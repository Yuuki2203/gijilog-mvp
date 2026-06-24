'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { GuestLoginButton } from '@/components/guest-login-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    // クライアント初期化をハンドラ内で行うことでビルド時のSSR実行を回避する
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません。');
    } else {
      router.push('/minutes');
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSignUp() {
    if (!email.trim()) {
      setError('メールアドレスを入力してください。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered')) {
        setError('このメールアドレスはすでに登録されています。');
      } else if (msg.includes('password') || msg.includes('at least')) {
        setError('パスワードが要件を満たしていません。6文字以上で入力してください。');
      } else if (msg.includes('email') || msg.includes('invalid format')) {
        setError('有効なメールアドレスを入力してください。');
      } else if (msg.includes('rate limit') || msg.includes('too many')) {
        setError('リクエストが多すぎます。しばらく時間をおいて再度お試しください。');
      } else {
        setError('サインアップに失敗しました。もう一度お試しください。');
      }
    } else if (data.session) {
      router.push('/minutes');
      router.refresh();
    } else {
      setError('サインアップに失敗しました。もう一度お試しください。');
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Gijilog</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" onValueChange={() => setError(null)}>
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">ログイン</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">サインアップ</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">メールアドレス</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">パスワード</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={handleLogin} disabled={loading}>
                {loading ? '処理中...' : 'ログイン'}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">メールアドレス</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">パスワード</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={handleSignUp} disabled={loading}>
                {loading ? '処理中...' : 'アカウント作成'}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">または</span>
            </div>
          </div>

          <GuestLoginButton />
        </CardContent>
      </Card>
    </main>
  );
}
