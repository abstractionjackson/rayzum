import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/storage'

export async function GET() {
  try {
    // This is a server-side route, so we can't access localStorage directly
    // Return helpful debug info about the API structure
    return NextResponse.json({
      message: 'Local storage is browser-based - check browser DevTools → Application → Local Storage',
      storage_key: 'rayzum_db',
      api_endpoints: {
        names: '/api/names',
        phones: '/api/phones',
        emails: '/api/emails',
        experience: '/api/experience',
        education_items: '/api/education-items',
        resumes: '/api/resumes'
      },
      note: 'All data is stored in browser localStorage. Server-side routes proxy to client storage.'
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug endpoint error' }, { status: 500 })
  }
}