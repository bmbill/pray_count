import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api, shareUrl, type MemberRow } from '../lib/api'
import { PageHeader } from '../components/PageHeader'
import { ProjectTabs } from '../components/ProjectTabs'
import { PrivacyPicker } from '../components/PrivacyPicker'
import { Spinner } from '../components/Spinner'
import { useToast } from '../hooks/useToast'
import type { Item, Project } from '../types'

export function ProjectManage() {
  const { id } = useParams<{ id: string }>()
  const { t, user } = useApp()
  const { show, Toast } = useToast()

  const [project, setProject] = useState<Project | null>(null)
  const [items, setItems] = useState<Item[] | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])

  // 新增項目
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState('')

  // 編輯中的項目
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTarget, setEditTarget] = useState('')

  async function reload() {
    if (!id) return
    const [p, it, mem] = await Promise.all([api.getProject(id), api.getItems(id), api.getMembers(id)])
    setProject(p)
    setItems(it)
    setMembers(mem)
  }

  useEffect(() => {
    reload().catch((e) => {
      console.error(e)
      setItems([])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function addItem() {
    if (!id || !newName.trim()) return
    try {
      await api.addItem({
        project_id: id,
        name: newName.trim(),
        target_count: newTarget ? parseInt(newTarget, 10) : null,
        sort_order: items ? items.length : 0,
      })
      setNewName('')
      setNewTarget('')
      await reload()
    } catch (e) {
      console.error(e)
      show(t('error.generic'))
    }
  }

  function startEdit(it: Item) {
    setEditId(it.id)
    setEditName(it.name)
    setEditTarget(it.target_count ? String(it.target_count) : '')
  }

  async function saveEdit() {
    if (!editId) return
    try {
      await api.updateItem(editId, {
        name: editName.trim(),
        target_count: editTarget ? parseInt(editTarget, 10) : null,
      })
      setEditId(null)
      await reload()
    } catch (e) {
      console.error(e)
      show(t('error.generic'))
    }
  }

  async function removeItem(it: Item) {
    if (!confirm(t('item.deleteConfirm', { name: it.name }))) return
    try {
      await api.deleteItem(it.id)
      await reload()
    } catch (e) {
      console.error(e)
      show(t('error.generic'))
    }
  }

  async function saveProject(patch: Partial<Project>) {
    if (!id || !project) return
    setProject({ ...project, ...patch })
    try {
      await api.updateProject(id, patch)
      show(t('common.save'))
    } catch (e) {
      console.error(e)
      show(t('error.generic'))
    }
  }

  async function toggleLeader(m: MemberRow) {
    if (!id) return
    try {
      await api.setLeader(id, m.user_id, !m.is_leader)
      await reload()
    } catch (e: any) {
      console.error(e)
      show(e?.message === 'last_leader' ? t('error.generic') : t('error.generic'))
    }
  }

  function copyLink() {
    if (!project) return
    navigator.clipboard.writeText(shareUrl(project.share_slug)).then(() => show(t('common.copied')))
  }

  if (!project || items === null) {
    return (
      <div className="page">
        <PageHeader title={t('project.manage')} back />
        <Spinner />
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader title={project.name} back />
      {id && <ProjectTabs projectId={id} active="manage" isLeader={true} />}

      {/* 分享網址 */}
      <div className="card">
        <div className="card-title">{t('project.shareTitle')}</div>
        <div
          style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 10, wordBreak: 'break-all', fontSize: '0.9em' }}
        >
          {shareUrl(project.share_slug)}
        </div>
        <button className="btn small secondary" style={{ marginTop: 10 }} onClick={copyLink}>
          📋 {t('common.copy')}
        </button>
      </div>

      {/* 功課項目 */}
      <div className="card">
        <div className="card-title">{t('project.items')}</div>
        <div className="stack">
          {items.map((it) =>
            editId === it.id ? (
              <div key={it.id} style={{ border: '2px solid var(--primary)', borderRadius: 12, padding: 12 }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ marginBottom: 8 }} />
                <input
                  type="number"
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  placeholder={t('item.target')}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="btn small" onClick={saveEdit}>
                    {t('common.save')}
                  </button>
                  <button className="btn small secondary" onClick={() => setEditId(null)}>
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div key={it.id} className="row-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{it.name}</div>
                  {it.target_count != null && (
                    <div className="muted" style={{ fontSize: '0.85em' }}>
                      🎯 {it.target_count.toLocaleString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="icon-btn" onClick={() => startEdit(it)}>
                    ✏️
                  </button>
                  <button className="icon-btn" onClick={() => removeItem(it)}>
                    🗑️
                  </button>
                </div>
              </div>
            )
          )}
          {items.length === 0 && <div className="muted">{t('item.noItems')}</div>}
        </div>

        {/* 新增項目 */}
        <div style={{ marginTop: 14, borderTop: '2px dashed var(--border)', paddingTop: 14 }}>
          <label className="field">
            <span>{t('item.name')}</span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('item.namePlaceholder')}
            />
          </label>
          <label className="field">
            <span>{t('item.target')}</span>
            <input
              type="number"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder={t('item.targetPlaceholder')}
            />
          </label>
          <button className="btn" onClick={addItem} disabled={!newName.trim()}>
            ＋ {t('item.add')}
          </button>
        </div>
      </div>

      {/* 專案設定 */}
      <div className="card">
        <div className="card-title">{t('project.manage')}</div>
        <label className="field">
          <span>{t('project.name')}</span>
          <input value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} onBlur={(e) => saveProject({ name: e.target.value })} />
        </label>
        <label className="field">
          <span>{t('project.endDate')}</span>
          <input
            type="date"
            value={project.end_date ?? ''}
            onChange={(e) => saveProject({ end_date: e.target.value || null })}
          />
        </label>
        <label className="field">
          <span>{t('project.privacy')}</span>
          <PrivacyPicker value={project.privacy_mode} onChange={(v) => saveProject({ privacy_mode: v })} />
        </label>
      </div>

      {/* 成員與組長 */}
      <div className="card">
        <div className="card-title">{t('profile.myGroups')}</div>
        <div className="stack">
          {members.map((m) => (
            <div key={m.user_id} className="row-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                {m.display_name}
                {m.user_id === user?.id && <span className="muted"> （{t('stats.personal')}）</span>}
              </div>
              <button
                className={`badge ${m.is_leader ? 'leader' : ''}`}
                style={{ border: 'none', cursor: 'pointer' }}
                onClick={() => toggleLeader(m)}
              >
                {m.is_leader ? t('home.leader') : t('home.member')}
              </button>
            </div>
          ))}
        </div>
      </div>
      <Toast />
    </div>
  )
}
