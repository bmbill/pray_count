import { Routes, Route } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { Spinner } from './components/Spinner'
import { TabBar } from './components/TabBar'
import { Onboarding } from './pages/Onboarding'
import { Home } from './pages/Home'
import { Profile } from './pages/Profile'
import { Settings } from './pages/Settings'
import { CreateProject } from './pages/CreateProject'
import { JoinProject } from './pages/JoinProject'
import { ProjectRecord } from './pages/ProjectRecord'
import { ProjectStats } from './pages/ProjectStats'
import { ProjectManage } from './pages/ProjectManage'

export function App() {
  const { status } = useApp()

  if (status === 'loading') {
    return (
      <div className="app-shell">
        <Spinner />
      </div>
    )
  }

  if (status === 'needs-name') {
    return (
      <div className="app-shell">
        <Onboarding />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/create" element={<CreateProject />} />
        <Route path="/join/:slug" element={<JoinProject />} />
        <Route path="/p/:id" element={<ProjectRecord />} />
        <Route path="/p/:id/stats" element={<ProjectStats />} />
        <Route path="/p/:id/manage" element={<ProjectManage />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <TabBar />
    </div>
  )
}
