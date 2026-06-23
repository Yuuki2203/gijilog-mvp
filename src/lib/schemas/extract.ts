import { z } from "zod";

export const extractRequestSchema = z.object({
  rawText: z
    .string()
    .min(10, "テキストが短すぎます(10文字以上を入力してください)")
    .max(50000, "テキストが長すぎます(50,000文字以内で入力してください)"),
});

export type ExtractRequest = z.infer<typeof extractRequestSchema>;

export const extractedMinutesSchema = z.object({
  title: z.string(),
  summary: z.string(),
  decisions: z.array(z.string()),
  todos: z.array(
    z.object({
      content: z.string(),
      assignee: z.string().nullable(),
      dueDate: z.string().nullable(),
    })
  ),
});

export type ExtractedMinutes = z.infer<typeof extractedMinutesSchema>;
