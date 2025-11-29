'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { storage, setDefaultItem } from '@/lib/storage'

export default function PersonalPage() {
    const [names, setNames] = useState<Array<{ id: number; name: string; createdAt: string; is_default: boolean }>>([])
    const [phones, setPhones] = useState<Array<{ id: number; phone: string; createdAt: string; is_default: boolean }>>([])
    const [emails, setEmails] = useState<Array<{ id: number; email: string; createdAt: string; is_default: boolean }>>([])
    const [newName, setNewName] = useState('')
    const [newPhone, setNewPhone] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [openDropdown, setOpenDropdown] = useState<number | null>(null)
    const [openPhoneDropdown, setOpenPhoneDropdown] = useState<number | null>(null)
    const [openEmailDropdown, setOpenEmailDropdown] = useState<number | null>(null)

    // Fetch names, phones, and emails when component mounts
    useEffect(() => {
        fetchNames()
        fetchPhones()
        fetchEmails()
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdown !== null || openPhoneDropdown !== null || openEmailDropdown !== null) {
                const target = event.target as HTMLElement
                // Don't close if clicking inside a dropdown
                if (!target.closest('.dropdown-menu')) {
                    setOpenDropdown(null)
                    setOpenPhoneDropdown(null)
                    setOpenEmailDropdown(null)
                }
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [openDropdown, openPhoneDropdown, openEmailDropdown])

    const fetchNames = async () => {
        try {
            const data = storage.select('names')
            setNames(data)
        } catch (error) {
            console.error('Error fetching names:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchPhones = async () => {
        try {
            const data = storage.select('phones')
            setPhones(data)
        } catch (error) {
            console.error('Error fetching phones:', error)
        }
    }

    const fetchEmails = async () => {
        try {
            const data = storage.select('emails')
            setEmails(data)
        } catch (error) {
            console.error('Error fetching emails:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName.trim()) return

        setIsSubmitting(true)
        try {
            // Check for duplicates
            const existing = storage.select('names')
            if (existing.some((n: any) => n.name === newName.trim())) {
                alert('This name already exists. Please enter a different name.')
                return
            }

            // Insert the new name
            storage.insert('names', { name: newName.trim(), is_default: false })
            setNewName('')
            await fetchNames() // Refresh the list
        } catch (error) {
            console.error('Error adding name:', error)
            alert('Error adding name. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPhone.trim()) return

        setIsSubmitting(true)
        try {
            // Check for duplicates
            const existing = storage.select('phones')
            if (existing.some((p: any) => p.phone === newPhone.trim())) {
                alert('This phone already exists. Please enter a different phone.')
                return
            }

            // Insert the new phone
            storage.insert('phones', { phone: newPhone.trim(), is_default: false })
            setNewPhone('')
            await fetchPhones() // Refresh the list
        } catch (error) {
            console.error('Error adding phone:', error)
            alert('Error adding phone. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail.trim()) return

        setIsSubmitting(true)
        try {
            // Check for duplicates
            const existing = storage.select('emails')
            if (existing.some((em: any) => em.email === newEmail.trim())) {
                alert('This email already exists. Please enter a different email.')
                return
            }

            // Insert the new email
            storage.insert('emails', { email: newEmail.trim(), is_default: false })
            setNewEmail('')
            await fetchEmails() // Refresh the list
        } catch (error) {
            console.error('Error adding email:', error)
            alert('Error adding email. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSetDefault = async (id: number) => {
        try {
            setDefaultItem('names', id)
            await fetchNames() // Refresh the list
            setOpenDropdown(null) // Close dropdown
        } catch (error) {
            console.error('Error setting default name:', error)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this name?')) {
            return
        }

        try {
            storage.delete('names', id)
            await fetchNames() // Refresh the list
            setOpenDropdown(null) // Close dropdown
        } catch (error) {
            console.error('Error deleting name:', error)
        }
    }

    const handleSetPhoneDefault = async (id: number) => {
        try {
            setDefaultItem('phones', id)
            await fetchPhones() // Refresh the list
            setOpenPhoneDropdown(null) // Close dropdown
        } catch (error) {
            console.error('Error setting default phone:', error)
        }
    }

    const handleDeletePhone = async (id: number) => {
        if (!confirm('Are you sure you want to delete this phone?')) {
            return
        }

        try {
            storage.delete('phones', id)
            await fetchPhones() // Refresh the list
            setOpenPhoneDropdown(null) // Close dropdown
        } catch (error) {
            console.error('Error deleting phone:', error)
        }
    }

    const handleSetEmailDefault = async (id: number) => {
        try {
            setDefaultItem('emails', id)
            await fetchEmails() // Refresh the list
            setOpenEmailDropdown(null) // Close dropdown
        } catch (error) {
            console.error('Error setting default email:', error)
        }
    }

    const handleDeleteEmail = async (id: number) => {
        if (!confirm('Are you sure you want to delete this email?')) {
            return
        }

        try {
            storage.delete('emails', id)
            await fetchEmails() // Refresh the list
            setOpenEmailDropdown(null) // Close dropdown
        } catch (error) {
            console.error('Error deleting email:', error)
        }
    }

    const toggleDropdown = (id: number) => {
        console.log('toggleDropdown called for ID:', id)
        setOpenDropdown(openDropdown === id ? null : id)
    }

    const togglePhoneDropdown = (id: number) => {
        console.log('togglePhoneDropdown called for ID:', id)
        setOpenPhoneDropdown(openPhoneDropdown === id ? null : id)
    }

    const toggleEmailDropdown = (id: number) => {
        console.log('toggleEmailDropdown called for ID:', id)
        setOpenEmailDropdown(openEmailDropdown === id ? null : id)
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

                {/* Phone Form */}
                <div className="bg-white rounded-lg shadow-md p-6 border">
                    <h2 className="text-xl font-semibold mb-4">Add Phone</h2>
                    <form onSubmit={handlePhoneSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., +1 (555) 123-4567"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !newPhone.trim()}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Adding...' : 'Add'}
                        </button>
                    </form>
                </div>

                {/* Phones List */}
                <div className="bg-white rounded-lg shadow-md p-6 border">
                    <h2 className="text-xl font-semibold mb-4">Saved Phones</h2>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : phones.length > 0 ? (
                        <div className="space-y-2">
                            {phones.map((phoneEntry) => (
                                <div
                                    key={phoneEntry.id}
                                    className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="font-medium">{phoneEntry.phone}</span>
                                        {phoneEntry.is_default && (
                                            <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-200 rounded-full">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm text-gray-500">
                                            {new Date(phoneEntry.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="relative">
                                            <button
                                                onClick={() => togglePhoneDropdown(phoneEntry.id)}
                                                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                                                aria-label="More options"
                                            >
                                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </button>
                                            {openPhoneDropdown === phoneEntry.id && (
                                                <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleSetPhoneDefault(phoneEntry.id)
                                                            }}
                                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${phoneEntry.is_default
                                                                ? 'text-gray-400 cursor-not-allowed'
                                                                : 'text-gray-700 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            {phoneEntry.is_default ? '✓ Default' : 'Make Default'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeletePhone(phoneEntry.id)
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
                            No phones added yet. Add your first phone using the form.
                        </p>
                    )}
                </div>

                {/* Email Form */}
                <div className="bg-white rounded-lg shadow-md p-6 border">
                    <h2 className="text-xl font-semibold mb-4">Add Email</h2>
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., john.doe@example.com"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || !newEmail.trim()}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Adding...' : 'Add'}
                        </button>
                    </form>
                </div>

                {/* Emails List */}
                <div className="bg-white rounded-lg shadow-md p-6 border">
                    <h2 className="text-xl font-semibold mb-4">Saved Emails</h2>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : emails.length > 0 ? (
                        <div className="space-y-2">
                            {emails.map((emailEntry) => (
                                <div
                                    key={emailEntry.id}
                                    className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="font-medium">{emailEntry.email}</span>
                                        {emailEntry.is_default && (
                                            <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-200 rounded-full">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm text-gray-500">
                                            {new Date(emailEntry.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="relative">
                                            <button
                                                onClick={() => toggleEmailDropdown(emailEntry.id)}
                                                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                                                aria-label="More options"
                                            >
                                                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </button>
                                            {openEmailDropdown === emailEntry.id && (
                                                <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleSetEmailDefault(emailEntry.id)
                                                            }}
                                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${emailEntry.is_default
                                                                ? 'text-gray-400 cursor-not-allowed'
                                                                : 'text-gray-700 hover:bg-gray-100'
                                                                }`}
                                                        >
                                                            {emailEntry.is_default ? '✓ Default' : 'Make Default'}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteEmail(emailEntry.id)
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
                            No emails added yet. Add your first email using the form.
                        </p>
                    )}
                </div>
            </div>

            {/* Next Step Button */}
            <div className="max-w-4xl mx-auto mt-8 flex justify-end">
                <Link
                    href="/dashboard/experience"
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                    Next: Manage Experience →
                </Link>
            </div>
        </main>
    )
}