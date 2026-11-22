import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [enviando, setEnviando] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setEnviando(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Bienvenido, ${user.name}`)
      navigate(user.role === 'organizador' ? '/organizador/eventos'
        : user.role === 'portero' ? '/portero' : '/')
    } catch {
      setEnviando(false)
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <div className="auth-mark" aria-hidden="true">ey<span>•</span></div>
      <span className="eyebrow">QUÉ BUENO TENERTE DE VUELTA</span>
      <h1>Inicia sesión</h1>
      <p className="auth-intro">Entra y sigue descubriendo momentos increíbles.</p>

      <label className="field-label" htmlFor="login-email">Correo electrónico</label>
      <input
        className="form-input"
        id="login-email"
        type="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        required
        value={form.email}
        onChange={event => setForm({ ...form, email: event.target.value })}
      />

      <label className="field-label" htmlFor="login-password">Contraseña</label>
      <input
        className="form-input"
        id="login-password"
        type="password"
        autoComplete="current-password"
        placeholder="Tu contraseña"
        required
        value={form.password}
        onChange={event => setForm({ ...form, password: event.target.value })}
      />

      <button className="button button-primary button-large auth-submit" type="submit" disabled={enviando}>
        {enviando ? 'Ingresando…' : 'Iniciar sesión'}
      </button>
      <p className="auth-switch">¿Aún no tienes cuenta? <Link to="/register">Regístrate gratis</Link></p>
    </form>
  )
}
