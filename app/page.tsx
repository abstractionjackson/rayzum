import Link from 'next/link'
import { Suspense } from 'react'
import ResumeComponents from '@/components/table'
import ResumeComponentsPlaceholder from '@/components/table-placeholder'

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center py-12">
      <h1 className="pt-4 pb-8 bg-gradient-to-br from-black via-[#171717] to-[#575757] bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl">
        Resume Builder
      </h1>
      <p className="font-light text-gray-600 w-full max-w-lg text-center mt-6 mb-8">
        Create professional resumes with modular components. Build individual sections like experience bullet points and select which parts to include.
      </p>

      <div className="flex flex-col space-y-4 mb-12">
        <Link
          href="/dashboard"
          className="rounded-lg bg-blue-600 px-8 py-3 text-white font-medium hover:bg-blue-700 transition-colors text-center"
        >
          Go to Dashboard
        </Link>
      </div>

      <div className="w-full max-w-6xl px-4">
        <h2 className="text-2xl font-semibold text-center mb-6">Demo: Resume Components</h2>
        <Suspense fallback={<ResumeComponentsPlaceholder />}>
          <ResumeComponents />
        </Suspense>
      </div>
    </main>
  )
}
