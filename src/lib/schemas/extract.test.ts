import { describe, it, expect } from "vitest";
import { extractRequestSchema, extractedMinutesSchema } from "./extract";

describe("extractRequestSchema", () => {
  it("10文字以上の文字列でparseが成功する", () => {
    const result = extractRequestSchema.safeParse({ rawText: "a".repeat(10) });
    expect(result.success).toBe(true);
  });

  it("10文字未満の文字列でエラーになり、エラーメッセージに「10文字以上」が含まれる", () => {
    const result = extractRequestSchema.safeParse({ rawText: "短い" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("10文字以上");
    }
  });

  it("空文字列でエラーになる", () => {
    const result = extractRequestSchema.safeParse({ rawText: "" });
    expect(result.success).toBe(false);
  });
});

describe("extractedMinutesSchema", () => {
  it("全フィールドが正しい型で揃っている場合、parseが成功する", () => {
    const valid = {
      title: "テスト会議",
      summary: "会議の要約テキスト",
      decisions: ["決定事項1", "決定事項2"],
      todos: [
        { content: "タスク1", assignee: "山田", dueDate: "2026-06-30" },
      ],
    };
    const result = extractedMinutesSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("todos内のassigneeとdueDateがnullの場合でもparseが成功する", () => {
    const valid = {
      title: "テスト会議",
      summary: "会議の要約テキスト",
      decisions: [],
      todos: [{ content: "タスク1", assignee: null, dueDate: null }],
    };
    const result = extractedMinutesSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("titleが欠落している場合エラーになる", () => {
    const invalid = {
      summary: "会議の要約テキスト",
      decisions: [],
      todos: [],
    };
    const result = extractedMinutesSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("todos内のcontentが欠落している場合エラーになる", () => {
    const invalid = {
      title: "テスト会議",
      summary: "会議の要約テキスト",
      decisions: [],
      todos: [{ assignee: null, dueDate: null }],
    };
    const result = extractedMinutesSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
