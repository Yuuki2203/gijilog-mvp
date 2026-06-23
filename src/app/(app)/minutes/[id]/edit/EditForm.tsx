"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMinute } from "@/app/actions/minutes";
import { isNextInternalError } from "@/lib/utils";
import { Loader2, AlertCircle } from "lucide-react";

type DecisionItem = { id: string; value: string };
type TodoItem = { id: string; content: string; assignee: string | null; dueDate: string | null };

type Props = {
  minuteId: string;
  initialTitle: string;
  initialMeetingDate: string;
  initialDecisions: string[];
  initialTodos: Array<{ content: string; assignee: string | null; dueDate: string | null }>;
};

export function EditForm({
  minuteId,
  initialTitle,
  initialMeetingDate,
  initialDecisions,
  initialTodos,
}: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [meetingDate, setMeetingDate] = useState(initialMeetingDate);
  const [decisions, setDecisions] = useState<DecisionItem[]>(() =>
    initialDecisions.map((v) => ({ id: crypto.randomUUID(), value: v }))
  );
  const [todos, setTodos] = useState<TodoItem[]>(() =>
    initialTodos.map((t) => ({ id: crypto.randomUUID(), ...t }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) { setError("タイトルを入力してください。"); return; }
    if (!meetingDate) { setError("日付を入力してください。"); return; }
    setIsSaving(true);
    setError(null);
    try {
      await updateMinute(minuteId, {
        title,
        meetingDate,
        decisions: decisions.map((d) => d.value),
        todos: todos.map(({ id: _, ...t }) => t),
      });
    } catch (err) {
      if (isNextInternalError(err)) throw err;
      setError("保存に失敗しました。");
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
    setTodos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), content: "", assignee: null, dueDate: null },
    ]);
  }
  function removeTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
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
        <Button variant="outline" onClick={() => router.push(`/minutes/${minuteId}`)}>
          キャンセル
        </Button>
      </div>
    </div>
  );
}
