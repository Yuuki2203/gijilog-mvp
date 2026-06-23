import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { DeleteButton } from "./delete-button";
import { formatDate } from "@/lib/utils";

export default async function MinuteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  const minute = await prisma.minute.findFirst({
    where: { id, userId: user.id },
    include: {
      decisions: { orderBy: { order: "asc" } },
      todos: { orderBy: { order: "asc" } },
    },
  });

  if (!minute) return notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/minutes"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          ← 一覧に戻る
        </Link>
        <Link
          href={`/minutes/${minute.id}/edit`}
          className={buttonVariants({ size: "sm" })}
        >
          編集
        </Link>
      </div>

      <h1 className="text-2xl font-bold">{minute.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(minute.meetingDate)}
      </p>

      {/* 決定事項 */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">決定事項</h2>
        {minute.decisions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">なし</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {minute.decisions.map((d) => (
              <li key={d.id} className="flex gap-2 text-sm">
                <span className="text-muted-foreground">・</span>
                <span>{d.content}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* TODO */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">TODO</h2>
        {minute.todos.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">なし</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {minute.todos.map((todo) => (
              <li key={todo.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{todo.content}</p>
                <div className="mt-1 flex gap-4 text-muted-foreground">
                  <span>担当：{todo.assignee ?? "未定"}</span>
                  <span>
                    期日：{todo.dueDate ? formatDate(todo.dueDate) : "未定"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 border-t pt-6 flex items-center justify-between">
        <a
          href={`/api/minutes/${minute.id}/pdf`}
          download
          className={buttonVariants({ variant: "outline" })}
        >
          PDFダウンロード
        </a>
        <DeleteButton id={minute.id} />
      </div>
    </main>
  );
}
