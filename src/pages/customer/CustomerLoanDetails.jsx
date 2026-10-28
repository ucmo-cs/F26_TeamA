import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api, formatCurrency } from '../../api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function CustomerLoanDetails() {
  const { id } = useParams();
  const { t, formatDate } = useLanguage();
  const [loan, setLoan] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/customer/loans/${id}`)
      .then((data) => setLoan(data.loan))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error && !loan) {
    return (
      <p>
        {error}. <Link to="/customer">{t('backToDashboard')}</Link>
      </p>
    );
  }

  if (!loan) return <p>{t('loading')}</p>;

  return (
    <section className="panel">
      <p className="eyebrow">{t('yourLoan')}</p>
      <h1>{t('loanNumber', { id: loan.id })}</h1>

      <dl className="detail-list">
        <div>
          <dt>{t('opened')}</dt>
          <dd>{formatDate(loan.date_taken)}</dd>
        </div>
        <div>
          <dt>{t('originalAmountLabel')}</dt>
          <dd>{formatCurrency(loan.original_amount)}</dd>
        </div>
        <div>
          <dt>{t('balance')}</dt>
          <dd className="emphasis">{formatCurrency(loan.balance)}</dd>
        </div>
        <div>
          <dt>{t('interestRate')}</dt>
          <dd>{loan.rate}% APR</dd>
        </div>
        <div>
          <dt>{t('minimumPayment')}</dt>
          <dd>{formatCurrency(loan.minimum_payment || loan.suggested_monthly)}</dd>
        </div>
        <div>
          <dt>{t('projectedPayoff')}</dt>
          <dd>
            {loan.projected_payoff ? formatDate(loan.projected_payoff) : t('notAvailable')}
          </dd>
        </div>
        <div>
          <dt>{t('bankAccount')}</dt>
          <dd>{loan.bank || '—'}</dd>
        </div>
      </dl>

      <p className="muted">{t('paymentsExternalNote')}</p>

      <p>
        <Link to="/customer/schedule" className="btn primary">
          {t('schedulePayment')}
        </Link>{' '}
        <Link to="/customer">← {t('backToDashboard')}</Link>
      </p>
    </section>
  );
}
