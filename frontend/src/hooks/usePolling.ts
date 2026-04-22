"use client"

import { useState, useEffect, useCallback, useRef } from "react"

/**
 * Hook for auto-polling an API endpoint at a configurable interval.
 * Fetches immediately on mount, then every `intervalMs` milliseconds.
 * Pauses when the tab is hidden to save bandwidth.
 *
 * Optional fallback: if the primary fetch returns empty data (per `isEmpty`),
 * and `fallbackUrl` is provided, a second fetch from `fallbackUrl` is made.
 * The `isFallback` return value indicates whether fallback data is being shown.
 */
export function usePolling<T>(
    url: string,
    opts: {
        intervalMs?: number
        transform?: (json: Record<string, unknown>) => T | null
        fallbackUrl?: string
        isEmpty?: (data: T) => boolean
        /**
         * Seed value rendered immediately on mount. Use when the parent server
         * component has already fetched the data so the first paint is not blank.
         * Client polling still runs normally to keep the view fresh.
         */
        initialData?: T | null
    } = {}
) {
    const { intervalMs = 120_000, transform, fallbackUrl, isEmpty, initialData } = opts  // Default: 2 minutes
    const [data, setData] = useState<T | null>(initialData ?? null)
    const [loading, setLoading] = useState(initialData == null)
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)
    const [isFallback, setIsFallback] = useState(false)
    const mountedRef = useRef(true)

    const defaultIsEmpty = useCallback((d: T): boolean => {
        return Array.isArray(d) && (d as unknown[]).length === 0
    }, [])

    const doFetch = useCallback(async (isInitial = false) => {
        const checkEmpty = isEmpty ?? defaultIsEmpty
        try {
            if (isInitial) setLoading(true)
            const controller = new AbortController()
            const timer = setTimeout(() => controller.abort(), 15_000) // 15s client-side timeout
            let res: Response
            try {
                res = await fetch(url, { signal: controller.signal })
            } finally {
                clearTimeout(timer)
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const json = await res.json()
            if (!mountedRef.current) return

            const value = transform ? transform(json) : (json as T)
            if (value !== null) {
                if (fallbackUrl && checkEmpty(value)) {
                    // Primary returned empty — try fallback
                    try {
                        const fbRes = await fetch(fallbackUrl)
                        if (!fbRes.ok) throw new Error(`HTTP ${fbRes.status}`)
                        const fbJson = await fbRes.json()
                        if (!mountedRef.current) return
                        const fbValue = transform ? transform(fbJson) : (fbJson as T)
                        if (fbValue !== null) {
                            setData(fbValue)
                            setLastUpdated(new Date().toLocaleTimeString())
                            setIsFallback(true)
                        }
                    } catch (fbErr) {
                        console.warn(`[usePolling] fallback ${fallbackUrl} failed:`, fbErr)
                        // Still set original (empty) data so callers are not stuck loading
                        setData(value)
                        setLastUpdated(new Date().toLocaleTimeString())
                        setIsFallback(false)
                    }
                } else {
                    setData(value)
                    setLastUpdated(new Date().toLocaleTimeString())
                    setIsFallback(false)
                }
            }
        } catch (err) {
            console.warn(`[usePolling] ${url} failed:`, err)
        } finally {
            if (mountedRef.current) setLoading(false)
        }
    }, [url, transform, fallbackUrl, isEmpty, defaultIsEmpty])

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

    return { data, loading, lastUpdated, isFallback }
}
