import { Link } from 'react-router';
import { useLanguage } from '../i18n/LanguageContext';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="home">
      <section className="hero">
        <p className="eyebrow">{t('homeEyebrow')}</p>
        <h1>{t('appName')}</h1>
        <p className="lede">{t('homeLede')}</p>
        <div className="cta-row">
          <Link className="btn primary" to="/customer/login">
            {t('customerLogin')}
          </Link>
          <Link className="btn ghost" to="/admin/login">
            {t('adminLogin')}
          </Link>
        </div>
      </section>
    </div>
  );
}
