import { NextRequest, NextResponse } from "next/server";
import { extractRequestSchema } from "@/lib/schemas/extract";
import { extractMinutes } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "認証が必要です。再度ログインしてください。" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

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
