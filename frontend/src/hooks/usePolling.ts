"use client"

import { useState, useEffect, useCallback, useRef } from "react"

/**
 * Hook for auto-polling an API endpoint at a configurable interval.
 * Fetches immediately on mount, then every `intervalMs` milliseconds.
 * Pauses when the tab is hidden to save bandwidth.
 */
export function usePolling<T>(
    url: string,
    opts: {
        intervalMs?: number
        transform?: (json: Record<string, unknown>) => T | null
    } = {}
) {
    const { intervalMs = 120_000, transform } = opts  // Default: 2 minutes
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)
    const mountedRef = useRef(true)

    const doFetch = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true)
            const res = await fetch(url)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const json = await res.json()
            if (!mountedRef.current) return

            const value = transform ? transform(json) : (json as T)
            if (value !== null) {
                setData(value)
                setLastUpdated(new Date().toLocaleTimeString())
            }
        } catch (err) {
            console.warn(`[usePolling] ${url} failed:`, err)
        } finally {
            if (mountedRef.current) setLoading(false)
        }
    }, [url, transform])

    useEffect(() => {
        mountedRef.current = true
        doFetch(true)

        const id = setInterval(() => {
            // Only poll when tab is visible
            if (!document.hidden) {
                doFetch()
            }
        }, intervalMs)

        // Also refetch when tab becomes visible after being hidden
        const onVisibility = () => {
            if (!document.hidden) doFetch()
        }
        document.addEventListener("visibilitychange", onVisibility)

        return () => {
            mountedRef.current = false
            clearInterval(id)
            document.removeEventListener("visibilitychange", onVisibility)
        }
    }, [doFetch, intervalMs])

    return { data, loading, lastUpdated }
}
