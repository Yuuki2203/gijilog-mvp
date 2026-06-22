import type { Minute, Decision, Todo } from "@prisma/client";

/**
 * 詳細画面・一覧画面で使う、関連レコードを含んだ議事録の型。
 */
export type MinuteWithRelations = Minute & {
  decisions: Decision[];
  todos: Todo[];
};
