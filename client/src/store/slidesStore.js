import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

const makeSlide = (label = 'Slide 1') => ({
  id: uuidv4(),
  label,
  elements: [],
  specVersion: '1.0',
  localUpdatedAt: null,
})

export const useSlidesStore = create(persist(
  (set, get) => ({
    slides: [makeSlide()],
    activeSlideId: null,

    init() {
      const { slides, activeSlideId } = get()
      if (!activeSlideId || !slides.find(s => s.id === activeSlideId)) {
        set({ activeSlideId: slides[0]?.id ?? null })
      }
    },

    getActiveSlide() {
      const { slides, activeSlideId } = get()
      return slides.find(s => s.id === activeSlideId) ?? slides[0] ?? null
    },

    setActiveSlide: (id) => set({ activeSlideId: id }),

    // Returns the new slide so callers can persist it to server
    addSlide() {
      const { slides } = get()
      const slide = makeSlide(`Slide ${slides.length + 1}`)
      set({ slides: [...slides, slide], activeSlideId: slide.id })
      return slide
    },

    // After server creates the slide, swap temp UUID for server UUID
    replaceSlide(tempId, serverSlide) {
      set(s => ({
        slides: s.slides.map(sl =>
          sl.id === tempId
            ? { ...serverSlide, elements: sl.elements, localUpdatedAt: sl.localUpdatedAt }
            : sl
        ),
        activeSlideId: s.activeSlideId === tempId ? serverSlide.id : s.activeSlideId
      }))
    },

    duplicateSlide(id) {
      const { slides } = get()
      const src = slides.find(s => s.id === id)
      if (!src) return null
      const copy = {
        ...src,
        id: uuidv4(),
        label: `${src.label} (copy)`,
        elements: JSON.parse(JSON.stringify(src.elements)),
        localUpdatedAt: null,
      }
      const idx = slides.indexOf(src)
      set({ slides: [...slides.slice(0, idx + 1), copy, ...slides.slice(idx + 1)], activeSlideId: copy.id })
      return copy
    },

    deleteSlide(id) {
      const { slides, activeSlideId } = get()
      if (slides.length <= 1) return
      const idx  = slides.findIndex(s => s.id === id)
      const next = slides.filter(s => s.id !== id)
      set({ slides: next, activeSlideId: activeSlideId === id ? next[Math.max(0, idx - 1)]?.id : activeSlideId })
    },

    renameSlide: (id, label) =>
      set(s => ({ slides: s.slides.map(sl => sl.id === id ? { ...sl, label } : sl) })),

    reorderSlides: (slides) => set({ slides }),

    // Mark the slide as locally modified with a timestamp
    updateSlideElements(slideId, elements) {
      set(s => ({
        slides: s.slides.map(sl =>
          sl.id === slideId
            ? { ...sl, elements, localUpdatedAt: new Date().toISOString() }
            : sl
        )
      }))
    },

    setSlides(slides) {
      set({ slides, activeSlideId: slides[0]?.id ?? null })
    },

    importSlides(incoming) {
      const { slides } = get()
      const imported = incoming.map(s => ({ ...s, id: uuidv4(), localUpdatedAt: null }))
      set({ slides: [...slides, ...imported] })
    }
  }),
  {
    name: 'wb-slides',
    partialize: s => ({ slides: s.slides, activeSlideId: s.activeSlideId })
  }
))
