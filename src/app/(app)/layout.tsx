import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { Header } from "@/components/shared/Header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
