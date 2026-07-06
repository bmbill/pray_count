// Supabase 連線設定。
// 注意：這裡的 anon key 是「公開金鑰」，本來就設計成放在前端使用，
// 真正的安全性由資料庫的 Row Level Security (RLS) 規則保護。
// 若日後換專案，改這兩個值即可。
export const SUPABASE_URL = 'https://bpcbujambozxbrmitaog.supabase.co'
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwY2J1amFtYm96eGJybWl0YW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMTI1NzUsImV4cCI6MjA5ODg4ODU3NX0.y5qF5v9uxpRzObFfZbagWomS9kiNeJuwsn8eK5I2GdE'
