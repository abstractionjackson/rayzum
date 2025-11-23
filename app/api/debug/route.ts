import { NextResponse } from 'next/server'
import postgres from 'postgres'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

export async function GET() {
  try {
    console.log('DEBUG: Checking database state...')
    
    // Create a fresh SQL connection to avoid cached plan issues
    const freshSql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })
    
    // Check if names table exists
    const tableExists = await freshSql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'names'
    `
    console.log('DEBUG: Names table exists:', tableExists.length > 0)
    
    if (tableExists.length > 0) {
      // Check table structure
      const columns = await freshSql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'names'
        ORDER BY ordinal_position
      `
      console.log('DEBUG: Table columns:', columns)
      
      // Get all names regardless of user_id
      const allNames = await freshSql`SELECT * FROM names ORDER BY "createdAt" DESC`
      console.log('DEBUG: All names in table:', allNames)
      
      // Get names for demo-user specifically
      const demoUserNames = await freshSql`SELECT * FROM names WHERE user_id = 'demo-user' ORDER BY "createdAt" DESC`
      console.log('DEBUG: Demo user names:', demoUserNames)
      
      await freshSql.end()
      
      return NextResponse.json({
        tableExists: true,
        columns,
        allNames,
        demoUserNames,
        counts: {
          total: allNames.length,
          demoUser: demoUserNames.length
        }
      })
    } else {
      await freshSql.end()
      return NextResponse.json({
        tableExists: false,
        message: 'Names table does not exist'
      })
    }
    
  } catch (error) {
    console.error('DEBUG endpoint error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}