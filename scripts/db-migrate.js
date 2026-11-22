const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const service = process.argv[2];
const services = new Set([
  'auth',
  'checkin',
  'events',
  'orders',
  'payments',
  'tickets'
]);

if (!services.has(service)) {
  console.error(`Uso: node scripts/db-migrate.js <${[...services].join('|')}>`);
  process.exitCode = 1;
} else {
  runMigrations(service).catch(error => {
    console.error(`Error aplicando migraciones de ${service}: ${error.message}`);
    process.exitCode = 1;
  });
}

async function runMigrations(serviceName) {
  const serviceDirectory = path.resolve(__dirname, '..', serviceName);
  const serviceRequire = createRequire(path.join(serviceDirectory, 'package.json'));
  serviceRequire('dotenv').config({ path: path.join(serviceDirectory, '.env') });

  const { Client } = serviceRequire('pg');
  const connectionString = process.env.DATABASE_URL;
  const config = connectionString
    ? { connectionString }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      };

  if (
    !connectionString &&
    (!config.host || !config.database || !config.user)
  ) {
    throw new Error(
      'Configura DATABASE_URL o las variables DB_HOST, DB_NAME y DB_USER.'
    );
  }

  const migrationsDirectory = path.join(serviceDirectory, 'db', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDirectory)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    throw new Error(`No hay archivos SQL en ${migrationsDirectory}.`);
  }

  const client = new Client(config);
  let connected = false;

  try {
    await client.connect();
    connected = true;

    const lockKey = `entradasya:${serviceName}:schema_migrations`;
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [lockKey]);

    const historyTable = `${serviceName}_schema_migrations`;
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.${historyTable} (
        version TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDirectory, file), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const applied = await client.query(
        `SELECT checksum FROM public.${historyTable} WHERE version = $1`,
        [file]
      );

      if (applied.rowCount > 0) {
        if (applied.rows[0].checksum !== checksum) {
          throw new Error(
            `La migración ${file} ya fue aplicada y su contenido cambió. Crea una nueva migración.`
          );
        }
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO public.${historyTable} (version, checksum) VALUES ($1, $2)`,
          [file, checksum]
        );
        await client.query('COMMIT');
        console.log(`Migración aplicada: ${serviceName}/${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log(`Esquema de ${serviceName} actualizado.`);
  } finally {
    if (connected) {
      await client.end();
    }
  }
}
