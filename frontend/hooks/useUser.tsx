'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUser, getCurrentSession } from '@/lib/supabase/auth'

interface UserContextType {
  user: User | null
  loading: boolean
  error: string | null
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshUser = async () => {
    try {
      setLoading(true)
      setError(null)

      const { user: currentUser, error } = await getCurrentUser()

      if (error) {
        setError(error.message)
        setUser(null)
      } else {
        setUser(currentUser)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { session, error } = await getCurrentSession()

        if (error) {
          setError(error.message)
        } else if (session?.user) {
          setUser(session.user)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setLoading(true)

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          setError(null)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setError(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value: UserContextType = {
    user,
    loading,
    error,
    refreshUser,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }

  return context
}

// Convenience hook for checking if user is authenticated
export function useAuth() {
  const { user, loading } = useUser()
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user,
  }
}
