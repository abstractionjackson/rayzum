'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import styles from './resume.module.scss'

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
}

interface Resume {
    id: number
    title: string
    name_value: string | null
    phone_value: string | null
    email_value: string | null
    experience_ids: Array<{
        id: number
        template_id: number
        selected_highlight_ids: number[]
        display_order: number
    }>
    education_ids: Array<{
        id: number
        display_order: number
    }>
}

// Format date as "Month YYYY"
const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' }
    return date.toLocaleDateString('en-US', options)
}

export default function ResumePreviewPage() {
    const params = useParams()
    const resumeId = params.id as string

    const [resume, setResume] = useState<Resume | null>(null)
    const [experiences, setExperiences] = useState<Experience[]>([])
    const [educationItems, setEducationItems] = useState<EducationItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (resumeId) {
            fetchData()
        }
    }, [resumeId])

    const fetchData = async () => {
        try {
            const [resumesRes, experiencesRes, educationRes] = await Promise.all([
                fetch('/api/resumes'),
                fetch('/api/experience'),
                fetch('/api/education-items')
            ])

            if (resumesRes.ok) {
                const resumesData = await resumesRes.json()
                const foundResume = resumesData.find((r: Resume) => r.id === Number(resumeId))
                setResume(foundResume || null)
            }

            if (experiencesRes.ok) {
                const experiencesData = await experiencesRes.json()
                setExperiences(experiencesData)
            }

            if (educationRes.ok) {
                const educationData = await educationRes.json()
                setEducationItems(educationData)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (isLoading) {
        return (
            <main className="container mx-auto py-12 px-4">
                <div className="text-center">Loading...</div>
            </main>
        )
    }

    if (!resume) {
        return (
            <main className="container mx-auto py-12 px-4">
                <div className="text-center">
                    <p className="mb-4">Resume not found</p>
                    <Link href="/dashboard/builder" className="text-blue-600 hover:underline">
                        Back to Resume Builder
                    </Link>
                </div>
            </main>
        )
    }

    // Get selected experiences with their highlights
    const selectedExperiences = resume.experience_ids
        ?.map((expInstance) => {
            const template = experiences.find((e) => e.id === expInstance.template_id)
            if (!template) return null

            // Filter highlights based on selected IDs
            const selectedHighlights = template.highlights.filter((h) =>
                expInstance.selected_highlight_ids.includes(h.id)
            )

            return {
                ...template,
                highlights: selectedHighlights
            }
        })
        .filter(Boolean) || []

    // Get selected education items
    const selectedEducation = resume.education_ids
        ?.map((eduRef) => educationItems.find((e) => e.id === eduRef.id))
        .filter(Boolean) || []

    return (
        <>
            <div className={styles.noPrint + " bg-gray-100 py-4 px-6 border-b"}>
                <div className="container mx-auto flex items-center justify-between">
                    <Link
                        href="/dashboard/builder"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        ← Back to Resume Builder
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                        Print Resume
                    </button>
                </div>
            </div>

            <div className={styles.resumeContainer}>
                <div className={styles.spacer}>
                    {/* Header with name */}
                    <h1>{resume.name_value || 'Your Name'}</h1>

                    {/* Contact Information */}
                    <div className={styles.headerInfo}>
                        <ul>
                            {resume.phone_value && <li>{resume.phone_value}</li>}
                            {resume.email_value && <li>{resume.email_value}</li>}
                        </ul>
                    </div>

                    {/* Experience Section */}
                    {selectedExperiences.length > 0 && (
                        <div className={styles.section}>
                            <h2>Experience</h2>
                            {selectedExperiences.map((exp: any) => (
                                <div key={exp.id} className={styles.experienceItem}>
                                    <h3>
                                        <span>{exp.job_title}</span>
                                        <span>
                                            {formatDate(exp.start_date)}
                                            {exp.end_date ? ` - ${formatDate(exp.end_date)}` : ' - Present'}
                                        </span>
                                    </h3>
                                    <p>{exp.company_name}</p>
                                    {exp.highlights && exp.highlights.length > 0 && (
                                        <ul>
                                            {exp.highlights.map((highlight: any) => (
                                                <li key={highlight.id}>{highlight.text}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Education Section */}
                    {selectedEducation.length > 0 && (
                        <div className={styles.section}>
                            <h2>Education</h2>
                            {selectedEducation.map((edu: any) => (
                                <div key={edu.id} className={styles.educationItem}>
                                    <h3>
                                        <span>{edu.school}</span>
                                        <span>{edu.year}</span>
                                    </h3>
                                    <p>{edu.degree}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
