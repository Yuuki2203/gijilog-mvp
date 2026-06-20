export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-3xl font-bold">Gijilog</h1>
      <p className="text-muted-foreground">
        AIが議事録から要約・決定事項・ToDoを自動抽出します。
      </p>
      {/* TODO: Step1完了後、ログイン導線(Linkコンポーネント)を追加 */}
    </main>
  );
}
