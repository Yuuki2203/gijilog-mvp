import { NextRequest, NextResponse } from "next/server";
import { extractRequestSchema } from "@/lib/schemas/extract";
import { extractMinutes } from "@/lib/claude";

// TODO: 認証実装後、ここでSupabaseのセッションチェックを追加する
// (未認証ユーザーが呼べると、Claude APIの課金が無防備に発生するため)
export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsedRequest = extractRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: parsedRequest.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const result = await extractMinutes(parsedRequest.data.rawText);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI extraction failed:", error);
    return NextResponse.json(
      { error: "AI抽出処理に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
