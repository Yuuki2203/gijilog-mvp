"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createMinute } from "@/app/actions/minutes";
import { isNextInternalError } from "@/lib/utils";
import type { ExtractedMinutes } from "@/lib/schemas/extract";
import { Loader2, AlertCircle } from "lucide-react";

type DecisionItem = { id: string; value: string };
type TodoItem = { id: string; content: string; assignee: string | null; dueDate: string | null };

export default function NewMinutePage() {
  const [rawText, setRawText] = useState("");

  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasExtracted, setHasExtracted] = useState(false);

  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [summary, setSummary] = useState("");
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawText((ev.target?.result as string) ?? "");
    };
    reader.readAsText(file, "utf-8");
  }

  async function handleExtract() {
    if (!rawText.trim()) {
      setExtractError("テキストを入力してください。");
      return;
    }
    setIsExtracting(true);
    setExtractError(null);
    setSaveError(null);
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
      const data: ExtractedMinutes = await res.json();
      setTitle(data.title);
      setSummary(data.summary ?? "");
      setDecisions(data.decisions.map((v) => ({ id: crypto.randomUUID(), value: v })));
      setTodos(data.todos.map((t) => ({ id: crypto.randomUUID(), ...t })));
      setHasExtracted(true);
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "抽出に失敗しました。");
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setSaveError("タイトルを入力してください。");
      return;
    }
    if (!meetingDate) {
      setSaveError("日付を入力してください。");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await createMinute({
        title,
        meetingDate,
        rawText,
        summary,
        decisions: decisions.map((d) => d.value),
        todos: todos.map(({ id: _, ...t }) => t),
      });
    } catch (err) {
      if (isNextInternalError(err)) throw err;
      setSaveError("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  }

  function updateDecision(id: string, value: string) {
    setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, value } : d)));
  }
  function addDecision() {
    setDecisions((prev) => [...prev, { id: crypto.randomUUID(), value: "" }]);
  }
  function removeDecision(id: string) {
    setDecisions((prev) => prev.filter((d) => d.id !== id));
  }

  function updateTodo(id: string, field: keyof Omit<TodoItem, "id">, value: string) {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const newValue = field === "content" ? value : (value || null);
        return { ...t, [field]: newValue };
      })
    );
  }
  function addTodo() {
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), content: "", assignee: null, dueDate: null }]);
  }
  function removeTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link href="/minutes" className={buttonVariants({ variant: "outline", size: "sm" })}>
          ← 一覧に戻る
        </Link>
      </div>
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
        {extractError && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {extractError}
          </div>
        )}
        <Button onClick={handleExtract} disabled={isExtracting}>
          {isExtracting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              AI解析中...
            </>
          ) : "AI抽出"}
        </Button>
      </section>

      {/* Step2: 抽出結果の編集 */}
      {hasExtracted && (
        <section className="flex flex-col gap-6 border-t pt-6">
          <h2 className="text-lg font-semibold">抽出結果の確認・編集</h2>

          <div>
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              className="mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="summary">要約</Label>
            <Textarea
              id="summary"
              className="mt-1 min-h-24"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

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

          <div>
            <Label>決定事項</Label>
            <div className="mt-2 flex flex-col gap-2">
              {decisions.map((d) => (
                <div key={d.id} className="flex gap-2">
                  <Input
                    value={d.value}
                    onChange={(e) => updateDecision(d.id, e.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={() => removeDecision(d.id)}>
                    削除
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addDecision}>
                ＋ 追加
              </Button>
            </div>
          </div>

          <div>
            <Label>TODO</Label>
            <div className="mt-2 flex flex-col gap-3">
              {todos.map((todo) => (
                <div key={todo.id} className="rounded-lg border p-3 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="内容"
                      value={todo.content}
                      onChange={(e) => updateTodo(todo.id, "content", e.target.value)}
                    />
                    <Button variant="outline" size="sm" onClick={() => removeTodo(todo.id)}>
                      削除
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="担当者"
                      value={todo.assignee ?? ""}
                      onChange={(e) => updateTodo(todo.id, "assignee", e.target.value)}
                    />
                    <Input
                      type="date"
                      value={todo.dueDate ?? ""}
                      onChange={(e) => updateTodo(todo.id, "dueDate", e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addTodo}>
                ＋ 追加
              </Button>
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {saveError}
            </div>
          )}

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : "保存する"}
          </Button>
        </section>
      )}
    </main>
  );
}
