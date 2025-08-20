'use client'

import { SignupForm } from '../../components/auth/SignupForm'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <SignupForm />
    </div>
  )
}