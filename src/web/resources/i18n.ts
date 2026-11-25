import {
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
  type TranslationCoverageReport,
} from '../../core/domain/i18n';
import {
  getTranslationCoverageReport,
  normalizeSupportedLanguage,
  resolveTranslation,
} from '../../core/services/localizationService';
import { BrowserCultureCookieStorage } from '../../infrastructure/storage/BrowserCultureCookieStorage';
import { enResources } from './en';
import { faResources, type ResourceKey } from './fa';

export type TranslationParams = Record<string, string | number>;

const initialCookieStorage = new BrowserCultureCookieStorage();
let activeLanguage: SupportedLanguage =
  initialCookieStorage.getLanguage() ?? DEFAULT_LANGUAGE;

const languageListeners = new Set<() => void>();

export function getActiveLanguage(): SupportedLanguage {
  return activeLanguage;
}

export function setActiveLanguage(lang: SupportedLanguage): void {
  const normalized = normalizeSupportedLanguage(lang);
  if (activeLanguage === normalized) {
    return;
  }
  activeLanguage = normalized;
  for (const listener of languageListeners) {
    try {
      listener();
    } catch {
      // Ignore listener errors
    }
  }
}

export function subscribeActiveLanguage(listener: () => void): () => void {
  languageListeners.add(listener);
  return () => {
    languageListeners.delete(listener);
  };
}

export function getTranslationCoverage(): TranslationCoverageReport {
  return getTranslationCoverageReport({
    fa: faResources,
    en: enResources,
  });
}

/**
 * Translates a resource key using the active language dictionary (`fa` or `en`).
 * Untranslated English keys safely fall back to Persian (`fa.ts`), and unknown keys fall back to the key itself.
 */
export function t(
  key: ResourceKey | (string & {}),
  params?: TranslationParams,
  explicitLanguage?: SupportedLanguage,
): string {
  const lang = explicitLanguage ?? activeLanguage;
  return resolveTranslation(
    key,
    lang,
    {
      fa: faResources,
      en: enResources,
    },
    params,
  );
}
