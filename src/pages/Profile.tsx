import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api, type ProfileRow } from '../lib/api'
import { Spinner } from '../components/Spinner'
import { formatNumber } from '../lib/dates'

interface GroupedProject {
  project_id: string
  project_name: string
  is_leader: boolean
  items: ProfileRow[]
}

export function Profile() {
  const { t, user } = useApp()
  const navigate = useNavigate()
  const [rows, setRows] = useState<ProfileRow[] | null>(null)

  useEffect(() => {
    api.getProfileSummary().then(setRows).catch((e) => {
      console.error(e)
      setRows([])
    })
  }, [])

  const grouped = useMemo<GroupedProject[]>(() => {
    if (!rows) return []
    const map = new Map<string, GroupedProject>()
    for (const r of rows) {
      if (!map.has(r.project_id)) {
        map.set(r.project_id, {
          project_id: r.project_id,
          project_name: r.project_name,
          is_leader: r.is_leader,
          items: [],
        })
      }
      map.get(r.project_id)!.items.push(r)
    }
    return [...map.values()]
  }, [rows])

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t('profile.title')}</h1>
      </header>

      <div className="card">
        <div className="muted">{t('profile.name')}</div>
        <div style={{ fontSize: '1.4em', fontWeight: 700 }}>{user?.display_name}</div>
      </div>

      <h2 style={{ fontSize: '1.15em' }}>{t('profile.myGroups')}</h2>

      {rows === null ? (
        <Spinner />
      ) : grouped.length === 0 ? (
        <div className="card center muted">{t('home.empty')}</div>
      ) : (
        grouped.map((g) => (
          <div key={g.project_id} className="card" onClick={() => navigate(`/p/${g.project_id}`)} style={{ cursor: 'pointer' }}>
            <div className="row-between">
              <div className="card-title" style={{ margin: 0 }}>
                {g.project_name}
              </div>
              {g.is_leader && <span className="badge leader">{t('home.leader')}</span>}
            </div>
            <div className="stack" style={{ marginTop: 10 }}>
              {g.items.map((it) => {
                const pct =
                  it.target_count && it.target_count > 0
                    ? Math.min(100, Math.round((it.group_total / it.target_count) * 100))
                    : null
                return (
                  <div key={it.item_id}>
                    <div className="row-between">
                      <span>{it.item_name}</span>
                      <span>
                        <strong>{formatNumber(it.my_total)}</strong>
                        <span className="muted"> / {formatNumber(it.group_total)}</span>
                      </span>
                    </div>
                    {pct !== null && (
                      <div className="progress" style={{ height: 8 }}>
                        <div style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                )
              })}
              {g.items.length === 0 && <div className="muted">{t('item.noItems')}</div>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
