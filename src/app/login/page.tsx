'use client'

import { LoginForm } from '../../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  )
}
