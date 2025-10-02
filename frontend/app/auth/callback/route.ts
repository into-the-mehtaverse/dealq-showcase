import { createClient } from '@/lib/supabase/serverClient'
import { NextRequest, NextResponse } from 'next/server'
import { getBillingInfo } from '@/lib/api/actions/getBillingInfo'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/checkout'

  // For Google OAuth, redirect to checkout if no next param
  const redirectPath = next || '/checkout'

  // Use environment variable for origin instead of request.url
  const origin = process.env.NEXT_PUBLIC_SITE_URL

  // Handle OAuth errors from Google
  if (error) {
    return NextResponse.redirect(`${origin}/landing/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        return NextResponse.redirect(`${origin}/landing/login?error=${encodeURIComponent(exchangeError.message)}`)
      }

      if (data.session) {
        // Check if user has an active subscription
        try {
          const billingInfo = await getBillingInfo()

          // If user has an active subscription, redirect to dashboard
          if (billingInfo.subscription && billingInfo.subscription.status === 'active') {
            return NextResponse.redirect(`${origin}/dashboard/deals`)
          }
        } catch {
          // If we can't get billing info, assume no subscription and go to checkout
        }

        // Default to checkout if no active subscription
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    } catch {
      return NextResponse.redirect(`${origin}/landing/login?error=Unexpected error during authentication`)
    }
  }

  // If there's no code and no error, something went wrong
  return NextResponse.redirect(`${origin}/landing/login?error=Could not authenticate with Google`)
}
