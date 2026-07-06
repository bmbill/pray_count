import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import type { MembershipProject } from '../types'
import { Spinner } from '../components/Spinner'
import dayjs from 'dayjs'

export function Home() {
  const { t } = useApp()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<MembershipProject[] | null>(null)

  useEffect(() => {
    api.getMyProjects().then(setProjects).catch((e) => {
      console.error(e)
      setProjects([])
    })
  }, [])

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t('home.title')}</h1>
      </header>

      <button className="btn" style={{ marginBottom: 20 }} onClick={() => navigate('/create')}>
        ＋ {t('home.createProject')}
      </button>

      {projects === null ? (
        <Spinner />
      ) : projects.length === 0 ? (
        <div className="card center stack">
          <div style={{ fontSize: '3em' }}>🌱</div>
          <p className="muted">{t('home.empty')}</p>
          <p className="muted" style={{ fontSize: '0.95em' }}>
            {t('home.joinHint')}
          </p>
        </div>
      ) : (
        projects.map((p) => {
          const ended = p.end_date && dayjs(p.end_date).isBefore(dayjs(), 'day')
          return (
            <div key={p.id} className="card" onClick={() => navigate(`/p/${p.id}`)} style={{ cursor: 'pointer' }}>
              <div className="row-between">
                <div className="card-title">{p.name}</div>
                <span className={`badge ${p.is_leader ? 'leader' : ''}`}>
                  {p.is_leader ? t('home.leader') : t('home.member')}
                </span>
              </div>
              {p.description && <div className="muted">{p.description}</div>}
              <div
                className="muted"
                style={{ fontSize: '0.9em', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '2px 14px', alignItems: 'center' }}
              >
                <span style={{ whiteSpace: 'nowrap' }}>
                  {t('home.startLabel')}：{p.start_date || '—'}
                </span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  {t('home.endLabel')}：{p.end_date || t('home.noEnd')}
                </span>
                {ended && <span className="badge">{t('home.ended')}</span>}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
