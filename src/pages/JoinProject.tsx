import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api, type ProjectPreview } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { Spinner } from '../components/Spinner'

export function JoinProject() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useApp()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<ProjectPreview | null | 'notfound'>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!slug) return
    api
      .getProjectBySlug(slug)
      .then((p) => setPreview(p ?? 'notfound'))
      .catch(() => setPreview('notfound'))
  }, [slug])

  async function join() {
    if (!slug || busy) return
    setBusy(true)
    try {
      const proj = await api.joinProject(slug)
      navigate(`/p/${proj.id}`, { replace: true })
    } catch (e) {
      console.error(e)
      setBusy(false)
    }
  }

  if (preview === null) return <div className="page"><Spinner /></div>

  if (preview === 'notfound') {
    return (
      <div className="page">
        <PageHeader title={t('join.title')} back />
        <div className="card center stack">
          <div style={{ fontSize: '3em' }}>🤔</div>
          <p className="muted">{t('join.notFound')}</p>
          <button className="btn secondary" onClick={() => navigate('/')}>
            {t('common.back')}
          </button>
        </div>
      </div>
    )
  }

  if (preview.already_member) {
    return (
      <div className="page">
        <PageHeader title={t('join.title')} back />
        <div className="card center stack">
          <div className="card-title">{preview.name}</div>
          <p className="muted">{t('join.already')}</p>
          <button className="btn" onClick={() => navigate(`/p/${preview.id}`, { replace: true })}>
            {t('project.record')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title={t('join.title')} back />
      <div className="card center stack">
        <div style={{ fontSize: '3em' }}>🙏</div>
        <div className="card-title">{preview.name}</div>
        {preview.description && <p className="muted">{preview.description}</p>}
        <p style={{ fontSize: '1.1em' }}>{t('join.confirm', { name: preview.name })}</p>
        {preview.same_name && (
          <p style={{ color: 'var(--danger)', fontSize: '0.95em' }}>⚠️ {t('join.sameNameWarn')}</p>
        )}
        <button className="btn" onClick={join} disabled={busy}>
          {t('join.join')}
        </button>
      </div>
    </div>
  )
}
