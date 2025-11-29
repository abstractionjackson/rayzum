'use client'

import { useState, useEffect } from 'react'
import { storage, getAllExperiencesWithHighlights } from '@/lib/storage'

interface Experience {
    id: number
    job_title: string
    company_name: string
    start_date: string
    end_date: string | null
    highlights: Array<{ id: number; text: string }>
}

interface Props {
    onDataChange: () => void
}

export default function DashboardExperience({ onDataChange }: Props) {
    const [experiences, setExperiences] = useState<Experience[]>([])
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [jobTitle, setJobTitle] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [highlightInputs, setHighlightInputs] = useState<string[]>([''])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = () => {
        const data = getAllExperiencesWithHighlights()
        setExperiences(data)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (editingId) {
            storage.update('experience_templates', editingId, {
                job_title: jobTitle,
                company_name: companyName,
                start_date: startDate,
                end_date: endDate || null,
                updatedAt: new Date().toISOString()
            } as any)

            storage.deleteWhere('highlights', h => h.experience_template_id === editingId)
            highlightInputs.filter(h => h.trim()).forEach(text => {
                storage.insert('highlights', {
                    experience_template_id: editingId,
                    text: text.trim()
                } as any)
            })
        } else {
            const newExp = storage.insert('experience_templates', {
                job_title: jobTitle,
                company_name: companyName,
                start_date: startDate,
                end_date: endDate || null,
                updatedAt: new Date().toISOString()
            } as any)

            highlightInputs.filter(h => h.trim()).forEach(text => {
                storage.insert('highlights', {
                    experience_template_id: newExp.id,
                    text: text.trim()
                } as any)
            })
        }

        resetForm()
        fetchData()
        onDataChange()
    }

    const handleDelete = (id: number) => {
        if (!confirm('Are you sure you want to delete this experience?')) return

        storage.deleteWhere('highlights', h => h.experience_template_id === id)
        storage.deleteWhere('resume_experience_instances', i => i.experience_template_id === id)
        storage.delete('experience_templates', id)
        fetchData()
        onDataChange()
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
        setShowForm(false)
    }

    return (
        <div className="space-y-6">
            {showForm ? (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold">
                            {editingId ? 'Edit Experience' : 'Add Experience'}
                        </h3>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Job Title *</label>
                                    <input
                                        type="text"
                                        value={jobTitle}
                                        onChange={(e) => setJobTitle(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Company *</label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Date *</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="block text-sm font-medium">Highlights</label>
                                    <button
                                        type="button"
                                        onClick={() => setHighlightInputs([...highlightInputs, ''])}
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
                                                onChange={(e) => {
                                                    const updated = [...highlightInputs]
                                                    updated[index] = e.target.value
                                                    setHighlightInputs(updated)
                                                }}
                                                className="flex-1 px-3 py-2 border rounded-md"
                                                placeholder="e.g., Led development of web applications"
                                            />
                                            {highlightInputs.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setHighlightInputs(highlightInputs.filter((_, i) => i !== index))}
                                                    className="px-3 text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                    {editingId ? 'Update' : 'Add'} Experience
                                </button>
                                <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Experience Templates</h3>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            + Add Experience
                        </button>
                    </div>
                    <div className="p-6">
                        {experiences.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">No experience templates yet</p>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Add Your First Experience
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {experiences.map((exp) => (
                                    <div key={exp.id} className="bg-white rounded-lg border border-gray-200 p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-semibold text-lg">{exp.job_title}</h4>
                                                <p className="text-gray-600">{exp.company_name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(exp.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} -{' '}
                                                    {exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEdit(exp)}
                                                    className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(exp.id)}
                                                    className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        {exp.highlights.length > 0 && (
                                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                                {exp.highlights.map((h) => (
                                                    <li key={h.id}>{h.text}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
