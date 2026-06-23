'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signInAsGuest() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInAnonymously()
  if (error) {
    return { error: error.message }
  }
  redirect('/minutes')
}
