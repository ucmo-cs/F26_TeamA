import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function Login({ role }) {
  const isAdmin = role === 'admin';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password, role);
      navigate(isAdmin ? '/admin' : '/customer');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel auth-panel">
      <p className="eyebrow">{isAdmin ? t('staffAccess') : t('userAccess')}</p>
      <h1>{isAdmin ? t('adminLoginTitle') : t('customerLoginTitle')}</h1>
      <p className="muted">{isAdmin ? t('adminLoginDesc') : t('customerLoginDesc')}</p>

      <form onSubmit={handleLogin}>
        <label htmlFor="username">{t('username')}</label>
        <input
          id="username"
          aria-label={t('username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password">{t('password')}</label>
        <input
          id="password"
          aria-label={t('password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? t('signingIn') : t('signIn')}
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="demo-hint">
        <p>
          {t('username')}:{' '}
          <code>{isAdmin ? 'admin' : 'collin, tyreek, or patrick'}</code>
        </p>
        <p>
          {t('password')}: <code>{isAdmin ? 'admin123' : 'customer123'}</code>
        </p>
      </div>

      <p className="switch-portal">
        {isAdmin ? (
          <Link to="/customer/login">{t('customerLogin')}</Link>
        ) : (
          <Link to="/admin/login">{t('adminLogin')}</Link>
        )}
      </p>
    </section>
  );
}
