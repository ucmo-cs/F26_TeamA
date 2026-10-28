import db from './db.js';
import { formatCurrency, formatDisplayDate } from './loanCalc.js';

/**
 * Logs confirmation emails to the database.
 * In production, swap the console + log for a real SMTP/API send (nodemailer).
 */
export function sendEmail({ to, subject, body }) {
  db.prepare(
    'INSERT INTO email_log (to_email, subject, body) VALUES (?, ?, ?)'
  ).run(to, subject, body);

  console.log(`\n📧 Email queued → ${to}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   ${body.split('\n')[0]}…\n`);

  return { ok: true, to, subject };
}

export function paymentScheduledEmail(user, loan, schedule) {
  return sendEmail({
    to: user.email,
    subject: 'Payment schedule confirmed — Loan Repayment Tracker',
    body: [
      `Hi ${user.name},`,
      '',
      `Your payment schedule has been set for loan #${loan.id}.`,
      `Amount: ${formatCurrency(schedule.amount)}`,
      `Frequency: ${schedule.frequency}`,
      `Next payment: ${formatDisplayDate(schedule.next_payment_date)}`,
      `Remaining balance: ${formatCurrency(loan.balance)}`,
      '',
      'Thank you for using Loan Repayment Tracker.',
    ].join('\n'),
  });
}

export function paymentReceivedEmail(user, loan, amount, date) {
  return sendEmail({
    to: user.email,
    subject: 'Payment received — Loan Repayment Tracker',
    body: [
      `Hi ${user.name},`,
      '',
      `We received your payment of ${formatCurrency(amount)} on ${formatDisplayDate(date)}.`,
      `Updated balance for loan #${loan.id}: ${formatCurrency(loan.balance)}`,
      '',
      'Thank you for your payment.',
    ].join('\n'),
  });
}

export function loanCreatedEmail(user, loan) {
  return sendEmail({
    to: user.email,
    subject: 'New loan account opened — Loan Repayment Tracker',
    body: [
      `Hi ${user.name},`,
      '',
      `A new loan has been opened on your account.`,
      `Amount: ${formatCurrency(loan.original_amount)}`,
      `Interest rate: ${loan.rate}%`,
      `Date: ${formatDisplayDate(loan.date_taken)}`,
      '',
      'Log in to the customer portal to view details and schedule payments.',
      'Demo password (if new): customer123',
    ].join('\n'),
  });
}

export function profileUpdatedEmail(user) {
  return sendEmail({
    to: user.email,
    subject: 'Profile updated — Loan Repayment Tracker',
    body: [
      `Hi ${user.name},`,
      '',
      'Your account information was updated successfully.',
      `Email on file: ${user.email}`,
      `Phone on file: ${user.phone || '—'}`,
      '',
      'If you did not make this change, contact support.',
    ].join('\n'),
  });
}
