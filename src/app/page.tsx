import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/minutes')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg">Gijilog</span>
        <Button asChild variant="outline" size="sm">
          <Link href="/login">ログイン</Link>
        </Button>
      </header>

      {/* ヒーローセクション */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-8 py-16">
        <div className="flex flex-col gap-4 max-w-xl">
          <h1 className="text-4xl font-bold leading-tight">
            AIが議事録を<br />自動で整理する
          </h1>
          <p className="text-muted-foreground text-lg">
            テキストを貼るだけで、決定事項・TODOを自動抽出。<br />
            PDFで即出力。
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/login">今すぐ試す →</Link>
        </Button>

        {/* 機能3点 */}
        <div className="flex gap-8 text-sm text-muted-foreground">
          <span>✦ AI自動抽出</span>
          <span>✦ TODO管理</span>
          <span>✦ PDF出力</span>
        </div>

        {/* スクリーンショット */}
        <div className="mt-4 w-full max-w-3xl rounded-xl border shadow-lg overflow-hidden">
          <Image
            src="/screenshot.png"
            alt="Gijilog の画面イメージ"
            width={1280}
            height={800}
            className="w-full h-auto"
            priority
          />
        </div>
      </main>
    </div>
  )
}