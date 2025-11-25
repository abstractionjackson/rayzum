import { NextRequest, NextResponse } from 'next/server'
import { storage, getResumeWithDetails, getDatabase, saveDatabase } from '@/lib/storage'

export async function GET() {
  try {
    const resumes = storage.select('resumes')
    
    // Enrich each resume with details
    const enrichedResumes = resumes.map(resume => getResumeWithDetails(resume.id))
    
    // Sort by updatedAt descending
    return NextResponse.json(
      enrichedResumes.sort((a, b) => 
        new Date(b!.updatedAt).getTime() - new Date(a!.updatedAt).getTime()
      )
    )
  } catch (error) {
    console.error('Error fetching resumes:', error)
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, name_id, phone_id, email_id, experience_ids, education_ids } = await request.json()

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Check for duplicate title
    const existing = storage.select('resumes').find(r => r.title === title.trim())
    if (existing) {
      return NextResponse.json({ error: 'Resume with this title already exists' }, { status: 409 })
    }

    // Create resume
    const newResume = storage.insert('resumes', {
      title: title.trim(),
      name_id: name_id || null,
      phone_id: phone_id || null,
      email_id: email_id || null,
      updatedAt: new Date().toISOString()
    } as any)

    // Create experience instances
    if (experience_ids && Array.isArray(experience_ids)) {
      experience_ids.forEach((exp, index) => {
        // Support both old format (numbers) and new format (objects)
        const templateId = typeof exp === 'number' ? exp : exp.template_id
        const selectedHighlightIds = typeof exp === 'object' ? (exp.selected_highlight_ids || []) : []
        
        storage.insert('resume_experience_instances', {
          resume_id: newResume.id,
          experience_template_id: templateId,
          selected_highlight_ids: selectedHighlightIds,
          display_order: index,
          updatedAt: new Date().toISOString()
        } as any)
      })
    }

    // Create education links
    if (education_ids && Array.isArray(education_ids)) {
      education_ids.forEach((eduId, index) => {
        storage.insert('resume_education', {
          resume_id: newResume.id,
          education_item_id: eduId,
          display_order: index
        } as any)
      })
    }

    // Return enriched resume
    const enriched = getResumeWithDetails(newResume.id)
    return NextResponse.json(enriched, { status: 201 })
  } catch (error) {
    console.error('Error creating resume:', error)
    return NextResponse.json({ error: 'Failed to create resume' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, title, name_id, phone_id, email_id, experience_ids, education_ids } = await request.json()

    if (!id || !title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'ID and title are required' }, { status: 400 })
    }

    // Check for duplicate title (excluding current resume)
    const existing = storage.select('resumes').find(r => r.title === title.trim() && r.id !== id)
    if (existing) {
      return NextResponse.json({ error: 'Resume with this title already exists' }, { status: 409 })
    }

    // Update resume
    const updated = storage.update('resumes', id, {
      title: title.trim(),
      name_id: name_id || null,
      phone_id: phone_id || null,
      email_id: email_id || null,
      updatedAt: new Date().toISOString()
    } as any)

    if (!updated) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    // Delete existing experience instances and education links
    storage.deleteWhere('resume_experience_instances', i => i.resume_id === id)
    storage.deleteWhere('resume_education', e => e.resume_id === id)

    // Create new experience instances
    if (experience_ids && Array.isArray(experience_ids)) {
      experience_ids.forEach((exp, index) => {
        // Support both old format (numbers) and new format (objects)
        const templateId = typeof exp === 'number' ? exp : exp.template_id
        const selectedHighlightIds = typeof exp === 'object' ? (exp.selected_highlight_ids || []) : []
        
        storage.insert('resume_experience_instances', {
          resume_id: id,
          experience_template_id: templateId,
          selected_highlight_ids: selectedHighlightIds,
          display_order: index,
          updatedAt: new Date().toISOString()
        } as any)
      })
    }

    // Create new education links
    if (education_ids && Array.isArray(education_ids)) {
      education_ids.forEach((eduId, index) => {
        storage.insert('resume_education', {
          resume_id: id,
          education_item_id: eduId,
          display_order: index
        } as any)
      })
    }

    // Return enriched resume
    const enriched = getResumeWithDetails(id)
    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error updating resume:', error)
    return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Delete experience instances (cascade)
    storage.deleteWhere('resume_experience_instances', i => i.resume_id === id)
    
    // Delete education links (cascade)
    storage.deleteWhere('resume_education', e => e.resume_id === id)

    // Delete resume
    const deleted = storage.delete('resumes', id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting resume:', error)
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 })
  }
}
