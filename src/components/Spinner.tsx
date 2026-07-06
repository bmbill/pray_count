import { useApp } from '../context/AppContext'

export function Spinner() {
  const { t } = useApp()
  return (
    <div className="spinner-wrap">
      <div className="muted" style={{ fontSize: '1.1em' }}>
        {t('common.loading')}
      </div>
    </div>
  )
}
