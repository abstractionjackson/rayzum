'use client'

import { useState, useEffect } from 'react'
import { storage, setDefaultItem } from '@/lib/storage'

interface PersonalData {
    names: Array<{ id: number; name: string; is_default: boolean; createdAt: string }>
    phones: Array<{ id: number; phone: string; is_default: boolean; createdAt: string }>
    emails: Array<{ id: number; email: string; is_default: boolean; createdAt: string }>
}

interface Props {
    onDataChange: () => void
}

export default function DashboardPersonal({ onDataChange }: Props) {
    const [names, setNames] = useState<PersonalData['names']>([])
    const [phones, setPhones] = useState<PersonalData['phones']>([])
    const [emails, setEmails] = useState<PersonalData['emails']>([])
    const [newName, setNewName] = useState('')
    const [newPhone, setNewPhone] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [openDropdown, setOpenDropdown] = useState<{ type: string; id: number } | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = () => {
        setNames(storage.select('names'))
        setPhones(storage.select('phones'))
        setEmails(storage.select('emails'))
    }

    const handleSubmitName = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName.trim()) return

        const existing = storage.select('names')
        if (existing.some((n: any) => n.name === newName.trim())) {
            alert('This name already exists.')
            return
        }

        storage.insert('names', { name: newName.trim(), is_default: false })
        setNewName('')
        fetchData()
        onDataChange()
    }

    const handleSubmitPhone = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPhone.trim()) return

        const existing = storage.select('phones')
        if (existing.some((p: any) => p.phone === newPhone.trim())) {
            alert('This phone already exists.')
            return
        }

        storage.insert('phones', { phone: newPhone.trim(), is_default: false })
        setNewPhone('')
        fetchData()
        onDataChange()
    }

    const handleSubmitEmail = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail.trim()) return

        const existing = storage.select('emails')
        if (existing.some((e: any) => e.email === newEmail.trim())) {
            alert('This email already exists.')
            return
        }

        storage.insert('emails', { email: newEmail.trim(), is_default: false })
        setNewEmail('')
        fetchData()
        onDataChange()
    }

    const handleSetDefault = (table: string, id: number) => {
        setDefaultItem(table as any, id)
        fetchData()
        onDataChange()
        setOpenDropdown(null)
    }

    const handleDelete = (table: string, id: number) => {
        if (!confirm(`Are you sure you want to delete this ${table.slice(0, -1)}?`)) return
        storage.delete(table as any, id)
        fetchData()
        onDataChange()
        setOpenDropdown(null)
    }

    return (
        <div className="space-y-6">
            {/* Names Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Names</h3>
                <form onSubmit={handleSubmitName} className="mb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter a name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Add
                        </button>
                    </div>
                </form>
                <div className="space-y-2">
                    {names.map((name) => (
                        <div key={name.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <span>{name.name}</span>
                                {name.is_default && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Default</span>
                                )}
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown?.type === 'name' && openDropdown.id === name.id ? null : { type: 'name', id: name.id })}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                </button>
                                {openDropdown?.type === 'name' && openDropdown.id === name.id && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-10">
                                        <button
                                            onClick={() => handleSetDefault('names', name.id)}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${name.is_default ? 'text-gray-400' : ''}`}
                                            disabled={name.is_default}
                                        >
                                            {name.is_default ? '✓ Default' : 'Make Default'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete('names', name.id)}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Phones Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Phone Numbers</h3>
                <form onSubmit={handleSubmitPhone} className="mb-4">
                    <div className="flex gap-2">
                        <input
                            type="tel"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            placeholder="Enter a phone number"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Add
                        </button>
                    </div>
                </form>
                <div className="space-y-2">
                    {phones.map((phone) => (
                        <div key={phone.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <span>{phone.phone}</span>
                                {phone.is_default && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Default</span>
                                )}
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown?.type === 'phone' && openDropdown.id === phone.id ? null : { type: 'phone', id: phone.id })}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                </button>
                                {openDropdown?.type === 'phone' && openDropdown.id === phone.id && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-10">
                                        <button
                                            onClick={() => handleSetDefault('phones', phone.id)}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${phone.is_default ? 'text-gray-400' : ''}`}
                                            disabled={phone.is_default}
                                        >
                                            {phone.is_default ? '✓ Default' : 'Make Default'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete('phones', phone.id)}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Emails Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Email Addresses</h3>
                <form onSubmit={handleSubmitEmail} className="mb-4">
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Enter an email address"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Add
                        </button>
                    </div>
                </form>
                <div className="space-y-2">
                    {emails.map((email) => (
                        <div key={email.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                            <div className="flex items-center gap-2">
                                <span>{email.email}</span>
                                {email.is_default && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Default</span>
                                )}
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown?.type === 'email' && openDropdown.id === email.id ? null : { type: 'email', id: email.id })}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                </button>
                                {openDropdown?.type === 'email' && openDropdown.id === email.id && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-10">
                                        <button
                                            onClick={() => handleSetDefault('emails', email.id)}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${email.is_default ? 'text-gray-400' : ''}`}
                                            disabled={email.is_default}
                                        >
                                            {email.is_default ? '✓ Default' : 'Make Default'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete('emails', email.id)}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
