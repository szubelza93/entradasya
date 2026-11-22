import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosClient from '../api/axiosClient'

export default function OrganizadorEventos() {
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarEventos = () => axiosClient.get('/eventos/mine')
    .then(response => setEventos(response.data.data || []))

  useEffect(() => {
    cargarEventos()
      .catch(() => setEventos([]))
      .finally(() => setCargando(false))
  }, [])

  const publicar = async (id) => {
    await axiosClient.post(`/eventos/${id}/publish`)
    await cargarEventos()
  }

  const cancelar = async (id) => {
    if (!window.confirm('¿Cancelar este evento?')) return
    await axiosClient.post(`/eventos/${id}/cancel`)
    await cargarEventos()
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading page-heading-row">
        <div>
          <span className="eyebrow">PANEL DE ORGANIZADOR</span>
          <h1>Mis eventos<span>.</span></h1>
          <p>Administra tus experiencias desde un solo lugar.</p>
        </div>
        <Link className="button button-primary" to="/organizador/eventos/nuevo">
          <span aria-hidden="true">＋</span> Crear evento
        </Link>
      </div>

      {cargando ? (
        <div className="dashboard-list">
          {[1, 2].map(item => <div className="event-skeleton order-skeleton" key={item} />)}
        </div>
      ) : eventos.length === 0 ? (
        <div className="empty-state dashboard-empty">
          <span className="empty-icon" aria-hidden="true">✦</span>
          <h2>Tu escenario está esperando</h2>
          <p>Crea tu primer evento y compártelo con toda la comunidad.</p>
          <Link className="button button-primary" to="/organizador/eventos/nuevo">Crear mi primer evento</Link>
        </div>
      ) : (
        <div className="dashboard-list">
          {eventos.map(event => (
            <article className="organizer-event-card" key={event.id}>
              <div className="organizer-event-image">
                {event.imagenUrl
                  ? <img src={event.imagenUrl} alt="" />
                  : <span aria-hidden="true">EY</span>}
              </div>
              <div className="organizer-event-info">
                <span className={`status-pill status-${event.estado}`}>{event.estado}</span>
                <h2>{event.nombre}</h2>
                <p><span aria-hidden="true">◷</span> {new Date(event.fecha).toLocaleString('es-BO')}</p>
                <p><span aria-hidden="true">⌖</span> {event.lugar}</p>
              </div>
              <div className="organizer-event-actions">
                {event.estado === 'borrador' && (
                  <>
                    <Link className="button button-secondary" to={`/organizador/eventos/${event.id}/editar`}>Editar</Link>
                    <button className="button button-primary" type="button" onClick={() => publicar(event.id).catch(() => {})}>Publicar</button>
                  </>
                )}
                {event.estado !== 'cancelado' && (
                  <button className="button button-quiet" type="button" onClick={() => cancelar(event.id).catch(() => {})}>Cancelar</button>
                )}
                <Link className="text-link" to={`/organizador/eventos/${event.id}/ventas`}>Ver ventas <span aria-hidden="true">↗</span></Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
