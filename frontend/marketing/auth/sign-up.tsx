'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signup, signUpWithGoogle } from './actions/login'
import { createCheckoutSession } from '@/lib/api/actions/createCheckoutSession'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus } from 'lucide-react'

export default function SignUpForm() {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Get error from URL params (for other error sources)
  const urlError = searchParams.get('error')
  const message = searchParams.get('message')
  const selectedPlan = searchParams.get('plan') // Get selected plan from URL
  const canceled = searchParams.get('canceled') // Check if checkout was canceled

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signup(formData)

      // If we get here, signup was successful and redirect happened
      // If there was an error, result.error will contain the message
      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // If signup was successful and we have a selected plan, create checkout session
      if (selectedPlan && (selectedPlan === 'starter' || selectedPlan === 'professional')) {
        try {
          const priceId = selectedPlan === 'starter'
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_MONTHLY!
            : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY!

          const checkoutData = await createCheckoutSession({
            price_id: priceId,
            success_url: `${window.location.origin}/dashboard/billing?success=true`,
            cancel_url: `${window.location.origin}/landing/sign-up?plan=${selectedPlan}&canceled=true`
          })

          // Redirect to Stripe checkout
          window.location.href = checkoutData.checkout_url
        } catch (checkoutError) {
          console.error('Checkout session creation failed:', checkoutError)
          // If checkout fails, redirect to checkout page to try again
          window.location.href = '/checkout'
        }
      } else {
        // No plan selected, redirect to checkout to select a plan
        window.location.href = '/checkout'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

      const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError(null)

    try {
      const result = await signUpWithGoogle()

      if (result?.error) {
        setError(result.error)
        setGoogleLoading(false)
      } else if (result?.url) {
        // Perform the redirect on the client side
        window.location.href = result.url
      } else {
        setError('Failed to initiate Google sign-up')
        setGoogleLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full bg-transparent border-0">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 text-primary mb-4">
            <UserPlus className="h-12 w-12" />
          </div>
          <CardTitle className="text-3xl font-extrabold">
            Create your account
          </CardTitle>
          <CardDescription className="text-base">
            Join DealQ to analyze real estate deals
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Selected Plan Display */}
          {selectedPlan && (
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="text-sm font-medium text-accent">
                Selected Plan: {selectedPlan === 'starter' ? 'Starter ($30/month)' : 'Professional ($175/month)'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                You'll be redirected to checkout after creating your account
              </div>
            </div>
          )}

          {/* Canceled Checkout Message */}
          {canceled && (
            <Alert>
              <AlertDescription>
                Checkout was canceled. You can try again after creating your account.
              </AlertDescription>
            </Alert>
          )}

          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Enter your full name"
                disabled={loading}
                className="w-full"
              />
            </div>

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
                autoComplete="new-password"
                required
                placeholder="Create a password"
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

            {message && (
              <Alert>
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Creating account...' : selectedPlan ? 'Create account & Continue to Checkout' : 'Create account'}
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
            onClick={handleGoogleSignUp}
            className="w-full"
            size="lg"
          >
            {googleLoading ? (
              'Signing up with Google...'
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
              Already have an account?{' '}
              <a
                href="/landing/login"
                className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
              >
                Sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
