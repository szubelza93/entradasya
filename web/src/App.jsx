import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Cartelera from './pages/Cartelera'
import EventoDetalle from './pages/EventoDetalle'
import MisCompras from './pages/MisCompras'
import MisEntradas from './pages/MisEntradas'
import OrganizadorEventos from './pages/OrganizadorEventos'
import OrganizadorEventoForm from './pages/OrganizadorEventoForm'
import OrganizadorVentas from './pages/OrganizadorVentas'
import PorteroEscaner from './pages/PorteroEscaner'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Toaster position="top-right" />
        <main className="page-shell">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Cliente */}
            <Route path="/" element={<Cartelera />} />
            <Route path="/eventos/:id" element={<EventoDetalle />} />
            <Route path="/mis-compras" element={
              <ProtectedRoute roles={['cliente']}><MisCompras /></ProtectedRoute>
            } />
            <Route path="/mis-entradas" element={
              <ProtectedRoute roles={['cliente']}><MisEntradas /></ProtectedRoute>
            } />

            {/* Organizador */}
            <Route path="/organizador/eventos" element={
              <ProtectedRoute roles={['organizador']}><OrganizadorEventos /></ProtectedRoute>
            } />
            <Route path="/organizador/eventos/nuevo" element={
              <ProtectedRoute roles={['organizador']}><OrganizadorEventoForm /></ProtectedRoute>
            } />
            <Route path="/organizador/eventos/:id/editar" element={
              <ProtectedRoute roles={['organizador']}><OrganizadorEventoForm /></ProtectedRoute>
            } />
            <Route path="/organizador/eventos/:id/ventas" element={
              <ProtectedRoute roles={['organizador']}><OrganizadorVentas /></ProtectedRoute>
            } />

            {/* Portero */}
            <Route path="/portero" element={
              <ProtectedRoute roles={['portero']}><PorteroEscaner /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="site-footer">
          <Link className="brand" to="/">
            entradas<span>ya</span><i aria-hidden="true">.</i>
          </Link>
          <span>Tu próximo recuerdo empieza aquí.</span>
          <span className="footer-copy">© {new Date().getFullYear()} EntradasYa</span>
        </footer>
      </BrowserRouter>
    </AuthProvider>
  )
}