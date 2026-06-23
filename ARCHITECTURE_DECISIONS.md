# Architecture Decisions

## ADR-001: Supabase Auth + @supabase/ssr による認証基盤

### 決定内容
- ブラウザ用クライアント: `createBrowserClient` (`src/lib/supabase/client.ts`)
- サーバー用クライアント: `createServerClient` + Next.js 16 `cookies()` 非同期API (`src/lib/supabase/server.ts`)
- ルートガード: `src/proxy.ts`（Next.js 16 の proxy 規約）

### セッション検証に `getUser()` を使う理由
`getSession()` はローカル Cookie を読むだけでサーバー側のトークン再検証を行わない。
`getUser()` はSupabase Auth サーバーへの問い合わせを行うため、改ざん・失効トークンを正しく弾ける。
Supabase 公式が明示的に注意喚起している点。

### Server Component でのCookie書き込みを try/catch で握りつぶす理由
Next.js の Server Component はレスポンス送信後に Cookie を書き込めない仕様。
実際のセッション更新（トークンリフレッシュ）は proxy.ts ミドルウェアが担うため、
Server Component 側での書き込み失敗は無害であり、例外がアプリ全体に伝播しないよう握りつぶす。

### Next.js 16 対応: middleware → proxy 改名
package.json の実際のバージョンは 16.2.9（CLAUDE.md 記載の「15」は古い）。
Next.js 16 では `middleware.ts` が deprecated となり `proxy.ts` + `proxy` 関数エクスポートが必須。
ファイル名・関数名ともに `proxy` に統一している。

### ログインページの Supabase クライアント初期化をハンドラ内で行う理由
`createBrowserClient` をコンポーネントのレンダー関数直下（トップレベル）で呼ぶと、
Next.js のビルド時プリレンダリングフェーズで実行され env vars 未設定時にビルドが落ちる。
イベントハンドラ内で初期化することでビルド時の実行を回避し、実際のブラウザ実行時のみ呼ばれることを保証する。


## ADR-002: Confirm email 設定方針
### 決定内容
- 開発中: Confirm email = OFF（Supabase Dashboard側で設定）
- デプロイ前: ON に切替（運用ルールとして明記）
### 理由
ポートフォリオデモとしての動作確認しやすさを優先し、開発中はメール確認ステップを省略する。
本番相当の運用に進む際は、なりすましサインアップ防止のため必ずONに切り替える。
### 関連インシデント
開発中、本設定がチャット上の決定（OFF）に反してDashboard上でONのままになっており、
サインイン失敗の原因となった。「チャットでの決定」と「実環境（Dashboard等）への反映」は
別物であるという教訓を得た。今後、手動のダッシュボード操作を伴う決定は、実装完了後の
動作確認チェックリストに「設定が実際に反映されているか」を明示的な確認項目として加える。

## ADR-003: Supabase APIキーは publishable key を採用
### 決定内容
- 環境変数名: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `anon key`（JWT形式・レガシー）ではなく `publishable key`（`sb_publishable_...`形式）を使用
### 理由
Web検索による一次情報確認の結果、`anon key`は2026年末までに廃止予定のレガシー体系であり、
新規プロジェクトでは`publishable/secret`キー体系が現行標準であることが判明した。
ADR-001作成時点では`NEXT_PUBLIC_SUPABASE_ANON_KEY`を正としていたが、本決定により訂正する。
実コード（client.ts / server.ts / proxy.ts）は既に`PUBLISHABLE_KEY`を参照しており、
本ADRはその実態をドキュメント側に反映させるものである。

## ADR-004: 多層防御方針（ページガード + Server Action内検証）
### 決定内容
- `proxy.ts`によるルートガードでページ単位のアクセス制御を行う
- 加えて、すべてのServer Action内で`userId`を再取得し、Prismaクエリの`WHERE`句に反映する
### 理由
`proxy.ts`のガードは「そのページに到達できるか」のゲートに過ぎず、Server Action自体への
直接的な不正呼び出しを防げない。既存のPrisma設計（userIdスコープ）と一貫性を持たせるため、
データアクセス層でも必ず認可チェックを行う方針とする。

## ADR-005: Next.js 16 対応（middleware.ts → proxy.ts）
### 決定内容
- ファイル名: `middleware.ts` → `proxy.ts`
- エクスポート関数名: `middleware` → `proxy`
### 理由
Next.js 16では`middleware.ts`がdeprecatedとなり、`proxy.ts` + `proxy`関数エクスポートが
必須となった。また、旧middlewareがEdge Runtime前提だったのに対し、proxy.tsは既定でNode.js
ランタイム上で動作するという実行環境上の違いもある。

