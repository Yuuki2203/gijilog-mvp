import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const minute = await prisma.minute.findFirst({
    where: { id, userId: user.id },
    include: {
      decisions: { orderBy: { order: "asc" } },
      todos: { orderBy: { order: "asc" } },
    },
  });

  if (!minute) {
    return NextResponse.json({ error: "見つかりません。" }, { status: 404 });
  }

  return NextResponse.json({
    id: minute.id,
    title: minute.title,
    meetingDate: minute.meetingDate.toISOString().split("T")[0],
    decisions: minute.decisions.map((d) => d.content),
    todos: minute.todos.map((t) => ({
      content: t.content,
      assignee: t.assignee,
      dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
    })),
  });
}
