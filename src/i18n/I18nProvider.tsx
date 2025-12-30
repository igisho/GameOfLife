import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, isLocale, type Locale } from './locales';
import { MESSAGES } from './messages';
import { buildPathnameWithLocale, normalizeUrlToLocale, parseLocaleFromPathname } from './routing';

type TranslateParams = Record<string, string | number>;

export type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale, opts?: { replace?: boolean }) => void;
  t: (key: string, params?: TranslateParams) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, params?: TranslateParams) {
  if (!params) return template;
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, k: string) => {
    const v = params[k];
    return v === undefined || v === null ? '' : String(v);
  });
}

function translate(locale: Locale, key: string, params?: TranslateParams) {
  const dict = MESSAGES[locale];
  const fallback = MESSAGES[DEFAULT_LOCALE];

  const template = dict[key] ?? fallback[key] ?? key;
  return interpolate(template, params);
}

const STORAGE_KEY = 'conoway.locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  // Initial locale resolution + URL normalization.
  useEffect(() => {
    const storedLocale = window.localStorage.getItem(STORAGE_KEY);
    const norm = normalizeUrlToLocale({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      storedLocale,
      browserLocale: navigator.language,
    });

    if (norm.changed) {
      window.history.replaceState(null, '', norm.url);
    }

    setLocaleState(norm.locale);
    window.localStorage.setItem(STORAGE_KEY, norm.locale);
    setReady(true);
  }, []);

  // Keep locale in sync when the user navigates browser history.
  useEffect(() => {
    if (!ready) return;

    const onPopState = () => {
      const parsed = parseLocaleFromPathname(window.location.pathname);
      if (parsed.locale && parsed.locale !== locale) {
        setLocaleState(parsed.locale);
        window.localStorage.setItem(STORAGE_KEY, parsed.locale);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [locale, ready]);

  // Apply <html lang> and document title.
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.title = translate(locale, 'meta.title');
  }, [locale, ready]);

  const setLocale = useCallback(
    (next: Locale, opts?: { replace?: boolean }) => {
      if (!isLocale(next)) return;

      const parsed = parseLocaleFromPathname(window.location.pathname);
      const restPath = parsed.locale ? parsed.restPath : '/';
      const nextPathname = buildPathnameWithLocale(next, restPath);
      const nextUrl = `${nextPathname}${window.location.search}${window.location.hash}`;

      if (opts?.replace) window.history.replaceState(null, '', nextUrl);
      else window.history.pushState(null, '', nextUrl);

      setLocaleState(next);
      window.localStorage.setItem(STORAGE_KEY, next);
    },
    []
  );

  const t = useCallback((key: string, params?: TranslateParams) => translate(locale, key, params), [locale]);

  const value = useMemo<I18nContextValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  if (!ready) return null;
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used within I18nProvider');
  return value;
}
