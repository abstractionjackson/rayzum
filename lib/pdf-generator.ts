'use client'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { getResumeWithDetails, getAllExperiencesWithHighlights, storage } from './storage'

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

const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' }
    return date.toLocaleDateString('en-US', options)
}

export async function generateResumePDF(resumeId: number): Promise<void> {
    const resume = getResumeWithDetails(resumeId)
    if (!resume) {
        throw new Error('Resume not found')
    }

    const allExperiences = getAllExperiencesWithHighlights()
    const educationItems = storage.select('education_items') || []

    // Build selected experiences with their highlights
    const selectedExperiences: Experience[] = resume.experience_ids.map(ei => {
        const exp = allExperiences.find(e => e.id === ei.template_id)
        if (!exp) return null

        const filteredHighlights = exp.highlights.filter(h =>
            ei.selected_highlight_ids.includes(h.id)
        )

        return {
            id: exp.id,
            job_title: exp.job_title,
            company_name: exp.company_name,
            start_date: exp.start_date,
            end_date: exp.end_date,
            highlights: filteredHighlights
        }
    }).filter(Boolean) as Experience[]

    // Build selected education items
    const selectedEducation: EducationItem[] = resume.education_ids
        .map(ei => {
            const item = educationItems.find(e => e.id === ei.id)
            if (!item) return null
            return {
                id: item.id,
                school: item.school,
                degree: item.degree,
                year: item.year
            }
        })
        .filter(Boolean) as EducationItem[]

    // Create a temporary container for rendering the resume
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '8.5in'
    container.style.background = 'white'
    container.style.padding = '0.5in'
    container.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif'
    container.style.fontSize = '11pt'
    container.style.lineHeight = '1.4'
    container.style.color = '#1f2937'

    // Build the HTML content
    let html = ''

    // Header
    if (resume.name_value) {
        html += `<div style="font-size: 24pt; font-weight: 700; margin-bottom: 8px; color: #111827;">${resume.name_value}</div>`
    }

    const contactInfo = [resume.phone_value, resume.email_value].filter(Boolean)
    if (contactInfo.length > 0) {
        html += `<div style="font-size: 10pt; color: #6b7280; margin-bottom: 24px;">${contactInfo.join(' • ')}</div>`
    }

    // Experience Section
    if (selectedExperiences.length > 0) {
        html += `<div style="font-size: 14pt; font-weight: 700; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 2px solid #e5e7eb; color: #111827;">EXPERIENCE</div>`

        selectedExperiences.forEach(exp => {
            html += `<div style="margin-bottom: 16px;">`
            html += `<div style="font-weight: 600; font-size: 12pt; color: #111827;">${exp.job_title}</div>`
            html += `<div style="font-size: 11pt; color: #4b5563; margin-bottom: 4px;">${exp.company_name}</div>`

            const startDate = formatDate(exp.start_date)
            const endDate = exp.end_date ? formatDate(exp.end_date) : 'Present'
            html += `<div style="font-size: 9pt; color: #6b7280; font-style: italic; margin-bottom: 8px;">${startDate} – ${endDate}</div>`

            if (exp.highlights.length > 0) {
                html += `<ul style="margin: 0; padding-left: 20px;">`
                exp.highlights.forEach(highlight => {
                    html += `<li style="margin-bottom: 4px; color: #374151;">${highlight.text}</li>`
                })
                html += `</ul>`
            }
            html += `</div>`
        })
    }

    // Education Section
    if (selectedEducation.length > 0) {
        html += `<div style="font-size: 14pt; font-weight: 700; margin-bottom: 12px; margin-top: 24px; padding-bottom: 4px; border-bottom: 2px solid #e5e7eb; color: #111827;">EDUCATION</div>`

        selectedEducation.forEach(edu => {
            html += `<div style="margin-bottom: 12px;">`
            html += `<div style="font-weight: 600; font-size: 12pt; color: #111827;">${edu.school}</div>`
            html += `<div style="font-size: 11pt; color: #4b5563;">${edu.degree}</div>`
            html += `<div style="font-size: 9pt; color: #6b7280; font-style: italic;">${edu.year}</div>`
            html += `</div>`
        })
    }

    container.innerHTML = html
    document.body.appendChild(container)

    try {
        // Convert HTML to canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        })

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'in',
            format: 'letter'
        })

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = 8.5
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)

        // Open in new window
        const pdfBlob = pdf.output('blob')
        const url = URL.createObjectURL(pdfBlob)
        window.open(url, '_blank')

        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 100)
    } finally {
        document.body.removeChild(container)
    }
}
