import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware-utils'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/upload/:path*',
    '/underwrite/:path*',
    '/landing/login',
    '/landing/sign-up'
  ]
}
