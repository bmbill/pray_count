export type PrivacyMode = 'totals_only' | 'top3' | 'show_all'

export interface UserSettings {
  lang: 'zh' | 'en'
  fontSize: 'sm' | 'md' | 'lg' | 'xl'
  fontFamily: 'default' | 'kai' | 'ming'
  theme: 'warm' | 'light' | 'dark'
  tutorialDone: boolean
  projectOrder?: string[]
}

export interface AppUser {
  id: string
  display_name: string
  settings: UserSettings
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  share_slug: string
  start_date: string | null
  end_date: string | null
  privacy_mode: PrivacyMode
  created_by: string
  created_at: string
}

export interface Item {
  id: string
  project_id: string
  name: string
  target_count: number | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface RecordRow {
  id: string
  item_id: string
  project_id: string
  user_id: string
  delta: number
  recorded_at: string
  record_date: string
}

// 使用者參與的專案（含角色）
export interface MembershipProject extends Project {
  is_leader: boolean
}
