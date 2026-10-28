import { useState } from 'react';
import { useAuth } from '../../AuthContext';
import { api } from '../../api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function CustomerProfile() {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    bankDetails: user.bankDetails || user.bank || '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await api('/customer/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      updateUser(data.user);
      setMessage(t('profileUpdated'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <p className="eyebrow">{t('account')}</p>
      <h1>{t('editInfo')}</h1>
      <p className="muted">{t('editInfoDesc')}</p>

      <form onSubmit={handleSubmit} className="form-grid">
        <div>
          <label htmlFor="name">{t('fullName')}</label>
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
          <label htmlFor="bankDetails">{t('bankAccount')}</label>
          <input
            id="bankDetails"
            name="bankDetails"
            value={form.bankDetails}
            onChange={handleChange}
            placeholder="Bank name — account ending in ####"
          />
        </div>
        <div>
          <label>{t('username')}</label>
          <input value={user.username} disabled />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? t('saving') : t('saveChanges')}
          </button>
        </div>
      </form>

      {message && <p className="success">{message}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
