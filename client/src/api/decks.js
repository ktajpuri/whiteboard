import api from './client'

export const listDecks = () => api.get('/api/decks').then(r => r.data)
export const createDeck = (title) => api.post('/api/decks', { title }).then(r => r.data)
export const getDeck = (id) => api.get(`/api/decks/${id}`).then(r => r.data)
export const updateDeck = (id, data) => api.patch(`/api/decks/${id}`, data).then(r => r.data)
export const deleteDeck = (id) => api.delete(`/api/decks/${id}`)
