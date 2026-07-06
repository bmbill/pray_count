import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api, shareUrl } from '../lib/api'
import type { PrivacyMode, Project } from '../types'
import { PageHeader } from '../components/PageHeader'
import { PrivacyPicker } from '../components/PrivacyPicker'
import { useToast } from '../hooks/useToast'
import { today } from '../lib/dates'

export function CreateProject() {
  const { t } = useApp()
  const navigate = useNavigate()
  const { show, Toast } = useToast()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(today())
  const [noEnd, setNoEnd] = useState(true)
  const [endDate, setEndDate] = useState('')
  const [privacy, setPrivacy] = useState<PrivacyMode>('totals_only')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<Project | null>(null)

  async function submit() {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      const proj = await api.createProject({
        name: name.trim(),
        description,
        start_date: startDate || null,
        end_date: noEnd ? null : endDate || null,
        privacy_mode: privacy,
      })
      setCreated(proj)
    } catch (e) {
      console.error(e)
      show(t('error.generic'))
      setBusy(false)
    }
  }

  function copyLink() {
    if (!created) return
    navigator.clipboard.writeText(shareUrl(created.share_slug)).then(() => show(t('common.copied')))
  }

  if (created) {
    return (
      <div className="page">
        <PageHeader title={t('project.shareTitle')} />
        <div className="card stack center">
          <div style={{ fontSize: '3em' }}>🎉</div>
          <div className="card-title">{created.name}</div>
          <p className="muted">{t('project.shareHint')}</p>
          <div
            style={{
              background: 'var(--surface-2)',
              padding: 12,
              borderRadius: 12,
              wordBreak: 'break-all',
              fontSize: '0.95em',
            }}
          >
            {shareUrl(created.share_slug)}
          </div>
          <button className="btn" onClick={copyLink}>
            📋 {t('common.copy')}
          </button>
          <button className="btn secondary" onClick={() => navigate(`/p/${created.id}/manage`)}>
            {t('project.manage')}（{t('project.items')}）
          </button>
          <button className="link" onClick={() => navigate(`/p/${created.id}`)}>
            {t('common.done')}
          </button>
        </div>
        <Toast />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title={t('project.create.title')} back />
      <div className="card">
        <label className="field">
          <span>{t('project.name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('project.namePlaceholder')} />
        </label>
        <label className="field">
          <span>{t('project.description')}</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="field">
          <span>{t('project.startDate')}</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="field">
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              checked={noEnd}
              onChange={(e) => setNoEnd(e.target.checked)}
              style={{ width: 24, height: 24, minHeight: 0 }}
            />
            {t('project.noEndDate')}
          </span>
        </label>
        {!noEnd && (
          <label className="field">
            <span>{t('project.endDate')}</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        )}
        <label className="field">
          <span>{t('project.privacy')}</span>
          <PrivacyPicker value={privacy} onChange={setPrivacy} />
        </label>
        <button className="btn" onClick={submit} disabled={busy || !name.trim()}>
          {t('project.create.submit')}
        </button>
      </div>
      <Toast />
    </div>
  )
}
