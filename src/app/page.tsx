import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-3xl font-bold">Gijilog</h1>
      <p className="text-muted-foreground">
        AIが議事録から要約・決定事項・ToDoを自動抽出します。
      </p>
      <Link
        href="/login"
        className="mt-2 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        はじめる
      </Link>
    </main>
  );
}
