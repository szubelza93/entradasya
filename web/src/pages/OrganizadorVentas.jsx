import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axiosClient from '../api/axiosClient'

export default function OrganizadorVentas() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  useEffect(() => {
    axiosClient.get(`/reportes/eventos/${id}`).then(r => setData(r.data)).catch(() => {})
  }, [id])

  if (!data) return <section className="dashboard-page"><div className="event-skeleton order-skeleton" /></section>
  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <span className="eyebrow">ANÁLISIS DEL EVENTO</span>
        <h1>Ventas<span>.</span></h1>
        <p>{data.eventTitle}</p>
      </div>
      <div className="sales-summary">
        <article className="metric-card"><span>INGRESOS TOTALES</span><b>Bs. {Number(data.totalRevenue).toFixed(2)}</b><small>Recaudación del evento</small></article>
        <article className="metric-card"><span>ENTRADAS VENDIDAS</span><b>{data.totalSold}</b><small>Accesos confirmados</small></article>
      </div>
      <div className="table-card">
        <h2>Rendimiento por sector</h2>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Sector</th><th>Precio</th><th>Vendidas</th><th>Cupo</th><th>Ingresos</th></tr>
            </thead>
            <tbody>
              {data.sectors.map(sector => (
                <tr key={sector.id}>
                  <td>{sector.name}</td>
                  <td>Bs. {Number(sector.price).toFixed(2)}</td>
                  <td>{sector.sold}</td>
                  <td>{sector.capacity}</td>
                  <td>Bs. {Number(sector.revenue).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}