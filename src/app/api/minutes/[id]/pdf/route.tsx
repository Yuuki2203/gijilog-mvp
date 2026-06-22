import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import path from "path";

Font.register({
  family: "NotoSansJP",
  src: path.join(process.cwd(), "public/fonts/NotoSansJP-Regular.ttf"),
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    padding: 40,
    fontSize: 11,
    color: "#1a1a1a",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  date: {
    fontSize: 11,
    color: "#666",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  item: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    width: 16,
    color: "#666",
  },
  itemText: {
    flex: 1,
  },
  todoBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  todoContent: {
    marginBottom: 4,
  },
  todoMeta: {
    flexDirection: "row",
    gap: 16,
    color: "#666",
    fontSize: 10,
  },
});

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}年${m}月${d}日`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const minute = await prisma.minute.findFirst({
    where: { id, userId: user.id },
    include: {
      decisions: { orderBy: { order: "asc" } },
      todos: { orderBy: { order: "asc" } },
    },
  });

  if (!minute) {
    return NextResponse.json({ error: "見つかりません。" }, { status: 404 });
  }

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{minute.title}</Text>
        <Text style={styles.date}>{formatDate(minute.meetingDate)}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>決定事項</Text>
          {minute.decisions.length === 0 ? (
            <Text style={{ color: "#999" }}>なし</Text>
          ) : (
            minute.decisions.map((d) => (
              <View key={d.id} style={styles.item}>
                <Text style={styles.bullet}>・</Text>
                <Text style={styles.itemText}>{d.content}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TODO</Text>
          {minute.todos.length === 0 ? (
            <Text style={{ color: "#999" }}>なし</Text>
          ) : (
            minute.todos.map((todo) => (
              <View key={todo.id} style={styles.todoBox}>
                <Text style={styles.todoContent}>{todo.content}</Text>
                <View style={styles.todoMeta}>
                  <Text>担当：{todo.assignee ?? "未定"}</Text>
                  <Text>期日：{todo.dueDate ? formatDate(todo.dueDate) : "未定"}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);

  const fileName = encodeURIComponent(`${minute.title}.pdf`);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
    },
  });
}
