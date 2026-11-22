import axios from 'axios'
import toast from 'react-hot-toast'

const axiosClient = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// Adjunta el JWT si existe
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Manejo global de errores
axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || 'Error de conexión'
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    } else {
      toast.error(msg)
    }
    return Promise.reject(err)
  }
)

export default axiosClient