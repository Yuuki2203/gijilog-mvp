"use client";

import { deleteMinute } from "@/app/actions/minutes";
import { buttonVariants } from "@/components/ui/button";

export function DeleteButton({ id }: { id: string }) {
  async function handleDelete() {
    if (!confirm("この議事録を削除しますか？この操作は取り消せません。")) return;
    await deleteMinute(id);
  }

  return (
    <button
      onClick={handleDelete}
      className={buttonVariants({ variant: "destructive" })}
    >
      削除する
    </button>
  );
}
