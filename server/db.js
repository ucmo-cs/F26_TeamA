import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'loans.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'customer')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES users(id),
    date_taken TEXT NOT NULL,
    original_amount REAL NOT NULL,
    balance REAL NOT NULL,
    rate REAL NOT NULL,
    term_months INTEGER DEFAULT 60,
    bank TEXT DEFAULT 'Not provided',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payment_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly')),
    next_payment_date TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL,
    method TEXT DEFAULT 'manual',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS email_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TEXT DEFAULT (datetime('now'))
  );
`);

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count > 0) return;

  const hash = bcrypt.hashSync('admin123', 10);
  const custHash = bcrypt.hashSync('customer123', 10);

  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash, role, name, email, phone) VALUES (?, ?, ?, ?, ?, ?)'
  );

  insertUser.run('admin', hash, 'admin', 'Admin User', 'admin@loantracker.local', '');
  const collin = insertUser.run(
    'collin',
    custHash,
    'customer',
    'Collin Raymond',
    'collin@example.com',
    '555-122-0607'
  );
  const tyreek = insertUser.run(
    'tyreek',
    custHash,
    'customer',
    'Tyreek Hill',
    'tyreek@example.com',
    '555-224-0706'
  );
  const patrick = insertUser.run(
    'patrick',
    custHash,
    'customer',
    'Patrick Mahomes',
    'patrick@example.com',
    '555-333-0708'
  );

  const insertLoan = db.prepare(
    `INSERT INTO loans (customer_id, date_taken, original_amount, balance, rate, term_months, bank)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  insertLoan.run(collin.lastInsertRowid, '2025-09-12', 12000, 8350, 6.5, 48, 'Demo Bank — ending in 4726');
  insertLoan.run(tyreek.lastInsertRowid, '2026-03-05', 7500, 6200, 5.25, 36, 'Not provided');
  insertLoan.run(patrick.lastInsertRowid, '2026-08-20', 18000, 18000, 7, 60, 'Not provided');

  console.log('Database seeded with demo users and loans.');
}

seed();

export default db;
