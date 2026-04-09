import api from './client'

export const getSlides = (deckId) => api.get(`/api/decks/${deckId}/slides`).then(r => r.data)
export const createSlide = (deckId, data) => api.post(`/api/decks/${deckId}/slides`, data).then(r => r.data)
export const updateSlide = (deckId, slideId, data) => api.put(`/api/decks/${deckId}/slides/${slideId}`, data).then(r => r.data)
export const deleteSlide = (deckId, slideId) => api.delete(`/api/decks/${deckId}/slides/${slideId}`)
export const reorderSlides = (deckId, order) => api.post(`/api/decks/${deckId}/slides/reorder`, { order })
