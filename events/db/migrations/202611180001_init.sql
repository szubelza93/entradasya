DO $$
BEGIN
  CREATE TYPE public.enum_events_estado AS ENUM ('borrador', 'publicado', 'cancelado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.enum_reservations_estado AS ENUM ('reserved', 'released');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.events (
  id SERIAL PRIMARY KEY,
  organizer_id INTEGER NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMPTZ NOT NULL,
  lugar VARCHAR(220) NOT NULL,
  imagen_url TEXT,
  estado public.enum_events_estado NOT NULL DEFAULT 'borrador',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sectors (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  precio NUMERIC(10, 2) NOT NULL,
  cupo INTEGER NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT sectors_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.events (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.reservations (
  id SERIAL PRIMARY KEY,
  order_item_id VARCHAR(120) NOT NULL UNIQUE,
  event_id INTEGER NOT NULL,
  sector_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  estado public.enum_reservations_estado NOT NULL DEFAULT 'reserved',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS events_estado_fecha
  ON public.events (estado, fecha);
CREATE INDEX IF NOT EXISTS events_organizer_id_fecha
  ON public.events (organizer_id, fecha);
CREATE UNIQUE INDEX IF NOT EXISTS sectors_event_id_nombre
  ON public.sectors (event_id, nombre);
CREATE INDEX IF NOT EXISTS reservations_event_id_sector_id
  ON public.reservations (event_id, sector_id);
CREATE INDEX IF NOT EXISTS reservations_estado
  ON public.reservations (estado);
