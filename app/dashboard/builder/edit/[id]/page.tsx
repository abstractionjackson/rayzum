'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'

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

interface Resume {
    id: number
    title: string
    name_id: number | null
    phone_id: number | null
    email_id: number | null
    experience_ids: Array<{ id: number; template_id: number; selected_highlight_ids: number[]; display_order: number }>
    education_ids: Array<{ id: number; display_order: number }>
}

export default function EditResumePage() {
    const router = useRouter()
    const params = useParams()
    const resumeId = params.id as string

    const [resume, setResume] = useState<Resume | null>(null)
    const [names, setNames] = useState<PersonalInfo[]>([])
    const [phones, setPhones] = useState<PersonalInfo[]>([])
    const [emails, setEmails] = useState<PersonalInfo[]>([])
    const [experiences, setExperiences] = useState<Experience[]>([])
    const [educationItems, setEducationItems] = useState<EducationItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Form state
    const [formTitle, setFormTitle] = useState('')
    const [formNameId, setFormNameId] = useState<number | null>(null)
    const [formPhoneId, setFormPhoneId] = useState<number | null>(null)
    const [formEmailId, setFormEmailId] = useState<number | null>(null)
    const [formExperienceInstances, setFormExperienceInstances] = useState<ExperienceInstance[]>([])
    const [formEducationIds, setFormEducationIds] = useState<number[]>([])

    useEffect(() => {
        if (resumeId) {
            fetchResume()
            fetchPersonalInfo()
            fetchExperiences()
            fetchEducationItems()
        }
    }, [resumeId])

    const fetchResume = async () => {
        try {
            const response = await fetch('/api/resumes')
            if (response.ok) {
                const data = await response.json()
                const foundResume = data.find((r: Resume) => r.id === Number(resumeId))
                if (foundResume) {
                    setResume(foundResume)
                    setFormTitle(foundResume.title)
                    setFormNameId(foundResume.name_id)
                    setFormPhoneId(foundResume.phone_id)
                    setFormEmailId(foundResume.email_id)
                    setFormExperienceInstances(
                        foundResume.experience_ids
                            ? foundResume.experience_ids.map((e: any) => ({
                                template_id: e.template_id,
                                selected_highlight_ids: e.selected_highlight_ids || []
                            }))
                            : []
                    )
                    setFormEducationIds(foundResume.education_ids ? foundResume.education_ids.map((e: any) => e.id) : [])
                } else {
                    alert('Resume not found')
                    router.push('/dashboard/builder')
                }
            }
        } catch (error) {
            console.error('Error fetching resume:', error)
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
                setNames(namesData.map((n: any) => ({ id: n.id, value: n.name, is_default: n.is_default })))
            }
            if (phonesRes.ok) {
                const phonesData = await phonesRes.json()
                setPhones(phonesData.map((p: any) => ({ id: p.id, value: p.phone, is_default: p.is_default })))
            }
            if (emailsRes.ok) {
                const emailsData = await emailsRes.json()
                setEmails(emailsData.map((e: any) => ({ id: e.id, value: e.email, is_default: e.is_default })))
            }
        } catch (error) {
            console.error('Error fetching personal info:', error)
        }
    }

    const fetchExperiences = async () => {
        try {
            const response = await fetch('/api/experience')
            if (response.ok) {
                const data = await response.json()
                setExperiences(data)
            }
        } catch (error) {
            console.error('Error fetching experiences:', error)
        }
    }

    const fetchEducationItems = async () => {
        try {
            const response = await fetch('/api/education-items')
            if (response.ok) {
                const data = await response.json()
                setEducationItems(data)
            }
        } catch (error) {
            console.error('Error fetching education items:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const response = await fetch('/api/resumes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: Number(resumeId),
                    title: formTitle,
                    name_id: formNameId,
                    phone_id: formPhoneId,
                    email_id: formEmailId,
                    experience_ids: formExperienceInstances,
                    education_ids: formEducationIds
                })
            })

            if (response.ok) {
                router.push('/dashboard/builder')
            } else {
                const error = await response.json()
                alert('Error updating resume: ' + error.error)
            }
        } catch (error) {
            console.error('Error updating resume:', error)
            alert('Error updating resume')
        }
    }

    if (isLoading) {
        return (
            <main className="container mx-auto py-12 px-4">
                <div className="bg-white rounded-lg shadow-md p-6 border">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </main>
        )
    }

    if (!resume) {
        return null
    }

    return (
        <main className="container mx-auto py-12 px-4">
            <div className="mb-6">
                <Link
                    href="/dashboard/builder"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    ← Back to Resume Builder
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border">
                <h1 className="text-2xl font-bold mb-6">Edit Resume</h1>

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
                                    No experience templates yet.{' '}
                                    <Link href="/dashboard/experience" className="text-blue-600 hover:underline">
                                        Add experience
                                    </Link>
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
                                    No education entries yet.{' '}
                                    <Link href="/dashboard/education-items" className="text-blue-600 hover:underline">
                                        Add education
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
                            Update Resume
                        </button>
                        <Link
                            href="/dashboard/builder"
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </main>
    )
}
