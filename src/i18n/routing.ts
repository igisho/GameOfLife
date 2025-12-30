import { DEFAULT_LOCALE, isLocale, type Locale } from './locales';

export type ParsedLocalePath = {
  locale: Locale | null;
  restPath: string; // always starts with '/'
};

export function parseLocaleFromPathname(pathname: string): ParsedLocalePath {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const parts = clean.split('/').filter(Boolean);

  const first = parts[0];
  if (first && isLocale(first)) {
    const restParts = parts.slice(1);
    const restPath = restParts.length ? `/${restParts.join('/')}` : '/';
    return { locale: first, restPath };
  }

  return { locale: null, restPath: clean || '/' };
}

export function buildPathnameWithLocale(locale: Locale, restPath: string) {
  const rest = restPath.startsWith('/') ? restPath : `/${restPath}`;
  const suffix = rest === '/' ? '' : rest;
  return `/${locale}${suffix}`;
}

export function resolvePreferredLocale({
  stored,
  browser,
  fallback = DEFAULT_LOCALE,
}: {
  stored: string | null;
  browser: string | null;
  fallback?: Locale;
}): Locale {
  if (stored && isLocale(stored)) return stored;

  const browserPrimary = browser?.split('-')[0]?.toLowerCase() ?? '';
  if (isLocale(browserPrimary)) return browserPrimary;

  return fallback;
}

export function normalizeUrlToLocale({
  pathname,
  search,
  hash,
  storedLocale,
  browserLocale,
}: {
  pathname: string;
  search: string;
  hash: string;
  storedLocale: string | null;
  browserLocale: string | null;
}) {
  const parsed = parseLocaleFromPathname(pathname);

  if (parsed.locale) {
    return {
      locale: parsed.locale,
      url: `${pathname}${search}${hash}`,
      changed: false,
      restPath: parsed.restPath,
    };
  }

  const locale = resolvePreferredLocale({ stored: storedLocale, browser: browserLocale });
  const nextPathname = buildPathnameWithLocale(locale, parsed.restPath);

  return {
    locale,
    url: `${nextPathname}${search}${hash}`,
    changed: true,
    restPath: parsed.restPath,
  };
}
