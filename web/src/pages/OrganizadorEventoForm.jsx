import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import toast from 'react-hot-toast'

const crearFormularioVacio = () => ({
  nombre: '', descripcion: '', fecha: '', lugar: '',
  sectores: [{ nombre: 'General', precio: 0, cupo: 0 }]
})

const fechaParaInput = (fecha) => {
  const date = new Date(fecha)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export default function OrganizadorEventoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(crearFormularioVacio)
  const [imagen, setImagen] = useState(null)

  useEffect(() => {
    if (id) {
      axiosClient.get(`/eventos/${id}/manage`).then(r => {
        const event = r.data.data
        setForm({
          ...event,
          fecha: fechaParaInput(event.fecha),
          sectores: event.sectores || []
        })
      }).catch(() => {})
    }
  }, [id])

  const setSector = (i, key, val) => {
    const sectores = [...form.sectores]
    sectores[i] = {
      ...sectores[i],
      [key]: key === 'precio' || key === 'cupo' ? +val : val
    }
    setForm({ ...form, sectores })
  }

  const addSector = () => setForm({
    ...form,
    sectores: [...form.sectores, { nombre: '', precio: 0, cupo: 0 }]
  })

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      if (id) {
        await axiosClient.patch(`/eventos/${id}`, {
          nombre: form.nombre,
          descripcion: form.descripcion,
          fecha: new Date(form.fecha).toISOString(),
          lugar: form.lugar
        })

        for (const sector of form.sectores) {
          const datosSector = {
            nombre: sector.nombre,
            precio: sector.precio,
            cupo: sector.cupo
          }

          if (sector.id) {
            await axiosClient.patch(`/eventos/${id}/sectors/${sector.id}`, datosSector)
          } else {
            await axiosClient.post(`/eventos/${id}/sectors`, datosSector)
          }
        }
      } else {
        const datos = new FormData()
        datos.append('imagen', imagen)
        datos.append('nombre', form.nombre)
        datos.append('descripcion', form.descripcion)
        datos.append('fecha', new Date(form.fecha).toISOString())
        datos.append('lugar', form.lugar)
        datos.append('sectores', JSON.stringify(form.sectores.map(({ nombre, precio, cupo }) => ({
          nombre, precio, cupo
        }))))
        await axiosClient.post('/eventos', datos)
      }
      toast.success('Guardado')
      navigate('/organizador/eventos')
    } catch {}
  }

  return (
    <form className="event-form" onSubmit={onSubmit}>
      <span className="eyebrow">PANEL DE ORGANIZADOR</span>
      <h1>{id ? 'Editar evento' : 'Crear un evento'}<span>.</span></h1>
      <p className="form-intro">Prepara una experiencia que todos quieran vivir.</p>
      <label className="field-label" htmlFor="event-name">Nombre del evento</label>
      <input placeholder="Nombre" required value={form.nombre}
        onChange={e => setForm({ ...form, nombre: e.target.value })}
        id="event-name" className="form-input" />
      <label className="field-label" htmlFor="event-description">Descripción</label>
      <textarea placeholder="Descripción" value={form.descripcion || ''}
        onChange={e => setForm({ ...form, descripcion: e.target.value })}
        id="event-description" className="form-input form-textarea" />
      <label className="field-label" htmlFor="event-date">Fecha y hora</label>
      <input type="datetime-local" required value={form.fecha}
        onChange={e => setForm({ ...form, fecha: e.target.value })}
        id="event-date" className="form-input" />
      <label className="field-label" htmlFor="event-place">Lugar</label>
      <input placeholder="Lugar" required value={form.lugar}
        onChange={e => setForm({ ...form, lugar: e.target.value })}
        id="event-place" className="form-input" />
      {id ? (
        form.imagenUrl && <p className="current-image">Imagen actual: <a href={form.imagenUrl} target="_blank" rel="noreferrer">ver imagen ↗</a></p>
      ) : (
        <input type="file" accept="image/jpeg,image/png,image/webp" required
          onChange={e => setImagen(e.target.files[0] || null)}
          className="form-input file-input" aria-label="Imagen del evento" />
      )}

      <div className="form-section-heading">
        <div><span className="eyebrow">ENTRADAS</span><h2>Sectores</h2></div>
        <button className="button button-secondary" type="button" onClick={addSector}>＋ Agregar sector</button>
      </div>
      {form.sectores.map((s, i) => (
        <div className="sector-form-row" key={i}>
          <input className="form-input" aria-label="Nombre del sector" placeholder="Nombre" required value={s.nombre}
            onChange={e => setSector(i, 'nombre', e.target.value)} />
          <input className="form-input" type="number" min="0" step="0.01" aria-label="Precio del sector" placeholder="Precio (Bs.)" required value={s.precio}
            onChange={e => setSector(i, 'precio', e.target.value)} />
          <input className="form-input" type="number" min="1" step="1" aria-label="Cupo del sector" placeholder="Cupo" required value={s.cupo}
            onChange={e => setSector(i, 'cupo', e.target.value)} />
        </div>
      ))}
      <div className="form-actions">
        <button className="button button-primary button-large" type="submit">Guardar evento</button>
      </div>
    </form>
  )
}