import type { MouseEvent } from 'react'
import { useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'

export function useHeroAmbient(reduceMotion: boolean | null) {
  const x = useMotionValue(50)
  const y = useMotionValue(42)
  const left = useSpring(x, { stiffness: 36, damping: 22, mass: 0.6 })
  const top = useSpring(y, { stiffness: 36, damping: 22, mass: 0.6 })
  const spotlight = useMotionTemplate`radial-gradient(34rem circle at ${left}% ${top}%, rgba(255,107,0,0.42), transparent 58%)`

  const onMove = (event: MouseEvent<HTMLElement>) => {
    if (reduceMotion) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    x.set(((event.clientX - rect.left) / rect.width) * 100)
    y.set(((event.clientY - rect.top) / rect.height) * 100)
  }

  return { spotlight, onMove }
}
