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
- ~~議事録の CRUD 画面実装（`/minutes` 一覧・詳細・新規作成）~~ → **Step 5 で完了**
- ~~Server Actions への userId スコープ実装~~ → **Step 5 で完了**
- ~~PDF エクスポート機能~~ → **Step 5 で完了**
- Vercel デプロイ・本番環境確認
- README の完成（スクリーンショット・デモ URL 掲載）

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

---

## Step 5: CRUD 画面・PDF 出力・セキュリティ強化（完了: 2026-06-23）

### ① 完了内容
- `/minutes` 一覧ページ（Server Component、Prisma クエリ、ログアウト）
- `/minutes/[id]` 詳細ページ（決定事項・TODO 表示、PDF ダウンロード、削除）
- `/minutes/new` 新規作成ページ（Step1: テキスト入力/ファイル読み込み → AI 抽出、Step2: 確認・編集 → 保存）
- `/minutes/[id]/edit` 編集ページ（既存データ取得 → 修正 → 保存）
- Server Actions: `createMinute` / `deleteMinute` / `updateMinute`（`src/app/actions/minutes.ts`）
- PDF エクスポート: `/api/minutes/[id]/pdf`（@react-pdf/renderer、NotoSansJP フォント）
- AI 抽出 API の認証チェック追加（`/api/ai/extract`）
- `src/lib/auth.ts`: `getAuthUser()` を React `cache()` でラップ（リクエスト内重複排除）
- `src/lib/utils.ts`: `formatDate` / `isNextInternalError` を共通化（3 ファイル重複を解消）
- `(app)` レイアウトによるルートガード（`src/app/(app)/layout.tsx`）

### ② 確定した設計判断と理由
- `getAuthUser()` with React `cache()`: レイアウトとページ両方で getUser() を呼ぶと Supabase Auth への往復が 2 回発生するため、`cache()` でリクエスト単位にメモ化（詳細は ADR-006）
- `deleteMinute` で `deleteMany` + count チェックを採用: Prisma の `delete` は WHERE に主キー以外のフィールドを要求しないため、`deleteMany({ where:{ id, userId } })` で TOCTOU を排除しつつ userId スコープを保証（詳細は ADR-007）
- `updateMinute` でインタラクティブトランザクションを採用: 所有権確認と更新を同一トランザクション内で原子的に実行（詳細は ADR-008）
- `redirect()` はトランザクション外で呼ぶ: `redirect()` は `NEXT_REDIRECT` を throw する実装のため、`$transaction` コールバック内で呼ぶとトランザクションがロールバックしてしまう
- rawText と summary を両方 DB に保存: rawText は原文監査・再抽出に、summary は一覧表示・PDF に使用（詳細は ADR-009）
- `isNextInternalError`: NEXT_REDIRECT と NEXT_NOT_FOUND を同一関数で検出し、クライアントの catch が Next.js 内部エラーを誤飲みしないよう統一

### ③ 次にやること
- Vercel デプロイ（環境変数設定・`DATABASE_URL` の Supabase 接続文字列確認）
- README 完成（機能説明・スクリーンショット・デモ URL・技術スタック）
- （任意）edit ページの summary 表示・編集対応

### ④ 保留事項
- edit ページでは summary フィールドが表示されない（新規作成は表示・編集可能だが、編集ページの API レスポンスに summary を含めていない）
- PDF の日本語フォント（NotoSansJP-Regular.ttf）は public/fonts に手動配置が必要。Vercel デプロイ前に確認

### ⑤ 注意点
- `$transaction(async callback)` 内で `notFound()` / `redirect()` を呼ぶと Prisma がロールバックを試みる。制御フロー用 throw は必ずトランザクション外で行うこと
- Server Action 内の `getUser()` は `getAuthUser()` を使わず直接 `createClient()` を呼んでいる（Server Action は React のレンダーツリー外で実行されるため `cache()` が効かない）。これは意図した設計

### 動作確認済み（2026-06-23）
- 一覧 → 詳細 → 編集 → 保存 → 詳細 遷移 ✅
- 新規作成: AI 抽出 → 要約・決定事項・TODO 編集 → 保存 ✅
- 削除ボタン → confirm → 削除 → 一覧 遷移 ✅
- PDF ダウンロード ✅
- 他ユーザーの議事録を直接 URL で編集・削除しようとすると 404 ✅
