import { supabase } from './client'
import { User, AuthError } from '@supabase/supabase-js'

export interface AuthResponse {
  user: User | null
  error: AuthError | null
}

export interface SignUpData {
  email: string
  password: string
  name?: string
}

export interface LogInData {
  email: string
  password: string
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name || '',
        },
      },
    })

    return {
      user: authData.user,
      error,
    }
  } catch (error) {
    return {
      user: null,
      error: error as AuthError,
    }
  }
}

/**
 * Log in a user with email and password
 */
export async function logIn(data: LogInData): Promise<AuthResponse> {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    return {
      user: authData.user,
      error,
    }
  } catch (error) {
    return {
      user: null,
      error: error as AuthError,
    }
  }
}

/**
 * Log out the current user
 */
export async function logout(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    return {
      error: error as AuthError,
    }
  }
}

/**
 * Get the current session
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    return { error }
  } catch (error) {
    return {
      error: error as AuthError,
    }
  }
}

/**
 * Sign up with Google OAuth
 */
export async function signUpWithGoogle(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    return { error }
  } catch (error) {
    return {
      error: error as AuthError,
    }
  }
}
