import axios from 'axios'

export const baseURL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8000'

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
