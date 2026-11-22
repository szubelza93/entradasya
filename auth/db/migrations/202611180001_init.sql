CREATE TABLE IF NOT EXISTS public."User" (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'cliente',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"
  ON public."User" ("email");
