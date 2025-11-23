import RefreshButton from './refresh-button'

export default function ResumeComponentsPlaceholder() {
  return (
    <div className="bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Resume Components</h2>
          <p className="text-sm text-gray-500">Loading resume components...</p>
        </div>
        <RefreshButton />
      </div>

      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="mb-4 space-y-2">
              <div className="h-6 w-48 rounded-md bg-gray-200" />
              <div className="h-4 w-32 rounded-md bg-gray-200" />
              <div className="h-3 w-24 rounded-md bg-gray-200" />
            </div>

            <div className="space-y-3">
              <div className="h-4 w-20 rounded-md bg-gray-200" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-start space-x-3">
                  <div className="mt-1.5 w-3 h-3 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-full rounded-md bg-gray-200" />
                    <div className="h-3 w-32 rounded-md bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
