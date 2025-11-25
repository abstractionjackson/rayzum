import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { seed } from '@/lib/seed'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

export async function GET() {
  try {
    // Create a fresh SQL connection
    const querySql = postgres(process.env.POSTGRES_URL!, { 
      ssl: 'require',
      max: 1,
      idle_timeout: 1
    })
    
    try {
      // Get all names and join with defaults table to check which is default
      const names = await querySql`
        SELECT 
          n.id,
          n.name,
          n.user_id,
          n."createdAt",
          CASE WHEN d.entity_id = n.id THEN true ELSE false END as is_default
        FROM names n
        LEFT JOIN defaults d ON d.entity_type = 'name' AND d.user_id = n.user_id AND d.entity_id = n.id
        WHERE n.user_id = 'demo-user'
        ORDER BY n."createdAt" DESC
      `
      
      await querySql.end()
      
      return NextResponse.json(names)
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
        
        const names = await newQuerySql`
          SELECT 
            n.id,
            n.name,
            n.user_id,
            n."createdAt",
            CASE WHEN d.entity_id = n.id THEN true ELSE false END as is_default
          FROM names n
          LEFT JOIN defaults d ON d.entity_type = 'name' AND d.user_id = n.user_id AND d.entity_id = n.id
          WHERE n.user_id = 'demo-user'
          ORDER BY n."createdAt" DESC
        `
        
        await newQuerySql.end()
        
        return NextResponse.json(names)
      } else {
        throw e
      }
    }
  } catch (error) {
    console.error('Error fetching names:', error)
    return NextResponse.json({ error: 'Failed to fetch names' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/names - Starting...')
    const { name } = await request.json()
    console.log('POST /api/names - Received name:', name)

    if (!name || typeof name !== 'string' || !name.trim()) {
      console.log('POST /api/names - Invalid name provided')
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Create a fresh SQL connection
    const insertSql = postgres(process.env.POSTGRES_URL!, { 
      ssl: 'require',
      max: 1,
      idle_timeout: 1
    })
    
    try {
      // Insert the name (no is_default column needed)
      const result = await insertSql`
        INSERT INTO names (name, user_id)
        VALUES (${name.trim()}, 'demo-user')
        RETURNING *
      `
      
      await insertSql.end()
      console.log('POST /api/names - Insert successful, result:', result)
      
      // Return with is_default: false since new names are not default
      const nameWithDefault = { ...result[0], is_default: false }
      return NextResponse.json(nameWithDefault)
      
    } catch (e: any) {
      await insertSql.end()
      console.log('POST /api/names - Insert error:', e.message)
      
      // Check if it's a unique constraint violation
      if (e.message.includes('duplicate key value violates unique constraint') || 
          e.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ error: 'A name with this value already exists' }, { status: 409 })
      }
      
      if (e.message.includes('relation "names" does not exist')) {
        console.log('Names table does not exist, creating and seeding it now...')
        await seed()
        
        const newInsertSql = postgres(process.env.POSTGRES_URL!, { 
          ssl: 'require',
          max: 1,
          idle_timeout: 1
        })
        
        const result = await newInsertSql`
          INSERT INTO names (name, user_id)
          VALUES (${name.trim()}, 'demo-user')
          RETURNING *
        `
        
        await newInsertSql.end()
        console.log('POST /api/names - Insert after seeding successful:', result)
        
        const nameWithDefault = { ...result[0], is_default: false }
        return NextResponse.json(nameWithDefault)
      } else {
        throw e
      }
    }
  } catch (error) {
    console.error('Error adding name:', error)
    return NextResponse.json({ error: 'Failed to add name' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/names - Starting...')
    const { id, action } = await request.json()
    console.log('PUT /api/names - Received ID:', id, 'Action:', action)

    if (!id || !action) {
      return NextResponse.json({ error: 'ID and action are required' }, { status: 400 })
    }

    if (action === 'set_default') {
      console.log('PUT /api/names - Setting default for ID:', id)
      
      // Create a fresh SQL connection
      const updateSql = postgres(process.env.POSTGRES_URL!, { 
        ssl: 'require',
        max: 1,
        idle_timeout: 1
      })

      try {
        // First verify the name exists
        const nameExists = await updateSql`
          SELECT id FROM names WHERE id = ${id} AND user_id = 'demo-user'
        `
        
        if (nameExists.length === 0) {
          await updateSql.end()
          return NextResponse.json({ error: 'Name not found' }, { status: 404 })
        }

        console.log('PUT /api/names - Name exists, updating defaults table...')

        // Use UPSERT to set the default in the defaults table
        const result = await updateSql`
          INSERT INTO defaults (user_id, entity_type, entity_id)
          VALUES ('demo-user', 'name', ${id})
          ON CONFLICT (user_id, entity_type) 
          DO UPDATE SET 
            entity_id = ${id},
            "createdAt" = CURRENT_TIMESTAMP
          RETURNING *
        `

        console.log('PUT /api/names - Defaults table updated:', result)

        // Get the updated name with default status
        const updatedName = await updateSql`
          SELECT 
            n.id,
            n.name,
            n.user_id,
            n."createdAt",
            true as is_default
          FROM names n
          WHERE n.id = ${id} AND n.user_id = 'demo-user'
        `

        await updateSql.end()

        console.log('PUT /api/names - Default set successfully for name:', updatedName[0])
        return NextResponse.json(updatedName[0])
        
      } catch (e: any) {
        await updateSql.end()
        console.log('PUT /api/names - Error setting default:', e.message)
        return NextResponse.json({ error: 'Failed to set default: ' + e.message }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating name:', error)
    return NextResponse.json({ error: 'Failed to update name' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/names - Starting...')
    const { id } = await request.json()
    console.log('DELETE /api/names - Received ID:', id)

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
      // First verify the name exists
      const nameExists = await deleteSql`
        SELECT id FROM names WHERE id = ${id} AND user_id = 'demo-user'
      `
      
      if (nameExists.length === 0) {
        await deleteSql.end()
        return NextResponse.json({ error: 'Name not found' }, { status: 404 })
      }

      console.log('DELETE /api/names - Name exists, deleting...')

      // Remove from defaults table if this name is currently default
      await deleteSql`
        DELETE FROM defaults 
        WHERE user_id = 'demo-user' AND entity_type = 'name' AND entity_id = ${id}
      `

      // Delete the name
      const result = await deleteSql`
        DELETE FROM names 
        WHERE id = ${id} AND user_id = 'demo-user'
        RETURNING *
      `

      await deleteSql.end()

      console.log('DELETE /api/names - Name deleted successfully:', result[0])
      return NextResponse.json({ message: 'Name deleted successfully', deletedName: result[0] })
      
    } catch (e: any) {
      await deleteSql.end()
      console.log('DELETE /api/names - Error deleting:', e.message)
      return NextResponse.json({ error: 'Failed to delete: ' + e.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting name:', error)
    return NextResponse.json({ error: 'Failed to delete name' }, { status: 500 })
  }
}