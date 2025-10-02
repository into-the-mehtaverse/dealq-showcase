import { createClient } from '@/lib/supabase/serverClient'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from './layout-client'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
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
    <DashboardLayoutClient userInfo={userInfo}>
      {children}
    </DashboardLayoutClient>
  )
}
