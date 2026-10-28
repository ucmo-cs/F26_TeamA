import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api, formatCurrency } from '../../api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function CreateLoan() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    original: '',
    rate: '',
    term_months: '60',
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(event) {
    const next = { ...form, [event.target.name]: event.target.value };
    setForm(next);

    const principal = Number(next.original);
    const rate = Number(next.rate);
    const term = Number(next.term_months) || 60;
    if (principal > 0 && rate >= 0 && term > 0) {
      const r = rate / 100 / 12;
      const payment =
        r === 0
          ? principal / term
          : (principal * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1);
      setPreview(Number(payment.toFixed(2)));
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/admin/loans', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          original: Number(form.original),
          rate: Number(form.rate),
          term_months: Number(form.term_months),
        }),
      });
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <p className="eyebrow">{t('admin')}</p>
      <h1>{t('createNewLoan')}</h1>
      <p className="muted">{t('createLoanDesc')}</p>

      <form onSubmit={handleSubmit} className="form-grid">
        <div>
          <label htmlFor="name">{t('customerName')}</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="email">{t('email')}</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="phone">{t('phone')}</label>
          <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="date">{t('dateTakenOut')}</label>
          <input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="original">{t('originalAmount')}</label>
          <input
            id="original"
            name="original"
            type="number"
            min="1"
            step="0.01"
            value={form.original}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="rate">{t('interestRate')}</label>
          <input
            id="rate"
            name="rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.rate}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="term_months">{t('termMonths')}</label>
          <input
            id="term_months"
            name="term_months"
            type="number"
            min="1"
            max="360"
            value={form.term_months}
            onChange={handleChange}
            required
          />
        </div>

        {preview != null && (
          <div className="calc-callout">
            <strong>{t('suggestedMonthly')}</strong>
            <span>{formatCurrency(preview)}</span>
            <small>{t('calcHint')}</small>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? t('creating') : t('createLoan')}
          </button>
          <Link to="/admin" className="btn ghost">
            {t('cancel')}
          </Link>
        </div>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
