import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useSlidesStore } from '../store/slidesStore'
import { updateSlide, createSlide } from '../api/slides'

const INTERVAL = 30_000

export function useAutoSave(deckId) {
  const user = useAuthStore(s => s.user)
  const slides = useSlidesStore(s => s.slides)
  const slidesRef = useRef(slides)
  const dirtyRef = useRef(false)

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

      for (const slide of current) {
        try {
          await updateSlide(deckId, slide.id, { label: slide.label, elements: slide.elements })
        } catch (err) {
          if (err.response?.status === 404) {
            // Slide doesn't exist on server yet — create it
            try {
              const created = await createSlide(deckId, { label: slide.label, elements: slide.elements })
              // Update local store to use server-assigned ID
              useSlidesStore.getState().updateSlideElements(created.id, slide.elements)
            } catch {
              dirtyRef.current = true
            }
          } else {
            dirtyRef.current = true
          }
        }
      }
    }, INTERVAL)

    return () => clearInterval(interval)
  }, [user, deckId])
}
