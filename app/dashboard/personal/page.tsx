'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PersonalPage() {
    const [names, setNames] = useState<Array<{ id: number; name: string; createdAt: string; is_default: boolean }>>([])
    const [newName, setNewName] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [openDropdown, setOpenDropdown] = useState<number | null>(null)

    // Fetch names when component mounts
    useEffect(() => {
        fetchNames()
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdown !== null) {
                const target = event.target as HTMLElement
                // Don't close if clicking inside a dropdown
                if (!target.closest('.dropdown-menu')) {
                    setOpenDropdown(null)
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [openDropdown])

    const fetchNames = async () => {
        try {
            console.log('Fetching names...')
            const response = await fetch('/api/names')
            console.log('Response status:', response.status, response.statusText)

            if (response.ok) {
                const data = await response.json()
                console.log('Fetched names data:', data)
                console.log('Data type:', typeof data, 'Length:', Array.isArray(data) ? data.length : 'not array')
                setNames(data)
            } else {
                const errorData = await response.text()
                console.error('Failed to fetch names:', response.status, errorData)
            }
        } catch (error) {
            console.error('Error fetching names:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName.trim()) return

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/names', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newName.trim() }),
            })

            const data = await response.json()

            if (response.ok) {
                setNewName('')
                await fetchNames() // Refresh the list
            } else {
                // Handle different error types
                if (response.status === 409) {
                    alert('This name already exists. Please enter a different name.')
                } else {
                    alert('Error creating name: ' + (data.error || 'Unknown error'))
                }
            }
        } catch (error) {
            console.error('Error adding name:', error)
            alert('Error adding name. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSetDefault = async (id: number) => {
        console.log('=== handleSetDefault called ===')
        console.log('ID:', id)
        console.log('Type of ID:', typeof id)

        try {
            console.log('Setting default for ID:', id)
            const response = await fetch('/api/names', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, action: 'set_default' }),
            })

            console.log('Response status:', response.status)
            const responseData = await response.json()
            console.log('Response data:', responseData)

            if (response.ok) {
                console.log('Successfully set default, refreshing list...')
                await fetchNames() // Refresh the list
                setOpenDropdown(null) // Close dropdown
            } else {
                console.error('Failed to set default:', responseData)
            }
        } catch (error) {
            console.error('Error setting default name:', error)
        }
    }

    const handleDelete = async (id: number) => {
        console.log('=== handleDelete called ===')
        console.log('ID:', id)

        if (!confirm('Are you sure you want to delete this name?')) {
            return
        }

        try {
            console.log('Deleting name with ID:', id)
            const response = await fetch('/api/names', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            })

            console.log('Delete response status:', response.status)
            const responseData = await response.json()
            console.log('Delete response data:', responseData)

            if (response.ok) {
                console.log('Successfully deleted name, refreshing list...')
                await fetchNames() // Refresh the list
                setOpenDropdown(null) // Close dropdown
            } else {
                console.error('Failed to delete name:', responseData)
            }
        } catch (error) {
            console.error('Error deleting name:', error)
        }
    }

    const toggleDropdown = (id: number) => {
        console.log('toggleDropdown called for ID:', id)
        setOpenDropdown(openDropdown === id ? null : id)
    }

    return (
        <main className="container mx-auto py-12 px-4">
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    ← Back to Dashboard
                </Link>
            </div>

            <h1 className="text-3xl font-bold mb-8">Personal Information</h1>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Name Form */}
                <div className="bg-white rounded-lg shadow-md p-6 border">
                    <h2 className="text-xl font-semibold mb-4">Add Name</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter a name"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !newName.trim()}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Adding...' : 'Add'}
                        </button>
                    </form>
                </div>

                {/* Names List */}
                <div className="bg-white rounded-lg shadow-md p-6 border">
                    <h2 className="text-xl font-semibold mb-4">Saved Names</h2>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : names.length > 0 ? (
                        <div className="space-y-2">
                            {names.map((nameEntry) => (
                                <div
                                    key={nameEntry.id}
                                    className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="font-medium">{nameEntry.name}</span>
                                        {nameEntry.is_default && (
                                            <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-200 rounded-full">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm text-gray-500">
                                            {new Date(nameEntry.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="relative">
                                            <button
                                                onClick={() => toggleDropdown(nameEntry.id)}
                                                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                                                aria-label="More options"
                                            >
                                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </button>
                                            {openDropdown === nameEntry.id && (
                                                <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                console.log('=== Make Default button clicked ===')
                                                                console.log('nameEntry.id:', nameEntry.id)
                                                                console.log('nameEntry.is_default:', nameEntry.is_default)
                                                                console.log('nameEntry:', nameEntry)
                                                                handleSetDefault(nameEntry.id)
                                                            }}
                                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${nameEntry.is_default
                                                                ? 'text-gray-400 cursor-not-allowed'
                                                                : 'text-gray-700 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            {nameEntry.is_default ? '✓ Default' : 'Make Default'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                console.log('=== Delete button clicked ===')
                                                                console.log('nameEntry.id:', nameEntry.id)
                                                                handleDelete(nameEntry.id)
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">
                            No names added yet. Add your first name using the form.
                        </p>
                    )}
                </div>
            </div>
        </main>
    )
}