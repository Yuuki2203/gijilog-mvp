export default function MinutesListPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold">議事録一覧</h1>
      <p className="mt-2 text-muted-foreground">まだ議事録がありません。</p>
      {/* TODO: Step2(Prisma)完了後、DBから一覧取得して表示 */}
    </main>
  );
}
