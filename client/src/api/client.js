import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true
})

// Offline queue: buffer non-GET requests when offline
let offlineQueue = []

window.addEventListener('online', flushQueue)

async function flushQueue() {
  const queued = [...offlineQueue]
  offlineQueue = []
  for (const config of queued) {
    try { await api.request(config) } catch { /* best effort */ }
  }
}

api.interceptors.request.use(config => {
  if (!navigator.onLine && config.method !== 'get') {
    offlineQueue.push(config)
    return Promise.reject(Object.assign(new Error('offline'), { offline: true }))
  }
  return config
})

export default api
