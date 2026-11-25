import type { ICultureStorage } from '../../core/abstractions/cultureStorage';
import {
  CULTURE_COOKIE_MAX_AGE_SECONDS,
  CULTURE_COOKIE_NAME,
  type SupportedLanguage,
} from '../../core/domain/i18n';
import { isSupportedLanguage } from '../../core/services/localizationService';

const FALLBACK_STORAGE_KEY = 'ma_lang_fallback';

export interface CultureCookieAdapter {
  getCookieString(): string;
  setCookieString(cookieAssignment: string): void;
}

export interface CultureFallbackAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultCookieAdapter(): CultureCookieAdapter | null {
  if (typeof document === 'undefined' || typeof document.cookie !== 'string') {
    return null;
  }
  return {
    getCookieString: () => document.cookie,
    setCookieString: (assignment: string) => {
      document.cookie = assignment;
    },
  };
}

function defaultFallbackAdapter(): CultureFallbackAdapter | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function readCookieOnly(
  cookieAdapter: CultureCookieAdapter | null,
  name: string,
): string | null {
  if (!cookieAdapter) {
    return null;
  }
  let rawString = '';
  try {
    rawString = cookieAdapter.getCookieString();
  } catch {
    return null;
  }
  if (!rawString) {
    return null;
  }
  const cookies = rawString.split(';');
  const prefix = `${name}=`;
  for (const raw of cookies) {
    const trimmed = raw.trim();
    if (trimmed.startsWith(prefix)) {
      const rawValue = trimmed.slice(prefix.length).trim();
      if (!rawValue) {
        return null;
      }
      try {
        const decoded = decodeURIComponent(rawValue).trim();
        return decoded || null;
      } catch {
        return rawValue;
      }
    }
  }
  return null;
}

export class BrowserCultureCookieStorage implements ICultureStorage {
  private readonly customCookieAdapter?: CultureCookieAdapter;
  private readonly customFallbackAdapter?: CultureFallbackAdapter | null;

  constructor(options?: {
    cookieAdapter?: CultureCookieAdapter;
    fallbackAdapter?: CultureFallbackAdapter | null;
  }) {
    this.customCookieAdapter = options?.cookieAdapter;
    this.customFallbackAdapter = options?.fallbackAdapter;
  }

  private getCookieAdapter(): CultureCookieAdapter | null {
    return this.customCookieAdapter ?? defaultCookieAdapter();
  }

  private getFallbackAdapter(): CultureFallbackAdapter | null {
    if (this.customFallbackAdapter !== undefined) {
      return this.customFallbackAdapter;
    }
    return defaultFallbackAdapter();
  }

  public getLanguage(): SupportedLanguage | null {
    const fromCookie = readCookieOnly(this.getCookieAdapter(), CULTURE_COOKIE_NAME);
    if (isSupportedLanguage(fromCookie)) {
      return fromCookie;
    }

    const fallback = this.getFallbackAdapter();
    if (fallback) {
      try {
        const stored = fallback.getItem(FALLBACK_STORAGE_KEY);
        if (isSupportedLanguage(stored)) {
          return stored;
        }
      } catch {
        // Ignore storage restrictions
      }
    }

    return null;
  }

  public setLanguage(
    lang: SupportedLanguage,
    maxAgeSeconds: number = CULTURE_COOKIE_MAX_AGE_SECONDS,
  ): void {
    if (!isSupportedLanguage(lang)) {
      this.clearLanguage();
      return;
    }

    const ttl =
      Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0
        ? Math.floor(maxAgeSeconds)
        : CULTURE_COOKIE_MAX_AGE_SECONDS;

    const cookieAdapter = this.getCookieAdapter();
    if (cookieAdapter) {
      try {
        cookieAdapter.setCookieString(
          `${CULTURE_COOKIE_NAME}=${encodeURIComponent(lang)}; max-age=${ttl}; path=/; SameSite=Lax`,
        );
      } catch {
        // Fallback below handles restricted environments
      }
    }

    const fallback = this.getFallbackAdapter();
    const verifiedCookie = readCookieOnly(cookieAdapter, CULTURE_COOKIE_NAME);
    if (verifiedCookie === lang) {
      if (fallback) {
        try {
          fallback.removeItem(FALLBACK_STORAGE_KEY);
        } catch {
          // Ignore
        }
      }
    } else if (fallback) {
      try {
        fallback.setItem(FALLBACK_STORAGE_KEY, lang);
      } catch {
        // Ignore
      }
    }
  }

  public clearLanguage(): void {
    const cookieAdapter = this.getCookieAdapter();
    if (cookieAdapter) {
      try {
        cookieAdapter.setCookieString(
          `${CULTURE_COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`,
        );
      } catch {
        // Ignore
      }
    }

    const fallback = this.getFallbackAdapter();
    if (fallback) {
      try {
        fallback.removeItem(FALLBACK_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  }
}
