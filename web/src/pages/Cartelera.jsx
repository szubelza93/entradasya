import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosClient from '../api/axiosClient'

const formatDate = (value, options = {}) => new Intl.DateTimeFormat('es-BO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  ...options
}).format(new Date(value))

const lowestPrice = (event) => {
  const prices = (event.sectores || [])
    .map(sector => Number(sector.precio))
    .filter(price => Number.isFinite(price))
  return prices.length ? Math.min(...prices) : null
}

export default function Cartelera() {
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)
  const [query, setQuery] = useState('')
  const [lugarActivo, setLugarActivo] = useState('Todos')

  useEffect(() => {
    axiosClient.get('/eventos')
      .then(response => setEventos(response.data.data || []))
      .catch(() => setEventos([]))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (eventos.length < 2) return undefined
    const timer = window.setInterval(() => {
      setActiveSlide(current => (current + 1) % eventos.length)
    }, 7000)
    return () => window.clearInterval(timer)
  }, [eventos.length])

  const lugares = useMemo(() => [
    'Todos',
    ...new Set(eventos.map(event => event.lugar).filter(Boolean))
  ], [eventos])

  const eventosFiltrados = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    return eventos.filter(event => {
      const matchesPlace = lugarActivo === 'Todos' || event.lugar === lugarActivo
      const matchesSearch = !search ||
        `${event.nombre} ${event.lugar} ${event.descripcion || ''}`.toLocaleLowerCase().includes(search)
      return matchesPlace && matchesSearch
    })
  }, [eventos, lugarActivo, query])

  const hero = eventos[activeSlide]
  const showHero = !query && lugarActivo === 'Todos'

  const changeSlide = (direction) => {
    setActiveSlide(current => (current + direction + eventos.length) % eventos.length)
  }

  return (
    <div className="discover-page">
      <section className={`hero-banner${hero?.imagenUrl ? ' has-image' : ''}`} aria-label="Eventos destacados">
        {hero?.imagenUrl && (
          <img
            key={hero.id}
            className="hero-image"
            src={hero.imagenUrl}
            alt=""
          />
        )}
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="eyebrow"><span className="live-dot" /> Vive lo que viene</span>
          <p className="hero-kicker">{hero ? 'DESTACADO' : 'ENTRADASYA PRESENTA'}</p>
          <h1>{hero?.nombre || 'Encuentra tu próximo gran plan.'}</h1>
          <p className="hero-description">
            {hero?.descripcion || 'Conciertos, cultura y experiencias inolvidables. Descubre qué está pasando cerca de ti.'}
          </p>
          <div className="hero-meta">
            {hero && (
              <>
                <span><b aria-hidden="true">◷</b> {formatDate(hero.fecha, { weekday: 'short' })}</span>
                <span><b aria-hidden="true">⌖</b> {hero.lugar}</span>
              </>
            )}
          </div>
          <div className="hero-actions">
            {hero ? (
              <Link className="button button-primary button-large" to={`/eventos/${hero.id}`}>
                Ver evento <span aria-hidden="true">↗</span>
              </Link>
            ) : (
              <a className="button button-primary button-large" href="#explorar">
                Explorar eventos <span aria-hidden="true">↓</span>
              </a>
            )}
            <a className="button button-glass button-large" href="#explorar">Explorar cartelera</a>
          </div>
        </div>
        {eventos.length > 1 && showHero && (
          <div className="hero-controls">
            <button type="button" aria-label="Evento anterior" onClick={() => changeSlide(-1)}>‹</button>
            <div className="hero-dots" aria-label="Seleccionar evento destacado">
              {eventos.map((event, index) => (
                <button
                  type="button"
                  key={event.id}
                  className={index === activeSlide ? 'active' : ''}
                  aria-label={`Mostrar ${event.nombre}`}
                  aria-current={index === activeSlide ? 'true' : undefined}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
            <button type="button" aria-label="Siguiente evento" onClick={() => changeSlide(1)}>›</button>
          </div>
        )}
      </section>

      <section className="event-discovery" id="explorar">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ELIGE TU PRÓXIMA SALIDA</span>
            <h2>Eventos para vivir <span>en grande.</span></h2>
            <p>Encuentra el plan perfecto y asegura tu lugar.</p>
          </div>
          <label className="search-field">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.5 4.5" />
            </svg>
            <input
              type="search"
              placeholder="Artista, evento o lugar"
              aria-label="Buscar por evento o lugar"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
            <kbd>⌘ K</kbd>
          </label>
        </div>

        <div className="filter-row" aria-label="Filtrar por lugar">
          {lugares.map(lugar => (
            <button
              type="button"
              key={lugar}
              className={`filter-chip${lugarActivo === lugar ? ' selected' : ''}`}
              onClick={() => setLugarActivo(lugar)}
            >
              {lugar}
            </button>
          ))}
        </div>

        <div className="results-heading">
          <h3>{query || lugarActivo !== 'Todos' ? 'Resultados' : 'Próximos eventos'}</h3>
          <span>{eventosFiltrados.length} {eventosFiltrados.length === 1 ? 'evento' : 'eventos'}</span>
        </div>

        {cargando ? (
          <div className="event-grid" aria-label="Cargando eventos">
            {[1, 2, 3].map(item => <div className="event-skeleton" key={item} />)}
          </div>
        ) : eventosFiltrados.length ? (
          <div className="event-grid">
            {eventosFiltrados.map((event, index) => (
              <Link
                className="event-card"
                key={event.id}
                to={`/eventos/${event.id}`}
                style={{ '--card-delay': `${Math.min(index, 6) * 70}ms` }}
              >
                <div className="event-card-image">
                  {event.imagenUrl
                    ? <img src={event.imagenUrl} alt={event.nombre} loading="lazy" />
                    : <div className="event-image-fallback" aria-hidden="true">EY</div>}
                  <span className="event-badge">En vivo</span>
                  <span className="card-arrow" aria-hidden="true">↗</span>
                </div>
                <div className="event-card-content">
                  <div className="event-card-date">
                    <span className="date-day">{formatDate(event.fecha, { day: '2-digit' })}</span>
                    <span>{formatDate(event.fecha, { month: 'short', year: 'numeric' })}</span>
                  </div>
                  <h3>{event.nombre}</h3>
                  <p className="event-location"><span aria-hidden="true">⌖</span> {event.lugar}</p>
                  <div className="event-card-footer">
                    <span>
                      <small>DESDE</small>
                      <b>{lowestPrice(event) == null ? 'Consultar' : `Bs. ${lowestPrice(event).toFixed(2)}`}</b>
                    </span>
                    <span className="card-cta">Ver evento <span aria-hidden="true">→</span></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">✦</span>
            <h3>{cargando ? 'Cargando cartelera' : 'Todavía no hay eventos por aquí'}</h3>
            <p>{query ? 'Prueba con otro nombre o lugar.' : 'Vuelve pronto para descubrir nuevos eventos.'}</p>
            {(query || lugarActivo !== 'Todos') && (
              <button className="button button-quiet" onClick={() => { setQuery(''); setLugarActivo('Todos') }}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
