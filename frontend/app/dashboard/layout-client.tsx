'use client'

import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { logout } from '@/lib/supabase/auth'

interface UserInfo {
  name: string
  email: string
  avatar?: string
}

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userInfo: UserInfo
}

export default function DashboardLayoutClient({ children, userInfo }: DashboardLayoutClientProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const { error } = await logout()

      if (error) {
        console.error("Logout error:", error)
        // Still redirect even if there's an error
      }

      // Redirect to landing page
      router.push('/')
    } catch (err) {
      console.error("Logout failed:", err)
      // Still redirect even if there's an error
      router.push('/')
    }
  }

  return (
    <SidebarProvider defaultOpen>
      {/* Sidebar */}
      <Sidebar
        userInfo={userInfo}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <SidebarInset className="flex flex-col overflow-hidden">
        {/* Header */}
        <Header userInfo={userInfo} />

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-background mt-2 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
