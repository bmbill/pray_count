import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { TutorialSlides } from '../components/TutorialSlides'

type Step = 'tutorial' | 'choose' | 'name' | 'sync'

export function Onboarding() {
  const { t, createPerson, refreshUser } = useApp()
  const [step, setStep] = useState<Step>('tutorial')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submitName() {
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

  async function submitCode() {
    if (code.length < 6 || busy) return
    setBusy(true)
    setError('')
    try {
      await api.redeemPairingCode(code.trim())
      await refreshUser()
      // 成功後 status 會變 ready，畫面自動切換
    } catch (e) {
      console.error(e)
      setError(t('settings.sync.invalid'))
      setBusy(false)
    }
  }

  return (
    <div className="page" style={{ paddingBottom: 24 }}>
      <h1 className="center" style={{ fontSize: '1.6em', marginTop: 24 }}>
        {t('onboard.welcome')}
      </h1>

      {step === 'tutorial' && <TutorialSlides onDone={() => setStep('choose')} />}

      {step === 'choose' && (
        <div className="stack" style={{ marginTop: 24 }}>
          <h2 className="center" style={{ fontSize: '1.25em' }}>
            {t('onboard.chooseTitle')}
          </h2>
          <button className="option-card" onClick={() => setStep('name')} style={{ paddingLeft: 16 }}>
            <div className="option-title">🌱 {t('onboard.newUser')}</div>
            <div className="option-desc">{t('onboard.newUserHint')}</div>
          </button>
          <button className="option-card" onClick={() => setStep('sync')} style={{ paddingLeft: 16 }}>
            <div className="option-title">🔗 {t('onboard.hasAccount')}</div>
            <div className="option-desc">{t('onboard.hasAccountHint')}</div>
          </button>
        </div>
      )}

      {step === 'name' && (
        <div className="card stack" style={{ marginTop: 24 }}>
          <label className="field" style={{ marginBottom: 0 }}>
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
          <button className="btn" onClick={submitName} disabled={busy}>
            {t('onboard.start')}
          </button>
          <button className="link" onClick={() => { setError(''); setStep('choose') }}>
            {t('common.back')}
          </button>
        </div>
      )}

      {step === 'sync' && (
        <div className="card stack" style={{ marginTop: 24 }}>
          <div className="card-title">{t('onboard.syncTitle')}</div>
          <p className="muted" style={{ margin: 0 }}>
            {t('onboard.syncHint')}
          </p>
          <input
            type="tel"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            style={{ fontSize: '1.8em', letterSpacing: '0.2em', textAlign: 'center' }}
            autoFocus
          />
          {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
          <button className="btn" onClick={submitCode} disabled={code.length < 6 || busy}>
            {t('onboard.syncConfirm')}
          </button>
          <button className="link" onClick={() => { setError(''); setStep('choose') }}>
            {t('common.back')}
          </button>
        </div>
      )}
    </div>
  )
}
