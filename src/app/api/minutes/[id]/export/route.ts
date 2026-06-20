import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO: エクスポート機能の実装ステップで実装する。
  // クエリパラメータ(?format=pdf|md)に応じてMarkdownまたはPDF
  // (@react-pdf/renderer使用)を生成して返す。
  return NextResponse.json(
    { message: `Not implemented yet (id: ${id})` },
    { status: 501 }
  );
}
