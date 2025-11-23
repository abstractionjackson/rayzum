import postgres from 'postgres'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

export async function seed() {
  // Create names table (without is_default column)
  const createNamesTable = await sql`
    CREATE TABLE IF NOT EXISTS names (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) DEFAULT 'demo-user',
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, name)
    );
  `

  // Create phones table
  const createPhonesTable = await sql`
    CREATE TABLE IF NOT EXISTS phones (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(50) NOT NULL,
      user_id VARCHAR(255) DEFAULT 'demo-user',
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, phone)
    );
  `

  // Create emails table
  const createEmailsTable = await sql`
    CREATE TABLE IF NOT EXISTS emails (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      user_id VARCHAR(255) DEFAULT 'demo-user',
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, email)
    );
  `

  // Create defaults table
  const createDefaultsTable = await sql`
    CREATE TABLE IF NOT EXISTS defaults (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INTEGER NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, entity_type)
    );
  `

  // Create resumes table
  const createResumesTable = await sql`
    CREATE TABLE IF NOT EXISTS resumes (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      template VARCHAR(100) DEFAULT 'default',
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `

  // Create experience sections table
  const createExperienceTable = await sql`
    CREATE TABLE IF NOT EXISTS experience_sections (
      id SERIAL PRIMARY KEY,
      resume_id INTEGER REFERENCES resumes(id) ON DELETE CASCADE,
      company VARCHAR(255) NOT NULL,
      position VARCHAR(255) NOT NULL,
      start_date DATE,
      end_date DATE,
      is_current BOOLEAN DEFAULT FALSE,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `

  // Create bullet points table
  const createBulletsTable = await sql`
    CREATE TABLE IF NOT EXISTS bullet_points (
      id SERIAL PRIMARY KEY,
      experience_id INTEGER REFERENCES experience_sections(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_selected BOOLEAN DEFAULT TRUE,
      display_order INTEGER DEFAULT 1,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `

  console.log(`Created resume-related tables`)

  // Seed with sample names (without is_default)
  const sampleNames = await Promise.all([
    sql`
      INSERT INTO names (name, user_id)
      VALUES ('John Doe', 'demo-user')
      ON CONFLICT (user_id, name) DO NOTHING
      RETURNING id;
    `,
    sql`
      INSERT INTO names (name, user_id)
      VALUES ('Jane Smith', 'demo-user')
      ON CONFLICT (user_id, name) DO NOTHING
      RETURNING id;
    `
  ])

  // Seed with sample phones
  const samplePhones = await Promise.all([
    sql`
      INSERT INTO phones (phone, user_id)
      VALUES ('+1 (555) 123-4567', 'demo-user')
      ON CONFLICT (user_id, phone) DO NOTHING
      RETURNING id;
    `,
    sql`
      INSERT INTO phones (phone, user_id)
      VALUES ('+1 (555) 987-6543', 'demo-user')
      ON CONFLICT (user_id, phone) DO NOTHING
      RETURNING id;
    `
  ])

  // Seed with sample emails
  const sampleEmails = await Promise.all([
    sql`
      INSERT INTO emails (email, user_id)
      VALUES ('john.doe@example.com', 'demo-user')
      ON CONFLICT (user_id, email) DO NOTHING
      RETURNING id;
    `,
    sql`
      INSERT INTO emails (email, user_id)
      VALUES ('jane.smith@example.com', 'demo-user')
      ON CONFLICT (user_id, email) DO NOTHING
      RETURNING id;
    `
  ])

  // Set first name as default using defaults table
  if (sampleNames[0] && sampleNames[0][0]) {
    await sql`
      INSERT INTO defaults (user_id, entity_type, entity_id)
      VALUES ('demo-user', 'name', ${sampleNames[0][0].id})
      ON CONFLICT (user_id, entity_type) 
      DO UPDATE SET entity_id = ${sampleNames[0][0].id};
    `
  }

  // Set first phone as default using defaults table
  if (samplePhones[0] && samplePhones[0][0]) {
    await sql`
      INSERT INTO defaults (user_id, entity_type, entity_id)
      VALUES ('demo-user', 'phone', ${samplePhones[0][0].id})
      ON CONFLICT (user_id, entity_type) 
      DO UPDATE SET entity_id = ${samplePhones[0][0].id};
    `
  }

  // Set first email as default using defaults table
  if (sampleEmails[0] && sampleEmails[0][0]) {
    await sql`
      INSERT INTO defaults (user_id, entity_type, entity_id)
      VALUES ('demo-user', 'email', ${sampleEmails[0][0].id})
      ON CONFLICT (user_id, entity_type) 
      DO UPDATE SET entity_id = ${sampleEmails[0][0].id};
    `
  }

  // Seed with sample data
  const sampleResume = await sql`
    INSERT INTO resumes (user_id, title, template)
    VALUES ('demo-user', 'Software Engineer Resume', 'modern')
    RETURNING id;
  `

  const resumeId = sampleResume[0].id

  const sampleExperience = await sql`
    INSERT INTO experience_sections (resume_id, company, position, start_date, end_date, is_current)
    VALUES (${resumeId}, 'Tech Company', 'Senior Software Engineer', '2022-01-01', NULL, true)
    RETURNING id;
  `

  const experienceId = sampleExperience[0].id

  const sampleBullets = await Promise.all([
    sql`
      INSERT INTO bullet_points (experience_id, content, is_selected, display_order)
      VALUES (${experienceId}, 'Led development of scalable web applications using React and Node.js', true, 1);
    `,
    sql`
      INSERT INTO bullet_points (experience_id, content, is_selected, display_order)
      VALUES (${experienceId}, 'Improved application performance by 40% through code optimization', true, 2);
    `,
    sql`
      INSERT INTO bullet_points (experience_id, content, is_selected, display_order)
      VALUES (${experienceId}, 'Mentored junior developers and conducted code reviews', false, 3);
    `
  ])

  console.log(`Seeded sample resume data`)

  return {
    createNamesTable,
    createDefaultsTable,
    createResumesTable,
    createExperienceTable,
    createBulletsTable,
    sampleNames,
    sampleResume,
    sampleBullets,
  }
}
