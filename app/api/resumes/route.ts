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
      // Query resumes with their associated personal information and experiences
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
          e.email as email_value,
          COALESCE(exp_agg.experience_ids, '[]'::json) as experience_ids,
          COALESCE(edu_agg.education_ids, '[]'::json) as education_ids
        FROM resumes r
        LEFT JOIN names n ON r.name_id = n.id
        LEFT JOIN phones p ON r.phone_id = p.id
        LEFT JOIN emails e ON r.email_id = e.id
        LEFT JOIN LATERAL (
          SELECT json_agg(
            jsonb_build_object(
              'id', rei.id,
              'template_id', rei.experience_template_id,
              'selected_highlight_ids', rei.selected_highlight_ids,
              'display_order', rei.display_order
            ) ORDER BY rei.display_order ASC
          ) as experience_ids
          FROM resume_experience_instances rei
          WHERE rei.resume_id = r.id
        ) exp_agg ON true
        LEFT JOIN LATERAL (
          SELECT json_agg(
            jsonb_build_object(
              'id', red.education_item_id,
              'display_order', red.display_order
            ) ORDER BY red.display_order ASC
          ) as education_ids
          FROM resume_education red
          WHERE red.resume_id = r.id
        ) edu_agg ON true
        WHERE r.user_id = 'demo-user'
        ORDER BY r."updatedAt" DESC
      `
      
      await querySql.end()
      
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
            e.email as email_value,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', re.experience_entry_id,
                  'display_order', re.display_order
                ) ORDER BY re.display_order ASC
              ) FILTER (WHERE re.experience_entry_id IS NOT NULL),
              '[]'
            ) as experience_ids
          FROM resumes r
          LEFT JOIN names n ON r.name_id = n.id
          LEFT JOIN phones p ON r.phone_id = p.id
          LEFT JOIN emails e ON r.email_id = e.id
          LEFT JOIN resume_experiences re ON re.resume_id = r.id
          WHERE r.user_id = 'demo-user'
          GROUP BY r.id, n.name, p.phone, e.email
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
    const { title, name_id, phone_id, email_id, experience_ids, education_ids } = await request.json()
    console.log('POST /api/resumes - Received:', { title, name_id, phone_id, email_id, experience_ids, education_ids })

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
      
      const resumeId = result[0].id
      
      // Add experience instances if provided
      // Expect experience_instances array with { template_id, selected_highlight_ids }
      if (experience_ids && Array.isArray(experience_ids) && experience_ids.length > 0) {
        for (let i = 0; i < experience_ids.length; i++) {
          const instance = experience_ids[i]
          // Support both old format (number) and new format (object)
          const templateId = typeof instance === 'object' ? instance.template_id : instance
          const highlightIds = typeof instance === 'object' ? (instance.selected_highlight_ids || []) : []
          
          await insertSql`
            INSERT INTO resume_experience_instances (resume_id, experience_template_id, selected_highlight_ids, display_order)
            VALUES (${resumeId}, ${templateId}, ${highlightIds}, ${i})
            ON CONFLICT (resume_id, experience_template_id) DO NOTHING
          `
        }
      }
      
      // Add education items if provided
      if (education_ids && Array.isArray(education_ids) && education_ids.length > 0) {
        for (let i = 0; i < education_ids.length; i++) {
          await insertSql`
            INSERT INTO resume_education (resume_id, education_item_id, display_order)
            VALUES (${resumeId}, ${education_ids[i]}, ${i})
            ON CONFLICT (resume_id, education_item_id) DO NOTHING
          `
        }
      }
      
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
    const { id, title, name_id, phone_id, email_id, experience_ids, education_ids } = await request.json()
    console.log('PUT /api/resumes - Received:', { id, title, name_id, phone_id, email_id, experience_ids, education_ids })

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

      if (result.length === 0) {
        await updateSql.end()
        return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
      }

      // Update experience instances if provided
      if (experience_ids !== undefined && Array.isArray(experience_ids)) {
        // Delete existing experience associations
        await updateSql`
          DELETE FROM resume_experience_instances WHERE resume_id = ${id}
        `
        
        // Insert new experience instances
        for (let i = 0; i < experience_ids.length; i++) {
          const instance = experience_ids[i]
          // Support both old format (number) and new format (object)
          const templateId = typeof instance === 'object' ? instance.template_id : instance
          const highlightIds = typeof instance === 'object' ? (instance.selected_highlight_ids || []) : []
          
          await updateSql`
            INSERT INTO resume_experience_instances (resume_id, experience_template_id, selected_highlight_ids, display_order)
            VALUES (${id}, ${templateId}, ${highlightIds}, ${i})
            ON CONFLICT (resume_id, experience_template_id) DO UPDATE 
            SET display_order = ${i}, selected_highlight_ids = ${highlightIds}, "updatedAt" = CURRENT_TIMESTAMP
          `
        }
      }

      // Update education items if provided
      if (education_ids !== undefined && Array.isArray(education_ids)) {
        // Delete existing education associations
        await updateSql`
          DELETE FROM resume_education WHERE resume_id = ${id}
        `
        
        // Insert new education associations
        for (let i = 0; i < education_ids.length; i++) {
          await updateSql`
            INSERT INTO resume_education (resume_id, education_item_id, display_order)
            VALUES (${id}, ${education_ids[i]}, ${i})
            ON CONFLICT (resume_id, education_item_id) DO UPDATE SET display_order = ${i}
          `
        }
      }

      await updateSql.end()

      console.log('PUT /api/resumes - Update successful')
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
