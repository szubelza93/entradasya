import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axiosClient from '../api/axiosClient'

export default function MisCompras() {
  const [ordenes, setOrdenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [params] = useSearchParams()
  const ordenId = params.get('orden')

  useEffect(() => {
    axiosClient.get('/ordenes/mias')
      .then(response => setOrdenes(response.data || []))
      .catch(() => setOrdenes([]))
      .finally(() => setCargando(false))
  }, [])

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <span className="eyebrow">TU ACTIVIDAD</span>
        <h1>Mis compras<span>.</span></h1>
        <p>Todo lo que ya estás esperando vivir.</p>
      </div>

      {cargando ? (
        <div className="dashboard-list">
          {[1, 2].map(item => <div className="event-skeleton order-skeleton" key={item} />)}
        </div>
      ) : ordenes.length === 0 ? (
        <div className="empty-state dashboard-empty">
          <span className="empty-icon" aria-hidden="true">✦</span>
          <h2>Tu próxima aventura empieza aquí</h2>
          <p>Cuando compres una entrada, encontrarás tu compra en este espacio.</p>
          <Link className="button button-primary" to="/">Explorar eventos</Link>
        </div>
      ) : (
        <div className="dashboard-list">
          {ordenes.map(order => (
            <article
              className={`order-card${ordenId === String(order.id) ? ' highlighted' : ''}`}
              key={order.id}
            >
              <div className="order-card-icon" aria-hidden="true">✦</div>
              <div className="order-card-main">
                <span className="eyebrow">ORDEN #{order.id}</span>
                <h2>Evento #{order.event_id}</h2>
                <p>Sector #{order.sector_id} <span>·</span> {order.quantity} {order.quantity === 1 ? 'entrada' : 'entradas'}</p>
              </div>
              <div className="order-card-total">
                <small>TOTAL</small>
                <b>Bs. {Number(order.total_amount).toFixed(2)}</b>
              </div>
              <span className={`status-pill status-${order.status}`}>{order.status}</span>
              {order.status === 'pagada' && (
                <Link className="button button-secondary order-ticket-link" to="/mis-entradas">
                  Ver entradas <span aria-hidden="true">↗</span>
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
