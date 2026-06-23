"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMinute } from "@/app/actions/minutes";
import { isNextInternalError } from "@/lib/utils";
import { Loader2, AlertCircle } from "lucide-react";

type Todo = {
  content: string;
  assignee: string | null;
  dueDate: string | null;
};

type MinuteData = {
  id: string;
  title: string;
  meetingDate: string;
  decisions: string[];
  todos: Todo[];
};

export default function EditMinutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const [minuteId, setMinuteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [decisions, setDecisions] = useState<string[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 既存データを取得して初期値にセット
  useEffect(() => {
    params
      .then(({ id }) => {
        setMinuteId(id);
        fetch(`/api/minutes/${id}`)
          .then((res) => {
            if (!res.ok) throw new Error("取得に失敗しました。");
            return res.json() as Promise<MinuteData>;
          })
          .then((data) => {
            setTitle(data.title);
            setMeetingDate(data.meetingDate);
            setDecisions(data.decisions);
            setTodos(data.todos);
          })
          .catch(() => setError("議事録の取得に失敗しました。"))
          .finally(() => setIsLoading(false));
      })
      .catch(() => {
        setError("議事録の取得に失敗しました。");
        setIsLoading(false);
      });
  }, [params]);

  // 保存
  async function handleSave() {
    if (!title.trim()) { setError("タイトルを入力してください。"); return; }
    if (!meetingDate) { setError("日付を入力してください。"); return; }
    if (!minuteId) return;
    setIsSaving(true);
    setError(null);
    try {
      await updateMinute(minuteId, { title, meetingDate, decisions, todos });
    } catch (err) {
      if (isNextInternalError(err)) throw err;
      setError("保存に失敗しました。");
    } finally {
      setIsSaving(false);
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
  function updateTodo(index: number, field: keyof Todo, value: string) {
    setTodos((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        // content は NOT NULL のため空文字をそのまま保持。nullable フィールドのみ空文字を null に変換
        const newValue = field === "content" ? value : (value || null);
        return { ...t, [field]: newValue };
      })
    );
  }
  function addTodo() {
    setTodos((prev) => [...prev, { content: "", assignee: null, dueDate: null }]);
  }
  function removeTodo(index: number) {
    setTodos((prev) => prev.filter((_, i) => i !== index));
  }

  if (isLoading) {

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      読み込み中...
    </main>
  );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">議事録を編集</h1>

      <div className="flex flex-col gap-6">
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
                <Button variant="outline" size="sm" onClick={() => removeDecision(i)}>
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
                  <Button variant="outline" size="sm" onClick={() => removeTodo(i)}>
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
  <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
    <AlertCircle className="h-4 w-4 shrink-0" />
    {error}
  </div>
)}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
  <>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    保存中...
  </>
) : "保存する"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/minutes/${minuteId}`)}
          >
            キャンセル
          </Button>
        </div>
      </div>
    </main>
  );
}
