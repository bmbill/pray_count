// 一次性設定腳本：透過 Supabase Management API
//   1) 執行 supabase/schema.sql
//   2) 開啟匿名登入
// 用法： SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-supabase.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REF = 'bpcbujambozxbrmitaog'
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
if (!TOKEN) {
  console.error('缺少 SUPABASE_ACCESS_TOKEN')
  process.exit(1)
}
const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }

async function runSchema() {
  const sql = readFileSync(join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8')
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  console.log('[schema] HTTP', res.status)
  if (!res.ok) {
    console.error('[schema] 失敗：', text)
    process.exit(1)
  }
  console.log('[schema] 成功')
}

async function enableAnon() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ external_anonymous_users_enabled: true }),
  })
  const text = await res.text()
  console.log('[auth] HTTP', res.status)
  if (!res.ok) {
    console.error('[auth] 失敗：', text)
    process.exit(1)
  }
  console.log('[auth] 匿名登入已開啟')
}

await runSchema()
await enableAnon()
console.log('全部完成 ✅')
