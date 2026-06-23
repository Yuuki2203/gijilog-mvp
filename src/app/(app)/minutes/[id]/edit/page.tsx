import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditForm } from "./EditForm";

export default async function EditMinutePage({
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

  if (!minute) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">議事録を編集</h1>
      <EditForm
        minuteId={id}
        initialTitle={minute.title}
        initialMeetingDate={minute.meetingDate.toISOString().split("T")[0]}
        initialDecisions={minute.decisions.map((d) => d.content)}
        initialTodos={minute.todos.map((t) => ({
          content: t.content,
          assignee: t.assignee,
          dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
        }))}
      />
    </main>
  );
}
