import postgres from 'postgres'
import { timeAgo } from '@/lib/utils'
import RefreshButton from './refresh-button'
import { seed } from '@/lib/seed'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export default async function ResumeComponents() {
  let experienceData, bulletsData
  let startTime = Date.now()

  try {
    // Check if tables exist by trying to query them
    experienceData = await sql`
      SELECT es.*, r.title as resume_title 
      FROM experience_sections es 
      JOIN resumes r ON es.resume_id = r.id
    `
    bulletsData = await sql`
      SELECT bp.*, es.company, es.position 
      FROM bullet_points bp 
      JOIN experience_sections es ON bp.experience_id = es.id
    `
  } catch (e: any) {
    if (e.message.includes('relation') && e.message.includes('does not exist')) {
      console.log(
        'Resume tables do not exist, creating and seeding them now...'
      )
      // Tables are not created yet
      await seed()
      startTime = Date.now()
      experienceData = await sql`
        SELECT es.*, r.title as resume_title 
        FROM experience_sections es 
        JOIN resumes r ON es.resume_id = r.id
      `
      bulletsData = await sql`
        SELECT bp.*, es.company, es.position 
        FROM bullet_points bp 
        JOIN experience_sections es ON bp.experience_id = es.id
      `
    } else {
      throw e
    }
  }

  const duration = Date.now() - startTime

  return (
    <div className="bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Resume Components</h2>
          <p className="text-sm text-gray-500">
            Loaded {bulletsData.length} bullet points from {experienceData.length} experience sections in {duration}ms
          </p>
        </div>
        <RefreshButton />
      </div>

      <div className="space-y-6">
        {experienceData.map((experience) => {
          const relatedBullets = bulletsData.filter(bullet => bullet.experience_id === experience.id)

          return (
            <div key={experience.id} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{experience.position}</h3>
                <p className="text-gray-600">{experience.company}</p>
                <p className="text-sm text-gray-500">
                  {new Date(experience.start_date).getFullYear()} - {experience.is_current ? 'Present' : new Date(experience.end_date).getFullYear()}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Bullet Points:</h4>
                {relatedBullets.map((bullet) => (
                  <div key={bullet.id} className="flex items-start space-x-3">
                    <div className={`mt-1.5 w-3 h-3 rounded-full flex-shrink-0 ${bullet.is_selected ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    <div className="flex-1">
                      <p className={`text-sm ${bullet.is_selected ? 'text-gray-900' : 'text-gray-500'}`}>
                        {bullet.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {bullet.is_selected ? 'Selected' : 'Not selected'} • Created {timeAgo(bullet.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
