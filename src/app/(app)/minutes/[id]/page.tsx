export default async function MinuteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main>
      <h1 className="text-2xl font-bold">議事録詳細(仮)</h1>
      <p className="text-muted-foreground">ID: {id}</p>
      {/* TODO: Step2(Prisma)完了後、DBから取得して表示・編集フォームを実装 */}
    </main>
  );
}
