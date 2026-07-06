# 功課紀錄 Practice Log

佛教功課次數紀錄與小組共修統計 PWA。前端部署於 GitHub Pages，後端使用 Supabase。

## 技術
- React + Vite + TypeScript（PWA，可安裝、可離線瀏覽）
- React Router（HashRouter，GitHub Pages 相容）
- Supabase（PostgreSQL + 匿名登入 + RLS）

## 本機開發
```bash
npm install
node scripts/gen-icons.mjs   # 產生 PWA 圖示（第一次）
npm run dev
```

## Supabase 設定（只需做一次）
1. 到 Supabase 專案 → **SQL Editor** → 貼上 `supabase/schema.sql` 全部內容 → **Run**。
2. **Authentication → Sign In / Providers → Anonymous** → 開啟（Enable anonymous sign-ins）。
3. 金鑰設定在 `src/config.ts`（anon key 為公開金鑰，可放前端）。

## 部署到 GitHub Pages
1. 建立 GitHub repo，名稱建議 `pray_count`（若不同，改 `vite.config.ts` 的 `base`）。
2. 推上 `main` 分支。
3. repo → **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
4. 之後每次 push 到 `main` 會自動建置部署。

## 專案結構
- `src/pages/` 各頁面
- `src/lib/api.ts` 與 Supabase 溝通的封裝
- `src/context/AppContext.tsx` 登入/使用者/設定/多語言
- `supabase/schema.sql` 資料表、RLS、RPC 函式
