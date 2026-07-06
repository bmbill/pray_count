import { useApp } from '../context/AppContext'
import type { PrivacyMode } from '../types'

const OPTIONS: PrivacyMode[] = ['totals_only', 'top3', 'show_all']

export function PrivacyPicker({
  value,
  onChange,
}: {
  value: PrivacyMode
  onChange: (v: PrivacyMode) => void
}) {
  const { t } = useApp()
  return (
    <div className="option-list">
      {OPTIONS.map((o) => (
        <button
          key={o}
          type="button"
          className={`option-card${value === o ? ' active' : ''}`}
          onClick={() => onChange(o)}
        >
          <div className="option-title">{t(`project.privacy.${o}`)}</div>
          <div className="option-desc">{t(`project.privacy.${o}.desc`)}</div>
        </button>
      ))}
    </div>
  )
}
