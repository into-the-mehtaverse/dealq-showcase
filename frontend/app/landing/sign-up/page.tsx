import { Suspense } from 'react'
import SignUpForm from '@/marketing/auth/sign-up'

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
