'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Mail } from 'lucide-react'

export default function AwaitConfirmation() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md bg-transparent border-0 w-full">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 text-green-600 mb-4">
            <Mail className="h-12 w-12" />
          </div>
          <CardTitle className="text-3xl font-extrabold">
            Check your email
          </CardTitle>
          <CardDescription className="text-base">
            We've sent you a confirmation email to verify your account.
          </CardDescription>
          <CardDescription className="text-sm text-muted-foreground">
            Please check your inbox and click the confirmation link to activate your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertTitle>Didn't receive the email?</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 list-disc list-inside text-xs space-y-1">
                <li>Check your spam folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes for the email to arrive</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button asChild className="w-full" size="lg">
            <Link href="/landing/login">
              Go to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
