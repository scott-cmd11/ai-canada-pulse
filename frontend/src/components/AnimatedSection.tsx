"use client"

import { useEffect, useRef } from "react"

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number
}

export default function AnimatedSection({ children, className = "", delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    // Apply hidden state imperatively — SSR renders content visible by default
    el.style.opacity = "0"
    el.style.transform = "translateY(18px)"
    el.style.transition = `opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}ms`

    let revealed = false
    const reveal = () => {
      if (revealed) return
      revealed = true
      el.style.opacity = "1"
      el.style.transform = "translateY(0)"
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal()
          observer.disconnect()
        }
      },
      { threshold: 0.05 }
    )
    observer.observe(el)

    // Fallback: reveal after 800ms even if IntersectionObserver doesn't fire
    const fallbackTimer = setTimeout(reveal, 800)

    return () => {
      observer.disconnect()
      clearTimeout(fallbackTimer)
    }
  }, [delay])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
