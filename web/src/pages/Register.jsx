import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cliente' })
  const [enviando, setEnviando] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    setEnviando(true)
    try {
      const user = await register(form)
      toast.success('Cuenta creada')
      navigate(user.role === 'organizador' ? '/organizador/eventos' : '/')
    } catch {
      setEnviando(false)
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <div className="auth-mark" aria-hidden="true">ey<span>•</span></div>
      <span className="eyebrow">EMPIEZA A VIVIRLO</span>
      <h1>Crea tu cuenta</h1>
      <p className="auth-intro">Un mundo de eventos te está esperando.</p>

      <label className="field-label" htmlFor="register-name">Nombre</label>
      <input
        className="form-input"
        id="register-name"
        autoComplete="name"
        placeholder="Tu nombre"
        required
        value={form.name}
        onChange={event => setForm({ ...form, name: event.target.value })}
      />

      <label className="field-label" htmlFor="register-email">Correo electrónico</label>
      <input
        className="form-input"
        id="register-email"
        type="email"
        autoComplete="email"
        placeholder="tu@correo.com"
        required
        value={form.email}
        onChange={event => setForm({ ...form, email: event.target.value })}
      />

      <label className="field-label" htmlFor="register-password">Contraseña</label>
      <input
        className="form-input"
        id="register-password"
        type="password"
        autoComplete="new-password"
        placeholder="Crea una contraseña"
        required
        value={form.password}
        onChange={event => setForm({ ...form, password: event.target.value })}
      />

      <label className="field-label" htmlFor="register-role">Quiero registrarme como</label>
      <select
        className="form-input"
        id="register-role"
        value={form.role}
        onChange={event => setForm({ ...form, role: event.target.value })}
      >
        <option value="cliente">Cliente</option>
        <option value="organizador">Organizador</option>
        <option value="portero">Portero</option>
      </select>

      <button className="button button-primary button-large auth-submit" type="submit" disabled={enviando}>
        {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
      <p className="auth-switch">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </form>
  )
}
