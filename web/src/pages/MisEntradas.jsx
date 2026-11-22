import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosClient from '../api/axiosClient'

export default function MisEntradas() {
  const [tickets, setTickets] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    axiosClient.get('/tickets/my')
      .then(response => setTickets(response.data.data || []))
      .catch(() => setTickets([]))
      .finally(() => setCargando(false))
  }, [])

  const descargar = async (ticket) => {
    const { data } = await axiosClient.get(`/tickets/${ticket.id}/download`, {
      responseType: 'blob'
    })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = `${ticket.code}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <span className="eyebrow">TUS PRÓXIMAS EXPERIENCIAS</span>
        <h1>Mis entradas<span>.</span></h1>
        <p>Ten tus accesos listos para el gran día.</p>
      </div>

      {cargando ? (
        <div className="ticket-grid">
          {[1, 2].map(item => <div className="event-skeleton ticket-skeleton" key={item} />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state dashboard-empty">
          <span className="empty-icon" aria-hidden="true">⌑</span>
          <h2>Aún no tienes entradas</h2>
          <p>Compra tus entradas y aparecerán aquí listas para descargar.</p>
          <Link className="button button-primary" to="/">Encontrar un evento</Link>
        </div>
      ) : (
        <div className="ticket-grid">
          {tickets.map(ticket => (
            <article className="ticket-card" key={ticket.id}>
              <div className="ticket-card-top">
                <span className="ticket-symbol" aria-hidden="true">EY</span>
                <span className={`status-pill status-${ticket.status}`}>{ticket.status}</span>
              </div>
              <span className="eyebrow">ENTRADA DIGITAL</span>
              <h2>{ticket.eventName}</h2>
              <p className="event-location"><span aria-hidden="true">⌖</span> {ticket.eventPlace}</p>
              <div className="ticket-details">
                <span><small>SECTOR</small><b>{ticket.sectorName}</b></span>
                <span><small>FECHA</small><b>{new Date(ticket.eventDate).toLocaleDateString('es-BO')}</b></span>
              </div>
              <div className="ticket-code">
                <small>CÓDIGO DE ACCESO</small>
                <code>{ticket.code}</code>
              </div>
              <button className="button button-primary ticket-download" onClick={() => descargar(ticket)}>
                Descargar PDF <span aria-hidden="true">↓</span>
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
