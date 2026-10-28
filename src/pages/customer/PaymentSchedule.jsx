import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api, formatCurrency } from '../../api';
import { useLanguage } from '../../i18n/LanguageContext';

function minFor(loan, frequency) {
  if (!loan) return null;
  const fromMap = loan.minimums_by_frequency?.[frequency];
  if (fromMap != null) return Number(fromMap);
  if (frequency === 'monthly') return Number(loan.suggested_monthly || loan.minimum_payment);
  return Number(loan.suggested_monthly || 0);
}

export default function PaymentSchedule() {
  const { t, formatDate } = useLanguage();
  const [loans, setLoans] = useState([]);
  const [loanId, setLoanId] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDate, setNextDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/customer/loans')
      .then((data) => {
        const active = data.loans.filter((l) => l.balance > 0);
        setLoans(active);
        if (active[0]) {
          setLoanId(String(active[0].id));
          const min = minFor(active[0], 'monthly');
          setAmount(min != null ? String(min) : '');
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const selected = loans.find((l) => String(l.id) === loanId);
    const min = minFor(selected, frequency);
    if (min != null) setAmount(String(min));
  }, [loanId, loans, frequency]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const data = await api(`/customer/loans/${loanId}/schedule`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(amount),
          frequency,
          next_payment_date: nextDate,
        }),
      });
      setLoans((prev) => prev.map((l) => (l.id === data.loan.id ? data.loan : l)));
      setMessage(
        t('scheduleSaved', {
          date: data.loan.projected_payoff ? formatDate(data.loan.projected_payoff) : '—',
        })
      );
    } catch (err) {
      setError(err.message);
    }
  }

  const selected = loans.find((l) => String(l.id) === loanId);
  const minimum = minFor(selected, frequency);

  return (
    <section className="panel">
      <p className="eyebrow">{t('customer')}</p>
      <h1>{t('paymentScheduling')}</h1>
      <p className="muted">{t('paymentSchedulingDesc')}</p>

      {loans.length === 0 ? (
        <p className="empty">
          {t('noActiveLoans')} <Link to="/customer">{t('returnToDashboard')}</Link>
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="form-grid">
          <div>
            <label htmlFor="loan">{t('loan')}</label>
            <select id="loan" value={loanId} onChange={(e) => setLoanId(e.target.value)} required>
              {loans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {t('loanOption', {
                    id: loan.id,
                    balance: formatCurrency(loan.balance),
                  })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="frequency">{t('frequency')}</label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              required
            >
              <option value="weekly">{t('weekly')}</option>
              <option value="biweekly">{t('biweekly')}</option>
              <option value="monthly">{t('monthly')}</option>
            </select>
          </div>

          {minimum != null && (
            <div className="calc-callout">
              <strong>{t('minimumPayment')}</strong>
              <span>{formatCurrency(minimum)}</span>
              <small>{t('minimumPaymentHint')}</small>
            </div>
          )}

          <div>
            <label htmlFor="amount">{t('paymentAmount')}</label>
            <input
              id="amount"
              type="number"
              min={minimum ?? 1}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="next">{t('nextPaymentDate')}</label>
            <input
              id="next"
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              required
            />
          </div>

          {selected?.schedule && (
            <div className="calc-callout">
              <strong>{t('currentSchedule')}</strong>
              <span>
                {formatCurrency(selected.schedule.amount)} · {selected.schedule.frequency}
              </span>
              <small>
                {t('next')}: {formatDate(selected.schedule.next_payment_date)}
              </small>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn primary">
              {t('saveSchedule')}
            </button>
            <Link to="/customer" className="btn ghost">
              {t('cancel')}
            </Link>
          </div>
        </form>
      )}

      {message && <p className="success">{message}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
