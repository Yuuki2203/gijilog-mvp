# PROGRESS.md

## Step 4: 認証基盤 (/login) の実装（完了: 2026-06-21）

### ① 完了内容
- `src/lib/supabase/client.ts`: ブラウザ用 Supabase クライアント
- `src/lib/supabase/server.ts`: Server Component / Server Action 用クライアント（Cookie 書き込み失敗を安全に握りつぶす）
- `src/proxy.ts`: 全リクエストのセッション検証・リダイレクトガード（Next.js 16 proxy 規約）
- `src/app/login/page.tsx`: ログイン / サインアップ タブ切替UI（shadcn/ui Nova preset）
- shadcn/ui コンポーネント追加: `tabs`, `input`, `label`, `card`

### ② 確定した設計判断と理由
- `getUser()` 使用（`getSession()` 禁止）: サーバー側トークン再検証のため（Supabase 公式推奨）
- `createClient()` をハンドラ内で呼ぶ: ビルド時プリレンダリングでの env vars エラーを回避
- `proxy.ts`（Next.js 16 規約）: `middleware.ts` は deprecated、`proxy` 関数エクスポートが必須
- Server Component の Cookie 書き込みを try/catch で握りつぶす: 実害なし、アプリ安定性確保

### ③ 次にやること
- 議事録の CRUD 画面実装（`/minutes` 一覧・詳細・新規作成）
- Server Actions への userId スコープ実装
- PDF エクスポート機能

### ④ 保留事項
- `.env.example` の変数名を `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` に統一する（現在 `ANON_KEY` 表記が混在）

### ⑤ 注意点（運用ナレッジ）
- アクセス元が `localhost` 以外（LAN の IP 等）の場合、WebCrypto API が使えず PKCE が plain にフォールバック → Supabase が 400 を返す。開発時は必ず `localhost:3000` でアクセスすること
- Supabase Dashboard の「Confirm email」は **OFF** にすること。ON のままだとサインアップ後にセッションが発行されず遷移しない
- Next.js 16 では `middleware.ts` が deprecated → `proxy.ts` + `proxy` 関数エクスポートが必須（CLAUDE.md も更新済み）

### 動作確認済み（2026-06-21）
- サインアップ → `/minutes` 遷移 ✅
- 未ログインで `/minutes` → `/login` リダイレクト ✅
- ログイン済みで `/login` → `/minutes` リダイレクト ✅
