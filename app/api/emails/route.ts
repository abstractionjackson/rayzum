import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { seed } from '@/lib/seed'
import { migrateDatabase } from '@/lib/migrate'

export async function GET() {
  try {
    // Run migration first to ensure schema is up to date
    await migrateDatabase()
    
    // Create a fresh SQL connection
    const querySql = postgres(process.env.POSTGRES_URL!, { 
      ssl: 'require',
      max: 1,
      idle_timeout: 1
    })

    try {
      // Query emails with default status from the defaults table
      const emails = await querySql`
        SELECT 
          e.id,
          e.email,
          e.user_id,
          e."createdAt",
          CASE WHEN d.entity_id = e.id THEN true ELSE false END as is_default
        FROM emails e
        LEFT JOIN defaults d ON d.entity_type = 'email' AND d.user_id = e.user_id AND d.entity_id = e.id
        WHERE e.user_id = 'demo-user'
        ORDER BY e."createdAt" DESC
      `
      
      await querySql.end()
      
      return NextResponse.json(emails)
    } catch (e: any) {
      await querySql.end()
      
      if (e.message.includes('relation') && e.message.includes('does not exist')) {
        await seed()
        
        // Try again after seeding
        const newQuerySql = postgres(process.env.POSTGRES_URL!, { 
          ssl: 'require',
          max: 1,
          idle_timeout: 1
        })
        
        const emails = await newQuerySql`
          SELECT 
            e.id,
            e.email,
            e.user_id,
            e."createdAt",
            CASE WHEN d.entity_id = e.id THEN true ELSE false END as is_default
          FROM emails e
          LEFT JOIN defaults d ON d.entity_type = 'email' AND d.user_id = e.user_id AND d.entity_id = e.id
          WHERE e.user_id = 'demo-user'
          ORDER BY e."createdAt" DESC
        `
        
        await newQuerySql.end()
        
        return NextResponse.json(emails)
      }
      
      throw e
    }
  } catch (error) {
    console.error('Error fetching emails:', error)
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/emails - Starting...')
    const { email } = await request.json()
    console.log('POST /api/emails - Received email:', email)

    if (!email || typeof email !== 'string' || !email.trim()) {
      console.log('POST /api/emails - Invalid email provided')
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create a fresh SQL connection
    const insertSql = postgres(process.env.POSTGRES_URL!, { 
      ssl: 'require',
      max: 1,
      idle_timeout: 1
    })
    
    try {
      // Insert the email
      const result = await insertSql`
        INSERT INTO emails (email, user_id)
        VALUES (${email.trim()}, 'demo-user')
        RETURNING *
      `
      
      await insertSql.end()
      console.log('POST /api/emails - Insert successful, result:', result)
      
      // Return with is_default: false since new emails are not default
      const emailWithDefault = { ...result[0], is_default: false }
      return NextResponse.json(emailWithDefault)
      
    } catch (e: any) {
      await insertSql.end()
      console.log('POST /api/emails - Insert error:', e.message)
      
      // Check if it's a unique constraint violation
      if (e.message.includes('duplicate key value violates unique constraint') || 
          e.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ error: 'An email with this value already exists' }, { status: 409 })
      }
      
      if (e.message.includes('relation "emails" does not exist')) {
        console.log('Emails table does not exist, creating and seeding it now...')
        await seed()
        
        const newInsertSql = postgres(process.env.POSTGRES_URL!, { 
          ssl: 'require',
          max: 1,
          idle_timeout: 1
        })
        
        const result = await newInsertSql`
          INSERT INTO emails (email, user_id)
          VALUES (${email.trim()}, 'demo-user')
          RETURNING *
        `
        
        await newInsertSql.end()
        
        const emailWithDefault = { ...result[0], is_default: false }
        return NextResponse.json(emailWithDefault)
      }
      
      return NextResponse.json({ error: 'Failed to create email: ' + e.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error creating email:', error)
    return NextResponse.json({ error: 'Failed to create email' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/emails - Starting...')
    const { id, action } = await request.json()
    console.log('PUT /api/emails - Received ID:', id, 'Action:', action)

    if (!id || !action) {
      return NextResponse.json({ error: 'ID and action are required' }, { status: 400 })
    }

    if (action === 'set_default') {
      console.log('PUT /api/emails - Setting default for ID:', id)
      
      // Create a fresh SQL connection
      const updateSql = postgres(process.env.POSTGRES_URL!, { 
        ssl: 'require',
        max: 1,
        idle_timeout: 1
      })

      try {
        // First verify the email exists
        const emailExists = await updateSql`
          SELECT id FROM emails WHERE id = ${id} AND user_id = 'demo-user'
        `
        
        if (emailExists.length === 0) {
          await updateSql.end()
          return NextResponse.json({ error: 'Email not found' }, { status: 404 })
        }

        console.log('PUT /api/emails - Email exists, updating defaults table...')

        // Use UPSERT to set the default in the defaults table
        const result = await updateSql`
          INSERT INTO defaults (user_id, entity_type, entity_id)
          VALUES ('demo-user', 'email', ${id})
          ON CONFLICT (user_id, entity_type) 
          DO UPDATE SET 
            entity_id = ${id},
            "createdAt" = CURRENT_TIMESTAMP
          RETURNING *
        `

        console.log('PUT /api/emails - Defaults table updated:', result)

        // Get the updated email with default status
        const updatedEmail = await updateSql`
          SELECT 
            e.id,
            e.email,
            e.user_id,
            e."createdAt",
            true as is_default
          FROM emails e
          WHERE e.id = ${id} AND e.user_id = 'demo-user'
        `

        await updateSql.end()

        console.log('PUT /api/emails - Default set successfully for email:', updatedEmail[0])
        return NextResponse.json(updatedEmail[0])
        
      } catch (e: any) {
        await updateSql.end()
        console.log('PUT /api/emails - Error setting default:', e.message)
        return NextResponse.json({ error: 'Failed to set default: ' + e.message }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating email:', error)
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/emails - Starting...')
    const { id } = await request.json()
    console.log('DELETE /api/emails - Received ID:', id)

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Create a fresh SQL connection
    const deleteSql = postgres(process.env.POSTGRES_URL!, { 
      ssl: 'require',
      max: 1,
      idle_timeout: 1
    })

    try {
      // First verify the email exists
      const emailExists = await deleteSql`
        SELECT id FROM emails WHERE id = ${id} AND user_id = 'demo-user'
      `
      
      if (emailExists.length === 0) {
        await deleteSql.end()
        return NextResponse.json({ error: 'Email not found' }, { status: 404 })
      }

      console.log('DELETE /api/emails - Email exists, deleting...')

      // Remove from defaults table if this email is currently default
      await deleteSql`
        DELETE FROM defaults 
        WHERE user_id = 'demo-user' AND entity_type = 'email' AND entity_id = ${id}
      `

      // Delete the email
      const result = await deleteSql`
        DELETE FROM emails 
        WHERE id = ${id} AND user_id = 'demo-user'
        RETURNING *
      `

      await deleteSql.end()

      console.log('DELETE /api/emails - Email deleted successfully:', result[0])
      return NextResponse.json({ message: 'Email deleted successfully', deletedEmail: result[0] })
      
    } catch (e: any) {
      await deleteSql.end()
      console.log('DELETE /api/emails - Error deleting:', e.message)
      return NextResponse.json({ error: 'Failed to delete: ' + e.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting email:', error)
    return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 })
  }
}
