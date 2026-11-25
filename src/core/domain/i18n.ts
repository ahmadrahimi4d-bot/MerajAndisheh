export type SupportedLanguage = 'fa' | 'en';

export type TextDirection = 'rtl' | 'ltr';

export type CalendarSystem = 'jalali' | 'gregorian';

export type LocaleFontFamilyKind = 'vazirmatn' | 'system';

export const DEFAULT_LANGUAGE: SupportedLanguage = 'fa';

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ['fa', 'en'] as const;

export const CULTURE_COOKIE_NAME = 'ma_lang';
export const CULTURE_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export interface LocaleConfig {
  readonly code: SupportedLanguage;
  readonly dir: TextDirection;
  readonly calendar: CalendarSystem;
  readonly usePersianDigits: boolean;
  readonly fontFamilyKind: LocaleFontFamilyKind;
  readonly nativeLabel: string;
  readonly shortLabel: string;
}

export const LOCALE_CONFIGS: Readonly<Record<SupportedLanguage, LocaleConfig>> = Object.freeze({
  fa: Object.freeze({
    code: 'fa',
    dir: 'rtl',
    calendar: 'jalali',
    usePersianDigits: true,
    fontFamilyKind: 'vazirmatn',
    nativeLabel: 'فارسی',
    shortLabel: 'فا',
  }),
  en: Object.freeze({
    code: 'en',
    dir: 'ltr',
    calendar: 'gregorian',
    usePersianDigits: false,
    fontFamilyKind: 'system',
    nativeLabel: 'English',
    shortLabel: 'EN',
  }),
});

export interface UntranslatedKeyEntry {
  key: string;
  faValue: string;
}

export interface TranslationCoverageReport {
  totalKeysCount: number;
  translatedKeysCount: number;
  untranslatedKeysCount: number;
  coveragePercent: number;
  untranslatedKeys: UntranslatedKeyEntry[];
}
