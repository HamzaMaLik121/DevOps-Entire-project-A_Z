import axios from 'axios'

const baseURL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000'

console.log('[api] using gateway:', baseURL)

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('anime-threads-store')
  const token = raw ? JSON.parse(raw)?.state?.user?.token : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[api] response error:', err.config?.method?.toUpperCase(), err.config?.url, err.message)
    return Promise.reject(err)
  }
)

export default api
