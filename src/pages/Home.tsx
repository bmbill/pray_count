import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import type { MembershipProject } from '../types'
import { Spinner } from '../components/Spinner'
import dayjs from 'dayjs'

export function Home() {
  const { t, settings, updateSettings } = useApp()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<MembershipProject[] | null>(null)
  const [sortMode, setSortMode] = useState(false)
  const view = settings.viewMode ?? 'card'

  useEffect(() => {
    api.getMyProjects().then(setProjects).catch((e) => {
      console.error(e)
      setProjects([])
    })
  }, [])

  const ordered = useMemo(() => {
    if (!projects) return []
    const order = settings.projectOrder ?? []
    const idx = (id: string) => {
      const i = order.indexOf(id)
      return i === -1 ? Number.MAX_SAFE_INTEGER : i
    }
    return [...projects].sort((a, b) => idx(a.id) - idx(b.id))
  }, [projects, settings.projectOrder])

  const isEnded = (p: MembershipProject) => !!p.end_date && dayjs(p.end_date).isBefore(dayjs(), 'day')
  const active = ordered.filter((p) => !isEnded(p))
  const ended = ordered.filter((p) => isEnded(p))

  function moveActive(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= active.length) return
    const arr = [...active]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    updateSettings({ projectOrder: [...arr.map((p) => p.id), ...ended.map((p) => p.id)] })
  }

  function arrows(i: number) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="icon-btn" disabled={i === 0} onClick={(e) => { e.stopPropagation(); moveActive(i, -1) }} aria-label={t('home.moveUp')}>
          ⬆️
        </button>
        <button className="icon-btn" disabled={i === active.length - 1} onClick={(e) => { e.stopPropagation(); moveActive(i, 1) }} aria-label={t('home.moveDown')}>
          ⬇️
        </button>
      </div>
    )
  }

  function roleBadge(p: MembershipProject) {
    return (
      <span className={`badge ${p.is_leader ? 'leader' : ''}`}>
        {p.is_leader ? t('home.leader') : t('home.member')}
      </span>
    )
  }

  // 卡片
  function card(p: MembershipProject, canSort: boolean, i: number) {
    const end = isEnded(p)
    return (
      <div
        key={p.id}
        className="card"
        onClick={() => !sortMode && navigate(`/p/${p.id}`)}
        style={{ cursor: sortMode ? 'default' : 'pointer', opacity: end ? 0.7 : 1 }}
      >
        <div className="row-between">
          <div className="card-title" style={{ flex: 1 }}>{p.name}</div>
          {sortMode && canSort ? arrows(i) : roleBadge(p)}
        </div>
        {p.description && <div className="muted">{p.description}</div>}
        <div className="muted" style={{ fontSize: '0.9em', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '2px 14px', alignItems: 'center' }}>
          {p.start_date && <span style={{ whiteSpace: 'nowrap' }}>{t('home.startLabel')}：{p.start_date}</span>}
          {p.end_date && <span style={{ whiteSpace: 'nowrap' }}>{t('home.endLabel')}：{p.end_date}</span>}
          {end && <span className="badge">{t('home.ended')}</span>}
        </div>
      </div>
    )
  }

  // 條列
  function row(p: MembershipProject, canSort: boolean, i: number) {
    const end = isEnded(p)
    return (
      <button
        key={p.id}
        className="list-row"
        onClick={() => !sortMode && navigate(`/p/${p.id}`)}
        style={{ opacity: end ? 0.7 : 1, cursor: sortMode ? 'default' : 'pointer' }}
      >
        <span className="list-name">{p.name}</span>
        {end && <span className="badge">{t('home.ended')}</span>}
        {sortMode && canSort ? arrows(i) : roleBadge(p)}
      </button>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t('home.title')}</h1>
      </header>

      {!sortMode && (
        <button className="btn" style={{ marginBottom: 16 }} onClick={() => navigate('/create')}>
          ＋ {t('home.createProject')}
        </button>
      )}

      {ordered.length > 0 && (
        <div className="row-between" style={{ marginBottom: 14 }}>
          <div className="segmented" style={{ maxWidth: 190, flex: '0 0 auto' }}>
            <button className={view === 'card' ? 'active' : ''} onClick={() => updateSettings({ viewMode: 'card' })}>
              🗂 {t('home.viewCard')}
            </button>
            <button className={view === 'list' ? 'active' : ''} onClick={() => updateSettings({ viewMode: 'list' })}>
              ☰ {t('home.viewList')}
            </button>
          </div>
          {active.length >= 2 && (
            <button className="link" onClick={() => setSortMode((s) => !s)}>
              {sortMode ? t('home.reorderDone') : t('home.reorder')}
            </button>
          )}
        </div>
      )}

      {projects === null ? (
        <Spinner />
      ) : ordered.length === 0 ? (
        <div className="card center stack">
          <div style={{ fontSize: '3em' }}>🌱</div>
          <p className="muted">{t('home.empty')}</p>
          <p className="muted" style={{ fontSize: '0.95em' }}>{t('home.joinHint')}</p>
        </div>
      ) : view === 'card' ? (
        <>
          {active.map((p, i) => card(p, true, i))}
          {ended.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.05em', color: 'var(--text-soft)', marginTop: 24 }}>
                {t('home.endedSection')}（{ended.length}）
              </h2>
              {ended.map((p) => card(p, false, 0))}
            </>
          )}
        </>
      ) : (
        <>
          <div className="list">{active.map((p, i) => row(p, true, i))}</div>
          {ended.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.05em', color: 'var(--text-soft)', marginTop: 24 }}>
                {t('home.endedSection')}（{ended.length}）
              </h2>
              <div className="list">{ended.map((p) => row(p, false, 0))}</div>
            </>
          )}
        </>
      )}
    </div>
  )
}
