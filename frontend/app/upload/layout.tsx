import { createClient } from '@/lib/supabase/serverClient'
import { redirect } from 'next/navigation'
import UploadLayoutClient from './layout-client'

interface UploadLayoutProps {
  children: React.ReactNode
}

export default async function UploadLayout({ children }: UploadLayoutProps) {
  // Create server-side Supabase client
  const supabase = await createClient()

  // Get user data server-side
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/landing/login')
  }

  // Get user info for the layout
  const userInfo = {
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    avatar: user.user_metadata?.avatar_url
  }

  return (
    <UploadLayoutClient userInfo={userInfo}>
      {children}
    </UploadLayoutClient>
  )
}
