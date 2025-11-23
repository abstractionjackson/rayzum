import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { seed } from '@/lib/seed'
import { migrateDatabase } from '@/lib/migrate'

export async function GET() {
  try {
    console.log('GET /api/resumes - Starting...')
    
    // Run migration first to ensure schema is up to date
    await migrateDatabase()
    
    // Create a fresh SQL connection
    const querySql = postgres(process.env.POSTGRES_URL!, { 
      ssl: 'require',
      max: 1,
      idle_timeout: 1
    })

    try {
      // Query resumes with their associated personal information
      const resumes = await querySql`
        SELECT 
          r.id,
          r.user_id,
          r.title,
          r.name_id,
          r.phone_id,
          r.email_id,
          r.template,
          r."createdAt",
          r."updatedAt",
          n.name as name_value,
          p.phone as phone_value,
          e.email as email_value
        FROM resumes r
        LEFT JOIN names n ON r.name_id = n.id
        LEFT JOIN phones p ON r.phone_id = p.id
        LEFT JOIN emails e ON r.email_id = e.id
        WHERE r.user_id = 'demo-user'
        ORDER BY r."updatedAt" DESC
      `
      
      await querySql.end()
      
      console.log('GET /api/resumes - Query result:', resumes.length, 'resumes found')
      
      return NextResponse.json(resumes)
    } catch (e: any) {
      await querySql.end()
      
      if (e.message.includes('relation') && e.message.includes('does not exist')) {
        console.log('Tables do not exist, creating and seeding now...')
        await seed()
        
        // Try again after seeding
        const newQuerySql = postgres(process.env.POSTGRES_URL!, { 
          ssl: 'require',
          max: 1,
          idle_timeout: 1
        })
        
        const resumes = await newQuerySql`
          SELECT 
            r.id,
            r.user_id,
            r.title,
            r.name_id,
            r.phone_id,
            r.email_id,
            r.template,
            r."createdAt",
            r."updatedAt",
            n.name as name_value,
            p.phone as phone_value,
            e.email as email_value
          FROM resumes r
          LEFT JOIN names n ON r.name_id = n.id
          LEFT JOIN phones p ON r.phone_id = p.id
          LEFT JOIN emails e ON r.email_id = e.id
          WHERE r.user_id = 'demo-user'
          ORDER BY r."updatedAt" DESC
        `
        
        await newQuerySql.end()
        
        console.log('GET /api/resumes - After seed, query result:', resumes.length, 'resumes found')
        return NextResponse.json(resumes)
      }
      
      throw e
    }
  } catch (error) {
    console.error('Error fetching resumes:', error)
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/resumes - Starting...')
    const { title, name_id, phone_id, email_id } = await request.json()
    console.log('POST /api/resumes - Received:', { title, name_id, phone_id, email_id })

    if (!title || typeof title !== 'string' || !title.trim()) {
      console.log('POST /api/resumes - Invalid title provided')
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Create a fresh SQL connection
    const insertSql = postgres(process.env.POSTGRES_URL!, { 
      ssl: 'require',
      max: 1,
      idle_timeout: 1
    })
    
    try {
      // Insert the resume
      const result = await insertSql`
        INSERT INTO resumes (user_id, title, name_id, phone_id, email_id)
        VALUES ('demo-user', ${title.trim()}, ${name_id || null}, ${phone_id || null}, ${email_id || null})
        RETURNING *
      `
      
      await insertSql.end()
      console.log('POST /api/resumes - Insert successful, result:', result)
      
      return NextResponse.json(result[0])
      
    } catch (e: any) {
      await insertSql.end()
      console.log('POST /api/resumes - Insert error:', e.message)
      
      if (e.message.includes('relation "resumes" does not exist')) {
        console.log('Resumes table does not exist, creating and seeding it now...')
        await seed()
        
        const newInsertSql = postgres(process.env.POSTGRES_URL!, { 
          ssl: 'require',
          max: 1,
          idle_timeout: 1
        })
        
        const result = await newInsertSql`
          INSERT INTO resumes (user_id, title, name_id, phone_id, email_id)
          VALUES ('demo-user', ${title.trim()}, ${name_id || null}, ${phone_id || null}, ${email_id || null})
          RETURNING *
        `
        
        await newInsertSql.end()
        
        return NextResponse.json(result[0])
      }
      
      return NextResponse.json({ error: 'Failed to create resume: ' + e.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error creating resume:', error)
    return NextResponse.json({ error: 'Failed to create resume' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/resumes - Starting...')
    const { id, title, name_id, phone_id, email_id } = await request.json()
    console.log('PUT /api/resumes - Received:', { id, title, name_id, phone_id, email_id })

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Create a fresh SQL connection
    const updateSql = postgres(process.env.POSTGRES_URL!, { 
      ssl: 'require',
      max: 1,
      idle_timeout: 1
    })

    try {
      // Update the resume
      const result = await updateSql`
        UPDATE resumes 
        SET 
          title = COALESCE(${title}, title),
          name_id = ${name_id !== undefined ? (name_id || null) : updateSql`name_id`},
          phone_id = ${phone_id !== undefined ? (phone_id || null) : updateSql`phone_id`},
          email_id = ${email_id !== undefined ? (email_id || null) : updateSql`email_id`},
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${id} AND user_id = 'demo-user'
        RETURNING *
      `

      await updateSql.end()

      if (result.length === 0) {
        return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
      }

      console.log('PUT /api/resumes - Update successful:', result[0])
      return NextResponse.json(result[0])
      
    } catch (e: any) {
      await updateSql.end()
      console.log('PUT /api/resumes - Error updating:', e.message)
      return NextResponse.json({ error: 'Failed to update: ' + e.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error updating resume:', error)
    return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/resumes - Starting...')
    const { id } = await request.json()
    console.log('DELETE /api/resumes - Received ID:', id)

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
      // Delete the resume
      const result = await deleteSql`
        DELETE FROM resumes 
        WHERE id = ${id} AND user_id = 'demo-user'
        RETURNING *
      `

      await deleteSql.end()

      if (result.length === 0) {
        return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
      }

      console.log('DELETE /api/resumes - Resume deleted successfully:', result[0])
      return NextResponse.json({ message: 'Resume deleted successfully', deletedResume: result[0] })
      
    } catch (e: any) {
      await deleteSql.end()
      console.log('DELETE /api/resumes - Error deleting:', e.message)
      return NextResponse.json({ error: 'Failed to delete: ' + e.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting resume:', error)
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 })
  }
}
