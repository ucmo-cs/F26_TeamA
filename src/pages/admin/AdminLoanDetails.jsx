import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api, formatCurrency } from '../../api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AdminLoanDetails() {
  const { id } = useParams();
  const { t, formatDate } = useLanguage();
  const [loan, setLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/admin/loans/${id}`)
      .then((data) => {
        setLoan(data.loan);
        setPayments(data.payments);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <p>
        {error}. <Link to="/admin">{t('backToLoans')}</Link>
      </p>
    );
  }

  if (!loan) return <p>{t('loading')}</p>;

  return (
    <section className="panel">
      <p className="eyebrow">{t('loanNumber', { id: loan.id })}</p>
      <h1>{loan.name}</h1>

      <dl className="detail-list">
        <div>
          <dt>{t('email')}</dt>
          <dd>{loan.email}</dd>
        </div>
        <div>
          <dt>{t('phone')}</dt>
          <dd>{loan.phone || '—'}</dd>
        </div>
        <div>
          <dt>{t('dateTakenOut')}</dt>
          <dd>{formatDate(loan.date_taken)}</dd>
        </div>
        <div>
          <dt>{t('originalAmountLabel')}</dt>
          <dd>{formatCurrency(loan.original_amount)}</dd>
        </div>
        <div>
          <dt>{t('stillOwed')}</dt>
          <dd className="emphasis">{formatCurrency(loan.balance)}</dd>
        </div>
        <div>
          <dt>{t('interestRate')}</dt>
          <dd>{loan.rate}% APR</dd>
        </div>
        <div>
          <dt>{t('suggestedMonthlyLabel')}</dt>
          <dd>{formatCurrency(loan.suggested_monthly)}</dd>
        </div>
        <div>
          <dt>{t('projectedPayoff')}</dt>
          <dd>
            {loan.projected_payoff ? formatDate(loan.projected_payoff) : t('notAvailable')}
          </dd>
        </div>
        <div>
          <dt>{t('bankAccount')}</dt>
          <dd>{loan.bank}</dd>
        </div>
        <div>
          <dt>{t('autopay')}</dt>
          <dd>
            {loan.schedule
              ? `${formatCurrency(loan.schedule.amount)} · ${loan.schedule.frequency} · ${t('next')} ${formatDate(loan.schedule.next_payment_date)}`
              : t('notScheduled')}
          </dd>
        </div>
      </dl>

      <h2 className="subhead">{t('paymentHistory')}</h2>
      {payments.length === 0 ? (
        <p className="muted">{t('noPaymentsRecorded')}</p>
      ) : (
        <ul className="timeline">
          {payments.map((p) => (
            <li key={p.id}>
              <span>{formatDate(p.payment_date)}</span>
              <strong>{formatCurrency(p.amount)}</strong>
              <em>{p.method}</em>
            </li>
          ))}
        </ul>
      )}

      <p>
        <Link to="/admin">{t('backToOutstanding')}</Link>
      </p>
    </section>
  );
}
