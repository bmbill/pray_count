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

const STEPS = [-100, -10, -1, 1, 10, 100]

export function ProjectRecord() {
  const { id } = useParams<{ id: string }>()
  const { t, user } = useApp()
  const navigate = useNavigate()
  const { show, Toast } = useToast()

  const [project, setProject] = useState<Project | null>(null)
  const [rows, setRows] = useState<RecordViewRow[] | null>(null)
  const [isLeader, setIsLeader] = useState(false)

  useEffect(() => {
    if (!id || !user) return
    Promise.all([
      api.getProject(id),
      api.getRecordView(id, today()),
      api.isLeader(id, user.id),
    ])
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

  async function bump(row: RecordViewRow, delta: number) {
    if (!id || !user) return
    // 不允許某項目變成負數（累計）
    if (row.my_total + delta < 0) return
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
    try {
      await api.addRecord({
        item_id: row.item_id,
        project_id: id,
        delta,
        record_date: today(),
        user_id: user.id,
      })
      show(t('record.saved'), 1000)
    } catch (e) {
      console.error(e)
      show(t('error.generic'))
      // 還原
      setRows((prev) =>
        prev!.map((r) =>
          r.item_id === row.item_id
            ? {
                ...r,
                my_today: r.my_today - delta,
                my_total: r.my_total - delta,
                group_total: r.group_total - delta,
              }
            : r
        )
      )
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
              <div className="counter-row">
                {STEPS.map((s) => (
                  <button
                    key={s}
                    className={s > 0 ? 'plus' : 'minus'}
                    onClick={() => bump(row, s)}
                  >
                    {s > 0 ? `+${s}` : s}
                  </button>
                ))}
              </div>
              {pct !== null && (
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
              )}
              {pct === null && (
                <div className="muted center" style={{ fontSize: '0.9em', marginTop: 8 }}>
                  {t('stats.group')} {t('common.total')}：{formatNumber(row.group_total)}
                </div>
              )}
            </div>
          )
        })
      )}
      <Toast />
    </div>
  )
}
