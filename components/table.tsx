'use client'

import { useEffect, useState } from 'react'
import { timeAgo } from '@/lib/utils'
import RefreshButton from './refresh-button'

interface ExperienceWithBullets {
  id: number
  job_title: string
  company_name: string
  start_date: string
  end_date: string | null
  highlights: Array<{ id: number; text: string }>
}

export default function ResumeComponents() {
  const [experiences, setExperiences] = useState<ExperienceWithBullets[]>([])
  const [loading, setLoading] = useState(true)
  const [duration, setDuration] = useState(0)

  const loadData = async () => {
    const startTime = Date.now()
    setLoading(true)

    try {
      const response = await fetch('/api/experience')
      if (response.ok) {
        const data = await response.json()
        setExperiences(data)
      }
    } catch (error) {
      console.error('Error loading experiences:', error)
    } finally {
      setDuration(Date.now() - startTime)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const totalBullets = experiences.reduce((sum, exp) => sum + exp.highlights.length, 0)

  if (loading) {
    return (
      <div className="bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-4xl mx-auto w-full">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Resume Components</h2>
          <p className="text-sm text-gray-500">
            Loaded {totalBullets} highlights from {experiences.length} experience templates in {duration}ms
          </p>
        </div>
        <RefreshButton />
      </div>

      <div className="space-y-6">
        {experiences.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No experience templates yet. <a href="/dashboard/experience" className="text-blue-600 hover:underline">Add some</a>
          </p>
        ) : (
          experiences.map((experience) => (
            <div key={experience.id} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{experience.job_title}</h3>
                <p className="text-gray-600">{experience.company_name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(experience.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - {experience.end_date ? new Date(experience.end_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Present'}
                </p>
              </div>

              {experience.highlights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Highlights:</h4>
                  {experience.highlights.map((highlight) => (
                    <div key={highlight.id} className="flex items-start space-x-3">
                      <div className="mt-1.5 w-3 h-3 rounded-full flex-shrink-0 bg-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{highlight.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
