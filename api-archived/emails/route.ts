import { NextRequest, NextResponse } from 'next/server'
import { storage, setDefaultItem } from '@/lib/storage'

export async function GET() {
  try {
    const emails = storage.select('emails')
    return NextResponse.json(emails)
  } catch (error) {
    console.error('Error fetching emails:', error)
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check for duplicates
    const existing = storage.select('emails').find(e => e.email === email.trim())
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    const newEmail = storage.insert('emails', {
      email: email.trim(),
      is_default: false
    } as any)

    return NextResponse.json(newEmail, { status: 201 })
  } catch (error) {
    console.error('Error creating email:', error)
    return NextResponse.json({ error: 'Failed to create email' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, email } = await request.json()

    if (!id || !email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'ID and email are required' }, { status: 400 })
    }

    // Check for duplicates (excluding current item)
    const existing = storage.select('emails').find(e => e.email === email.trim() && e.id !== id)
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
    }

    const updated = storage.update('emails', id, { email: email.trim() } as any)
    
    if (!updated) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating email:', error)
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const deleted = storage.delete('emails', id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting email:', error)
    return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action } = await request.json()

    if (!id || action !== 'toggle-default') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const item = setDefaultItem('emails', id)
    
    if (!item) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error toggling default:', error)
    return NextResponse.json({ error: 'Failed to toggle default' }, { status: 500 })
  }
}
