'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login, signInWithGoogle } from './actions/login'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LogIn } from 'lucide-react'

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Get error from URL params (for other error sources)
  const urlError = searchParams.get('error')

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await login(formData)

      // If we get here, login was successful and redirect happened
      // If there was an error, result.error will contain the message
      if (result?.error) {
        // NEXT_REDIRECT is expected when redirect() is called in server actions
        if (result.error === 'NEXT_REDIRECT') {
          // Don't set error, let the redirect happen
          return
        }
        setError(result.error)
        setLoading(false)
      }
    } catch (err) {
      // Check if this is a NEXT_REDIRECT error (expected when redirect() is called)
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
        // Don't set error, let the redirect happen
        return
      }

      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

      const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)

    try {
      const result = await signInWithGoogle()

      if (result?.error) {
        setError(result.error)
        setGoogleLoading(false)
      } else if (result?.url) {
        // Perform the redirect on the client side
        window.location.href = result.url
      } else {
        setError('Failed to initiate Google sign-in')
        setGoogleLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full bg-transparent border-0">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 text-primary mb-4">
            <LogIn className="h-12 w-12" />
          </div>
          <CardTitle className="text-3xl font-extrabold">
            Sign in to your account
          </CardTitle>
          <CardDescription className="text-base">
            Welcome back to DealQ
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                disabled={loading}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                disabled={loading}
                className="w-full"
              />
            </div>

            {(error || urlError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error || urlError}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={loading || googleLoading}
            onClick={handleGoogleSignIn}
            className="w-full"
            size="lg"
          >
            {googleLoading ? (
              'Signing in with Google...'
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Need an account?{' '}
              <a
                href="/landing/sign-up"
                className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
              >
                Sign up
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
