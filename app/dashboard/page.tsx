import Link from 'next/link'

export default function Dashboard() {
    return (
        <main className="container mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Link
                    href="/dashboard/personal"
                    className="block p-6 bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow"
                >
                    <h2 className="text-xl font-semibold mb-2 text-blue-600">Personal Information</h2>
                    <p className="text-gray-600">
                        Manage your personal details including names, contact information, and other basic details.
                    </p>
                </Link>

                <Link
                    href="/dashboard/builder"
                    className="block p-6 bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow"
                >
                    <h2 className="text-xl font-semibold mb-2 text-green-600">Resume Builder</h2>
                    <p className="text-gray-600">
                        Create and manage your resume instances by selecting personal information elements.
                    </p>
                </Link>

                <Link
                    href="/dashboard/experience"
                    className="block p-6 bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow"
                >
                    <h2 className="text-xl font-semibold mb-2 text-purple-600">Experience</h2>
                    <p className="text-gray-600">
                        Add and manage your work experience entries with highlights and bullet points.
                    </p>
                </Link>

                <Link
                    href="/dashboard/education-items"
                    className="block p-6 bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow"
                >
                    <h2 className="text-xl font-semibold mb-2 text-orange-600">Education</h2>
                    <p className="text-gray-600">
                        Add and manage your educational background and certifications.
                    </p>
                </Link>

                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold mb-2 text-gray-400">Skills</h2>
                    <p className="text-gray-500">
                        Manage your technical and soft skills.
                    </p>
                    <span className="text-sm text-gray-400 mt-2 block">Coming Soon</span>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold mb-2 text-gray-400">Projects</h2>
                    <p className="text-gray-500">
                        Showcase your personal and professional projects.
                    </p>
                    <span className="text-sm text-gray-400 mt-2 block">Coming Soon</span>
                </div>
            </div>
        </main>
    )
}