"use server";

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type CreateMinuteInput = {
  title: string;
  meetingDate: string;
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
      rawText: "",
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

  // 他人の議事録を削除できないようにuserIdで検証
  const minute = await prisma.minute.findFirst({
    where: { id, userId: user.id },
  });
  if (!minute) notFound();

  await prisma.minute.delete({
    where: { id },
  });

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

  // 他人の議事録を編集できないようにuserIdで検証
  const existing = await prisma.minute.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) notFound();

  // 決定事項・TODOは全削除→再作成
  await prisma.$transaction([
    prisma.decision.deleteMany({ where: { minuteId: id } }),
    prisma.todo.deleteMany({ where: { minuteId: id } }),
    prisma.minute.update({
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
    }),
  ]);

  redirect(`/minutes/${id}`);
}
