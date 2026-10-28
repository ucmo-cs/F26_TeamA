import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from './translations';

const LANG_KEY = 'lrt_lang';
const LanguageContext = createContext(null);

function getInitialLang() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'es' || saved === 'en') return saved;
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    function setLang(next) {
      const resolved = next === 'es' ? 'es' : 'en';
      localStorage.setItem(LANG_KEY, resolved);
      setLangState(resolved);
    }

    function t(key, vars) {
      const dict = translations[lang] || translations.en;
      let text = dict[key] ?? translations.en[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([name, value]) => {
          text = text.replaceAll(`{{${name}}}`, String(value));
        });
      }
      return text;
    }

    function formatDate(isoDate) {
      if (!isoDate) return '—';
      const d = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00`);
      if (Number.isNaN(d.getTime())) return isoDate;
      return d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    return { lang, setLang, t, formatDate, locale: lang === 'es' ? 'es-ES' : 'en-US' };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
