import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../AuthContext';
import { api, formatCurrency } from '../../api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { t, formatDate } = useLanguage();
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/customer/loans')
      .then((data) => setLoans(data.loans))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalOwed = loans.reduce((sum, l) => sum + Number(l.balance), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('welcomeBack')}</p>
          <h1>{user.name}</h1>
          <p className="muted">{t('customerDashDesc')}</p>
        </div>
        <Link className="btn primary" to="/customer/schedule">
          {t('schedulePayment')}
        </Link>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-label">{t('yourLoans')}</span>
          <span className="stat-value">{loans.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">{t('totalBalance')}</span>
          <span className="stat-value">{formatCurrency(totalOwed)}</span>
        </div>
      </div>

      {loading && <p>{t('loading')}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="loan-grid">
        {loans.map((loan) => (
          <article key={loan.id} className="loan-card">
            <header>
              <h2>{t('loanNumber', { id: loan.id })}</h2>
              <span className={`badge ${loan.balance <= 0 ? 'ok' : ''}`}>
                {loan.balance <= 0 ? t('paidOff') : `${loan.rate}% APR`}
              </span>
            </header>
            <dl className="meta">
              <div>
                <dt>{t('opened')}</dt>
                <dd>{formatDate(loan.date_taken)}</dd>
              </div>
              <div>
                <dt>{t('original')}</dt>
                <dd>{formatCurrency(loan.original_amount)}</dd>
              </div>
              <div>
                <dt>{t('balance')}</dt>
                <dd className="emphasis">{formatCurrency(loan.balance)}</dd>
              </div>
              <div>
                <dt>{t('estPayoff')}</dt>
                <dd>
                  {loan.projected_payoff ? formatDate(loan.projected_payoff) : t('setUpAutopay')}
                </dd>
              </div>
            </dl>
            {loan.schedule && (
              <p className="schedule-chip">
                {t('autopaySummary', {
                  amount: formatCurrency(loan.schedule.amount),
                  frequency: loan.schedule.frequency,
                  date: formatDate(loan.schedule.next_payment_date),
                })}
              </p>
            )}
            <div className="card-actions">
              <Link className="btn ghost" to={`/customer/loans/${loan.id}`}>
                {t('viewAndPay')}
              </Link>
            </div>
          </article>
        ))}
      </div>

      {!loading && loans.length === 0 && <p className="empty">{t('noLoansYet')}</p>}
    </div>
  );
}
