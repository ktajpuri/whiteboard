import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

const makeSlide = (label = 'Slide 1') => ({
  id: uuidv4(),
  label,
  elements: [],
  specVersion: '1.0'
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

    addSlide() {
      const { slides } = get()
      const slide = makeSlide(`Slide ${slides.length + 1}`)
      set({ slides: [...slides, slide], activeSlideId: slide.id })
      return slide
    },

    duplicateSlide(id) {
      const { slides } = get()
      const src = slides.find(s => s.id === id)
      if (!src) return
      const copy = { ...src, id: uuidv4(), label: `${src.label} (copy)`, elements: JSON.parse(JSON.stringify(src.elements)) }
      const idx = slides.indexOf(src)
      set({ slides: [...slides.slice(0, idx + 1), copy, ...slides.slice(idx + 1)], activeSlideId: copy.id })
    },

    deleteSlide(id) {
      const { slides, activeSlideId } = get()
      if (slides.length <= 1) return
      const idx = slides.findIndex(s => s.id === id)
      const next = slides.filter(s => s.id !== id)
      set({ slides: next, activeSlideId: activeSlideId === id ? next[Math.max(0, idx - 1)]?.id : activeSlideId })
    },

    renameSlide: (id, label) =>
      set(s => ({ slides: s.slides.map(sl => sl.id === id ? { ...sl, label } : sl) })),

    reorderSlides: (slides) => set({ slides }),

    updateSlideElements(slideId, elements) {
      set(s => ({ slides: s.slides.map(sl => sl.id === slideId ? { ...sl, elements } : sl) }))
    },

    setSlides(slides) {
      set({ slides, activeSlideId: slides[0]?.id ?? null })
    },

    importSlides(incoming) {
      const { slides } = get()
      const imported = incoming.map(s => ({ ...s, id: uuidv4() }))
      set({ slides: [...slides, ...imported] })
    }
  }),
  {
    name: 'wb-slides',
    partialize: s => ({ slides: s.slides, activeSlideId: s.activeSlideId })
  }
))
