'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import UploadSidebar from '@/features/verification/shared/upload-sidebar'
import UploadHeader from '@/features/verification/shared/upload-header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { logout } from '@/lib/supabase/auth'
import { useVerificationSelectors, useVerificationActions } from '@/features/verification/store'

// Dynamic import with SSR disabled for components that use browser APIs
const RightSidebar = dynamic(() => import('@/features/verification/shared/right-sidebar'), {
  ssr: false,
  loading: () => (
    <div className="fixed right-0 top-0 h-full w-[60%] bg-white border-l border-gray-200 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-slate-600">Loading viewer...</p>
      </div>
    </div>
  )
})

interface UserInfo {
  name: string
  email: string
  avatar?: string
}

interface UploadLayoutClientProps {
  children: React.ReactNode
  userInfo: UserInfo
}

export default function UploadLayoutClient({ children, userInfo }: UploadLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Get sidebar state and actions from verification store
  const rightSidebarOpen = useVerificationSelectors.useRightSidebarOpen()
  const { setRightSidebarOpen, setSelectedDocumentType } = useVerificationActions()

  // Check if we're on a page that should show the right sidebar
  const shouldShowRightSidebar = pathname === '/upload/rr' || pathname === '/upload/t-12'

  // Automatically open right sidebar and select correct document when reaching verify pages
  useEffect(() => {
    if (shouldShowRightSidebar) {
      // Open the right sidebar
      setRightSidebarOpen(true)

      // Select the correct document type based on the current page
      if (pathname === '/upload/rr') {
        setSelectedDocumentType('RR')
      } else if (pathname === '/upload/t-12') {
        setSelectedDocumentType('T12')
      }
    } else {
      // Close the right sidebar when leaving verify pages
      setRightSidebarOpen(false)
      setSelectedDocumentType(null)
    }
  }, [pathname, shouldShowRightSidebar, setRightSidebarOpen, setSelectedDocumentType])

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

  const handleSaveProgress = () => {
    // TODO: Implement save progress functionality
    console.log('Saving progress...')
  }

  const handleBack = () => {
    // TODO: Implement back navigation
    console.log('Going back...')
  }

  // Handle right sidebar toggle
  const handleRightSidebarToggle = () => {
    setRightSidebarOpen(!rightSidebarOpen)
  }

  // Handle left sidebar state changes
  const handleLeftSidebarChange = (isOpen: boolean) => {
    // If left sidebar is opening and right sidebar is open, close the right sidebar
    if (isOpen && rightSidebarOpen) {
      setRightSidebarOpen(false)
    }
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      open={!rightSidebarOpen} // Left sidebar is open when right sidebar is closed
      onOpenChange={handleLeftSidebarChange}
    >
      {/* Upload Sidebar */}
      <UploadSidebar
        userInfo={userInfo}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <SidebarInset className="flex flex-col overflow-hidden">
        {/* Upload Header */}
        <UploadHeader
          onSave={handleSaveProgress}
          onBack={handleBack}
          showBackButton={false} // Can be made dynamic based on current step
        />

        {/* Page Content */}
        <div className={`flex-1 overflow-auto p-6 transition-all duration-300 ease-in-out ${
          shouldShowRightSidebar && rightSidebarOpen ? 'mr-[60%]' : ''
        }`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </SidebarInset>

      {/* Right Sidebar - Only show on specific pages */}
      {shouldShowRightSidebar && (
        <RightSidebar
          isOpen={rightSidebarOpen}
          onToggle={handleRightSidebarToggle}
        />
      )}
    </SidebarProvider>
  )
}
