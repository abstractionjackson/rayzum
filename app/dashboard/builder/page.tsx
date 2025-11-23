'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Resume {
    id: number
    title: string
    name_id: number | null
    phone_id: number | null
    email_id: number | null
    name_value: string | null
    phone_value: string | null
    email_value: string | null
    createdAt: string
    updatedAt: string
}

interface PersonalInfo {
    id: number
    value: string
    is_default: boolean
}

export default function BuilderPage() {
    const [resumes, setResumes] = useState<Resume[]>([])
    const [names, setNames] = useState<PersonalInfo[]>([])
    const [phones, setPhones] = useState<PersonalInfo[]>([])
    const [emails, setEmails] = useState<PersonalInfo[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingResume, setEditingResume] = useState<number | null>(null)
    
    // Form state
    const [formTitle, setFormTitle] = useState('')
    const [formNameId, setFormNameId] = useState<number | null>(null)
    const [formPhoneId, setFormPhoneId] = useState<number | null>(null)
    const [formEmailId, setFormEmailId] = useState<number | null>(null)

    useEffect(() => {
        fetchResumes()
        fetchPersonalInfo()
    }, [])

    const fetchResumes = async () => {
        try {
            const response = await fetch('/api/resumes')
            if (response.ok) {
                const data = await response.json()
                setResumes(data)
            }
        } catch (error) {
            console.error('Error fetching resumes:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchPersonalInfo = async () => {
        try {
            const [namesRes, phonesRes, emailsRes] = await Promise.all([
                fetch('/api/names'),
                fetch('/api/phones'),
                fetch('/api/emails')
            ])

            if (namesRes.ok) {
                const namesData = await namesRes.json()
                const mappedNames = namesData.map((n: any) => ({ id: n.id, value: n.name, is_default: n.is_default }))
                setNames(mappedNames)
                
                // Set default name if exists and form is empty
                const defaultName = mappedNames.find((n: PersonalInfo) => n.is_default)
                if (defaultName && formNameId === null && !editingResume) {
                    setFormNameId(defaultName.id)
                }
            }
            if (phonesRes.ok) {
                const phonesData = await phonesRes.json()
                const mappedPhones = phonesData.map((p: any) => ({ id: p.id, value: p.phone, is_default: p.is_default }))
                setPhones(mappedPhones)
                
                // Set default phone if exists and form is empty
                const defaultPhone = mappedPhones.find((p: PersonalInfo) => p.is_default)
                if (defaultPhone && formPhoneId === null && !editingResume) {
                    setFormPhoneId(defaultPhone.id)
                }
            }
            if (emailsRes.ok) {
                const emailsData = await emailsRes.json()
                const mappedEmails = emailsData.map((e: any) => ({ id: e.id, value: e.email, is_default: e.is_default }))
                setEmails(mappedEmails)
                
                // Set default email if exists and form is empty
                const defaultEmail = mappedEmails.find((e: PersonalInfo) => e.is_default)
                if (defaultEmail && formEmailId === null && !editingResume) {
                    setFormEmailId(defaultEmail.id)
                }
            }
        } catch (error) {
            console.error('Error fetching personal info:', error)
        }
    }

    const handleCreateResume = async (e: React.FormEvent) => {
        e.preventDefault()
        
        try {
            const response = await fetch('/api/resumes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formTitle,
                    name_id: formNameId,
                    phone_id: formPhoneId,
                    email_id: formEmailId
                })
            })

            if (response.ok) {
                resetForm()
                setShowCreateForm(false)
                await fetchResumes()
            } else {
                const error = await response.json()
                alert('Error creating resume: ' + error.error)
            }
        } catch (error) {
            console.error('Error creating resume:', error)
            alert('Error creating resume')
        }
    }

    const handleUpdateResume = async (resumeId: number) => {
        try {
            const response = await fetch('/api/resumes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: resumeId,
                    title: formTitle,
                    name_id: formNameId,
                    phone_id: formPhoneId,
                    email_id: formEmailId
                })
            })

            if (response.ok) {
                resetForm()
                setEditingResume(null)
                await fetchResumes()
            } else {
                const error = await response.json()
                alert('Error updating resume: ' + error.error)
            }
        } catch (error) {
            console.error('Error updating resume:', error)
            alert('Error updating resume')
        }
    }

    const handleDeleteResume = async (id: number) => {
        if (!confirm('Are you sure you want to delete this resume?')) return

        try {
            const response = await fetch('/api/resumes', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })

            if (response.ok) {
                await fetchResumes()
            } else {
                const error = await response.json()
                alert('Error deleting resume: ' + error.error)
            }
        } catch (error) {
            console.error('Error deleting resume:', error)
            alert('Error deleting resume')
        }
    }

    const startEdit = (resume: Resume) => {
        setFormTitle(resume.title)
        setFormNameId(resume.name_id)
        setFormPhoneId(resume.phone_id)
        setFormEmailId(resume.email_id)
        setEditingResume(resume.id)
        setShowCreateForm(false)
    }

    const resetForm = () => {
        setFormTitle('')
        // Set defaults when resetting form
        const defaultName = names.find(n => n.is_default)
        const defaultPhone = phones.find(p => p.is_default)
        const defaultEmail = emails.find(e => e.is_default)
        
        setFormNameId(defaultName?.id || null)
        setFormPhoneId(defaultPhone?.id || null)
        setFormEmailId(defaultEmail?.id || null)
    }

    const cancelEdit = () => {
        resetForm()
        setEditingResume(null)
        setShowCreateForm(false)
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

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Resume Builder</h1>
                <button
                    onClick={() => {
                        setShowCreateForm(!showCreateForm)
                        setEditingResume(null)
                        resetForm()
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    {showCreateForm ? 'Cancel' : '+ New Resume'}
                </button>
            </div>

            {/* Create/Edit Form */}
            {(showCreateForm || editingResume !== null) && (
                <div className="bg-white rounded-lg shadow-md p-6 border mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingResume !== null ? 'Edit Resume' : 'Create New Resume'}
                    </h2>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        if (editingResume !== null) {
                            handleUpdateResume(editingResume)
                        } else {
                            handleCreateResume(e)
                        }
                    }} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Resume Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Software Engineer Resume"
                                required
                            />
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Name
                                </label>
                                <select
                                    id="name"
                                    value={formNameId || ''}
                                    onChange={(e) => setFormNameId(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">None</option>
                                    {names.map((name) => (
                                        <option key={name.id} value={name.id}>
                                            {name.value} {name.is_default ? '(Default)' : ''}
                                        </option>
                                    ))}
                                </select>
                                {names.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        <Link href="/dashboard/personal" className="text-blue-600 hover:underline">
                                            Add names
                                        </Link>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone
                                </label>
                                <select
                                    id="phone"
                                    value={formPhoneId || ''}
                                    onChange={(e) => setFormPhoneId(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">None</option>
                                    {phones.map((phone) => (
                                        <option key={phone.id} value={phone.id}>
                                            {phone.value} {phone.is_default ? '(Default)' : ''}
                                        </option>
                                    ))}
                                </select>
                                {phones.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        <Link href="/dashboard/personal" className="text-blue-600 hover:underline">
                                            Add phones
                                        </Link>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <select
                                    id="email"
                                    value={formEmailId || ''}
                                    onChange={(e) => setFormEmailId(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">None</option>
                                    {emails.map((email) => (
                                        <option key={email.id} value={email.id}>
                                            {email.value} {email.is_default ? '(Default)' : ''}
                                        </option>
                                    ))}
                                </select>
                                {emails.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        <Link href="/dashboard/personal" className="text-blue-600 hover:underline">
                                            Add emails
                                        </Link>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                {editingResume !== null ? 'Update Resume' : 'Create Resume'}
                            </button>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Resumes List */}
            <div className="bg-white rounded-lg shadow-md p-6 border">
                <h2 className="text-xl font-semibold mb-4">Your Resumes</h2>
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
                        ))}
                    </div>
                ) : resumes.length > 0 ? (
                    <div className="space-y-4">
                        {resumes.map((resume) => (
                            <div
                                key={resume.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-2">{resume.title}</h3>
                                        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                                            <div>
                                                <span className="font-medium">Name:</span>{' '}
                                                {resume.name_value || <span className="text-gray-400">Not set</span>}
                                            </div>
                                            <div>
                                                <span className="font-medium">Phone:</span>{' '}
                                                {resume.phone_value || <span className="text-gray-400">Not set</span>}
                                            </div>
                                            <div>
                                                <span className="font-medium">Email:</span>{' '}
                                                {resume.email_value || <span className="text-gray-400">Not set</span>}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-2">
                                            Updated: {new Date(resume.updatedAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => startEdit(resume)}
                                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteResume(resume.id)}
                                            className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">
                            No resumes yet. Create your first resume to get started!
                        </p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Create Your First Resume
                        </button>
                    </div>
                )}
            </div>
        </main>
    )
}
