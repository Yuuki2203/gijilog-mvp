import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractMinutes } from "./claude";

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(function () {
    return { messages: { create: mockCreate } };
  }),
}));

describe("extractMinutes", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("正常系: tool_useブロックを含む正しいレスポンスの場合、ExtractedMinutesを返す", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "extract_minutes",
          id: "test_id",
          input: {
            title: "A社新機能進捗会議",
            summary: "A社向け新機能の進捗確認を行った。",
            decisions: ["実装方針はBチームと来週決定する"],
            todos: [
              { content: "デザイン完成", assignee: "山田", dueDate: "2026-06-28" },
            ],
          },
        },
      ],
    });

    const result = await extractMinutes("テスト用の会議テキスト");
    expect(result.title).toBe("A社新機能進捗会議");
    expect(result.decisions).toHaveLength(1);
    expect(result.todos[0].assignee).toBe("山田");
  });

  it("異常系: tool_useブロックが含まれない場合、エラーをthrowする", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "申し訳ありません" }],
    });

    await expect(extractMinutes("テスト")).rejects.toThrow(
      "AIから構造化データを取得できませんでした"
    );
  });

  it("異常系: tool_useのinputが不正な形の場合、Zodバリデーションエラーをthrowする", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "extract_minutes",
          id: "test_id",
          input: {
            title: 12345, // 数値(不正: 文字列でなければならない)
            summary: "要約",
            decisions: [],
            todos: [],
          },
        },
      ],
    });

    await expect(extractMinutes("テスト")).rejects.toThrow();
  });
});
