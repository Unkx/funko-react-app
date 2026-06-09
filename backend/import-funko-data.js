// Standalone CLI to import the open Funko dataset into funko_items.
// Usage:  node import-funko-data.js        (from the backend/ folder)
//
// Connects with DATABASE_URL if set, otherwise the discrete DB_* vars used by
// init-db.js. Run init-db.js first so the funko_items table exists.

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { importFunkoDataset } from './funkoDataset.js';

dotenv.config();

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'Web_AppDB',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
    });

(async () => {
  console.log('⬇️  Downloading and importing the Funko dataset...');
  const result = await importFunkoDataset(pool);
  console.log(
    `✅ Done — ${result.upserted} rows upserted ` +
      `(${result.unique} unique of ${result.total} parsed).`,
  );
  await pool.end();
})().catch(async (err) => {
  console.error('❌ Import failed:', err.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
