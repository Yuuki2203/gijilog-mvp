"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createMinute } from "@/app/actions/minutes";

type ExtractedResult = {
  title: string;
  meetingDate: string;
  decisions: string[];
  todos: Array<{
    content: string;
    assignee: string | null;
    dueDate: string | null;
  }>;
};

export default function NewMinutePage() {
  // 入力
  const [rawText, setRawText] = useState("");

  // UI状態
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 抽出結果フォーム
  const [extracted, setExtracted] = useState<ExtractedResult | null>(null);
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [decisions, setDecisions] = useState<string[]>([]);
  const [todos, setTodos] = useState<ExtractedResult["todos"]>([]);

  // ファイル読み込み
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawText((ev.target?.result as string) ?? "");
    };
    reader.readAsText(file, "utf-8");
  }

  // AI抽出
  async function handleExtract() {
    if (!rawText.trim()) {
      setError("テキストを入力してください。");
      return;
    }
    setIsExtracting(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "抽出に失敗しました。");
      }
      const data: ExtractedResult = await res.json();
      setExtracted(data);
      setTitle(data.title);
      setMeetingDate(data.meetingDate);
      setDecisions(data.decisions);
      setTodos(data.todos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "抽出に失敗しました。");
    } finally {
      setIsExtracting(false);
    }
  }

  // 保存
  async function handleSave() {
    if (!title.trim()) {
      setError("タイトルを入力してください。");
      return;
    }
    if (!meetingDate) {
      setError("日付を入力してください。");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await createMinute({ title, meetingDate, decisions, todos });
    } catch (err) {
      // redirect()はエラーとしてthrowされるため除外
      if (err instanceof Error && err.message !== "NEXT_REDIRECT") {
        setError("保存に失敗しました。");
        setIsSaving(false);
      }
    }
  }

  // 決定事項の操作
  function updateDecision(index: number, value: string) {
    setDecisions((prev) => prev.map((d, i) => (i === index ? value : d)));
  }
  function addDecision() {
    setDecisions((prev) => [...prev, ""]);
  }
  function removeDecision(index: number) {
    setDecisions((prev) => prev.filter((_, i) => i !== index));
  }

  // TODOの操作
  function updateTodo(index: number, field: keyof ExtractedResult["todos"][0], value: string) {
    setTodos((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value || null } : t))
    );
  }
  function addTodo() {
    setTodos((prev) => [...prev, { content: "", assignee: null, dueDate: null }]);
  }
  function removeTodo(index: number) {
    setTodos((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">新規作成</h1>

      {/* Step1: テキスト入力 */}
      <section className="mb-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="file">ファイルから読み込む（.txt / .md）</Label>
          <Input
            id="file"
            type="file"
            accept=".txt,.md"
            className="mt-1"
            onChange={handleFileChange}
          />
        </div>
        <div>
          <Label htmlFor="rawText">会議テキスト</Label>
          <Textarea
            id="rawText"
            className="mt-1 min-h-40"
            placeholder="会議の議事メモをここに貼り付けてください..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </div>
        {error && !extracted && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button onClick={handleExtract} disabled={isExtracting}>
          {isExtracting ? "抽出中..." : "AI抽出"}
        </Button>
      </section>

      {/* Step2: 抽出結果の編集 */}
      {extracted && (
        <section className="flex flex-col gap-6 border-t pt-6">
          <h2 className="text-lg font-semibold">抽出結果の確認・編集</h2>

          {/* タイトル */}
          <div>
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              className="mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 日付 */}
          <div>
            <Label htmlFor="meetingDate">会議日</Label>
            <Input
              id="meetingDate"
              type="date"
              className="mt-1"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
            />
          </div>

          {/* 決定事項 */}
          <div>
            <Label>決定事項</Label>
            <div className="mt-2 flex flex-col gap-2">
              {decisions.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={d}
                    onChange={(e) => updateDecision(i, e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDecision(i)}
                  >
                    削除
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addDecision}>
                ＋ 追加
              </Button>
            </div>
          </div>

          {/* TODO */}
          <div>
            <Label>TODO</Label>
            <div className="mt-2 flex flex-col gap-3">
              {todos.map((todo, i) => (
                <div key={i} className="rounded-lg border p-3 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="内容"
                      value={todo.content}
                      onChange={(e) => updateTodo(i, "content", e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTodo(i)}
                    >
                      削除
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="担当者"
                      value={todo.assignee ?? ""}
                      onChange={(e) => updateTodo(i, "assignee", e.target.value)}
                    />
                    <Input
                      type="date"
                      value={todo.dueDate ?? ""}
                      onChange={(e) => updateTodo(i, "dueDate", e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addTodo}>
                ＋ 追加
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存する"}
          </Button>
        </section>
      )}
    </main>
  );
}
