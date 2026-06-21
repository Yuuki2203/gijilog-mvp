import Anthropic from "@anthropic-ai/sdk";
import { extractedMinutesSchema, type ExtractedMinutes } from "@/lib/schemas/extract";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EXTRACT_TOOL = {
  name: "extract_minutes",
  description:
    "会議の文字起こし/メモから、タイトル・要約・決定事項・ToDoを抽出する",
  input_schema: {
    type: "object" as const,
    properties: {
      title: {
        type: "string",
        description: "会議の内容を表す簡潔なタイトル(20字程度)",
      },
      summary: {
        type: "string",
        description: "会議全体の要約(200〜400字程度)",
      },
      decisions: {
        type: "array",
        items: { type: "string" },
        description: "会議で決定した事項のリスト",
      },
      todos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            content: { type: "string", description: "ToDoの内容" },
            assignee: {
              type: ["string", "null"],
              description: "担当者名。本文に明記がなければnull(推測しない)",
            },
            dueDate: {
              type: ["string", "null"],
              description: "期限(YYYY-MM-DD)。本文に明記がなければnull(推測しない)",
            },
          },
          required: ["content", "assignee", "dueDate"],
        },
        description: "会議で発生したToDoのリスト",
      },
    },
    required: ["title", "summary", "decisions", "todos"],
  },
};

export async function extractMinutes(rawText: string): Promise<ExtractedMinutes> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "extract_minutes" },
    messages: [
      {
        role: "user",
        content: `以下は会議の文字起こし、またはメモです。内容を抽出してください。\n\n---\n${rawText}\n---`,
      },
    ],
  });

  const toolUseBlock = response.content.find((block) => block.type === "tool_use");

  if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
    throw new Error("AIから構造化データを取得できませんでした");
  }

  return extractedMinutesSchema.parse(toolUseBlock.input);
}
