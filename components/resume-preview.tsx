'use client'

import { useState, useEffect } from 'react'
import styles from './resume-preview.module.scss'
import { getResumeWithDetails, getAllExperiencesWithHighlights, storage } from '@/lib/storage'

interface Props {
    resumeId: number
    onClose: () => void
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

const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' }
    return date.toLocaleDateString('en-US', options)
}

export default function ResumePreview({ resumeId, onClose }: Props) {
    const [resume, setResume] = useState<Resume | null>(null)
    const [experiences, setExperiences] = useState<Experience[]>([])
    const [educationItems, setEducationItems] = useState<EducationItem[]>([])

    useEffect(() => {
        fetchData()
    }, [resumeId])

    const fetchData = () => {
        const foundResume = getResumeWithDetails(resumeId)
        setResume(foundResume as any || null)

        const experiencesData = getAllExperiencesWithHighlights()
        setExperiences(experiencesData)

        const educationData = storage.select('education_items')
        setEducationItems(educationData)
    }

    if (!resume) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Resume not found</p>
            </div>
        )
    }

    const selectedExperiences = resume.experience_ids
        ?.map((expInstance) => {
            const template = experiences.find((e) => e.id === expInstance.template_id)
            if (!template) return null

            const selectedHighlights = template.highlights.filter((h) =>
                expInstance.selected_highlight_ids.includes(h.id)
            )

            return {
                ...template,
                highlights: selectedHighlights
            }
        })
        .filter(Boolean) || []

    const selectedEducation = resume.education_ids
        ?.map((eduRef) => educationItems.find((e) => e.id === eduRef.id))
        .filter(Boolean) || []

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Preview: {resume.title || 'Resume'}</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Print / PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>

            <div className="p-8">
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
            </div>
        </div>
    )
}
