import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { enrichLoan, monthlyPayment } from './loanCalc.js';
import {
  paymentScheduledEmail,
  paymentReceivedEmail,
  loanCreatedEmail,
  profileUpdatedEmail,
} from './email.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'loan-tracker-dev-secret';

app.use(cors());
app.use(express.json());

function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db.prepare('SELECT id, username, role, name, email, phone FROM users WHERE id = ?').get(payload.id);
      if (!user) return res.status(401).json({ error: 'User not found' });
      if (requiredRole && user.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.user = user;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

function getSchedule(loanId) {
  return db
    .prepare('SELECT * FROM payment_schedules WHERE loan_id = ? AND active = 1 ORDER BY id DESC LIMIT 1')
    .get(loanId);
}

function loanWithCustomer(loanId) {
  return db
    .prepare(
      `SELECT loans.*, users.name, users.email, users.phone, users.username
       FROM loans JOIN users ON users.id = loans.customer_id
       WHERE loans.id = ?`
    )
    .get(loanId);
}

// ——— Auth ———
app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect username or password' });
  }
  if (role && user.role !== role) {
    return res.status(403).json({
      error: `This account is a ${user.role} account. Please use the ${user.role} login.`,
    });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  });
});

app.get('/api/auth/me', auth(), (req, res) => {
  res.json({ user: req.user });
});

// ——— Admin: loans ———
app.get('/api/admin/loans', auth('admin'), (req, res) => {
  const rows = db
    .prepare(
      `SELECT loans.*, users.name, users.email, users.phone
       FROM loans JOIN users ON users.id = loans.customer_id
       ORDER BY loans.date_taken DESC`
    )
    .all();

  res.json({
    loans: rows.map((loan) => enrichLoan(loan, getSchedule(loan.id))),
  });
});

