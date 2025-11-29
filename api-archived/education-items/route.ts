import { NextRequest, NextResponse } from 'next/server'
import { storage, setDefaultItem, getDatabase, saveDatabase } from '@/lib/storage'

export async function GET() {
  try {
    const educationItems = storage.select('education_items')
    // Sort by year descending
    return NextResponse.json(educationItems.sort((a, b) => b.year.localeCompare(a.year)))
  } catch (error) {
    console.error('Error fetching education items:', error)
    return NextResponse.json({ error: 'Failed to fetch education items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { school, degree, year } = await request.json()

    if (!school || !degree || !year) {
      return NextResponse.json(
        { error: 'School, degree, and year are required' },
        { status: 400 }
      )
    }

    // Check for duplicates
    const existing = storage.select('education_items').find(
      e => e.school === school.trim() && e.degree === degree.trim() && e.year === year.trim()
    )
    if (existing) {
      return NextResponse.json({ error: 'Education item already exists' }, { status: 409 })
    }

    const newEducation = storage.insert('education_items', {
      school: school.trim(),
      degree: degree.trim(),
      year: year.trim(),
      is_default: false
    } as any)

    return NextResponse.json(newEducation, { status: 201 })
  } catch (error) {
    console.error('Error creating education item:', error)
    return NextResponse.json({ error: 'Failed to create education item' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, school, degree, year } = await request.json()

    if (!id || !school || !degree || !year) {
      return NextResponse.json(
        { error: 'ID, school, degree, and year are required' },
        { status: 400 }
      )
    }

    // Check for duplicates (excluding current item)
    const existing = storage.select('education_items').find(
      e => e.school === school.trim() && 
           e.degree === degree.trim() && 
           e.year === year.trim() && 
           e.id !== id
    )
    if (existing) {
      return NextResponse.json({ error: 'Education item already exists' }, { status: 409 })
    }

    const updated = storage.update('education_items', id, {
      school: school.trim(),
      degree: degree.trim(),
      year: year.trim()
    } as any)
    
    if (!updated) {
      return NextResponse.json({ error: 'Education item not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating education item:', error)
    return NextResponse.json({ error: 'Failed to update education item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Delete from resume_education junction table (cascade)
    storage.deleteWhere('resume_education', e => e.education_item_id === id)

    // Delete education item
    const deleted = storage.delete('education_items', id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Education item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting education item:', error)
    return NextResponse.json({ error: 'Failed to delete education item' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action } = await request.json()

    if (!id || action !== 'toggle-default') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const db = getDatabase()
    const items = db.education_items
    
    const item = items.find(i => i.id === id)
    if (!item) {
      return NextResponse.json({ error: 'Education item not found' }, { status: 404 })
    }

    // Toggle the is_default value
    item.is_default = !item.is_default
    saveDatabase(db)

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error toggling default:', error)
    return NextResponse.json({ error: 'Failed to toggle default' }, { status: 500 })
  }
}
