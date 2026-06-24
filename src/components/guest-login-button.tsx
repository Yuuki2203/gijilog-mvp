'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signInAsGuest } from '@/app/login/actions'

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

function GuestLoginButtonInner({ size }: { size?: ButtonSize }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" className="w-full" size={size} disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ログイン中...
        </>
      ) : (
        'ゲストとして試す'
      )}
    </Button>
  )
}

export function GuestLoginButton({ size }: { size?: ButtonSize }) {
  return (
    <form action={signInAsGuest}>
      <GuestLoginButtonInner size={size} />
    </form>
  )
}
