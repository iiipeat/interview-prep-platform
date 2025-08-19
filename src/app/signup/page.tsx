'use client'

import { SignupForm } from '../../components/auth/SignupForm'
import { AuthProvider } from '../../components/auth/AuthProvider'

export default function SignUpPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <SignupForm />
      </div>
    </AuthProvider>
  )
}