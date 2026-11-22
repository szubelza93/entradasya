CREATE TABLE IF NOT EXISTS public.transacciones (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  last4 VARCHAR(4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS transacciones_order_id_key
  ON public.transacciones (order_id);
