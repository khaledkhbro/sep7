import { LoginForm } from "@/components/auth/login-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">WorkHub</h1>
          </div>
          <p className="text-gray-600">Your gateway to opportunities</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
