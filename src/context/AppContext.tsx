import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import type { AppUser, UserSettings } from '../types'
import { translations, type TranslationKey } from '../i18n/translations'

export const DEFAULT_SETTINGS: UserSettings = {
  lang: 'zh',
  fontSize: 'lg',
  fontFamily: 'default',
  theme: 'warm',
  tutorialDone: false,
}

const SETTINGS_KEY = 'praycount-settings'

function loadLocalSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS
}

type Status = 'loading' | 'needs-name' | 'ready'

interface AppContextValue {
  status: Status
  user: AppUser | null
  settings: UserSettings
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>
  createPerson: (name: string) => Promise<void>
  updateName: (name: string) => Promise<void>
  refreshUser: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<AppUser | null>(null)
  const [settings, setSettings] = useState<UserSettings>(loadLocalSettings)
  const initialised = useRef(false)

  // 套用外觀設定到 <html>
  useEffect(() => {
    const root = document.documentElement
    root.dataset.fontSize = settings.fontSize
    root.dataset.fontFamily = settings.fontFamily
    root.dataset.theme = settings.theme
    root.lang = settings.lang === 'zh' ? 'zh-Hant' : 'en'
  }, [settings])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const dict = translations[settings.lang] as Record<string, string>
      let text = dict[key] ?? (translations.zh as Record<string, string>)[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        }
      }
      return text
    },
    [settings.lang]
  )

  const applyUser = useCallback((u: AppUser | null) => {
    if (u) {
      setUser(u)
      const merged = { ...DEFAULT_SETTINGS, ...u.settings }
      setSettings(merged)
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
      setStatus('ready')
    } else {
      setStatus('needs-name')
    }
  }, [])

  const fetchCurrentPerson = useCallback(async () => {
    const { data, error } = await supabase.rpc('current_person')
    if (error) {
      console.error('current_person error', error)
      return null
    }
    // RPC 回傳陣列（setof）或單筆
    const row = Array.isArray(data) ? data[0] : data
    if (!row || !row.id) return null
    return {
      id: row.id,
      display_name: row.display_name,
      settings: { ...DEFAULT_SETTINGS, ...(row.settings ?? {}) },
      created_at: row.created_at,
    } as AppUser
  }, [])

  const bootstrap = useCallback(async () => {
    // 確保有匿名 session
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.error('anon sign-in failed', error)
        setStatus('needs-name')
        return
      }
    }
    const person = await fetchCurrentPerson()
    applyUser(person)
  }, [applyUser, fetchCurrentPerson])

  useEffect(() => {
    if (initialised.current) return
    initialised.current = true
    bootstrap()
  }, [bootstrap])

  const refreshUser = useCallback(async () => {
    const person = await fetchCurrentPerson()
    applyUser(person)
  }, [applyUser, fetchCurrentPerson])

  const updateSettings = useCallback(
    async (partial: Partial<UserSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial }
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
        // 若已有 user，非同步同步到伺服器
        if (user) {
          supabase
            .from('users')
            .update({ settings: next })
            .eq('id', user.id)
            .then(({ error }) => {
              if (error) console.error('update settings error', error)
            })
        }
        return next
      })
    },
    [user]
  )

  const createPerson = useCallback(
    async (name: string) => {
      const finalSettings = { ...settings, tutorialDone: true }
      const { data, error } = await supabase.rpc('create_person', {
        p_name: name,
        p_settings: finalSettings,
      })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      applyUser({
        id: row.id,
        display_name: row.display_name,
        settings: { ...DEFAULT_SETTINGS, ...(row.settings ?? {}) },
        created_at: row.created_at,
      })
    },
    [applyUser, settings]
  )

  const updateName = useCallback(
    async (name: string) => {
      if (!user) return
      const { error } = await supabase.from('users').update({ display_name: name }).eq('id', user.id)
      if (error) throw error
      setUser({ ...user, display_name: name })
    },
    [user]
  )

  const value = useMemo<AppContextValue>(
    () => ({ status, user, settings, t, updateSettings, createPerson, updateName, refreshUser }),
    [status, user, settings, t, updateSettings, createPerson, updateName, refreshUser]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
