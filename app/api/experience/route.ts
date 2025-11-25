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
      // Query experience templates with their highlights
      const experiences = await querySql`
        SELECT 
          e.id,
          e.user_id,
          e.job_title,
          e.company_name,
          e.start_date,
          e.end_date,
          e."createdAt",
          e."updatedAt",
          COALESCE(
            json_agg(
              json_build_object(
                'id', h.id,
                'text', h.text,
                'createdAt', h."createdAt"
              ) ORDER BY h."createdAt" ASC
            ) FILTER (WHERE h.id IS NOT NULL),
            '[]'
          ) as highlights
        FROM experience_templates e
        LEFT JOIN highlights h ON h.experience_template_id = e.id
        WHERE e.user_id = 'demo-user'
        GROUP BY e.id
        ORDER BY e.start_date DESC NULLS LAST, e."createdAt" DESC
      `
      
      await querySql.end()
      
      console.log('GET /api/experience - Query result:', experiences.length, 'experiences found')
      
      return NextResponse.json(experiences)
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
        
        const experiences = await newQuerySql`
          SELECT 
            e.id,
            e.user_id,
            e.job_title,
            e.company_name,
            e.start_date,
            e.end_date,
            e."createdAt",
            e."updatedAt",
            COALESCE(
              json_agg(
                json_build_object(
                  'id', h.id,
                  'text', h.text,
                  'createdAt', h."createdAt"
                ) ORDER BY h."createdAt" ASC
              ) FILTER (WHERE h.id IS NOT NULL),
              '[]'
            ) as highlights
          FROM experience_templates e
          LEFT JOIN highlights h ON h.experience_template_id = e.id
          WHERE e.user_id = 'demo-user'
          GROUP BY e.id
          ORDER BY e.start_date DESC NULLS LAST, e."createdAt" DESC
        `
        
        await newQuerySql.end()
        
        console.log('GET /api/experience - After seed, query result:', experiences.length, 'experiences found')
        return NextResponse.json(experiences)
      }
      
      throw e
    }
  } catch (error) {
    console.error('Error fetching experiences:', error)
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/experience - Starting...')
    const { job_title, company_name, start_date, end_date, highlights } = await request.json()
    console.log('POST /api/experience - Received:', { job_title, company_name, start_date, end_date, highlights })

    if (!job_title || !company_name || !start_date) {
      return NextResponse.json({ error: 'Job title, company name, and start date are required' }, { status: 400 })
    }

    // Create a fresh SQL connection
    const insertSql = postgres(process.env.POSTGRES_URL!, { 
      ssl: 'require',
      max: 1,
      idle_timeout: 1
    })
    
    try {
      // Insert the experience entry
      const result = await insertSql`
        INSERT INTO experience_templates (user_id, job_title, company_name, start_date, end_date)
        VALUES ('demo-user', ${job_title}, ${company_name}, ${start_date}, ${end_date || null})
        RETURNING *
      `
      
      const experienceId = result[0].id
      
      // Insert highlights if provided
      if (highlights && Array.isArray(highlights) && highlights.length > 0) {
        for (const highlight of highlights) {
          if (highlight.text && highlight.text.trim()) {
            await insertSql`
              INSERT INTO highlights (experience_template_id, text)
              VALUES (${experienceId}, ${highlight.text.trim()})
            `
          }
        }
      }
      
      // Fetch the complete entry with highlights
      const completeEntry = await insertSql`
        SELECT 
          e.id,
          e.user_id,
          e.job_title,
          e.company_name,
          e.start_date,
          e.end_date,
          e."createdAt",
          e."updatedAt",
          COALESCE(
            json_agg(
              json_build_object(
                'id', h.id,
                'text', h.text,
                'createdAt', h."createdAt"
              ) ORDER BY h."createdAt" ASC
            ) FILTER (WHERE h.id IS NOT NULL),
            '[]'
          ) as highlights
        FROM experience_templates e
        LEFT JOIN highlights h ON h.experience_template_id = e.id
        WHERE e.id = ${experienceId}
        GROUP BY e.id
      `
      
      await insertSql.end()
      console.log('POST /api/experience - Insert successful')
      
      return NextResponse.json(completeEntry[0])
      
    } catch (e: any) {
      await insertSql.end()
      console.log('POST /api/experience - Insert error:', e.message)
      
      if (e.message.includes('relation "experience_templates" does not exist')) {
        console.log('Experience table does not exist, creating and seeding it now...')
        await seed()
        
        const newInsertSql = postgres(process.env.POSTGRES_URL!, { 
          ssl: 'require',
          max: 1,
          idle_timeout: 1
        })
        
        const result = await newInsertSql`
          INSERT INTO experience_templates (user_id, job_title, company_name, start_date, end_date)
          VALUES ('demo-user', ${job_title}, ${company_name}, ${start_date}, ${end_date || null})
          RETURNING *
        `
        
        await newInsertSql.end()
        
        return NextResponse.json(result[0])
      }
      
      return NextResponse.json({ error: 'Failed to create experience: ' + e.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error creating experience:', error)
    return NextResponse.json({ error: 'Failed to create experience' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/experience - Starting...')
    const { id, job_title, company_name, start_date, end_date, highlights } = await request.json()
    console.log('PUT /api/experience - Received:', { id, job_title, company_name, start_date, end_date, highlights })

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
      // Update the experience entry
      const result = await updateSql`
        UPDATE experience_templates 
        SET 
          job_title = COALESCE(${job_title}, job_title),
          company_name = COALESCE(${company_name}, company_name),
          start_date = COALESCE(${start_date}, start_date),
          end_date = ${end_date !== undefined ? (end_date || null) : updateSql`end_date`},
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${id} AND user_id = 'demo-user'
        RETURNING *
      `

      if (result.length === 0) {
        await updateSql.end()
        return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
      }

      // Update highlights if provided
      if (highlights !== undefined && Array.isArray(highlights)) {
        // Delete existing highlights
        await updateSql`
          DELETE FROM highlights WHERE experience_template_id = ${id}
        `
        
        // Insert new highlights
        for (const highlight of highlights) {
          if (highlight.text && highlight.text.trim()) {
            await updateSql`
              INSERT INTO highlights (experience_template_id, text)
              VALUES (${id}, ${highlight.text.trim()})
            `
          }
        }
      }

      // Fetch the complete updated entry with highlights
      const completeEntry = await updateSql`
        SELECT 
          e.id,
          e.user_id,
          e.job_title,
          e.company_name,
          e.start_date,
          e.end_date,
          e."createdAt",
          e."updatedAt",
          COALESCE(
            json_agg(
              json_build_object(
                'id', h.id,
                'text', h.text,
                'createdAt', h."createdAt"
              ) ORDER BY h."createdAt" ASC
            ) FILTER (WHERE h.id IS NOT NULL),
            '[]'
          ) as highlights
        FROM experience_templates e
        LEFT JOIN highlights h ON h.experience_template_id = e.id
        WHERE e.id = ${id}
        GROUP BY e.id
      `

      await updateSql.end()

      console.log('PUT /api/experience - Update successful')
      return NextResponse.json(completeEntry[0])
      
    } catch (e: any) {
      await updateSql.end()
      console.log('PUT /api/experience - Error updating:', e.message)
      return NextResponse.json({ error: 'Failed to update: ' + e.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error updating experience:', error)
    return NextResponse.json({ error: 'Failed to update experience' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/experience - Starting...')
    const { id } = await request.json()
    console.log('DELETE /api/experience - Received ID:', id)

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
      // Delete the experience (highlights will cascade delete)
      const result = await deleteSql`
        DELETE FROM experience_templates 
        WHERE id = ${id} AND user_id = 'demo-user'
        RETURNING *
      `

      await deleteSql.end()

      if (result.length === 0) {
        return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
      }

      console.log('DELETE /api/experience - Experience deleted successfully')
      return NextResponse.json({ message: 'Experience deleted successfully', deletedExperience: result[0] })
      
    } catch (e: any) {
      await deleteSql.end()
      console.log('DELETE /api/experience - Error deleting:', e.message)
      return NextResponse.json({ error: 'Failed to delete: ' + e.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting experience:', error)
    return NextResponse.json({ error: 'Failed to delete experience' }, { status: 500 })
  }
}
