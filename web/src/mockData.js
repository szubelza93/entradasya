export const mockEventos = [
  {
    id: 1,
    title: "Coldplay: Music of the Spheres",
    description: "La gira mundial más esperada llega a la ciudad. Un show lleno de luces, colores y los mejores éxitos de la banda británica.",
    date: "2026-12-15T20:00",
    venue: "Estadio Nacional",
    image: "https://images.unsplash.com/photo-1540039155732-684736882207?q=80&w=800&auto=format&fit=crop",
    sectors: [
      { id: 1, name: "VIP", price: 250, available: 50 },
      { id: 2, name: "General", price: 120, available: 300 },
      { id: 3, name: "Cancha", price: 80, available: 500 }
    ]
  },
  {
    id: 2,
    title: "Final de la Copa Nacional",
    description: "El partido del año. Los dos equipos más grandes se enfrentan por el título. No te quedes fuera.",
    date: "2026-11-25T18:30",
    venue: "Estadio Metropolitano",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop",
    sectors: [
      { id: 1, name: "Tribuna Preferente", price: 150, available: 100 },
      { id: 2, name: "Tribuna Norte", price: 60, available: 2000 }
    ]
  },
  {
    id: 3,
    title: "Conferencia Tech 2026",
    description: "Los mejores exponentes de la industria tecnológica se reúnen para hablar sobre IA, desarrollo web y el futuro del software.",
    date: "2026-10-10T09:00",
    venue: "Centro de Convenciones",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop",
    sectors: [
      { id: 1, name: "Estudiante", price: 30, available: 200 },
      { id: 2, name: "Profesional", price: 90, available: 150 }
    ]
  }
];

export const mockMisCompras = [
  { id: 101, eventTitle: "Coldplay: Music of the Spheres", sectorName: "General", quantity: 2, total: 240, status: "pagado" },
  { id: 102, eventTitle: "Conferencia Tech 2026", sectorName: "Estudiante", quantity: 1, total: 30, status: "pendiente" }
];

export const mockMisEntradas = [
  { id: 501, eventTitle: "Coldplay: Music of the Spheres", sectorName: "General", code: "EYA-987A-B12C", status: "valido" }
];

export const mockVentasOrganizador = {
  eventTitle: "Coldplay: Music of the Spheres",
  totalRevenue: 12500,
  totalSold: 150,
  sectors: [
    { id: 1, name: "VIP", price: 250, sold: 20, capacity: 50, revenue: 5000 },
    { id: 2, name: "General", price: 120, sold: 80, capacity: 300, revenue: 9600 },
    { id: 3, name: "Cancha", price: 80, sold: 50, capacity: 500, revenue: 4000 }
  ]
};