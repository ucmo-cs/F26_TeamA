import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AdminEmails() {
  const { t, formatDate } = useLanguage();
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/emails')
      .then((data) => setEmails(data.emails))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('admin')}</p>
          <h1>{t('emailConfirmations')}</h1>
          <p className="muted">{t('emailConfirmationsDesc')}</p>
        </div>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="email-list">
        {emails.map((email) => (
          <article key={email.id} className="email-card">
            <header>
              <h2>{email.subject}</h2>
              <time>{formatDate(email.sent_at)}</time>
            </header>
            <p className="to">
              {t('to')}: {email.to_email}
            </p>
            <pre>{email.body}</pre>
          </article>
        ))}
        {emails.length === 0 && !error && <p className="empty">{t('noEmails')}</p>}
      </div>
    </div>
  );
}
