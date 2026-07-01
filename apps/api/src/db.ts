import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export const db: import('better-sqlite3').Database = new Database('./governos.db');

export function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user'
        );

        CREATE TABLE IF NOT EXISTS intents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id),
          description TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS workflows (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          intent_id INTEGER REFERENCES intents(id),
          status TEXT DEFAULT 'planned',
          plan_data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workflow_id INTEGER REFERENCES workflows(id),
          event_type TEXT NOT NULL,
          details TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Seed default admin user if not exists
    const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@governos.io');
    if (!adminExists) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync('password', salt);
        db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run('admin@governos.io', hash, 'admin');
        console.log("Seeded default admin user: admin@governos.io");
    }

    console.log("SQLite schema initialized");
}

export async function run(sql: string, params: any[] = []): Promise<any> {
    const stmt = db.prepare(sql);
    const info = stmt.run(params);
    return { lastID: info.lastInsertRowid, changes: info.changes };
}

export async function get(sql: string, params: any[] = []): Promise<any> {
    const stmt = db.prepare(sql);
    return stmt.get(params);
}
