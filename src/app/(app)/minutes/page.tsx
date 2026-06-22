import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日`;
}

export default async function MinutesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
        <p className="text-muted-foreground">まだ議事録がありません。</p>
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