app.get('/api/admin/loans/:id', auth('admin'), (req, res) => {
  const loan = loanWithCustomer(req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  const payments = db
    .prepare('SELECT * FROM payments WHERE loan_id = ? ORDER BY payment_date DESC')
    .all(loan.id);
  res.json({
    loan: enrichLoan(loan, getSchedule(loan.id)),
    payments,
  });
});

app.post('/api/admin/loans', auth('admin'), (req, res) => {
  const { name, email, phone, date, original, rate, term_months, username, password } = req.body || {};
  if (!name || !email || !date || !original || rate == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const amount = Number(original);
  const interest = Number(rate);
  const term = Number(term_months) || 60;

  let customer = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(email, 'customer');

  if (!customer) {
    const uname = username || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(uname);
    const finalUsername = existing ? `${uname}${Date.now().toString().slice(-4)}` : uname;
    const hash = bcrypt.hashSync(password || 'customer123', 10);
    const result = db
      .prepare(
        'INSERT INTO users (username, password_hash, role, name, email, phone) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(finalUsername, hash, 'customer', name, email, phone || '');
    customer = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  } else {
    db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(
      name,
      phone || customer.phone,
      customer.id
    );
    customer = db.prepare('SELECT * FROM users WHERE id = ?').get(customer.id);
  }

  const result = db
    .prepare(
      `INSERT INTO loans (customer_id, date_taken, original_amount, balance, rate, term_months)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(customer.id, date, amount, amount, interest, term);

  const loan = loanWithCustomer(result.lastInsertRowid);
  loanCreatedEmail(customer, loan);

  res.status(201).json({
    loan: enrichLoan(loan, null),
    suggested_monthly: Number(monthlyPayment(amount, interest, term).toFixed(2)),
  });
});

app.delete('/api/admin/loans/:id', auth('admin'), (req, res) => {
  const info = db.prepare('DELETE FROM loans WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Loan not found' });
  res.json({ ok: true });
});

app.get('/api/admin/emails', auth('admin'), (req, res) => {
  const emails = db.prepare('SELECT * FROM email_log ORDER BY sent_at DESC LIMIT 50').all();
  res.json({ emails });
});

// ——— Customer: loans & profile ———
app.get('/api/customer/loans', auth('customer'), (req, res) => {
  const rows = db
    .prepare('SELECT * FROM loans WHERE customer_id = ? ORDER BY date_taken DESC')
    .all(req.user.id);
  res.json({
    loans: rows.map((loan) =>
      enrichLoan({ ...loan, name: req.user.name, email: req.user.email, phone: req.user.phone }, getSchedule(loan.id))
    ),
  });
});

app.get('/api/customer/loans/:id', auth('customer'), (req, res) => {
  const loan = db
    .prepare('SELECT * FROM loans WHERE id = ? AND customer_id = ?')
    .get(req.params.id, req.user.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });

  const payments = db
    .prepare('SELECT * FROM payments WHERE loan_id = ? ORDER BY payment_date DESC')
    .all(loan.id);

  res.json({
    loan: enrichLoan(
      { ...loan, name: req.user.name, email: req.user.email, phone: req.user.phone },
      getSchedule(loan.id)
    ),
    payments,
  });
});

app.put('/api/customer/profile', auth('customer'), (req, res) => {
  const { name, email, phone } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

  db.prepare('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?').run(
    name,
    email,
    phone || '',
    req.user.id
  );

  const user = db
    .prepare('SELECT id, username, role, name, email, phone FROM users WHERE id = ?')
    .get(req.user.id);

  profileUpdatedEmail(user);
  res.json({ user });
});

app.post('/api/customer/loans/:id/schedule', auth('customer'), (req, res) => {
  const loan = db
    .prepare('SELECT * FROM loans WHERE id = ? AND customer_id = ?')
    .get(req.params.id, req.user.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });

  const { amount, frequency, next_payment_date } = req.body || {};
  if (!amount || !frequency || !next_payment_date) {
    return res.status(400).json({ error: 'Amount, frequency, and next payment date required' });
  }
  if (!['weekly', 'biweekly', 'monthly'].includes(frequency)) {
    return res.status(400).json({ error: 'Invalid frequency' });
  }

  db.prepare('UPDATE payment_schedules SET active = 0 WHERE loan_id = ?').run(loan.id);
  const result = db
    .prepare(
      `INSERT INTO payment_schedules (loan_id, amount, frequency, next_payment_date, active)
       VALUES (?, ?, ?, ?, 1)`
    )
    .run(loan.id, Number(amount), frequency, next_payment_date);

  const schedule = db.prepare('SELECT * FROM payment_schedules WHERE id = ?').get(result.lastInsertRowid);
  paymentScheduledEmail(req.user, loan, schedule);

  res.status(201).json({
    schedule,
    loan: enrichLoan(
      { ...loan, name: req.user.name, email: req.user.email, phone: req.user.phone },
      schedule
    ),
  });
});

app.post('/api/customer/loans/:id/payments', auth('customer'), (req, res) => {
  const loan = db
    .prepare('SELECT * FROM loans WHERE id = ? AND customer_id = ?')
    .get(req.params.id, req.user.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });

  const amount = Number(req.body?.amount);
  const payment_date = req.body?.payment_date || new Date().toISOString().slice(0, 10);
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

  const newBalance = Math.max(0, Number(loan.balance) - amount);
  db.prepare('UPDATE loans SET balance = ?, status = ? WHERE id = ?').run(
    newBalance,
    newBalance === 0 ? 'paid' : 'active',
    loan.id
  );
  db.prepare(
    'INSERT INTO payments (loan_id, amount, payment_date, method) VALUES (?, ?, ?, ?)'
  ).run(loan.id, amount, payment_date, 'manual');

  const updated = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan.id);
  paymentReceivedEmail(req.user, updated, amount, payment_date);

  res.status(201).json({
    loan: enrichLoan(
      { ...updated, name: req.user.name, email: req.user.email, phone: req.user.phone },
      getSchedule(loan.id)
    ),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Loan Tracker API running on http://localhost:${PORT}`);
});
