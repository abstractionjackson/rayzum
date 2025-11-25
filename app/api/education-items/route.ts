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
      // Query education items
      const educationItems = await querySql`
        SELECT 
          id,
          user_id,
          school,
          degree,
          year,
          is_default,
          "createdAt",
          "updatedAt"
        FROM education_items
        WHERE user_id = 'demo-user'
        ORDER BY year DESC, "createdAt" DESC
      `
      
      await querySql.end()
      
      return NextResponse.json(educationItems)
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
        
        const educationItems = await newQuerySql`
          SELECT 
            id,
            user_id,
            school,
            degree,
            year,
            is_default,
            "createdAt",
            "updatedAt"
          FROM education_items
          WHERE user_id = 'demo-user'
          ORDER BY year DESC, "createdAt" DESC
        `
        
        await newQuerySql.end()
        
        return NextResponse.json(educationItems)
      }
      
      throw e
    }
  } catch (error) {
    console.error('Error fetching education items:', error)
    return NextResponse.json({ error: 'Failed to fetch education items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { school, degree, year } = await request.json()

    if (!school || !degree || !year) {
      return NextResponse.json({ error: 'School, degree, and year are required' }, { status: 400 })
    }

    // Create a fresh SQL connection
    const insertSql = postgres(process.env.POSTGRES_URL!, { 
      ssl: 'require',
      max: 1,
      idle_timeout: 1
    })
    
    try {
      // Insert the education item
      const result = await insertSql`
        INSERT INTO education_items (school, degree, year, user_id)
        VALUES (${school.trim()}, ${degree.trim()}, ${year.trim()}, 'demo-user')
        RETURNING *
      `
      
      await insertSql.end()
      
      return NextResponse.json(result[0], { status: 201 })
    } catch (e: any) {
      await insertSql.end()
      
      if (e.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'This education entry already exists' },
          { status: 409 }
        )
      }
      
      if (e.message.includes('relation') && e.message.includes('does not exist')) {
        await seed()
        
        // Try again after seeding
        const newInsertSql = postgres(process.env.POSTGRES_URL!, { 
          ssl: 'require',
          max: 1,
          idle_timeout: 1
        })
        
        const result = await newInsertSql`
          INSERT INTO education_items (school, degree, year, user_id)
          VALUES (${school.trim()}, ${degree.trim()}, ${year.trim()}, 'demo-user')
          RETURNING *
        `
        
        await newInsertSql.end()
        
        return NextResponse.json(result[0], { status: 201 })
      }
      
      throw e
    }
  } catch (error) {
    console.error('Error creating education item:', error)
    return NextResponse.json({ error: 'Failed to create education item' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, action, school, degree, year } = await request.json()

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
      if (action === 'toggle-default') {
        // Get current default status
        const current = await updateSql`
          SELECT is_default FROM education_items WHERE id = ${id} AND user_id = 'demo-user'
        `
        
        if (current.length === 0) {
          await updateSql.end()
          return NextResponse.json({ error: 'Education item not found' }, { status: 404 })
        }
        
        const newDefaultStatus = !current[0].is_default
        
        // Update the default status
        const result = await updateSql`
          UPDATE education_items
          SET is_default = ${newDefaultStatus}, "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = ${id} AND user_id = 'demo-user'
          RETURNING *
        `
        
        await updateSql.end()
        
        if (result.length === 0) {
          return NextResponse.json({ error: 'Education item not found' }, { status: 404 })
        }
        
        return NextResponse.json(result[0])
      } else if (action === 'update') {
        if (!school || !degree || !year) {
          await updateSql.end()
          return NextResponse.json({ error: 'School, degree, and year are required' }, { status: 400 })
        }
        
        const result = await updateSql`
          UPDATE education_items
          SET 
            school = ${school.trim()},
            degree = ${degree.trim()},
            year = ${year.trim()},
            "updatedAt" = CURRENT_TIMESTAMP
          WHERE id = ${id} AND user_id = 'demo-user'
          RETURNING *
        `
        
        await updateSql.end()
        
        if (result.length === 0) {
          return NextResponse.json({ error: 'Education item not found' }, { status: 404 })
        }
        
        return NextResponse.json(result[0])
      }
      
      await updateSql.end()
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (e: any) {
      await updateSql.end()
      
      if (e.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'This education entry already exists' },
          { status: 409 }
        )
      }
      
      throw e
    }
  } catch (error) {
    console.error('Error updating education item:', error)
    return NextResponse.json({ error: 'Failed to update education item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

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
      const result = await deleteSql`
        DELETE FROM education_items
        WHERE id = ${id} AND user_id = 'demo-user'
        RETURNING *
      `
      
      await deleteSql.end()
      
      if (result.length === 0) {
        return NextResponse.json({ error: 'Education item not found' }, { status: 404 })
      }
      
      return NextResponse.json({ message: 'Education item deleted successfully' })
    } catch (e: any) {
      await deleteSql.end()
      throw e
    }
  } catch (error) {
    console.error('Error deleting education item:', error)
    return NextResponse.json({ error: 'Failed to delete education item' }, { status: 500 })
  }
}
