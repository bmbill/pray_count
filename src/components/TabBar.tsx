import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export function TabBar() {
  const { t } = useApp()
  return (
    <nav className="tabbar">
      <NavLink to="/" end>
        <span className="icon">🏠</span>
        <span>{t('nav.home')}</span>
      </NavLink>
      <NavLink to="/profile">
        <span className="icon">📿</span>
        <span>{t('nav.profile')}</span>
      </NavLink>
      <NavLink to="/settings">
        <span className="icon">⚙️</span>
        <span>{t('nav.settings')}</span>
      </NavLink>
    </nav>
  )
}
