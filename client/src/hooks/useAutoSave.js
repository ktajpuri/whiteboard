import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useSlidesStore } from '../store/slidesStore'
import { updateSlide } from '../api/slides'

const INTERVAL = 30_000

export function useAutoSave(deckId) {
  const user = useAuthStore(s => s.user)
  const slides = useSlidesStore(s => s.slides)
  const slidesRef = useRef(slides)
  const dirtyRef = useRef(false)

  // Track when slides change
  useEffect(() => {
    slidesRef.current = slides
    dirtyRef.current = true
  }, [slides])

  useEffect(() => {
    if (!user || !deckId) return

    const interval = setInterval(async () => {
      if (!dirtyRef.current) return
      dirtyRef.current = false
      const current = slidesRef.current
      try {
        await Promise.all(current.map(slide =>
          updateSlide(deckId, slide.id, {
            label: slide.label,
            elements: slide.elements
          }).catch(() => { dirtyRef.current = true })
        ))
      } catch { dirtyRef.current = true }
    }, INTERVAL)

    return () => clearInterval(interval)
  }, [user, deckId])
}
