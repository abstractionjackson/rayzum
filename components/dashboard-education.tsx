'use client'

import { useState, useEffect } from 'react'
import { storage, setDefaultItem } from '@/lib/storage'

interface EducationItem {
    id: number
    school: string
    degree: string
    year: string
    is_default: boolean
}

interface Props {
    onDataChange: () => void
}

export default function DashboardEducation({ onDataChange }: Props) {
    const [educationItems, setEducationItems] = useState<EducationItem[]>([])
    const [newSchool, setNewSchool] = useState('')
    const [newDegree, setNewDegree] = useState('')
    const [newYear, setNewYear] = useState('')
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editSchool, setEditSchool] = useState('')
    const [editDegree, setEditDegree] = useState('')
    const [editYear, setEditYear] = useState('')
    const [openDropdown, setOpenDropdown] = useState<number | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = () => {
        setEducationItems(storage.select('education_items'))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSchool.trim() || !newDegree.trim() || !newYear.trim()) return

        const existing = storage.select('education_items')
        if (existing.some((item: any) =>
            item.school === newSchool.trim() &&
            item.degree === newDegree.trim() &&
            item.year === newYear.trim()
        )) {
            alert('This education entry already exists.')
            return
        }

        storage.insert('education_items', {
            school: newSchool.trim(),
            degree: newDegree.trim(),
            year: newYear.trim(),
            is_default: false
        } as any)

        setNewSchool('')
        setNewDegree('')
        setNewYear('')
        fetchData()
        onDataChange()
    }

    const handleToggleDefault = (id: number) => {
        setDefaultItem('education_items', id)
        fetchData()
        onDataChange()
        setOpenDropdown(null)
    }

    const handleDelete = (id: number) => {
        if (!confirm('Are you sure you want to delete this education item?')) return
        storage.deleteWhere('resume_education', (re: any) => re.education_item_id === id)
        storage.delete('education_items', id)
        fetchData()
        onDataChange()
        setOpenDropdown(null)
    }

    const startEdit = (item: EducationItem) => {
        setEditingId(item.id)
        setEditSchool(item.school)
        setEditDegree(item.degree)
        setEditYear(item.year)
        setOpenDropdown(null)
    }

    const handleUpdate = (id: number) => {
        if (!editSchool.trim() || !editDegree.trim() || !editYear.trim()) return

        storage.update('education_items', id, {
            school: editSchool.trim(),
            degree: editDegree.trim(),
            year: editYear.trim()
        } as any)

        setEditingId(null)
        fetchData()
        onDataChange()
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Add Education</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">School</label>
                        <input
                            type="text"
                            value={newSchool}
                            onChange={(e) => setNewSchool(e.target.value)}
                            placeholder="e.g., University of California, Berkeley"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Degree</label>
                        <input
                            type="text"
                            value={newDegree}
                            onChange={(e) => setNewDegree(e.target.value)}
                            placeholder="e.g., Bachelor of Science in Computer Science"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Year</label>
                        <input
                            type="text"
                            value={newYear}
                            onChange={(e) => setNewYear(e.target.value)}
                            placeholder="e.g., 2020 or 2016-2020"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Add Education
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                {educationItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6">
                        {editingId === item.id ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={editSchool}
                                    onChange={(e) => setEditSchool(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="School"
                                />
                                <input
                                    type="text"
                                    value={editDegree}
                                    onChange={(e) => setEditDegree(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Degree"
                                />
                                <input
                                    type="text"
                                    value={editYear}
                                    onChange={(e) => setEditYear(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md"
                                    placeholder="Year"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleUpdate(item.id)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold">{item.school}</h4>
                                        {item.is_default && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Default</span>
                                        )}
                                    </div>
                                    <p className="text-gray-700">{item.degree}</p>
                                    <p className="text-sm text-gray-500">{item.year}</p>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                                        className="p-2 hover:bg-gray-100 rounded"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                        </svg>
                                    </button>
                                    {openDropdown === item.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10">
                                            <button
                                                onClick={() => handleToggleDefault(item.id)}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                            >
                                                {item.is_default ? 'Remove from Default' : 'Set as Default'}
                                            </button>
                                            <button
                                                onClick={() => startEdit(item)}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
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
                {educationItems.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-500">No education entries yet. Add one above to get started.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
