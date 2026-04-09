import { create } from 'zustand'

export const useHistoryStore = create((set, get) => ({
  // { [slideId]: { past: elements[][], future: elements[][] } }
  history: {},

  push(slideId, elements) {
    set(s => {
      const h = s.history[slideId] || { past: [], future: [] }
      return {
        history: {
          ...s.history,
          [slideId]: { past: [...h.past, elements].slice(-50), future: [] }
        }
      }
    })
  },

  undo(slideId, currentElements) {
    const h = get().history[slideId] || { past: [], future: [] }
    if (!h.past.length) return null
    const past = [...h.past]
    const previous = past.pop()
    set(s => ({
      history: {
        ...s.history,
        [slideId]: { past, future: [currentElements, ...h.future] }
      }
    }))
    return previous
  },

  redo(slideId, currentElements) {
    const h = get().history[slideId] || { past: [], future: [] }
    if (!h.future.length) return null
    const [next, ...future] = h.future
    set(s => ({
      history: {
        ...s.history,
        [slideId]: { past: [...h.past, currentElements], future }
      }
    }))
    return next
  },

  canUndo: (slideId) => (get().history[slideId]?.past.length ?? 0) > 0,
  canRedo: (slideId) => (get().history[slideId]?.future.length ?? 0) > 0
}))
