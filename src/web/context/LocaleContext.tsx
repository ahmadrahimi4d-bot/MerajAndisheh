import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LANGUAGE,
  type LocaleConfig,
  type SupportedLanguage,
  type TranslationCoverageReport,
} from '../../core/domain/i18n';
import {
  getLocaleConfig,
  normalizeSupportedLanguage,
} from '../../core/services/localizationService';
import {
  getTranslationCoverage,
  setActiveLanguage,
} from '../resources/i18n';
import { appContainer } from '../services/appContainer';

export interface LocaleContextValue {
  language: SupportedLanguage;
  localeConfig: LocaleConfig;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  coverageReport: TranslationCoverageReport;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function applyDocumentLocaleAttributes(lang: SupportedLanguage): void {
  if (typeof document === 'undefined' || !document.documentElement) {
    return;
  }
  const config = getLocaleConfig(lang);
  document.documentElement.lang = config.code;
  document.documentElement.dir = config.dir;
  document.documentElement.setAttribute('data-lang', config.code);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const initial = appContainer.cultureStorage.getLanguage() ?? DEFAULT_LANGUAGE;
    setActiveLanguage(initial);
    applyDocumentLocaleAttributes(initial);
    return initial;
  });

  useEffect(() => {
    setActiveLanguage(language);
    applyDocumentLocaleAttributes(language);
  }, [language]);

  const setLanguage = useCallback((next: SupportedLanguage) => {
    const normalized = normalizeSupportedLanguage(next);
    appContainer.cultureStorage.setLanguage(normalized);
    setActiveLanguage(normalized);
    applyDocumentLocaleAttributes(normalized);
    setLanguageState(normalized);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'fa' ? 'en' : 'fa');
  }, [language, setLanguage]);

  const localeConfig = useMemo(() => getLocaleConfig(language), [language]);
  const coverageReport = useMemo(() => getTranslationCoverage(), []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      localeConfig,
      setLanguage,
      toggleLanguage,
      coverageReport,
    }),
    [language, localeConfig, setLanguage, toggleLanguage, coverageReport],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used inside LocaleProvider');
  }
  return ctx;
}
