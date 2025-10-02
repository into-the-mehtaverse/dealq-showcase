'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function ConfirmedEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full bg-transparent border-0">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 text-green-600 mb-4">
            <CheckCircle className="h-12 w-12" />
          </div>
          <CardTitle className="text-3xl font-extrabold">
            Email confirmed!
          </CardTitle>
          <CardDescription className="text-base">
            Your account has been successfully verified.
          </CardDescription>
          <CardDescription className="text-sm text-muted-foreground">
            You can now sign in to your DealQ account and start analyzing real estate deals.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-sm text-green-700">
                <p className="font-medium">Welcome to DealQ!</p>
                <p className="mt-1">Your account is now active and ready to use.</p>
              </div>
            </div>

            <Button asChild className="w-full" size="lg">
              <Link href="/landing/login">
                Sign In to Your Account
              </Link>
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Need help getting started?{' '}
                <Link
                  href="/landing"
                  className="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                >
                  Visit our homepage
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
