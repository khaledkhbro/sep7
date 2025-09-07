import { RegisterForm } from "@/components/auth/register-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

function RegisterPageContent() {
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
          <p className="text-gray-600">Join thousands of professionals</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  )
}
