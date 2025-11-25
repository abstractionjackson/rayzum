// Local Storage Database - Browser-based data persistence
// This replaces PostgreSQL with browser localStorage

interface StorageData {
  names: Array<{ id: number; name: string; is_default: boolean; createdAt: string }>
  phones: Array<{ id: number; phone: string; is_default: boolean; createdAt: string }>
  emails: Array<{ id: number; email: string; is_default: boolean; createdAt: string }>
  experience_templates: Array<{
    id: number
    job_title: string
    company_name: string
    start_date: string
    end_date: string | null
    createdAt: string
    updatedAt: string
  }>
  highlights: Array<{
    id: number
    experience_template_id: number
    text: string
    createdAt: string
  }>
  resumes: Array<{
    id: number
    title: string
    name_id: number | null
    phone_id: number | null
    email_id: number | null
    createdAt: string
    updatedAt: string
  }>
  resume_experience_instances: Array<{
    id: number
    resume_id: number
    experience_template_id: number
    selected_highlight_ids: number[]
    display_order: number
    createdAt: string
    updatedAt: string
  }>
  education_items: Array<{
    id: number
    school: string
    degree: string
    year: string
    is_default: boolean
    createdAt: string
  }>
  resume_education: Array<{
    id: number
    resume_id: number
    education_item_id: number
    display_order: number
    createdAt: string
  }>
}

const STORAGE_KEY = 'regent_street_db'

// Initialize empty database structure
const getEmptyDatabase = (): StorageData => ({
  names: [],
  phones: [],
  emails: [],
  experience_templates: [],
  highlights: [],
  resumes: [],
  resume_experience_instances: [],
  education_items: [],
  resume_education: []
})

// Get all data from storage
export const getDatabase = (): StorageData => {
  if (typeof window === 'undefined') {
    return getEmptyDatabase()
  }
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    const empty = getEmptyDatabase()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(empty))
    return empty
  }
  
  return JSON.parse(stored)
}

// Save all data to storage
export const saveDatabase = (data: StorageData): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Generate next ID for a table
export const getNextId = (table: keyof StorageData): number => {
  const db = getDatabase()
  const items = db[table] as Array<{ id: number }>
  if (items.length === 0) return 1
  return Math.max(...items.map(item => item.id)) + 1
}

// Generic CRUD operations
export const storage = {
  // SELECT queries
  select: <T extends keyof StorageData>(
    table: T,
    filter?: (item: StorageData[T][number]) => boolean
  ): StorageData[T] => {
    const db = getDatabase()
    const items = db[table]
    if (!filter) return items
    return items.filter(filter) as StorageData[T]
  },

  // INSERT
  insert: <T extends keyof StorageData>(
    table: T,
    data: Omit<StorageData[T][number], 'id' | 'createdAt'>
  ): StorageData[T][number] => {
    const db = getDatabase()
    const id = getNextId(table)
    const createdAt = new Date().toISOString()
    const newItem = { id, ...data, createdAt } as StorageData[T][number]
    
    db[table] = [...db[table], newItem] as any
    saveDatabase(db)
    return newItem
  },

  // UPDATE
  update: <T extends keyof StorageData>(
    table: T,
    id: number,
    data: Partial<StorageData[T][number]>
  ): StorageData[T][number] | null => {
    const db = getDatabase()
    const items = db[table] as Array<any>
    const index = items.findIndex(item => item.id === id)
    
    if (index === -1) return null
    
    const updatedAt = new Date().toISOString()
    const updated = { ...items[index], ...data, updatedAt }
    items[index] = updated
    
    saveDatabase(db)
    return updated
  },

  // DELETE
  delete: <T extends keyof StorageData>(
    table: T,
    id: number
  ): boolean => {
    const db = getDatabase()
    const items = db[table] as Array<any>
    const filtered = items.filter(item => item.id !== id)
    
    if (filtered.length === items.length) return false
    
    db[table] = filtered as any
    saveDatabase(db)
    return true
  },

  // DELETE with filter
  deleteWhere: <T extends keyof StorageData>(
    table: T,
    filter: (item: StorageData[T][number]) => boolean
  ): number => {
    const db = getDatabase()
    const items = db[table] as Array<any>
    const filtered = items.filter(item => !filter(item))
    const deletedCount = items.length - filtered.length
    
    db[table] = filtered as any
    saveDatabase(db)
    return deletedCount
  },

  // Clear all data
  clearAll: (): void => {
    saveDatabase(getEmptyDatabase())
  }
}

// Helper functions for common queries

export const getDefaultItem = (type: 'names' | 'phones' | 'emails') => {
  const items = storage.select(type)
  return items.find(item => (item as any).is_default)
}

export const setDefaultItem = (type: 'names' | 'phones' | 'emails' | 'education_items', id: number) => {
  const db = getDatabase()
  const items = db[type] as Array<any>
  
  // Remove all defaults
  items.forEach(item => {
    item.is_default = false
  })
  
  // Set new default
  const item = items.find(i => i.id === id)
  if (item) {
    item.is_default = true
  }
  
  saveDatabase(db)
  return item
}

export const getResumeWithDetails = (resumeId: number) => {
  const resume = storage.select('resumes').find(r => r.id === resumeId)
  if (!resume) return null

  const name = resume.name_id ? storage.select('names').find(n => n.id === resume.name_id) : null
  const phone = resume.phone_id ? storage.select('phones').find(p => p.id === resume.phone_id) : null
  const email = resume.email_id ? storage.select('emails').find(e => e.id === resume.email_id) : null

  // Get experience instances
  const expInstances = storage.select('resume_experience_instances', i => i.resume_id === resumeId)
  const experienceIds = expInstances.map(inst => ({
    id: inst.id,
    template_id: inst.experience_template_id,
    selected_highlight_ids: inst.selected_highlight_ids,
    display_order: inst.display_order
  }))

  // Get education items
  const eduLinks = storage.select('resume_education', e => e.resume_id === resumeId)
  const educationIds = eduLinks.map(link => ({
    id: link.education_item_id,
    display_order: link.display_order
  }))

  return {
    ...resume,
    name_value: name?.name || null,
    phone_value: phone?.phone || null,
    email_value: email?.email || null,
    experience_ids: experienceIds,
    education_ids: educationIds
  }
}

export const getExperienceWithHighlights = (experienceId: number) => {
  const exp = storage.select('experience_templates').find(e => e.id === experienceId)
  if (!exp) return null

  const highlights = storage.select('highlights', h => h.experience_template_id === experienceId)
  
  return {
    ...exp,
    highlights: highlights.map(h => ({ id: h.id, text: h.text }))
  }
}

export const getAllExperiencesWithHighlights = () => {
  const experiences = storage.select('experience_templates')
  return experiences.map(exp => {
    const highlights = storage.select('highlights', h => h.experience_template_id === exp.id)
    return {
      ...exp,
      highlights: highlights.map(h => ({ id: h.id, text: h.text }))
    }
  })
}

export const getAllResumesWithDetails = () => {
  const resumes = storage.select('resumes')
  return resumes.map(resume => getResumeWithDetails(resume.id)).filter(Boolean)
}
