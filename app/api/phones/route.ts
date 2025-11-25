import { NextRequest, NextResponse } from 'next/server'
import { storage, setDefaultItem } from '@/lib/storage'

export async function GET() {
  try {
    const phones = storage.select('phones')
    return NextResponse.json(phones)
  } catch (error) {
    console.error('Error fetching phones:', error)
    return NextResponse.json({ error: 'Failed to fetch phones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    }

    // Check for duplicates
    const existing = storage.select('phones').find(p => p.phone === phone.trim())
    if (existing) {
      return NextResponse.json({ error: 'Phone already exists' }, { status: 409 })
    }

    const newPhone = storage.insert('phones', {
      phone: phone.trim(),
      is_default: false
    } as any)

    return NextResponse.json(newPhone, { status: 201 })
  } catch (error) {
    console.error('Error creating phone:', error)
    return NextResponse.json({ error: 'Failed to create phone' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, phone } = await request.json()

    if (!id || !phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json({ error: 'ID and phone are required' }, { status: 400 })
    }

    // Check for duplicates (excluding current item)
    const existing = storage.select('phones').find(p => p.phone === phone.trim() && p.id !== id)
    if (existing) {
      return NextResponse.json({ error: 'Phone already exists' }, { status: 409 })
    }

    const updated = storage.update('phones', id, { phone: phone.trim() } as any)
    
    if (!updated) {
      return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating phone:', error)
    return NextResponse.json({ error: 'Failed to update phone' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const deleted = storage.delete('phones', id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting phone:', error)
    return NextResponse.json({ error: 'Failed to delete phone' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action } = await request.json()

    if (!id || action !== 'toggle-default') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const item = setDefaultItem('phones', id)
    
    if (!item) {
      return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error toggling default:', error)
    return NextResponse.json({ error: 'Failed to toggle default' }, { status: 500 })
  }
}
