import { NextRequest, NextResponse } from 'next/server'
import { storage, getAllExperiencesWithHighlights, getExperienceWithHighlights } from '@/lib/storage'

export async function GET() {
  try {
    const experiences = getAllExperiencesWithHighlights()
    return NextResponse.json(experiences)
  } catch (error) {
    console.error('Error fetching experiences:', error)
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { job_title, company_name, start_date, end_date, highlights } = await request.json()

    if (!job_title || !company_name || !start_date) {
      return NextResponse.json(
        { error: 'Job title, company name, and start date are required' },
        { status: 400 }
      )
    }

    // Create experience template
    const newExperience = storage.insert('experience_templates', {
      job_title,
      company_name,
      start_date,
      end_date: end_date || null,
      updatedAt: new Date().toISOString()
    } as any)

    // Create highlights if provided
    const createdHighlights = []
    if (highlights && Array.isArray(highlights)) {
      for (const highlightItem of highlights) {
        // Handle both string format and object format { text: "..." }
        const highlightText = typeof highlightItem === 'string' ? highlightItem : highlightItem?.text
        if (highlightText && typeof highlightText === 'string' && highlightText.trim()) {
          const highlight = storage.insert('highlights', {
            experience_template_id: newExperience.id,
            text: highlightText.trim()
          } as any)
          createdHighlights.push({ id: highlight.id, text: highlight.text })
        }
      }
    }

    return NextResponse.json(
      {
        ...newExperience,
        highlights: createdHighlights
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating experience:', error)
    return NextResponse.json({ error: 'Failed to create experience' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, job_title, company_name, start_date, end_date, highlights } = await request.json()

    if (!id || !job_title || !company_name || !start_date) {
      return NextResponse.json(
        { error: 'ID, job title, company name, and start date are required' },
        { status: 400 }
      )
    }

    // Update experience template
    const updated = storage.update('experience_templates', id, {
      job_title,
      company_name,
      start_date,
      end_date: end_date || null,
      updatedAt: new Date().toISOString()
    } as any)

    if (!updated) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    // Delete existing highlights
    storage.deleteWhere('highlights', h => h.experience_template_id === id)

    // Create new highlights
    const createdHighlights = []
    if (highlights && Array.isArray(highlights)) {
      for (const highlightItem of highlights) {
        // Handle both string format and object format { text: "..." }
        const highlightText = typeof highlightItem === 'string' ? highlightItem : highlightItem?.text
        if (highlightText && typeof highlightText === 'string' && highlightText.trim()) {
          const highlight = storage.insert('highlights', {
            experience_template_id: id,
            text: highlightText.trim()
          } as any)
          createdHighlights.push({ id: highlight.id, text: highlight.text })
        }
      }
    }

    return NextResponse.json({
      ...updated,
      highlights: createdHighlights
    })
  } catch (error) {
    console.error('Error updating experience:', error)
    return NextResponse.json({ error: 'Failed to update experience' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Delete highlights first (cascade)
    storage.deleteWhere('highlights', h => h.experience_template_id === id)
    
    // Delete experience instances (cascade)
    storage.deleteWhere('resume_experience_instances', i => i.experience_template_id === id)

    // Delete experience template
    const deleted = storage.delete('experience_templates', id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting experience:', error)
    return NextResponse.json({ error: 'Failed to delete experience' }, { status: 500 })
  }
}
