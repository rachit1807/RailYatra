import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const migrationsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export async function migrateDatabase(pool) {
  await pool.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);

  const files = (await readdir(migrationsDirectory)).filter(file => file.endsWith('.sql')).sort();
  for (const file of files) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended('railyatra-schema-migrations', 0))");
      const existing = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
      if (existing.rowCount) {
        await client.query('COMMIT');
        continue;
      }
      await client.query(await readFile(path.join(migrationsDirectory, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.info(JSON.stringify({event: 'database.migration.applied', version: file}));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
