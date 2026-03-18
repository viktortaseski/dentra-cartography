import Database from 'better-sqlite3'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import { readFileSync, readdirSync, mkdirSync } from 'fs'

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export function initDatabase(): void {
  const userDataPath = app.getPath('userData')
  mkdirSync(userDataPath, { recursive: true })
  const dbPath = join(userDataPath, 'dental.db')
  db = new Database(dbPath)

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations()
}

function runMigrations(): void {
  const migrationsDir = is.dev
    ? join(app.getAppPath(), 'electron', 'db', 'migrations')
    : join(__dirname, 'migrations')
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  // Ensure meta table exists before querying schema_version
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '0');
  `)

  const row = db
    .prepare('SELECT value FROM meta WHERE key = ?')
    .get('schema_version') as { value: string } | undefined

  let currentVersion = row ? Number(row.value) : 0

  const updateVersion = db.prepare(`UPDATE meta SET value = ? WHERE key = 'schema_version'`)

  for (const file of files) {
    const migrationVersion = Number(file.split('_')[0])
    if (migrationVersion > currentVersion) {
      const sql = readFileSync(join(migrationsDir, file), 'utf-8')
      db.exec(sql)
      updateVersion.run(String(migrationVersion))
      currentVersion = migrationVersion
    }
  }
}
