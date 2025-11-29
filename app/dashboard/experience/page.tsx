'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { storage, getAllExperiencesWithHighlights, getNextId } from '@/lib/storage'

interface Highlight {
    id: number
    text: string
    createdAt?: string
}

interface Experience {
    id: number
    job_title: string
    company_name: string
    start_date: string
    end_date: string | null
    highlights: Highlight[]
    createdAt: string
    updatedAt: string
}

export default function ExperiencePage() {
    const [experiences, setExperiences] = useState<Experience[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)

    // Form state
    const [jobTitle, setJobTitle] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [highlightInputs, setHighlightInputs] = useState<string[]>([''])

    useEffect(() => {
        fetchExperiences()
    }, [])

    const fetchExperiences = async () => {
        try {
            const data = getAllExperiencesWithHighlights()
            setExperiences(data)
        } catch (error) {
            console.error('Error fetching experiences:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            if (editingId) {
                // Update existing experience
                const updated = storage.update('experience_templates', editingId, {
                    job_title: jobTitle,
                    company_name: companyName,
                    start_date: startDate,
                    end_date: endDate || null,
                    updatedAt: new Date().toISOString()
                } as any)

                if (!updated) {
                    alert('Error: Experience not found')
                    return
                }

                // Delete existing highlights
                storage.deleteWhere('highlights', h => h.experience_template_id === editingId)

                // Create new highlights
                highlightInputs.filter(h => h.trim()).forEach(text => {
                    storage.insert('highlights', {
                        experience_template_id: editingId,
                        text: text.trim()
                    } as any)
                })
            } else {
                // Create new experience
                const newExperience = storage.insert('experience_templates', {
                    job_title: jobTitle,
                    company_name: companyName,
                    start_date: startDate,
                    end_date: endDate || null,
                    updatedAt: new Date().toISOString()
                } as any)

                // Create highlights
                highlightInputs.filter(h => h.trim()).forEach(text => {
                    storage.insert('highlights', {
                        experience_template_id: newExperience.id,
                        text: text.trim()
                    } as any)
                })
            }

            resetForm()
            setShowForm(false)
            setEditingId(null)
            await fetchExperiences()
        } catch (error) {
            console.error('Error saving experience:', error)
            alert('Error saving experience')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this experience?')) return

        try {
            // Delete highlights first (cascade)
            storage.deleteWhere('highlights', h => h.experience_template_id === id)

            // Delete experience instances (cascade)
            storage.deleteWhere('resume_experience_instances', i => i.experience_template_id === id)

            // Delete experience template
            const deleted = storage.delete('experience_templates', id)

            if (!deleted) {
                alert('Error: Experience not found')
                return
            }

            await fetchExperiences()
        } catch (error) {
            console.error('Error deleting experience:', error)
            alert('Error deleting experience')
        }
    }

    const startEdit = (exp: Experience) => {
        setJobTitle(exp.job_title)
        setCompanyName(exp.company_name)
        setStartDate(exp.start_date)
        setEndDate(exp.end_date || '')
        setHighlightInputs(exp.highlights.length > 0 ? exp.highlights.map(h => h.text) : [''])
        setEditingId(exp.id)
        setShowForm(true)
    }

    const resetForm = () => {
        setJobTitle('')
        setCompanyName('')
        setStartDate('')
        setEndDate('')
        setHighlightInputs([''])
        setEditingId(null)
    }

    const addHighlightInput = () => {
        setHighlightInputs([...highlightInputs, ''])
    }

    const removeHighlightInput = (index: number) => {
        setHighlightInputs(highlightInputs.filter((_, i) => i !== index))
    }

    const updateHighlightInput = (index: number, value: string) => {
        const updated = [...highlightInputs]
        updated[index] = value
        setHighlightInputs(updated)
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Present'
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
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

            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold">Experience Templates</h1>
                <button
                    onClick={() => {
                        setShowForm(!showForm)
                        if (showForm) {
                            resetForm()
                        }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    {showForm ? 'Cancel' : '+ Add Template'}
                </button>
            </div>

            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> These are experience templates with all possible highlights. When building a resume, you can select which highlights to include for each position.
                </p>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-md p-6 border mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingId ? 'Edit Experience Template' : 'Add New Experience Template'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                                    Job Title *
                                </label>
                                <input
                                    type="text"
                                    id="jobTitle"
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Senior Software Engineer"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    id="companyName"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Tech Corp"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date *
                                </label>
                                <input
                                    type="date"
                                    id="startDate"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date (Leave blank if current)
                                </label>
                                <input
                                    type="date"
                                    id="endDate"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Highlights / Bullet Points
                                </label>
                                <button
                                    type="button"
                                    onClick={addHighlightInput}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    + Add Highlight
                                </button>
                            </div>
                            <div className="space-y-2">
                                {highlightInputs.map((highlight, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={highlight}
                                            onChange={(e) => updateHighlightInput(index, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., Led development of scalable web applications"
                                        />
                                        {highlightInputs.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeHighlightInput(index)}
                                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                {editingId ? 'Update Experience' : 'Add Experience'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm()
                                    setShowForm(false)
                                }}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Experience List */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
                        ))}
                    </div>
                ) : experiences.length > 0 ? (
                    experiences.map((exp) => (
                        <div
                            key={exp.id}
                            className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">{exp.job_title}</h3>
                                    <p className="text-lg text-gray-700">{exp.company_name}</p>
                                    <p className="text-sm text-gray-500">
                                        {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEdit(exp)}
                                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(exp.id)}
                                        className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {exp.highlights && exp.highlights.length > 0 && (
                                <div className="mt-4">
                                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                                        {exp.highlights.map((highlight) => (
                                            <li key={highlight.id}>{highlight.text}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-12 border text-center">
                        <p className="text-gray-500 mb-4">
                            No experience entries yet. Add your first experience to get started!
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Add Your First Experience
                        </button>
                    </div>
                )}
            </div>

            {/* Next Step Button */}
            <div className="max-w-4xl mx-auto mt-8 flex justify-end">
                <Link
                    href="/dashboard/education-items"
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                    Next: Manage Education →
                </Link>
            </div>
        </main>
    )
}
