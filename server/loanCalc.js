/** Monthly payment for amortizing loan (standard formula). */
export function monthlyPayment(principal, annualRatePercent, termMonths) {
  if (termMonths <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return principal / termMonths;
  const factor = Math.pow(1 + r, termMonths);
  return (principal * r * factor) / (factor - 1);
}

/** Remaining term in months given current balance, rate, and fixed monthly payment. */
export function remainingMonths(balance, annualRatePercent, payment) {
  if (payment <= 0 || balance <= 0) return 0;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return Math.ceil(balance / payment);
  if (payment <= balance * r) return Infinity;
  const n = Math.log(payment / (payment - balance * r)) / Math.log(1 + r);
  return Math.ceil(n);
}

/** Projected payoff date from today. */
export function projectedPayoffDate(balance, annualRatePercent, payment, fromDate = new Date()) {
  const months = remainingMonths(balance, annualRatePercent, payment);
  if (!Number.isFinite(months) || months <= 0) return null;
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Interest accrued for one period (simple monthly). */
export function monthlyInterest(balance, annualRatePercent) {
  return balance * (annualRatePercent / 100 / 12);
}

/** Frequency → approximate monthly equivalent payment. */
export function toMonthlyEquivalent(amount, frequency) {
  if (frequency === 'weekly') return (amount * 52) / 12;
  if (frequency === 'biweekly') return (amount * 26) / 12;
  return amount;
}

/** Format ISO date as readable English, e.g. "September 12, 2025". */
export function formatDisplayDate(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(n) || 0);
}

/** Full loan summary with calculated fields. */
export function enrichLoan(loan, schedule) {
  const payment = schedule
    ? toMonthlyEquivalent(schedule.amount, schedule.frequency)
    : monthlyPayment(loan.balance, loan.rate, loan.term_months || 60);

  const payoffIso = projectedPayoffDate(loan.balance, loan.rate, payment);
  const monthsLeft = remainingMonths(loan.balance, loan.rate, payment);

  return {
    ...loan,
    suggested_monthly: Number(monthlyPayment(loan.balance, loan.rate, loan.term_months || 60).toFixed(2)),
    months_remaining: Number.isFinite(monthsLeft) ? monthsLeft : null,
    projected_payoff: payoffIso,
    projected_payoff_display: formatDisplayDate(payoffIso),
    date_taken_display: formatDisplayDate(loan.date_taken),
    schedule: schedule || null,
  };
}
