import postgres from 'postgres'

export async function migrateDatabase() {
  // Create a completely fresh connection for migration
  const migrationSql = postgres(process.env.POSTGRES_URL!, { 
    ssl: 'require',
    max: 1,  // Single connection
    idle_timeout: 1 // Close quickly
  })

  try {
    console.log('Migration: Starting database migration check...')
    
    // Check if is_default column exists and remove it
    const columnExists = await migrationSql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'names' 
      AND column_name = 'is_default'
    `

    if (columnExists.length > 0) {
      console.log('Migration: Removing is_default column from names table...')
      
      // Remove the is_default column
      await migrationSql`
        ALTER TABLE names 
        DROP COLUMN IF EXISTS is_default
      `
      console.log('Migration: is_default column removed successfully')
    }

    // Check if the old unique constraint exists and replace it with a composite constraint
    console.log('Migration: Checking for existing unique constraints on names table...')
    
    const existingConstraints = await migrationSql`
      SELECT constraint_name, column_name
      FROM information_schema.key_column_usage
      WHERE table_name = 'names' 
      AND constraint_name LIKE '%unique%' OR constraint_name LIKE '%name%'
    `

    console.log('Migration: Existing constraints:', existingConstraints)

    // Drop the old unique constraint on just the name column if it exists
    const nameUniqueConstraints = existingConstraints.filter(c => 
      c.column_name === 'name' && c.constraint_name.includes('unique')
    )

    for (const constraint of nameUniqueConstraints) {
      console.log(`Migration: Dropping old unique constraint: ${constraint.constraint_name}`)
      try {
        await migrationSql`
          ALTER TABLE names 
          DROP CONSTRAINT IF EXISTS ${migrationSql.unsafe(constraint.constraint_name)}
        `
      } catch (e) {
        console.log(`Migration: Could not drop constraint ${constraint.constraint_name}:`, e.message)
      }
    }

    // Add the new composite unique constraint if it doesn't exist
    try {
      console.log('Migration: Adding composite unique constraint on (user_id, name)...')
      await migrationSql`
        ALTER TABLE names 
        ADD CONSTRAINT names_user_id_name_unique UNIQUE (user_id, name)
      `
      console.log('Migration: Composite unique constraint added successfully')
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('Migration: Composite unique constraint already exists')
      } else {
        console.log('Migration: Error adding composite unique constraint:', e.message)
      }
    }
    
    // Ensure defaults table exists
    await migrationSql`
      CREATE TABLE IF NOT EXISTS defaults (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, entity_type)
      );
    `
    console.log('Migration: Ensured defaults table exists')

    // Add foreign key columns to resumes table if they don't exist
    try {
      console.log('Migration: Checking resumes table for personal info columns...')
      
      const resumeColumns = await migrationSql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'resumes'
      `
      
      const columnNames = resumeColumns.map(c => c.column_name)
      
      if (!columnNames.includes('name_id')) {
        console.log('Migration: Adding name_id column to resumes table...')
        await migrationSql`
          ALTER TABLE resumes 
          ADD COLUMN name_id INTEGER REFERENCES names(id) ON DELETE SET NULL
        `
      }
      
      if (!columnNames.includes('phone_id')) {
        console.log('Migration: Adding phone_id column to resumes table...')
        await migrationSql`
          ALTER TABLE resumes 
          ADD COLUMN phone_id INTEGER REFERENCES phones(id) ON DELETE SET NULL
        `
      }
      
      if (!columnNames.includes('email_id')) {
        console.log('Migration: Adding email_id column to resumes table...')
        await migrationSql`
          ALTER TABLE resumes 
          ADD COLUMN email_id INTEGER REFERENCES emails(id) ON DELETE SET NULL
        `
      }
      
      console.log('Migration: Resumes table personal info columns updated')
    } catch (e) {
      console.log('Migration: Error updating resumes table:', e.message)
    }

    // Check if there's any existing default for names, if not set first name as default
    const existingDefault = await migrationSql`
      SELECT * FROM defaults 
      WHERE user_id = 'demo-user' AND entity_type = 'name'
    `

    if (existingDefault.length === 0) {
      // Set the first name as default if no default exists
      const firstName = await migrationSql`
        SELECT id FROM names 
        WHERE user_id = 'demo-user' 
        ORDER BY "createdAt" ASC 
        LIMIT 1
      `

      console.log('Migration: Found', firstName.length, 'existing names')

      if (firstName.length > 0) {
        await migrationSql`
          INSERT INTO defaults (user_id, entity_type, entity_id)
          VALUES ('demo-user', 'name', ${firstName[0].id})
        `
        console.log('Set first name as default:', firstName[0].id)
      }
    }

    console.log('Migration completed successfully')
    
    // Close the migration connection
    await migrationSql.end()
    
    // Wait a moment for connection to fully close
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return true

  } catch (error) {
    console.error('Migration failed:', error)
    await migrationSql.end()
    throw error
  }
}