import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import { useAuth } from '../auth/AuthContext'
import toast from 'react-hot-toast'

const formatDate = (value) => new Intl.DateTimeFormat('es-BO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value))

export default function EventoDetalle() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [evento, setEvento] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [sectorId, setSectorId] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [cardNumber, setCardNumber] = useState('')
  const [comprando, setComprando] = useState(false)

  useEffect(() => {
    setCargando(true)
    axiosClient.get(`/eventos/${id}`)
      .then(response => {
        const event = response.data.data
        setEvento(event)
        if (event.sectores?.length) setSectorId(event.sectores[0].id)
      })
      .catch(() => setEvento(null))
      .finally(() => setCargando(false))
  }, [id])

  const comprar = async () => {
    if (!user) return navigate('/login')
    if (comprando) return

    setComprando(true)
    try {
      const { data } = await axiosClient.post('/ordenes', {
        eventId: id,
        sectorId,
        quantity: cantidad,
        cardNumber
      })
      if (!data.ticketsGenerated) {
        toast.error(data.message)
      } else {
        toast.success('Compra exitosa. Tus entradas están disponibles.')
      }
      if (data.ticketsGenerated && !data.emailSent) {
        toast.error('No se pudo enviar el correo; consulta tus entradas en la web.')
      }
      navigate(`/mis-compras?orden=${data.order.id}`)
    } catch {
      setComprando(false)
    }
  }

  if (cargando) {
    return (
      <div className="detail-loading">
        <div className="event-skeleton detail-skeleton" />
        <div className="detail-skeleton-line" />
        <div className="detail-skeleton-line short" />
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="empty-state page-empty">
        <span className="empty-icon" aria-hidden="true">✦</span>
        <h2>No encontramos este evento</h2>
        <p>Puede que ya no esté disponible. Explora otros planes en la cartelera.</p>
        <Link className="button button-primary" to="/">Volver a la cartelera</Link>
      </div>
    )
  }

  const sector = evento.sectores?.find(item => item.id === sectorId)
  const total = sector ? Number(sector.precio) * cantidad : 0
  const cantidadValida = Number.isInteger(cantidad) && cantidad > 0 && cantidad <= 6

  return (
    <div className="event-detail-page">
      <Link className="back-link" to="/"><span aria-hidden="true">←</span> Volver a descubrir</Link>

      <section className={`detail-hero${evento.imagenUrl ? ' has-image' : ''}`}>
        {evento.imagenUrl && <img src={evento.imagenUrl} alt="" />}
        <div className="detail-hero-shade" />
        <div className="detail-hero-copy">
          <span className="eyebrow"><span className="live-dot" /> Experiencia en vivo</span>
          <h1>{evento.nombre}</h1>
          <div className="detail-hero-meta">
            <span><b aria-hidden="true">◷</b> {formatDate(evento.fecha)}</span>
            <span><b aria-hidden="true">⌖</b> {evento.lugar}</span>
          </div>
        </div>
      </section>

      <div className="detail-layout">
        <section className="detail-information">
          <div className="content-panel">
            <span className="eyebrow">SOBRE EL EVENTO</span>
            <h2>Una experiencia que se queda contigo.</h2>
            <p className="detail-description">
              {evento.descripcion || 'Prepárate para vivir un momento inolvidable. Asegura tus entradas y acompáñanos.'}
            </p>
          </div>

          <div className="content-panel">
            <span className="eyebrow">ELIGE TU LUGAR</span>
            <h2>Selecciona un sector</h2>
            {evento.sectores?.length ? (
              <div className="sector-list">
                {evento.sectores.map(item => (
                  <label className={`sector-option${sectorId === item.id ? ' selected' : ''}`} key={item.id}>
                    <input
                      type="radio"
                      name="sector"
                      value={item.id}
                      checked={sectorId === item.id}
                      onChange={() => setSectorId(item.id)}
                    />
                    <span className="sector-radio" />
                    <span className="sector-copy">
                      <b>{item.nombre}</b>
                      <small>Cupo total: {item.cupo}</small>
                    </span>
                    <span className="sector-price">Bs. {Number(item.precio).toFixed(2)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="muted-copy">No hay sectores disponibles para este evento.</p>
            )}
          </div>
        </section>

        <aside className="purchase-card">
          <div className="purchase-card-heading">
            <span className="eyebrow">ASEGURA TU LUGAR</span>
            <h2>Tu entrada empieza aquí.</h2>
            <p>Elige la cantidad y confirma tu compra.</p>
          </div>

          <label className="field-label" htmlFor="ticket-quantity">Cantidad de entradas</label>
          <div className="quantity-control">
            <button type="button" aria-label="Quitar una entrada" disabled={cantidad <= 1} onClick={() => setCantidad(current => Math.max(1, current - 1))}>−</button>
            <input
              id="ticket-quantity"
              type="number"
              min="1"
              max={Math.min(6, sector?.cupo || 6)}
              step="1"
              value={cantidad}
              onChange={event => setCantidad(Number(event.target.value))}
            />
            <button type="button" aria-label="Agregar una entrada" disabled={cantidad >= 6 || cantidad >= (sector?.cupo || 0)} onClick={() => setCantidad(current => Math.min(6, current + 1))}>+</button>
          </div>

          <label className="field-label" htmlFor="card-number">Tarjeta de prueba</label>
          <input
            className="form-input"
            id="card-number"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="Número de tarjeta"
            maxLength={19}
            value={cardNumber}
            onChange={event => setCardNumber(event.target.value.replace(/\D/g, ''))}
          />
          <p className="field-hint">En esta simulación, una tarjeta terminada en 0000 será rechazada.</p>

          <div className="purchase-total">
            <span>Total de la compra</span>
            <strong>Bs. {total.toFixed(2)}</strong>
          </div>
          <button
            className="button button-primary button-large purchase-submit"
            onClick={comprar}
            disabled={comprando || !sector || !cantidadValida || cantidad > sector.cupo || cardNumber.length < 12}
          >
            {comprando ? 'Procesando compra…' : 'Confirmar compra'}
            {!comprando && <span aria-hidden="true">↗</span>}
          </button>
          <p className="secure-note"><span aria-hidden="true">✓</span> Pago de prueba seguro · Entradas digitales</p>
        </aside>
      </div>
    </div>
  )
}
