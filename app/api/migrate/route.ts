import { NextResponse } from 'next/server'
import { migrateDatabase } from '@/lib/migrate'

export async function GET() {
  try {
    await migrateDatabase()
    return NextResponse.json({ message: 'Migration completed successfully' })
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await migrateDatabase()
    return NextResponse.json({ message: 'Migration completed successfully' })
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}