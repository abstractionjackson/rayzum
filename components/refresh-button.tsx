'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <button
      className={`${isPending ? 'cursor-not-allowed text-gray-400' : ''
        } text-sm text-gray-500 hover:text-gray-900 transition-colors`}
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh()
        })
      }}
      title="Refresh resume components"
    >
      {isPending ? 'Refreshing...' : 'Refresh'}
    </button>
  )
}
