import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";
import { formatDate } from "@/lib/utils";

export default async function MinutesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const minutes = await prisma.minute.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      meetingDate: true,
      _count: { select: { decisions: true, todos: true } },
    },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">議事録一覧</h1>
        <div className="flex gap-2">
          <form action={logout}>
            <button type="submit" className={buttonVariants({ variant: "outline" })}>
              ログアウト
            </button>
          </form>
          <Link href="/minutes/new" className={buttonVariants()}>
            新規作成
          </Link>
        </div>
      </div>

{minutes.length === 0 ? (
  <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
    <p className="text-muted-foreground">まだ議事録がありません。</p>
    <p className="text-sm text-muted-foreground">
      会議のテキストを貼り付けるだけで、AIが決定事項・TODOを自動で抽出します。
    </p>
    <Link href="/minutes/new" className={buttonVariants()}>
      最初の議事録を作成する
    </Link>
  </div>
) : (
        <div className="flex flex-col gap-3">
          {minutes.map((minute) => (
            <Link
              key={minute.id}
              href={`/minutes/${minute.id}`}
              className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="font-medium">{minute.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {formatDate(minute.meetingDate)}
              </div>
              <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                <span>決定事項 {minute._count.decisions}件</span>
                <span>TODO {minute._count.todos}件</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
