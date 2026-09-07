import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 text-red-500">Authentication Error</h1>
        <p className="text-gray-300 max-w-md mx-auto">
          We encountered an error while trying to authenticate your session. The secure link may have expired or is invalid.
        </p>
      </div>
      <Link 
        href="/onboarding" 
        className="bg-blue-600 px-6 py-3 rounded font-bold hover:bg-blue-500 transition-colors inline-block"
      >
        Return to Login
      </Link>
    </div>
  )
}
