import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // TODO: AI抽出機能の実装ステップで実装する。
  // 1. リクエストボディからテキストを受け取る
  // 2. lib/claude.ts 経由でAnthropic APIを呼び出す(Tool use)
  // 3. MinuteExtractInput形式のJSONを返す
  return NextResponse.json(
    { message: "Not implemented yet" },
    { status: 501 }
  );
}