## ADR-006: React cache() による getAuthUser の重複排除
### 決定内容
`src/lib/auth.ts` に React の `cache()` でラップした `getAuthUser()` を定義し、
`(app)/layout.tsx` と各 Server Component（minutes/page.tsx、minutes/[id]/page.tsx）から呼ぶ。
### 理由
`(app)` レイアウトと各ページの両方で `supabase.auth.getUser()` を呼ぶと、1 リクエストで
Supabase Auth サーバーへの往復が 2 回発生する。`cache()` はリクエスト単位でメモ化するため
1 回に削減できる。
### 制約と注意点
- `cache()` は React のサーバーレンダリングツリー内でのみ有効。Server Action（`"use server"` ファイル）
  はレンダーツリーの外で実行されるため `cache()` が効かない。Server Action では引き続き
  `createClient()` から直接 `getUser()` を呼ぶ設計とした
- 将来 Parallel Routes（`@slot`）を追加した場合、各スロットが別ツリーになりメモ化が効かなくなる可能性がある

## ADR-007: deleteMinute で deleteMany + count チェックを採用
### 決定内容
`deleteMinute` Server Action では `prisma.minute.deleteMany({ where: { id, userId: user.id } })` を使い、
返り値の `count === 0` で所有権なし（404）と判定する。
### 理由
Prisma の `delete()` は `where` に主キー（id）のみを要求し、追加フィールドの型制約がある。
`deleteMany()` は任意のフィルタを `where` に受け付けるため、`userId` スコープを
**削除操作そのもの**に組み込むことができる。
これにより findFirst（所有権確認）→ delete（削除）の 2 ステップで生じる TOCTOU 競合を排除し、
CLAUDE.md の「Server Actions内で必ず userId スコープの WHERE 句を明示すること」を 1 クエリで満たせる。
### 代替案との比較
- findFirst + delete（旧実装）: TOCTOU あり、最終 delete に userId なし → CLAUDE.md 違反
- Prisma v4.5+ の `delete({ where: { id, userId } })`: 型レベルで許可されているかバージョン依存
- deleteMany + count（採用）: バージョン非依存、TOCTOU なし、userId スコープが明示的

## ADR-008: updateMinute でインタラクティブトランザクションを採用
### 決定内容
`updateMinute` Server Action では `prisma.$transaction(async (tx) => { ... })` を使い、
所有権確認（findFirst with userId）と削除・更新を同一トランザクション内で実行する。
### 理由
旧実装（findFirst + batch `$transaction([...])`）は所有権確認と更新の間に TOCTOU 競合があった。
インタラクティブトランザクションにより 2 操作を原子的に実行し、CLAUDE.md の userId スコープ
要件を findFirst の WHERE 句で満たす。
### 重要な制約
`redirect()` および `notFound()` はどちらも内部で例外を throw する Next.js の制御フロー機構。
これらを `$transaction` コールバック内で呼ぶと Prisma がロールバックを試みてから再 throw するが、
Prisma がエラーオブジェクトを変更しないことに依存している。より安全なパターンは
所有権確認の結果を戻り値で受け取り、`notFound()` をトランザクション外で呼ぶことだが、
現バージョンの Prisma はエラーオブジェクトを変更しないことが確認されているため現状維持とした。
`redirect()` はトランザクション外（`await prisma.$transaction(...)` の後）で呼ぶこと。

## ADR-009: rawText と summary の二重保存
### 決定内容
議事録レコードに原文テキスト（`rawText`）と AI 生成要約（`summary`）を両方 DB に保存する。
### 理由
- `rawText`: 将来の再抽出・監査証跡・検索インデックス用途のために保存。AI の抽出精度向上時に
  原文から再処理できる
- `summary`: 一覧ページでの表示（将来）・PDF 出力・ユーザーによる確認・編集のために保存。
  新規作成フォームの Step2 で AI 生成後にユーザーが修正できる UI を提供している
### UI での扱い
新規作成（`/minutes/new`）: Step2 の確認フォームに summary の Textarea を表示し、ユーザーが保存前に確認・編集可能。
編集（`/minutes/[id]/edit`）: 現状 summary フィールドは表示・編集不可（API レスポンスに未含有）。今後の改善候補。