'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import * as Tabs from '@radix-ui/react-tabs'
import { storage } from '@/lib/storage'

interface Resume {
    id: number
    title: string
    name_id: number | null
    phone_id: number | null
    email_id: number | null
    createdAt: string
    updatedAt: string
}

export default function Dashboard() {
    const [resumes, setResumes] = useState<Resume[]>([])
    const [activeTab, setActiveTab] = useState('resumes')

    useEffect(() => {
        loadResumes()
    }, [])

    const loadResumes = () => {
        const allResumes = storage.select('resumes')
        setResumes(allResumes)
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Top Panel */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Rayzum</h1>
                    <Link
                        href="/dashboard/builder/new"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        + New Resume
                    </Link>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex">
                    {/* Left Sidebar */}
                    <Tabs.List className="w-64 bg-white border-r border-gray-200 p-4 space-y-1">
                        <Tabs.Trigger
                            value="resumes"
                            className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-medium transition-colors"
                        >
                            Resumes
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="personal"
                            className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-medium transition-colors"
                        >
                            Personal Information
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="experience"
                            className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-medium transition-colors"
                        >
                            Experience
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="education"
                            className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:font-medium transition-colors"
                        >
                            Education
                        </Tabs.Trigger>
                    </Tabs.List>

                    {/* Main Panel */}
                    <div className="flex-1 overflow-auto">
                        <Tabs.Content value="resumes" className="p-6">
                            <div className="bg-white rounded-lg shadow">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">Your Resumes</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    {resumes.length === 0 ? (
                                        <div className="px-6 py-12 text-center">
                                            <p className="text-gray-500 mb-4">No resumes yet</p>
                                            <Link
                                                href="/dashboard/builder/new"
                                                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Create your first resume
                                            </Link>
                                        </div>
                                    ) : (
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Title
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Created
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Updated
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {resumes.map((resume) => (
                                                    <tr key={resume.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {resume.title}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500">
                                                                {new Date(resume.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500">
                                                                {new Date(resume.updatedAt).toLocaleDateString()}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <Link
                                                                href={`/dashboard/builder/edit/${resume.id}`}
                                                                className="text-blue-600 hover:text-blue-800 mr-4"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <Link
                                                                href={`/dashboard/builder/preview/${resume.id}`}
                                                                className="text-green-600 hover:text-green-800"
                                                            >
                                                                Preview
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </Tabs.Content>

                        <Tabs.Content value="personal" className="p-6">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
                                <p className="text-gray-600 mb-4">
                                    Manage your personal details including names, contact information, and other basic details.
                                </p>
                                <Link
                                    href="/dashboard/personal"
                                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Manage Personal Info
                                </Link>
                            </div>
                        </Tabs.Content>

                        <Tabs.Content value="experience" className="p-6">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience</h2>
                                <p className="text-gray-600 mb-4">
                                    Add and manage your work experience entries with highlights and bullet points.
                                </p>
                                <Link
                                    href="/dashboard/experience"
                                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Manage Experience
                                </Link>
                            </div>
                        </Tabs.Content>

                        <Tabs.Content value="education" className="p-6">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Education</h2>
                                <p className="text-gray-600 mb-4">
                                    Add and manage your educational background and certifications.
                                </p>
                                <Link
                                    href="/dashboard/education-items"
                                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Manage Education
                                </Link>
                            </div>
                        </Tabs.Content>
                    </div>
                </Tabs.Root>
            </div>
        </div>
    )
}