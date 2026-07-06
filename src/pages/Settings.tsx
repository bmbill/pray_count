import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { TutorialSlides } from '../components/TutorialSlides'
import { useToast } from '../hooks/useToast'
import type { UserSettings } from '../types'

const FONT_SIZES: UserSettings['fontSize'][] = ['sm', 'md', 'lg', 'xl']
const FONT_FAMILIES: UserSettings['fontFamily'][] = ['default', 'kai', 'ming']
const THEMES: UserSettings['theme'][] = ['warm', 'light', 'dark']

export function Settings() {
  const { t, settings, updateSettings, user, updateName, refreshUser } = useApp()
  const { show, Toast } = useToast()

  const [showTutorial, setShowTutorial] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(user?.display_name ?? '')

  // 同步
  const [genCode, setGenCode] = useState<string | null>(null)
  const [enterMode, setEnterMode] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [syncBusy, setSyncBusy] = useState(false)

  async function saveName() {
    if (!nameInput.trim()) return
    await updateName(nameInput.trim())
    setEditingName(false)
    show(t('common.save'))
  }

  async function generate() {
    try {
      const code = await api.generatePairingCode()
      setGenCode(code)
      setEnterMode(false)
    } catch (e) {
      console.error(e)
      show(t('error.generic'))
    }
  }

  async function redeem() {
    if (!codeInput.trim() || syncBusy) return
    setSyncBusy(true)
    try {
      await api.redeemPairingCode(codeInput.trim())
      await refreshUser()
      show(t('settings.sync.success'))
      setEnterMode(false)
      setCodeInput('')
    } catch (e) {
      console.error(e)
      show(t('settings.sync.invalid'))
    } finally {
      setSyncBusy(false)
    }
  }

  if (showTutorial) {
    return (
      <div className="page">
        <TutorialSlides onDone={() => setShowTutorial(false)} />
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t('settings.title')}</h1>
      </header>

      {/* 姓名 */}
      <div className="card">
        <div className="row-between">
          <div>
            <div className="muted">{t('profile.name')}</div>
            {editingName ? (
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} style={{ marginTop: 6 }} />
            ) : (
              <div style={{ fontSize: '1.3em', fontWeight: 700 }}>{user?.display_name}</div>
            )}
          </div>
          {editingName ? (
            <button className="btn small" onClick={saveName}>
              {t('common.save')}
            </button>
          ) : (
            <button className="btn small secondary" onClick={() => { setNameInput(user?.display_name ?? ''); setEditingName(true) }}>
              {t('settings.editName')}
            </button>
          )}
        </div>
      </div>

      {/* 語言 */}
      <div className="card">
        <div className="card-title">{t('settings.language')}</div>
        <div className="segmented">
          <button className={settings.lang === 'zh' ? 'active' : ''} onClick={() => updateSettings({ lang: 'zh' })}>
            中文
          </button>
          <button className={settings.lang === 'en' ? 'active' : ''} onClick={() => updateSettings({ lang: 'en' })}>
            English
          </button>
        </div>
      </div>

      {/* 字體大小 */}
      <div className="card">
        <div className="card-title">{t('settings.fontSize')}</div>
        <div className="segmented">
          {FONT_SIZES.map((s) => (
            <button key={s} className={settings.fontSize === s ? 'active' : ''} onClick={() => updateSettings({ fontSize: s })}>
              {t(`settings.fontSize.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 字型 */}
      <div className="card">
        <div className="card-title">{t('settings.fontFamily')}</div>
        <div className="segmented">
          {FONT_FAMILIES.map((f) => (
            <button key={f} className={settings.fontFamily === f ? 'active' : ''} onClick={() => updateSettings({ fontFamily: f })}>
              {t(`settings.fontFamily.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 主題 */}
      <div className="card">
        <div className="card-title">{t('settings.theme')}</div>
        <div className="segmented">
          {THEMES.map((th) => (
            <button key={th} className={settings.theme === th ? 'active' : ''} onClick={() => updateSettings({ theme: th })}>
              {t(`settings.theme.${th}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 同步裝置 */}
      <div className="card stack">
        <div className="card-title">{t('settings.sync')}</div>
        <p className="muted" style={{ margin: 0 }}>
          {t('settings.sync.desc')}
        </p>
        {genCode ? (
          <div className="center stack">
            <div className="muted">{t('settings.sync.codeIs')}</div>
            <div style={{ fontSize: '2.6em', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--primary-dark)' }}>
              {genCode}
            </div>
            <div className="muted" style={{ fontSize: '0.9em' }}>
              {t('settings.sync.codeHint', { min: 10 })}
            </div>
            <button className="btn secondary" onClick={() => setGenCode(null)}>
              {t('common.close')}
            </button>
          </div>
        ) : enterMode ? (
          <div className="stack">
            <div className="muted">{t('settings.sync.enterHint')}</div>
            <input
              type="tel"
              inputMode="numeric"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              style={{ fontSize: '1.6em', letterSpacing: '0.2em', textAlign: 'center' }}
            />
            <button className="btn" onClick={redeem} disabled={codeInput.length < 6 || syncBusy}>
              {t('common.confirm')}
            </button>
            <button className="link" onClick={() => setEnterMode(false)}>
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn secondary" onClick={generate}>
              {t('settings.sync.generate')}
            </button>
            <button className="btn secondary" onClick={() => setEnterMode(true)}>
              {t('settings.sync.enter')}
            </button>
          </div>
        )}
      </div>

      {/* 重看教學 */}
      <div className="card">
        <button className="link" onClick={() => setShowTutorial(true)}>
          📖 {t('settings.replayTutorial')}
        </button>
      </div>
      <Toast />
    </div>
  )
}
