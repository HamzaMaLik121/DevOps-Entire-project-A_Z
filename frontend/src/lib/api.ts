import axios from 'axios'

export const baseURL =
  typeof window === 'undefined'
    ? process.env.API_GATEWAY_INTERNAL_URL || 'http://api-gateway:8000'
    : '/api'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config
  const raw = localStorage.getItem('anime-threads-store')
  const token = raw ? JSON.parse(raw)?.state?.user?.token : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
