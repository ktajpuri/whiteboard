import api from './client'

export const register = (email, password, displayName) =>
  api.post('/auth/register', { email, password, displayName }).then(r => r.data)

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data)

export const logout = () => api.post('/auth/logout')

export const getMe = () => api.get('/auth/me').then(r => r.data)

export const googleLogin = () => {
  const base = import.meta.env.VITE_API_URL || ''
  window.location.href = `${base}/auth/google`
}
