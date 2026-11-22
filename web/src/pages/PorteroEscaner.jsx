import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import axiosClient from '../api/axiosClient'

export default function PorteroEscaner() {
  const [eventos, setEventos] = useState([])
  const [eventId, setEventId] = useState('')
  const [ingresos, setIngresos] = useState({})
  const [cargando, setCargando] = useState(true)
  const [errorEventos, setErrorEventos] = useState('')
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [validando, setValidando] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef(null)
  const validationRef = useRef(false)
  const scanHandledRef = useRef(false)

  useEffect(() => {
    let active = true
    Promise.all([
      axiosClient.get('/eventos/check-in-events', { params: { limit: 100 } }),
      axiosClient.get('/checkin/stats')
    ])
      .then(([eventsResponse, statsResponse]) => {
        if (!active) return
        const publishedEvents = (eventsResponse.data.data || []).sort((first, second) =>
          Math.abs(new Date(first.fecha).getTime() - Date.now()) -
          Math.abs(new Date(second.fecha).getTime() - Date.now())
        )
        const stats = Object.fromEntries(
          (statsResponse.data.data || []).map(item => [item.eventId, item.totalIngresos])
        )
        setEventos(publishedEvents)
        setIngresos(stats)
        if (publishedEvents.length) setEventId(String(publishedEvents[0].id))
      })
      .catch(error => {
        if (active) {
          setErrorEventos(error.response?.data?.message || 'No se pudieron cargar los eventos.')
        }
      })
      .finally(() => {
        if (active) setCargando(false)
      })

    return () => { active = false }
  }, [])

  const validar = async (codigo) => {
    if (!codigo || !eventId || validationRef.current) return

    validationRef.current = true
    setValidando(true)
    setResult(null)
    try {
      const { data } = await axiosClient.post('/checkin/scan', {
        code: codigo,
        eventId: Number(eventId)
      })
      setResult({ ok: true, ...data })
      setIngresos(current => ({
        ...current,
        [eventId]: (current[eventId] || 0) + 1
      }))
    } catch (error) {
      setResult({
        ok: false,
        message: error.response?.data?.message || 'No se pudo validar la entrada.'
      })
    } finally {
      validationRef.current = false
      setValidando(false)
    }
  }

  const iniciarCamara = async () => {
    setCameraError('')
    scanHandledRef.current = false
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async decoded => {
          if (scanHandledRef.current) return
          scanHandledRef.current = true
          await validar(decoded)
          await scanner.stop()
          setScanning(false)
        },
        () => {}
      )
      setScanning(true)
    } catch (error) {
      setCameraError(error.message || 'No se pudo iniciar la cámara.')
      setScanning(false)
    }
  }

  useEffect(() => () => {
    scannerRef.current?.stop().catch(() => {})
  }, [])

  const eventoSeleccionado = eventos.find(event => String(event.id) === eventId)

  return (
    <section className="dashboard-page scanner-page">
      <div className="page-heading">
        <span className="eyebrow">ENTRADASYA · ACCESO</span>
        <h1>Control de ingreso<span>.</span></h1>
        <p>Selecciona el evento y escanea el QR o ingresa el código de la entrada.</p>
      </div>

      <div className="scanner-panel">
        {cargando ? (
          <div className="event-skeleton order-skeleton" aria-label="Cargando eventos" />
        ) : errorEventos ? (
          <p role="alert">{errorEventos}</p>
        ) : eventos.length === 0 ? (
          <p>No hay eventos publicados disponibles para controlar.</p>
        ) : (
          <>
            <label>
              Evento
              <select
                className="form-input"
                value={eventId}
                disabled={scanning || validando}
                onChange={event => {
                  setEventId(event.target.value)
                  setResult(null)
                }}
              >
                {eventos.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.nombre} · {ingresos[event.id] || 0} ingresos
                  </option>
                ))}
              </select>
            </label>

            <p aria-live="polite">
              Ingresos registrados para este evento: <strong>{ingresos[eventId] || 0}</strong>
            </p>

            <div className="scanner-input-row">
              <input
                className="form-input"
                placeholder="Código manual"
                aria-label="Código de entrada"
                value={code}
                onChange={event => setCode(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') validar(code.trim())
                }}
              />
              <button
                className="button button-primary"
                onClick={() => validar(code.trim())}
                disabled={!code.trim() || validando}
              >
                {validando ? 'Validando…' : 'Validar'}
              </button>
            </div>

            <button
              className="button button-secondary camera-button"
              onClick={iniciarCamara}
              disabled={scanning || validando}
            >
              {scanning ? 'Escaneando…' : '◎ Escanear con cámara'}
            </button>
            {cameraError && <p role="alert">{cameraError}</p>}

            <div id="qr-reader" className="qr-reader" />

            {result && (
              <div className={`scan-result${result.ok ? ' success' : ' failure'}`} aria-live="polite">
                <span className="scan-result-symbol" aria-hidden="true">{result.ok ? '✓' : '×'}</span>
                <h2>{result.ok ? 'Ingreso permitido' : 'Ingreso rechazado'}</h2>
                {result.ok
                  ? <p>{result.ticket?.eventTitle || eventoSeleccionado?.nombre} — {result.ticket?.sectorName}</p>
                  : <p>{result.message}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
