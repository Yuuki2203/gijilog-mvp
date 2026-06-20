import { z } from "zod";

/**
 * Claude APIのTool useで返される議事録抽出結果のスキーマ。
 * summaryの文字数(200〜400字)はプロンプト側で指示する目標値であり、
 * AI生成テキストの性質上ここでは厳密なmin/maxバリデーションはかけない。
 */
export const todoSchema = z.object({
  content: z.string().min(1, "ToDoの内容は必須です"),
  assignee: z.string().nullable(),
  dueDate: z.string().nullable(), // ISO 8601形式の日付文字列を想定
});

export const minuteExtractSchema = z.object({
  title: z.string().min(1).max(100),
  summary: z.string().min(1),
  decisions: z.array(z.string().min(1)),
  todos: z.array(todoSchema),
});

export type TodoInput = z.infer<typeof todoSchema>;
export type MinuteExtractInput = z.infer<typeof minuteExtractSchema>;
