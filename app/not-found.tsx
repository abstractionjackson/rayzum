'use client'

export default function NotFound() {
    // This 404 page will handle client-side routing for GitHub Pages
    // GitHub Pages serves 404.html for unknown routes, which we can use
    // to handle dynamic routes client-side

    if (typeof window !== 'undefined') {
        // Redirect to the home page and let client-side routing handle it
        const path = window.location.pathname
        const basePath = process.env.NODE_ENV === 'production' ? '/rayzum' : ''

        // If we're on a dynamic route, just reload to let Next.js handle it
        if (path.includes('/dashboard/builder/edit/') || path.includes('/dashboard/builder/preview/')) {
            // The page should already be loaded by Next.js client-side router
            return null
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-gray-600 mb-8">Page not found</p>
                <a
                    href={process.env.NODE_ENV === 'production' ? '/rayzum/' : '/'}
                    className="text-blue-600 hover:text-blue-800"
                >
                    Go to Home
                </a>
            </div>
        </div>
    )
}
