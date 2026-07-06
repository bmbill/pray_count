import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api, type RecordViewRow } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { ProjectTabs } from '../components/ProjectTabs'
import { Spinner } from '../components/Spinner'
import { useToast } from '../hooks/useToast'
import { today, formatNumber } from '../lib/dates'
import type { Project } from '../types'

const PLUS = [1, 10, 100]
const MINUS = [-1, -10, -100]

export function ProjectRecord() {
  const { id } = useParams<{ id: string }>()
  const { t, user } = useApp()
  const navigate = useNavigate()
  const { show, Toast } = useToast()

  const [project, setProject] = useState<Project | null>(null)
  const [rows, setRows] = useState<RecordViewRow[] | null>(null)
  const [isLeader, setIsLeader] = useState(false)
  const [pending, setPending] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !user) return
    Promise.all([api.getProject(id), api.getRecordView(id, today()), api.isLeader(id, user.id)])
      .then(([p, r, l]) => {
        setProject(p)
        setRows(r)
        setIsLeader(l)
      })
      .catch((e) => {
        console.error(e)
        setRows([])
      })
  }, [id, user])

  function adjust(row: RecordViewRow, delta: number) {
    setPending((prev) => {
      const cur = prev[row.item_id] ?? 0
      let next = cur + delta
      // 累計不可低於 0
      if (row.my_total + next < 0) next = -row.my_total
      return { ...prev, [row.item_id]: next }
    })
  }

  async function leave() {
    if (!id) return
    if (!confirm(t('project.leaveConfirm', { name: project?.name ?? '' }))) return
    try {
      await api.leaveProject(id)
      navigate('/')
    } catch (e: any) {
      console.error(e)
      show(e?.message === 'last_leader' ? t('project.leaveLastLeader') : t('error.generic'))
    }
  }

  async function submit(row: RecordViewRow) {
    if (!id || !user) return
    const delta = pending[row.item_id] ?? 0
    if (delta === 0 || saving) return
    setSaving(row.item_id)
    try {
      await api.addRecord({
        item_id: row.item_id,
        project_id: id,
        delta,
        record_date: today(),
        user_id: user.id,
      })
      setRows((prev) =>
        prev!.map((r) =>
          r.item_id === row.item_id
            ? {
                ...r,
                my_today: r.my_today + delta,
                my_total: r.my_total + delta,
                group_total: r.group_total + delta,
              }
            : r
        )
      )
      setPending((prev) => ({ ...prev, [row.item_id]: 0 }))
      show(t('record.saved'), 1200)
    } catch (e) {
      console.error(e)
      show(t('error.generic'))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="page">
      <PageHeader title={project?.name ?? t('project.record')} back />
      {id && <ProjectTabs projectId={id} active="record" isLeader={isLeader} />}

      {rows === null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <div className="card center stack">
          <div style={{ fontSize: '3em' }}>📿</div>
          <p className="muted">{t('item.noItems')}</p>
          {isLeader && (
            <button className="btn" onClick={() => navigate(`/p/${id}/manage`)}>
              ＋ {t('item.add')}
            </button>
          )}
        </div>
      ) : (
        rows.map((row) => {
          const pend = pending[row.item_id] ?? 0
          const pct =
            row.target_count && row.target_count > 0
              ? Math.min(100, Math.round((row.group_total / row.target_count) * 100))
              : null
          return (
            <div key={row.item_id} className="card">
              <div className="card-title">{row.item_name}</div>
              <div className="row-between">
                <span className="muted">{t('record.todayCount', { n: formatNumber(row.my_today) })}</span>
                <span key={row.my_total} className="big-number bump">
                  {formatNumber(row.my_total)}
                </span>
              </div>

              <div className="pending-box">
                <div className="label">{t('record.pending')}</div>
                <div className={`pending-num${pend === 0 ? ' zero' : ''}`}>
                  {pend > 0 ? '+' : ''}
                  {formatNumber(pend)}
                </div>
              </div>

              <div className="counter-grid plus">
                {PLUS.map((s) => (
                  <button key={s} onClick={() => adjust(row, s)}>
                    +{s}
                  </button>
                ))}
              </div>
              <div className="counter-grid minus">
                {MINUS.map((s) => (
                  <button key={s} onClick={() => adjust(row, s)}>
                    −{Math.abs(s)}
                  </button>
                ))}
              </div>

              <button
                className="btn"
                style={{ marginTop: 12 }}
                disabled={pend === 0 || saving === row.item_id}
                onClick={() => submit(row)}
              >
                {t('record.submit')}
                {pend !== 0 ? `（${pend > 0 ? '+' : ''}${formatNumber(pend)}）` : ''}
              </button>

              {pct !== null ? (
                <>
                  <div className="progress">
                    <div style={{ width: `${pct}%` }} />
                  </div>
                  <div className="muted center" style={{ fontSize: '0.9em', marginTop: 6 }}>
                    {t('record.groupProgress', {
                      current: formatNumber(row.group_total),
                      target: formatNumber(row.target_count!),
                    })}
                    （{pct}%）
                  </div>
                </>
              ) : (
                <div className="muted center" style={{ fontSize: '0.9em', marginTop: 10 }}>
                  {t('stats.group')} {t('common.total')}：{formatNumber(row.group_total)}
                </div>
              )}
            </div>
          )
        })
      )}

      {rows !== null && !isLeader && (
        <div className="center" style={{ marginTop: 24 }}>
          <button className="link" style={{ color: 'var(--danger)' }} onClick={leave}>
            {t('project.leave')}
          </button>
        </div>
      )}
      <Toast />
    </div>
  )
}
