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
      name_id INTEGER REFERENCES names(id) ON DELETE SET NULL,
      phone_id INTEGER REFERENCES phones(id) ON DELETE SET NULL,
      email_id INTEGER REFERENCES emails(id) ON DELETE SET NULL,
      template VARCHAR(100) DEFAULT 'default',
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, title)
    );
  `

  // Create experience entries table
  const createExperienceTable = await sql`
    CREATE TABLE IF NOT EXISTS experience_entries (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) DEFAULT 'demo-user',
      job_title VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `

  // Create highlights table
  const createHighlightsTable = await sql`
    CREATE TABLE IF NOT EXISTS highlights (
      id SERIAL PRIMARY KEY,
      experience_entry_id INTEGER NOT NULL REFERENCES experience_entries(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `

  // Create resume_experiences junction table
  const createResumeExperiencesTable = await sql`
    CREATE TABLE IF NOT EXISTS resume_experiences (
      id SERIAL PRIMARY KEY,
      resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
      experience_entry_id INTEGER NOT NULL REFERENCES experience_entries(id) ON DELETE CASCADE,
      display_order INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(resume_id, experience_entry_id)
    );
  `

  // Create education_items table
  const createEducationItemsTable = await sql`
    CREATE TABLE IF NOT EXISTS education_items (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) DEFAULT 'demo-user',
      school VARCHAR(255) NOT NULL,
      degree VARCHAR(255) NOT NULL,
      year VARCHAR(50) NOT NULL,
      is_default BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, school, degree, year)
    );
  `

  // Create resume_education junction table
  const createResumeEducationTable = await sql`
    CREATE TABLE IF NOT EXISTS resume_education (
      id SERIAL PRIMARY KEY,
      resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
      education_item_id INTEGER NOT NULL REFERENCES education_items(id) ON DELETE CASCADE,
      display_order INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(resume_id, education_item_id)
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

  // Seed with sample experience entries
  const sampleExperience = await sql`
    INSERT INTO experience_entries (user_id, job_title, company_name, start_date, end_date)
    VALUES ('demo-user', 'Senior Software Engineer', 'Tech Company', '2022-01-01', NULL)
    ON CONFLICT DO NOTHING
    RETURNING id;
  `

  // Seed sample highlights if we have an experience entry
  if (sampleExperience.length > 0) {
    const experienceId = sampleExperience[0].id

    await Promise.all([
      sql`
        INSERT INTO highlights (experience_entry_id, text)
        VALUES (${experienceId}, 'Led development of scalable web applications using React and Node.js')
        ON CONFLICT DO NOTHING;
      `,
      sql`
        INSERT INTO highlights (experience_entry_id, text)
        VALUES (${experienceId}, 'Improved application performance by 40% through code optimization')
        ON CONFLICT DO NOTHING;
      `,
      sql`
        INSERT INTO highlights (experience_entry_id, text)
        VALUES (${experienceId}, 'Mentored junior developers and conducted code reviews')
        ON CONFLICT DO NOTHING;
      `
    ])
  }

  console.log(`Seeded sample experience data`)

  return {
    createNamesTable,
    createPhonesTable,
    createEmailsTable,
    createDefaultsTable,
    createResumesTable,
    createExperienceTable,
    createHighlightsTable,
    sampleNames,
    samplePhones,
    sampleEmails,
  }
}
