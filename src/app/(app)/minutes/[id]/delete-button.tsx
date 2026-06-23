"use client";

import { deleteMinute } from "@/app/actions/minutes";
import { buttonVariants } from "@/components/ui/button";
import { isNextInternalError } from "@/lib/utils";

export function DeleteButton({ id }: { id: string }) {
  async function handleDelete() {
    if (!confirm("この議事録を削除しますか？この操作は取り消せません。")) return;
    try {
      await deleteMinute(id);
    } catch (err) {
      if (isNextInternalError(err)) throw err;
      alert("削除に失敗しました。もう一度お試しください。");
    }
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
