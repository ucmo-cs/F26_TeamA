import { Link, useNavigate } from 'react-router';
import { useAuth } from './AuthContext';
import { useLanguage } from './i18n/LanguageContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="brand">
        <Link to={user ? (user.role === 'admin' ? '/admin' : '/customer') : '/'}>
          Loan Repayment <span>Tracker</span>
        </Link>
      </div>

      <div className="header-right">
        <label className="lang-switch" htmlFor="lang-select">
          <span className="visually-hidden">{t('language')}</span>
          <select
            id="lang-select"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            aria-label={t('language')}
          >
            <option value="en">{t('english')}</option>
            <option value="es">{t('spanish')}</option>
          </select>
        </label>

        <nav>
          {!user && (
            <>
              <Link to="/customer/login">{t('navCustomer')}</Link>
              <Link to="/admin/login">{t('navAdmin')}</Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link to="/admin">{t('navLoans')}</Link>
              <Link to="/admin/loans/new">{t('navNewLoan')}</Link>
              <Link to="/admin/emails">{t('navEmails')}</Link>
            </>
          )}

          {user?.role === 'customer' && (
            <>
              <Link to="/customer">{t('navDashboard')}</Link>
              <Link to="/customer/schedule">{t('navPayments')}</Link>
              <Link to="/customer/profile">{t('navProfile')}</Link>
            </>
          )}

          {user && (
            <button type="button" className="linkish" onClick={handleLogout}>
              {t('signOut')}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
