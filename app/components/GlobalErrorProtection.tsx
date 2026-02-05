'use client'

import { useEffect } from 'react'

/**
 * Global error boundary and environment protection
 * This component runs on every page to catch and prevent common errors
 */
export default function GlobalErrorProtection() {
  useEffect(() => {
    // Protect against undefined process.env access
    if (typeof window !== 'undefined') {
      // Create a safe process.env proxy if it doesn't exist
      if (typeof (window as any).process === 'undefined') {
        (window as any).process = {
          env: {
            NODE_ENV: 'production',
            NEXT_PUBLIC_SITE_NAME: 'Grid World',
            NEXT_PUBLIC_APP_URL: window.location.origin,
          }
        }
      } else if (!(window as any).process.env) {
        (window as any).process.env = {
          NODE_ENV: 'production',
          NEXT_PUBLIC_SITE_NAME: 'Grid World',
          NEXT_PUBLIC_APP_URL: window.location.origin,
        }
      }

      // Add missing environment variables with defaults
      const defaults: Record<string, string> = {
        NEXT_PUBLIC_SITE_NAME: 'Grid World',
        NEXT_PUBLIC_APP_URL: window.location.origin,
        NEXT_PUBLIC_CONTACT_EMAIL: 'contact@gridworld.com',
      }

      Object.entries(defaults).forEach(([key, value]) => {
        if (!(window as any).process.env[key]) {
          (window as any).process.env[key] = value
        }
      })

      console.log('✅ Global error protection initialized')
    }
  }, [])

  return null
}
