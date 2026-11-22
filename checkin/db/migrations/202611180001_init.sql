CREATE TABLE IF NOT EXISTS public.checkins (
  id BIGSERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  ticket_code VARCHAR(50) NOT NULL,
  porter_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS checkins_ticket_id_unique
  ON public.checkins (ticket_id);

CREATE UNIQUE INDEX IF NOT EXISTS checkins_ticket_code_unique
  ON public.checkins (ticket_code);
