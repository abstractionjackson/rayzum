// Client-side storage utilities for components
// Import and use the storage module directly in client components

import { storage, setDefaultItem, getDatabase, saveDatabase } from './storage'

// Re-export for convenience
export { storage, setDefaultItem, getDatabase, saveDatabase }

// Helper to trigger re-render in components
export const useStorageSync = () => {
  if (typeof window === 'undefined') return null
  
  // Listen for storage changes
  window.addEventListener('storage', (e) => {
    if (e.key === 'rayzum_db') {
      // Trigger a re-render by dispatching a custom event
      window.dispatchEvent(new CustomEvent('rayzum_db_changed'))
    }
  })
  
  return null
}
