import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export function ProjectTabs({
  projectId,
  active,
  isLeader,
}: {
  projectId: string
  active: 'record' | 'stats' | 'manage'
  isLeader: boolean
}) {
  const { t } = useApp()
  const navigate = useNavigate()
  return (
    <div className="segmented" style={{ marginBottom: 16 }}>
      <button className={active === 'record' ? 'active' : ''} onClick={() => navigate(`/p/${projectId}`)}>
        {t('project.record')}
      </button>
      <button className={active === 'stats' ? 'active' : ''} onClick={() => navigate(`/p/${projectId}/stats`)}>
        {t('project.stats')}
      </button>
      {isLeader && (
        <button className={active === 'manage' ? 'active' : ''} onClick={() => navigate(`/p/${projectId}/manage`)}>
          {t('project.manage')}
        </button>
      )}
    </div>
  )
}
