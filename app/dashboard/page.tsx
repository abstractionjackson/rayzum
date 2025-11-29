'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import * as Tabs from '@radix-ui/react-tabs'
import { storage, getAllExperiencesWithHighlights, setDefaultItem } from '@/lib/storage'
import DashboardPersonal from '@/components/dashboard-personal'
import DashboardExperience from '@/components/dashboard-experience'
import DashboardEducation from '@/components/dashboard-education'
import { generateResumePDF } from '@/lib/pdf-generator'

interface Resume {
    id: number
    title: string
    name_id: number | null
    phone_id: number | null
    email_id: number | null
    createdAt: string
    updatedAt: string
}

interface PersonalInfo {
    id: number
    value: string
    is_default: boolean
}

interface Experience {
    id: number
    job_title: string
    company_name: string
    start_date: string
    end_date: string | null
    highlights: Array<{ id: number; text: string }>
}

interface EducationItem {
    id: number
    school: string
    degree: string
    year: string
    is_default: boolean
}

interface ExperienceInstance {
    template_id: number
    selected_highlight_ids: number[]
}

export default function Dashboard() {
    const [resumes, setResumes] = useState<Resume[]>([])
    const [activeTab, setActiveTab] = useState('resumes')
    const [showBuilder, setShowBuilder] = useState(false)
    const [editingResumeId, setEditingResumeId] = useState<number | null>(null)

    // Builder form state
    const [names, setNames] = useState<PersonalInfo[]>([])
    const [phones, setPhones] = useState<PersonalInfo[]>([])
    const [emails, setEmails] = useState<PersonalInfo[]>([])
    const [experiences, setExperiences] = useState<Experience[]>([])
    const [educationItems, setEducationItems] = useState<EducationItem[]>([])
    const [formTitle, setFormTitle] = useState('')
    const [formNameId, setFormNameId] = useState<number | null>(null)
    const [formPhoneId, setFormPhoneId] = useState<number | null>(null)
    const [formEmailId, setFormEmailId] = useState<number | null>(null)
    const [formExperienceInstances, setFormExperienceInstances] = useState<ExperienceInstance[]>([])
    const [formEducationIds, setFormEducationIds] = useState<number[]>([])

    useEffect(() => {
        loadResumes()
        fetchBuilderData()
    }, [])

    const loadResumes = () => {
        const allResumes = storage.select('resumes')
        setResumes(allResumes)
    }

    const fetchBuilderData = () => {
        // Fetch personal info
        const namesData = storage.select('names')
        const mappedNames = namesData.map((n: any) => ({ id: n.id, value: n.name, is_default: n.is_default }))
        setNames(mappedNames)

        const phonesData = storage.select('phones')
        const mappedPhones = phonesData.map((p: any) => ({ id: p.id, value: p.phone, is_default: p.is_default }))
        setPhones(mappedPhones)

        const emailsData = storage.select('emails')
        const mappedEmails = emailsData.map((e: any) => ({ id: e.id, value: e.email, is_default: e.is_default }))
        setEmails(mappedEmails)

        // Fetch experiences
        const expData = getAllExperiencesWithHighlights()
        setExperiences(expData)

        // Fetch education
        const eduData = storage.select('education_items')
        setEducationItems(eduData)
    }

    const openBuilder = () => {
        // Reset form and set defaults
        setEditingResumeId(null)
        setFormTitle('')
        const defaultName = names.find((n) => n.is_default)
        setFormNameId(defaultName?.id || null)
        const defaultPhone = phones.find((p) => p.is_default)
        setFormPhoneId(defaultPhone?.id || null)
        const defaultEmail = emails.find((e) => e.is_default)
        setFormEmailId(defaultEmail?.id || null)
        setFormExperienceInstances([])
        const defaultEdu = educationItems.filter((item) => item.is_default)
        setFormEducationIds(defaultEdu.map((item) => item.id))
        setShowBuilder(true)
    }

    const openEditResume = (resumeId: number) => {
        const resume = resumes.find(r => r.id === resumeId)
        if (!resume) return

        // Load resume data into form
        setFormTitle(resume.title)
        setFormNameId(resume.name_id)
        setFormPhoneId(resume.phone_id)
        setFormEmailId(resume.email_id)

        // Load experience instances
        const expInstances = storage.select('resume_experience_instances')
            .filter((i: any) => i.resume_id === resumeId)
            .map((i: any) => ({
                template_id: i.experience_template_id,
                selected_highlight_ids: i.selected_highlight_ids
            }))
        setFormExperienceInstances(expInstances)

        // Load education
        const eduLinks = storage.select('resume_education')
            .filter((re: any) => re.resume_id === resumeId)
            .map((re: any) => re.education_item_id)
        setFormEducationIds(eduLinks)

        setEditingResumeId(resumeId)
        setShowBuilder(true)
    }

    const closeBuilder = () => {
        setShowBuilder(false)
        setEditingResumeId(null)
    }

    const handleGeneratePDF = async (resumeId: number) => {
        try {
            await generateResumePDF(resumeId)
        } catch (error) {
            console.error('Error generating PDF:', error)
            alert('Error generating PDF. Please try again.')
        }
    }

    const handleDeleteResume = (resumeId: number) => {
        if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
            return
        }

        try {
            // Delete associated experience instances
            storage.deleteWhere('resume_experience_instances', (i: any) => i.resume_id === resumeId)

            // Delete associated education links
            storage.deleteWhere('resume_education', (re: any) => re.resume_id === resumeId)

            // Delete the resume
            storage.delete('resumes', resumeId)

            // Close builder if deleting current resume
            if (editingResumeId === resumeId) {
                closeBuilder()
            }

            // Reload resumes
            loadResumes()
        } catch (error) {
            console.error('Error deleting resume:', error)
            alert('Error deleting resume')
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        try {
            if (editingResumeId) {
                // Update existing resume
                storage.update('resumes', editingResumeId, {
                    title: formTitle,
                    name_id: formNameId,
                    phone_id: formPhoneId,
                    email_id: formEmailId,
                    updatedAt: new Date().toISOString()
                } as any)

                // Delete existing experience instances and education links
                storage.deleteWhere('resume_experience_instances', (i: any) => i.resume_id === editingResumeId)
                storage.deleteWhere('resume_education', (re: any) => re.resume_id === editingResumeId)

                // Create new experience instances
                formExperienceInstances.forEach((exp, index) => {
                    storage.insert('resume_experience_instances', {
                        resume_id: editingResumeId,
                        experience_template_id: exp.template_id,
                        selected_highlight_ids: exp.selected_highlight_ids,
                        display_order: index,
                        updatedAt: new Date().toISOString()
                    } as any)
                })

                // Create new education links
                formEducationIds.forEach((eduId, index) => {
                    storage.insert('resume_education', {
                        resume_id: editingResumeId,
                        education_item_id: eduId,
                        display_order: index
                    } as any)
                })
            } else {
                // Create new resume
                const newResume = storage.insert('resumes', {
                    title: formTitle,
                    name_id: formNameId,
                    phone_id: formPhoneId,
                    email_id: formEmailId,
                    updatedAt: new Date().toISOString()
                } as any)

                // Create experience instances
                formExperienceInstances.forEach((exp, index) => {
                    storage.insert('resume_experience_instances', {
                        resume_id: newResume.id,
                        experience_template_id: exp.template_id,
                        selected_highlight_ids: exp.selected_highlight_ids,
                        display_order: index,
                        updatedAt: new Date().toISOString()
                    } as any)
                })

                // Create education links
                formEducationIds.forEach((eduId, index) => {
                    storage.insert('resume_education', {
                        resume_id: newResume.id,
                        education_item_id: eduId,
                        display_order: index
                    } as any)
                })
            }

            // Reload resumes and close builder
            loadResumes()
            closeBuilder()
        } catch (error) {
            console.error('Error saving resume:', error)
            alert('Error saving resume')
        }
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Top Panel */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Rayzum</h1>
                    <button
                        onClick={openBuilder}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        + New Resume
                    </button>
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
                            {showBuilder ? (
                                <div className="bg-white rounded-lg shadow">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {editingResumeId ? 'Edit Resume' : 'Create New Resume'}
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div>
                                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Resume Title
                                                </label>
                                                <input
                                                    type="text"
                                                    id="title"
                                                    value={formTitle}
                                                    onChange={(e) => setFormTitle(e.target.value)}
                                                    placeholder="e.g., Software Engineer - FAANG, Marketing Manager - Startup"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Experience Templates
                                                </label>
                                                <div className="border border-gray-300 rounded-md p-3 max-h-96 overflow-y-auto">
                                                    {experiences.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {experiences.map((exp) => {
                                                                const instance = formExperienceInstances.find(i => i.template_id === exp.id)
                                                                const isSelected = !!instance

                                                                return (
                                                                    <div key={exp.id} className="border border-gray-200 rounded p-3">
                                                                        <label className="flex items-start gap-2 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isSelected}
                                                                                onChange={(e) => {
                                                                                    if (e.target.checked) {
                                                                                        setFormExperienceInstances([
                                                                                            ...formExperienceInstances,
                                                                                            {
                                                                                                template_id: exp.id,
                                                                                                selected_highlight_ids: exp.highlights.map(h => h.id)
                                                                                            }
                                                                                        ])
                                                                                    } else {
                                                                                        setFormExperienceInstances(
                                                                                            formExperienceInstances.filter(i => i.template_id !== exp.id)
                                                                                        )
                                                                                    }
                                                                                }}
                                                                                className="mt-1"
                                                                            />
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-sm">{exp.job_title}</div>
                                                                                <div className="text-xs text-gray-500">{exp.company_name}</div>
                                                                            </div>
                                                                        </label>

                                                                        {isSelected && exp.highlights && exp.highlights.length > 0 && (
                                                                            <div className="mt-2 ml-6 space-y-1">
                                                                                <div className="text-xs font-medium text-gray-600 mb-1">Select highlights:</div>
                                                                                {exp.highlights.map((highlight) => (
                                                                                    <label key={highlight.id} className="flex items-start gap-2 cursor-pointer text-xs">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={instance?.selected_highlight_ids.includes(highlight.id)}
                                                                                            onChange={(e) => {
                                                                                                const updatedInstances = formExperienceInstances.map(i => {
                                                                                                    if (i.template_id === exp.id) {
                                                                                                        if (e.target.checked) {
                                                                                                            return {
                                                                                                                ...i,
                                                                                                                selected_highlight_ids: [...i.selected_highlight_ids, highlight.id]
                                                                                                            }
                                                                                                        } else {
                                                                                                            return {
                                                                                                                ...i,
                                                                                                                selected_highlight_ids: i.selected_highlight_ids.filter(id => id !== highlight.id)
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                    return i
                                                                                                })
                                                                                                setFormExperienceInstances(updatedInstances)
                                                                                            }}
                                                                                            className="mt-0.5"
                                                                                        />
                                                                                        <span className="text-gray-700">{highlight.text}</span>
                                                                                    </label>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 text-center py-4">
                                                            No experience templates yet. Use the Experience tab to add.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Education
                                                </label>
                                                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                                                    {educationItems.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {educationItems.map((item) => (
                                                                <label key={item.id} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={formEducationIds.includes(item.id)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                if (!formEducationIds.includes(item.id)) {
                                                                                    setFormEducationIds([...formEducationIds, item.id])
                                                                                }
                                                                            } else {
                                                                                setFormEducationIds(formEducationIds.filter(id => id !== item.id))
                                                                            }
                                                                        }}
                                                                        className="mt-1"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-sm">{item.school}</div>
                                                                        <div className="text-xs text-gray-600">{item.degree}</div>
                                                                        <div className="text-xs text-gray-500">{item.year}</div>
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 text-center py-4">
                                                            No education entries yet. Use the Education tab to add.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    type="submit"
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                                >
                                                    {editingResumeId ? 'Update Resume' : 'Create Resume'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={closeBuilder}
                                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow">
                                    <div className="overflow-x-auto">
                                        {resumes.length === 0 ? (
                                            <div className="px-6 py-12 text-center">
                                                <p className="text-gray-500 mb-4">No resumes yet</p>
                                                <button
                                                    onClick={openBuilder}
                                                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    Create your first resume
                                                </button>
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
                                                                <button
                                                                    onClick={() => handleGeneratePDF(resume.id)}
                                                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                                                                >
                                                                    {resume.title}
                                                                </button>
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
                                                                <button
                                                                    onClick={() => openEditResume(resume.id)}
                                                                    className="text-blue-600 hover:text-blue-800 mr-4"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteResume(resume.id)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Tabs.Content>

                        <Tabs.Content value="personal" className="p-6">
                            <DashboardPersonal onDataChange={fetchBuilderData} />
                        </Tabs.Content>

                        <Tabs.Content value="experience" className="p-6">
                            <DashboardExperience onDataChange={fetchBuilderData} />
                        </Tabs.Content>

                        <Tabs.Content value="education" className="p-6">
                            <DashboardEducation onDataChange={fetchBuilderData} />
                        </Tabs.Content>
                    </div>
                </Tabs.Root>
            </div>
        </div>
    )
}