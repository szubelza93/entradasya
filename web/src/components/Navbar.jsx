import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="site-header">
      <nav className="nav-bar" aria-label="Navegación principal">
        <Link className="brand" to="/" aria-label="EntradasYa, inicio">
          entradas<span>ya</span>
          <i aria-hidden="true">.</i>
        </Link>

        <div className="nav-links">
          <NavLink to="/" end>Descubrir</NavLink>
          {user?.role === 'cliente' && (
            <>
              <NavLink to="/mis-compras">Mis compras</NavLink>
              <NavLink to="/mis-entradas">Mis entradas</NavLink>
            </>
          )}
          {user?.role === 'organizador' && (
            <NavLink to="/organizador/eventos">Mis eventos</NavLink>
          )}
          {user?.role === 'portero' && (
            <NavLink to="/portero">Control de acceso</NavLink>
          )}
        </div>

        <div className="nav-actions">
          <Link className="nav-search" to="/#explorar" aria-label="Buscar eventos">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.5 4.5" />
            </svg>
            <span>Buscar</span>
          </Link>
          {user ? (
            <>
              <span className="nav-user">
                <span className="avatar">{(user.name || user.email || 'U')[0].toUpperCase()}</span>
                <span className="nav-user-name">{user.name || 'Mi cuenta'}</span>
              </span>
              <button className="button button-quiet" onClick={handleLogout}>Salir</button>
            </>
          ) : (
            <>
              <Link className="nav-login" to="/login">Iniciar sesión</Link>
              <Link className="button button-primary nav-register" to="/register">Crear cuenta</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
