import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { TutorialSlides } from '../components/TutorialSlides'

export function Onboarding() {
  const { t, createPerson } = useApp()
  const [step, setStep] = useState<'tutorial' | 'name'>('tutorial')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!name.trim()) {
      setError(t('onboard.nameRequired'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await createPerson(name.trim())
    } catch (e) {
      setError(t('error.generic'))
      console.error(e)
      setBusy(false)
    }
  }

  return (
    <div className="page" style={{ paddingBottom: 24 }}>
      <h1 className="center" style={{ fontSize: '1.6em', marginTop: 24 }}>
        {t('onboard.welcome')}
      </h1>

      {step === 'tutorial' ? (
        <TutorialSlides onDone={() => setStep('name')} />
      ) : (
        <div className="card stack" style={{ marginTop: 24 }}>
          <label className="field">
            <span>{t('onboard.enterName')}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('onboard.namePlaceholder')}
              autoFocus
            />
          </label>
          {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
          <button className="btn" onClick={submit} disabled={busy}>
            {t('onboard.start')}
          </button>
        </div>
      )}
    </div>
  )
}
