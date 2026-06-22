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