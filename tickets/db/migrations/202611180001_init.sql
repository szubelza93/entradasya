DO $$
BEGIN
  CREATE TYPE public.enum_tickets_status AS ENUM ('emitida', 'usada', 'cancelada');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS public.tickets (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  order_id INTEGER NOT NULL,
  item_id UUID NOT NULL,
  customer_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  event_name VARCHAR(200) NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  event_place VARCHAR(250) NOT NULL,
  sector_id INTEGER NOT NULL,
  sector_name VARCHAR(100) NOT NULL,
  seat_number VARCHAR(50),
  pdf_path VARCHAR(500) NOT NULL,
  status public.enum_tickets_status NOT NULL DEFAULT 'emitida',
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS tickets_order_id_item_id
  ON public.tickets (order_id, item_id);
CREATE INDEX IF NOT EXISTS tickets_customer_id
  ON public.tickets (customer_id);
CREATE INDEX IF NOT EXISTS tickets_event_id
  ON public.tickets (event_id);
CREATE INDEX IF NOT EXISTS tickets_status
  ON public.tickets (status);
