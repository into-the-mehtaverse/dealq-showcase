'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/serverClient'
import { getBillingInfo } from '@/lib/api/actions/getBillingInfo'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/', 'layout')

    // Check if user has an active subscription
    let billingInfo
    try {
      billingInfo = await getBillingInfo()
    } catch (error) {
      // If we can't get billing info, assume no subscription and go to checkout
      redirect('/checkout')
    }

    // If user has an active subscription, redirect to dashboard
    if (billingInfo.subscription && billingInfo.subscription.status === 'active') {
      redirect('/dashboard/deals')
    }

    // Default to checkout if no active subscription
    redirect('/checkout')
  } catch (error) {
    // Only catch non-redirect errors
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      // Re-throw redirect errors so they can be handled by Next.js
      throw error
    }

    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        name: formData.get('name') as string,
      },
    },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/checkout')
}

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.startsWith('http') ? url : `https://${url}`
  // Make sure to include a trailing `/`.
  url = url.endsWith('/') ? url : `${url}/`
  return url
}

// Helper function to determine redirect path based on subscription status
async function getRedirectPath(): Promise<string> {
  try {
    const billingInfo = await getBillingInfo()

    // If user has an active subscription, redirect to dashboard
    if (billingInfo.subscription && billingInfo.subscription.status === 'active') {
      return '/dashboard'
    }
  } catch (error) {
    // If we can't get billing info, assume no subscription and go to checkout
  }

  // Default to checkout if no active subscription
  return '/checkout'
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const redirectUrl = `${getURL()}auth/callback`

  // Determine the correct redirect path based on subscription status
  const nextPath = await getRedirectPath()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        prompt: 'select_account', // Force account selection
        next: nextPath, // Pass next as query param
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Return the OAuth URL for client-side redirect
  return { url: data.url }
}

export async function signUpWithGoogle() {
  const supabase = await createClient()
  const redirectUrl = `${getURL()}auth/callback`

  // For new signups, always go to checkout
  const nextPath = '/checkout'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        prompt: 'select_account', // Force account selection
        next: nextPath, // Pass next as query param
      },
    },
  })

  if (error) {
    console.error('Google OAuth error:', error)
    return { error: error.message }
  }

  // Return the OAuth URL for client-side redirect
  return { url: data.url }
}
