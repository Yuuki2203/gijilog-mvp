import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { buttonVariants } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/minutes" className="text-lg font-semibold">
          Gijilog
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/minutes/new"
            className="text-muted-foreground hover:text-foreground"
          >
            新規作成
          </Link>
          <form action={logout}>
            <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
              ログアウト
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
