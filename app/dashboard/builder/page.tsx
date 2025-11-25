'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { storage, getAllResumesWithDetails } from '@/lib/storage'

interface Resume {
    id: number
    title: string
    name_id: number | null
    phone_id: number | null
    email_id: number | null
    name_value: string | null
    phone_value: string | null
    email_value: string | null
    experience_ids: Array<{ id: number; template_id: number; selected_highlight_ids: number[]; display_order: number }>
    education_ids: Array<{ id: number; display_order: number }>
    createdAt: string
    updatedAt: string
}

export default function BuilderPage() {
    const [resumes, setResumes] = useState<Resume[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchResumes()
    }, [])

    const fetchResumes = async () => {
        try {
            const data = getAllResumesWithDetails().filter(Boolean) as Resume[]
            setResumes(data)
        } catch (error) {
            console.error('Error fetching resumes:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this resume?')) {
            return
        }

        try {
            // Delete resume experience instances
            storage.deleteWhere('resume_experience_instances', (i: any) => i.resume_id === id)

            // Delete resume education entries
            storage.deleteWhere('resume_education', (e: any) => e.resume_id === id)

            // Delete the resume
            const deleted = storage.delete('resumes', id)

            if (!deleted) {
                alert('Error: Resume not found')
                return
            }

            await fetchResumes()
        } catch (error) {
            console.error('Error deleting resume:', error)
            alert('Error deleting resume')
        }
    }

    return (
        <main className="container mx-auto py-12 px-4">
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    ← Back to Dashboard
                </Link>
            </div>

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Resume Builder</h1>
                <Link
                    href="/dashboard/builder/new"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                    + Create New Resume
                </Link>
            </div>

            {isLoading ? (
                <div className="bg-white rounded-lg shadow-md p-6 border">
                    <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {resumes.length > 0 ? (
                        resumes.map((resume) => (
                            <div
                                key={resume.id}
                                className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{resume.title}</h3>

                                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                                            {resume.name_value && <p><strong>Name:</strong> {resume.name_value}</p>}
                                            {resume.phone_value && <p><strong>Phone:</strong> {resume.phone_value}</p>}
                                            {resume.email_value && <p><strong>Email:</strong> {resume.email_value}</p>}
                                        </div>

                                        <div className="flex gap-4 text-xs text-gray-500">
                                            {resume.experience_ids && resume.experience_ids.length > 0 && (
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                    {resume.experience_ids.length} experience {resume.experience_ids.length === 1 ? 'item' : 'items'}
                                                </span>
                                            )}
                                            {resume.education_ids && resume.education_ids.length > 0 && (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                                    {resume.education_ids.length} education {resume.education_ids.length === 1 ? 'item' : 'items'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <Link
                                            href={`/dashboard/builder/preview/${resume.id}`}
                                            className="bg-green-100 text-green-700 px-4 py-2 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
                                        >
                                            Print
                                        </Link>
                                        <Link
                                            href={`/dashboard/builder/edit/${resume.id}`}
                                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(resume.id)}
                                            className="bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-12 border text-center">
                            <p className="text-gray-500 mb-4">No resumes yet. Create your first one!</p>
                            <Link
                                href="/dashboard/builder/new"
                                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                            >
                                + Create New Resume
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </main>
    )
}
