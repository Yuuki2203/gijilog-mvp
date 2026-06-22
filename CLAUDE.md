\# CLAUDE.md



このファイルはプロジェクトの永続コンテキストとして、Claude Codeが各セッション開始時に自動的に読み込みます。



\## プロジェクト概要

\- gijilog-mvp: Gijilogにインスパイアされた議事録AI MVP

\- 目的: miryo.AI(AI駆動開発の受託企業)への応募ポートフォリオ

\- ターゲット想定: 中小企業向け業務システム



\## 技術スタック

\- Next.js 16 (App Router) + TypeScript

\- shadcn/ui (Nova preset)

\- Supabase Auth + Supabase Postgres + Prisma

\- Anthropic Claude API (claude-sonnet-4-6, Tool use で構造化JSON出力)

\- Zod (バリデーション)

\- @react-pdf/renderer (PDF出力)

\- Vercel (デプロイ)



\## アーキテクチャ上の重要な制約

\- PrismaはpostgresロールでDB接続するため、Supabaseの RLS (Row Level Security) を自動的にバイパスする

\- 認可はDB層に任せず、Server Actions内で必ず userId スコープの WHERE 句を明示すること

\- Supabase Data API (PostgREST) は無効化済み。クライアントからの直接アクセスは行わない

\- Supabaseリージョンは Tokyo (ap-northeast-1)



\## 開発の進め方（最優先ルール）

\- 要件定義 → 設計 → 実装 → テスト の順で進める。いきなり実装やファイル編集から始めない

\- 各フェーズが完了したら一度止まり、ユーザーの承認(OK)を得てから次のフェーズに進む。承認なしに複数ファイルへ一気に変更を加えない

\- MVPを優先し、過剰設計を避ける。提案が過剰設計だと感じた場合は、実装前に一言警告してから選択肢を示す

\- 現実の受託開発で採用される構成を優先する（理想論より実務的な判断）



\## コーディング規約

\- TypeScript、可読性重視、保守しやすい構成を優先

\- 実装した理由(なぜその設計/ライブラリを選んだか)を簡潔に添える



\## テスト方針

\- コアロジック(AI抽出処理・バリデーション等)はユニットテストを書く

\- UIフローは手動チェックリストで十分。過剰なテスト基盤(E2E自動化等)は組まない



\## レビュー観点（「レビューして」と言われた場合）

要件との整合性 / 保守性 / セキュリティ / パフォーマンス / 実務での妥当性 を確認する



\## ドキュメント運用

\- 技術選定・スキーマ確定・セキュリティ設計・既存方針からの逸脱など、技術面接で問われそうな設計判断は ARCHITECTURE\_DECISIONS.md に追記する

\- 大きな実装ステップが完了したら PROGRESS.md を更新し、①完了内容 ②確定した設計判断と理由 ③次にやること ④保留事項 ⑤注意点 を記録する



\## 実行環境

\- Windows / VSCode / PowerShell

\- コマンド例は PowerShell 構文で示す

