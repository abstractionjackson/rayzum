'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { storage, setDefaultItem } from '@/lib/storage'

interface EducationItem {
    id: number
    school: string
    degree: string
    year: string
    is_default: boolean
    createdAt: string
    updatedAt?: string
}

export default function EducationPage() {
    const [educationItems, setEducationItems] = useState<EducationItem[]>([])
    const [newSchool, setNewSchool] = useState('')
    const [newDegree, setNewDegree] = useState('')
    const [newYear, setNewYear] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editSchool, setEditSchool] = useState('')
    const [editDegree, setEditDegree] = useState('')
    const [editYear, setEditYear] = useState('')
    const [openDropdown, setOpenDropdown] = useState<number | null>(null)

    useEffect(() => {
        fetchEducationItems()
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdown !== null) {
                const target = event.target as HTMLElement
                if (!target.closest('.dropdown-menu')) {
                    setOpenDropdown(null)
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [openDropdown])

    const fetchEducationItems = async () => {
        try {
            const data = storage.select('education_items')
            setEducationItems(data)
        } catch (error) {
            console.error('Error fetching education items:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSchool.trim() || !newDegree.trim() || !newYear.trim()) return

        setIsSubmitting(true)
        try {
            // Check for duplicates
            const existing = storage.select('education_items')
            if (existing.some((item: any) =>
                item.school === newSchool.trim() &&
                item.degree === newDegree.trim() &&
                item.year === newYear.trim()
            )) {
                alert('This education entry already exists.')
                return
            }

            // Insert new education item
            storage.insert('education_items', {
                school: newSchool.trim(),
                degree: newDegree.trim(),
                year: newYear.trim(),
                is_default: false
            } as any)

            setNewSchool('')
            setNewDegree('')
            setNewYear('')
            await fetchEducationItems()
        } catch (error) {
            console.error('Error adding education item:', error)
            alert('Error adding education item. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggleDefault = async (id: number) => {
        try {
            setDefaultItem('education_items', id)
            await fetchEducationItems()
            setOpenDropdown(null)
        } catch (error) {
            console.error('Error toggling default:', error)
            alert('Error updating default. Please try again.')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this education item?')) return

        try {
            // Delete resume_education entries that reference this education item
            storage.deleteWhere('resume_education', (re: any) => re.education_item_id === id)

            // Delete the education item
            const deleted = storage.delete('education_items', id)

            if (!deleted) {
                alert('Error: Education item not found')
                return
            }

            await fetchEducationItems()
            setOpenDropdown(null)
        } catch (error) {
            console.error('Error deleting education item:', error)
            alert('Error deleting education item. Please try again.')
        }
    }

    const startEdit = (item: EducationItem) => {
        setEditingId(item.id)
        setEditSchool(item.school)
        setEditDegree(item.degree)
        setEditYear(item.year)
        setOpenDropdown(null)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditSchool('')
        setEditDegree('')
        setEditYear('')
    }

    const handleUpdate = async (id: number) => {
        if (!editSchool.trim() || !editDegree.trim() || !editYear.trim()) return

        try {
            // Check for duplicates (excluding current item)
            const existing = storage.select('education_items')
            if (existing.some((item: any) =>
                item.id !== id &&
                item.school === editSchool.trim() &&
                item.degree === editDegree.trim() &&
                item.year === editYear.trim()
            )) {
                alert('This education entry already exists.')
                return
            }

            // Update the education item
            const updated = storage.update('education_items', id, {
                school: editSchool.trim(),
                degree: editDegree.trim(),
                year: editYear.trim()
            } as any)

            if (!updated) {
                alert('Error: Education item not found')
                return
            }

            setEditingId(null)
            setEditSchool('')
            setEditDegree('')
            setEditYear('')
            await fetchEducationItems()
        } catch (error) {
            console.error('Error updating education item:', error)
            alert('Error updating education item. Please try again.')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Education</h1>
                    <p className="text-gray-600">
                        Manage your education entries. Mark items as default to automatically include them in new resumes.
                    </p>
                </div>

                {/* Add Education Form */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Education</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
                                School
                            </label>
                            <input
                                type="text"
                                id="school"
                                value={newSchool}
                                onChange={(e) => setNewSchool(e.target.value)}
                                placeholder="e.g., University of California, Berkeley"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">
                                Degree
                            </label>
                            <input
                                type="text"
                                id="degree"
                                value={newDegree}
                                onChange={(e) => setNewDegree(e.target.value)}
                                placeholder="e.g., Bachelor of Science in Computer Science"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                                Year
                            </label>
                            <input
                                type="text"
                                id="year"
                                value={newYear}
                                onChange={(e) => setNewYear(e.target.value)}
                                placeholder="e.g., 2020 or 2016-2020"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isSubmitting}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !newSchool.trim() || !newDegree.trim() || !newYear.trim()}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Education'}
                        </button>
                    </form>
                </div>

                {/* Education List */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Education Entries</h2>
                    {isLoading ? (
                        <p className="text-gray-500">Loading education entries...</p>
                    ) : educationItems.length === 0 ? (
                        <p className="text-gray-500">No education entries yet. Add one above to get started.</p>
                    ) : (
                        <div className="space-y-4">
                            {educationItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                                >
                                    {editingId === item.id ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    School
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editSchool}
                                                    onChange={(e) => setEditSchool(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Degree
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editDegree}
                                                    onChange={(e) => setEditDegree(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Year
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editYear}
                                                    onChange={(e) => setEditYear(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdate(item.id)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900">{item.school}</h3>
                                                    {item.is_default && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-700 mb-1">{item.degree}</p>
                                                <p className="text-sm text-gray-500">{item.year}</p>
                                            </div>
                                            <div className="relative dropdown-menu">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setOpenDropdown(openDropdown === item.id ? null : item.id)
                                                    }}
                                                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                                >
                                                    <svg
                                                        className="w-5 h-5 text-gray-500"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                    </svg>
                                                </button>
                                                {openDropdown === item.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleToggleDefault(item.id)
                                                                setOpenDropdown(null)
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                                                        >
                                                            {item.is_default ? 'Remove from Default' : 'Set as Default'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                startEdit(item)
                                                            }}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDelete(item.id)
                                                                setOpenDropdown(null)
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Next Step Button */}
            <div className="max-w-4xl mx-auto mt-8 flex justify-end">
                <Link
                    href="/dashboard/builder"
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                    Next: Build Resume →
                </Link>
            </div>
        </div>
    )
}
