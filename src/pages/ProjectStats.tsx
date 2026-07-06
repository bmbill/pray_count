import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api, type ItemStatRow, type RankingRow } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { ProjectTabs } from '../components/ProjectTabs'
import { Spinner } from '../components/Spinner'
import { rangeFor, formatNumber, today, type Period } from '../lib/dates'
import type { Project } from '../types'

const PERIODS: Period[] = ['daily', 'weekly', 'monthly', 'all', 'custom']

export function ProjectStats() {
  const { id } = useParams<{ id: string }>()
  const { t, user } = useApp()

  const [project, setProject] = useState<Project | null>(null)
  const [isLeader, setIsLeader] = useState(false)
  const [scope, setScope] = useState<'personal' | 'group'>('personal')
  const [period, setPeriod] = useState<Period>('weekly')
  const [customFrom, setCustomFrom] = useState(today())
  const [customTo, setCustomTo] = useState(today())
  const [stats, setStats] = useState<ItemStatRow[] | null>(null)
  const [ranking, setRanking] = useState<RankingRow[]>([])

  useEffect(() => {
    if (!id || !user) return
    api.getProject(id).then(setProject)
    api.isLeader(id, user.id).then((l) => {
      setIsLeader(l)
      // 組長預設看「小組」，組員預設看「我的」
      setScope(l ? 'group' : 'personal')
    })
  }, [id, user])

  const load = useCallback(async () => {
    if (!id) return
    setStats(null)
    const [from, to] = rangeFor(period, { from: customFrom, to: customTo })
    const [s, r] = await Promise.all([api.getItemStats(id, from, to), api.getRanking(id, from, to)])
    setStats(s)
    setRanking(r)
  }, [id, period, customFrom, customTo])

  useEffect(() => {
    if (period !== 'custom') load().catch(console.error)
  }, [period, load])

  const showRanking = scope === 'group' && ranking.length > 0

  return (
    <div className="page">
      <PageHeader title={project?.name ?? t('stats.title')} back />
      {id && <ProjectTabs projectId={id} active="stats" isLeader={isLeader} />}

      {/* 我的 / 小組 */}
      <div className="segmented" style={{ marginBottom: 12 }}>
        <button className={scope === 'personal' ? 'active' : ''} onClick={() => setScope('personal')}>
          {t('stats.personal')}
        </button>
        <button className={scope === 'group' ? 'active' : ''} onClick={() => setScope('group')}>
          {t('stats.group')}
        </button>
      </div>

      {/* 期間 */}
      <div className="segmented" style={{ marginBottom: 12 }}>
        {PERIODS.map((p) => (
          <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
            {t(`stats.${p === 'all' ? 'all' : p === 'custom' ? 'custom' : p}`)}
          </button>
        ))}
      </div>

      {/* 目前查詢的時間區間 */}
      {(() => {
        if (period === 'custom') return null
        const [rf, rt] = rangeFor(period, { from: customFrom, to: customTo })
        const text = period === 'all' ? t('stats.rangeAll') : rf === rt ? rf : `${rf} ~ ${rt}`
        return (
          <div
            className="muted center"
            style={{ marginBottom: 14, fontSize: '0.95em', whiteSpace: 'nowrap', overflowX: 'auto' }}
          >
            📅 {text}
          </div>
        )
      })()}

      {period === 'custom' && (
        <div className="card">
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <label className="field" style={{ flex: 1, marginBottom: 0 }}>
              <span>{t('stats.from')}</span>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </label>
            <label className="field" style={{ flex: 1, marginBottom: 0 }}>
              <span>{t('stats.to')}</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </label>
          </div>
          <button className="btn" style={{ marginTop: 12 }} onClick={() => load().catch(console.error)}>
            {t('stats.query')}
          </button>
        </div>
      )}

      {stats === null ? (
        <Spinner />
      ) : (
        <>
          {stats.every((s) => (scope === 'personal' ? s.my_sum : s.group_sum) === 0) ? (
            <div className="card center muted">{t('stats.noData')}</div>
          ) : (
            stats.map((s) => {
              const val = scope === 'personal' ? s.my_sum : s.group_sum
              return (
                <div key={s.item_id} className="card">
                  <div className="row-between">
                    <div className="card-title" style={{ margin: 0 }}>
                      {s.item_name}
                    </div>
                    <div className="big-number">{formatNumber(val)}</div>
                  </div>
                  {scope === 'group' && s.target_count != null && s.target_count > 0 && (
                    <div className="progress">
                      <div style={{ width: `${Math.min(100, Math.round((s.group_sum / s.target_count) * 100))}%` }} />
                    </div>
                  )}
                </div>
              )
            })
          )}

          {showRanking && (
            <div className="card">
              <div className="card-title">🏆 {t('stats.ranking')}</div>
              <div className="stack">
                {ranking.map((r) => (
                  <div
                    key={r.rnk}
                    className="row-between"
                    style={{
                      padding: '8px 0',
                      borderBottom: '1px solid var(--border)',
                      fontWeight: r.is_me ? 700 : 400,
                    }}
                  >
                    <span>
                      {r.rnk <= 3 ? ['🥇', '🥈', '🥉'][r.rnk - 1] : `${r.rnk}.`} {r.display_name}
                      {r.is_me && <span className="muted"> （{t('stats.personal')}）</span>}
                    </span>
                    <span className="big-number" style={{ fontSize: '1.2em' }}>
                      {formatNumber(r.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
