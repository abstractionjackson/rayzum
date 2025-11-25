import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { seed } from '@/lib/seed'

export async function GET() {
  try {
    // Create a fresh SQL connection
    const querySql = postgres(process.env.POSTGRES_URL!, { 
      ssl: 'require',
      max: 1,
      idle_timeout: 1
    })

    try {
      // Query phones with default status from the defaults table
      const phones = await querySql`
        SELECT 
          p.id,
          p.phone,
          p.user_id,
          p."createdAt",
          CASE WHEN d.entity_id = p.id THEN true ELSE false END as is_default
        FROM phones p
        LEFT JOIN defaults d ON d.entity_type = 'phone' AND d.user_id = p.user_id AND d.entity_id = p.id
        WHERE p.user_id = 'demo-user'
        ORDER BY p."createdAt" DESC
      `
      
      await querySql.end()
      
      return NextResponse.json(phones)
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
        
        const phones = await newQuerySql`
          SELECT 
            p.id,
            p.phone,
            p.user_id,
            p."createdAt",
            CASE WHEN d.entity_id = p.id THEN true ELSE false END as is_default
          FROM phones p
          LEFT JOIN defaults d ON d.entity_type = 'phone' AND d.user_id = p.user_id AND d.entity_id = p.id
          WHERE p.user_id = 'demo-user'
          ORDER BY p."createdAt" DESC
        `
        
        await newQuerySql.end()
        
        return NextResponse.json(phones)
      }
      
      throw e
    }
  } catch (error) {
    console.error('Error fetching phones:', error)
    return NextResponse.json({ error: 'Failed to fetch phones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/phones - Starting...')
    const { phone } = await request.json()
    console.log('POST /api/phones - Received phone:', phone)

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      console.log('POST /api/phones - Invalid phone provided')
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    }

    // Create a fresh SQL connection
    const insertSql = postgres(process.env.POSTGRES_URL!, { 
      ssl: 'require',
      max: 1,
      idle_timeout: 1
    })
    
    try {
      // Insert the phone
      const result = await insertSql`
        INSERT INTO phones (phone, user_id)
        VALUES (${phone.trim()}, 'demo-user')
        RETURNING *
      `
      
      await insertSql.end()
      console.log('POST /api/phones - Insert successful, result:', result)
      
      // Return with is_default: false since new phones are not default
      const phoneWithDefault = { ...result[0], is_default: false }
      return NextResponse.json(phoneWithDefault)
      
    } catch (e: any) {
      await insertSql.end()
      console.log('POST /api/phones - Insert error:', e.message)
      
      // Check if it's a unique constraint violation
      if (e.message.includes('duplicate key value violates unique constraint') || 
          e.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ error: 'A phone with this value already exists' }, { status: 409 })
      }
      
      if (e.message.includes('relation "phones" does not exist')) {
        console.log('Phones table does not exist, creating and seeding it now...')
        await seed()
        
        const newInsertSql = postgres(process.env.POSTGRES_URL!, { 
          ssl: 'require',
          max: 1,
          idle_timeout: 1
        })
        
        const result = await newInsertSql`
          INSERT INTO phones (phone, user_id)
          VALUES (${phone.trim()}, 'demo-user')
          RETURNING *
        `
        
        await newInsertSql.end()
        
        const phoneWithDefault = { ...result[0], is_default: false }
        return NextResponse.json(phoneWithDefault)
      }
      
      return NextResponse.json({ error: 'Failed to create phone: ' + e.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error creating phone:', error)
    return NextResponse.json({ error: 'Failed to create phone' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/phones - Starting...')
    const { id, action } = await request.json()
    console.log('PUT /api/phones - Received ID:', id, 'Action:', action)

    if (!id || !action) {
      return NextResponse.json({ error: 'ID and action are required' }, { status: 400 })
    }

    if (action === 'set_default') {
      console.log('PUT /api/phones - Setting default for ID:', id)
      
      // Create a fresh SQL connection
      const updateSql = postgres(process.env.POSTGRES_URL!, { 
        ssl: 'require',
        max: 1,
        idle_timeout: 1
      })

      try {
        // First verify the phone exists
        const phoneExists = await updateSql`
          SELECT id FROM phones WHERE id = ${id} AND user_id = 'demo-user'
        `
        
        if (phoneExists.length === 0) {
          await updateSql.end()
          return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
        }

        console.log('PUT /api/phones - Phone exists, updating defaults table...')

        // Use UPSERT to set the default in the defaults table
        const result = await updateSql`
          INSERT INTO defaults (user_id, entity_type, entity_id)
          VALUES ('demo-user', 'phone', ${id})
          ON CONFLICT (user_id, entity_type) 
          DO UPDATE SET 
            entity_id = ${id},
            "createdAt" = CURRENT_TIMESTAMP
          RETURNING *
        `

        console.log('PUT /api/phones - Defaults table updated:', result)

        // Get the updated phone with default status
        const updatedPhone = await updateSql`
          SELECT 
            p.id,
            p.phone,
            p.user_id,
            p."createdAt",
            true as is_default
          FROM phones p
          WHERE p.id = ${id} AND p.user_id = 'demo-user'
        `

        await updateSql.end()

        console.log('PUT /api/phones - Default set successfully for phone:', updatedPhone[0])
        return NextResponse.json(updatedPhone[0])
        
      } catch (e: any) {
        await updateSql.end()
        console.log('PUT /api/phones - Error setting default:', e.message)
        return NextResponse.json({ error: 'Failed to set default: ' + e.message }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating phone:', error)
    return NextResponse.json({ error: 'Failed to update phone' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/phones - Starting...')
    const { id } = await request.json()
    console.log('DELETE /api/phones - Received ID:', id)

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
      // First verify the phone exists
      const phoneExists = await deleteSql`
        SELECT id FROM phones WHERE id = ${id} AND user_id = 'demo-user'
      `
      
      if (phoneExists.length === 0) {
        await deleteSql.end()
        return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
      }

      console.log('DELETE /api/phones - Phone exists, deleting...')

      // Remove from defaults table if this phone is currently default
      await deleteSql`
        DELETE FROM defaults 
        WHERE user_id = 'demo-user' AND entity_type = 'phone' AND entity_id = ${id}
      `

      // Delete the phone
      const result = await deleteSql`
        DELETE FROM phones 
        WHERE id = ${id} AND user_id = 'demo-user'
        RETURNING *
      `

      await deleteSql.end()

      console.log('DELETE /api/phones - Phone deleted successfully:', result[0])
      return NextResponse.json({ message: 'Phone deleted successfully', deletedPhone: result[0] })
      
    } catch (e: any) {
      await deleteSql.end()
      console.log('DELETE /api/phones - Error deleting:', e.message)
      return NextResponse.json({ error: 'Failed to delete: ' + e.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting phone:', error)
    return NextResponse.json({ error: 'Failed to delete phone' }, { status: 500 })
  }
}
