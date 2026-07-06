import { supabase } from './supabase'
import type { Item, MembershipProject, PrivacyMode, Project } from '../types'

export interface ProjectPreview {
  id: string
  name: string
  description: string | null
  already_member: boolean
  same_name: boolean
}

export interface RecordViewRow {
  item_id: string
  item_name: string
  target_count: number | null
  sort_order: number
  my_today: number
  my_total: number
  group_total: number
}

export interface ItemStatRow {
  item_id: string
  item_name: string
  target_count: number | null
  sort_order: number
  my_sum: number
  group_sum: number
}

export interface RankingRow {
  display_name: string
  total: number
  is_me: boolean
  rnk: number
}

export interface MemberRow {
  user_id: string
  display_name: string
  is_leader: boolean
}

export interface ProfileRow {
  project_id: string
  project_name: string
  is_leader: boolean
  item_id: string
  item_name: string
  target_count: number | null
  my_total: number
  group_total: number
}

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message)
  return data as T
}

export const api = {
  async getMyProjects(): Promise<MembershipProject[]> {
    const { data, error } = await supabase.rpc('get_my_projects')
    return unwrap(data, error) as MembershipProject[]
  },

  async createProject(input: {
    name: string
    description: string
    start_date: string | null
    end_date: string | null
    privacy_mode: PrivacyMode
  }): Promise<Project> {
    const { data, error } = await supabase.rpc('create_project', {
      p_name: input.name,
      p_description: input.description,
      p_start: input.start_date,
      p_end: input.end_date,
      p_privacy: input.privacy_mode,
    })
    return unwrap(data, error) as Project
  },

  async updateProject(id: string, patch: Partial<Project>): Promise<void> {
    const { error } = await supabase.from('projects').update(patch).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async getProjectBySlug(slug: string): Promise<ProjectPreview | null> {
    const { data, error } = await supabase.rpc('get_project_by_slug', { p_slug: slug })
    const rows = unwrap(data, error) as ProjectPreview[]
    return rows && rows.length ? rows[0] : null
  },

  async joinProject(slug: string): Promise<Project> {
    const { data, error } = await supabase.rpc('join_project', { p_slug: slug })
    return unwrap(data, error) as Project
  },

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
    return unwrap(data, error) as Project | null
  },

  async isLeader(projectId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('project_leaders')
      .select('user_id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return !!data
  },

  async getItems(projectId: string): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order')
      .order('created_at')
    return unwrap(data, error) as Item[]
  },

  async addItem(input: {
    project_id: string
    name: string
    target_count: number | null
    sort_order: number
  }): Promise<Item> {
    const { data, error } = await supabase.from('items').insert(input).select().single()
    return unwrap(data, error) as Item
  },

  async updateItem(id: string, patch: Partial<Item>): Promise<void> {
    const { error } = await supabase.from('items').update(patch).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async addRecord(input: {
    item_id: string
    project_id: string
    delta: number
    record_date: string
    user_id: string
  }): Promise<void> {
    const { error } = await supabase.from('records').insert(input)
    if (error) throw new Error(error.message)
  },

  async getRecordView(projectId: string, todayStr: string): Promise<RecordViewRow[]> {
    const { data, error } = await supabase.rpc('get_record_view', {
      p_project_id: projectId,
      p_today: todayStr,
    })
    return unwrap(data, error) as RecordViewRow[]
  },

  async getItemStats(projectId: string, from: string | null, to: string | null): Promise<ItemStatRow[]> {
    const { data, error } = await supabase.rpc('get_item_stats', {
      p_project_id: projectId,
      p_from: from,
      p_to: to,
    })
    return unwrap(data, error) as ItemStatRow[]
  },

  async getRanking(projectId: string, from: string | null, to: string | null): Promise<RankingRow[]> {
    const { data, error } = await supabase.rpc('get_ranking', {
      p_project_id: projectId,
      p_from: from,
      p_to: to,
    })
    return unwrap(data, error) as RankingRow[]
  },

  async getMembers(projectId: string): Promise<MemberRow[]> {
    const { data, error } = await supabase.rpc('get_members', { p_project_id: projectId })
    return unwrap(data, error) as MemberRow[]
  },

  async setLeader(projectId: string, userId: string, isLeader: boolean): Promise<void> {
    const { error } = await supabase.rpc('set_project_leader', {
      p_project_id: projectId,
      p_user_id: userId,
      p_is_leader: isLeader,
    })
    if (error) throw new Error(error.message)
  },

  async getProfileSummary(): Promise<ProfileRow[]> {
    const { data, error } = await supabase.rpc('get_profile_summary')
    return unwrap(data, error) as ProfileRow[]
  },

  async leaveProject(projectId: string): Promise<void> {
    const { error } = await supabase.rpc('leave_project', { p_project_id: projectId })
    if (error) throw new Error(error.message)
  },

  async rejoinProject(projectId: string): Promise<void> {
    const { error } = await supabase.rpc('rejoin_project', { p_project_id: projectId })
    if (error) throw new Error(error.message)
  },

  async getLeftProjects(): Promise<
    { id: string; name: string; share_slug: string; start_date: string | null; end_date: string | null }[]
  > {
    const { data, error } = await supabase.rpc('get_left_projects')
    return unwrap(data, error) as any
  },

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await supabase.rpc('delete_project', { p_project_id: projectId })
    if (error) throw new Error(error.message)
  },

  async generatePairingCode(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_pairing_code')
    return unwrap(data, error) as string
  },

  async redeemPairingCode(code: string): Promise<void> {
    const { error } = await supabase.rpc('redeem_pairing_code', { p_code: code })
    if (error) throw new Error(error.message)
  },
}

export function shareUrl(slug: string): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`
  return `${base}#/join/${slug}`
}
