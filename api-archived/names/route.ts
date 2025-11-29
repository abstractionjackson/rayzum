import { NextRequest, NextResponse } from 'next/server'
import { storage, setDefaultItem } from '@/lib/storage'

export async function GET() {
  try {
    const names = storage.select('names')
    return NextResponse.json(names)
  } catch (error) {
    console.error('Error fetching names:', error)
    return NextResponse.json({ error: 'Failed to fetch names' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check for duplicates
    const existing = storage.select('names').find(n => n.name === name.trim())
    if (existing) {
      return NextResponse.json({ error: 'Name already exists' }, { status: 409 })
    }

    const newName = storage.insert('names', {
      name: name.trim(),
      is_default: false
    } as any)

    return NextResponse.json(newName, { status: 201 })
  } catch (error) {
    console.error('Error creating name:', error)
    return NextResponse.json({ error: 'Failed to create name' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name } = await request.json()

    if (!id || !name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    // Check for duplicates (excluding current item)
    const existing = storage.select('names').find(n => n.name === name.trim() && n.id !== id)
    if (existing) {
      return NextResponse.json({ error: 'Name already exists' }, { status: 409 })
    }

    const updated = storage.update('names', id, { name: name.trim() } as any)
    
    if (!updated) {
      return NextResponse.json({ error: 'Name not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating name:', error)
    return NextResponse.json({ error: 'Failed to update name' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const deleted = storage.delete('names', id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Name not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting name:', error)
    return NextResponse.json({ error: 'Failed to delete name' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action } = await request.json()

    if (!id || action !== 'toggle-default') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const item = setDefaultItem('names', id)
    
    if (!item) {
      return NextResponse.json({ error: 'Name not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error toggling default:', error)
    return NextResponse.json({ error: 'Failed to toggle default' }, { status: 500 })
  }
}
