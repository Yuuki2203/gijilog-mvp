"use server";

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type CreateMinuteInput = {
  title: string;
  meetingDate: string;
  rawText: string;
  summary: string;
  decisions: string[];
  todos: Array<{
    content: string;
    assignee: string | null;
    dueDate: string | null;
  }>;
};

export async function createMinute(input: CreateMinuteInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const minute = await prisma.minute.create({
    data: {
      userId: user.id,
      title: input.title,
      meetingDate: new Date(input.meetingDate),
      rawText: input.rawText,
      summary: input.summary,
      decisions: {
        create: input.decisions.map((content, order) => ({ content, order })),
      },
      todos: {
        create: input.todos.map((todo, order) => ({
          content: todo.content,
          assignee: todo.assignee,
          dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
          order,
        })),
      },
    },
  });

  redirect(`/minutes/${minute.id}`);
}

export async function deleteMinute(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // deleteMany は WHERE に userId を含み、0件なら所有権なしとみなす（TOCTOU 排除）
  const { count } = await prisma.minute.deleteMany({
    where: { id, userId: user.id },
  });
  if (count === 0) notFound();

  redirect("/minutes");
}

type UpdateMinuteInput = {
  title: string;
  meetingDate: string;
  decisions: string[];
  todos: Array<{
    content: string;
    assignee: string | null;
    dueDate: string | null;
  }>;
};

export async function updateMinute(id: string, input: UpdateMinuteInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // interactive transaction で所有権確認と更新を原子的に実行（TOCTOU 排除）
  await prisma.$transaction(async (tx) => {
    const existing = await tx.minute.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) notFound();

    // 決定事項・TODOは全削除→再作成
    await tx.decision.deleteMany({ where: { minuteId: id } });
    await tx.todo.deleteMany({ where: { minuteId: id } });
    await tx.minute.update({
      where: { id },
      data: {
        title: input.title,
        meetingDate: new Date(input.meetingDate),
        decisions: {
          create: input.decisions.map((content, order) => ({ content, order })),
        },
        todos: {
          create: input.todos.map((todo, order) => ({
            content: todo.content,
            assignee: todo.assignee,
            dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
            order,
          })),
        },
      },
    });
  });

  redirect(`/minutes/${id}`);
}
