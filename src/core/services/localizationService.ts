import {
  DEFAULT_LANGUAGE,
  LOCALE_CONFIGS,
  SUPPORTED_LANGUAGES,
  type LocaleConfig,
  type SupportedLanguage,
  type TranslationCoverageReport,
  type UntranslatedKeyEntry,
} from '../domain/i18n';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

export interface TranslationDictionaries {
  fa: Readonly<Record<string, string>>;
  en?: Readonly<Partial<Record<string, string>>>;
}

export type LocalizationParams = Readonly<Record<string, string | number>>;

export function isSupportedLanguage(
  value: string | null | undefined,
): value is SupportedLanguage {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(normalized);
}

export function normalizeSupportedLanguage(
  value: string | null | undefined,
): SupportedLanguage {
  if (!value || typeof value !== 'string') {
    return DEFAULT_LANGUAGE;
  }
  const normalized = value.trim().toLowerCase();
  return isSupportedLanguage(normalized) ? normalized : DEFAULT_LANGUAGE;
}

export function getLocaleConfig(lang: SupportedLanguage): LocaleConfig {
  return LOCALE_CONFIGS[lang] ?? LOCALE_CONFIGS[DEFAULT_LANGUAGE];
}

export function interpolateTranslationParams(
  template: string,
  params?: LocalizationParams,
): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, token: string) => {
    if (Object.prototype.hasOwnProperty.call(params, token)) {
      return String(params[token]);
    }
    return match;
  });
}

export function resolveTranslation(
  key: string,
  lang: SupportedLanguage,
  dictionaries: TranslationDictionaries,
  params?: LocalizationParams,
): string {
  if (!key || typeof key !== 'string') {
    return '';
  }

  let resolved: string | undefined;

  if (lang === 'en' && dictionaries.en) {
    if (Object.prototype.hasOwnProperty.call(dictionaries.en, key)) {
      const candidate = dictionaries.en[key];
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        resolved = candidate;
      }
    }
  }

  if (resolved === undefined && Object.prototype.hasOwnProperty.call(dictionaries.fa, key)) {
    const faCandidate = dictionaries.fa[key];
    if (typeof faCandidate === 'string' && faCandidate.length > 0) {
      resolved = faCandidate;
    }
  }

  if (resolved === undefined) {
    return key;
  }

  return interpolateTranslationParams(resolved, params);
}

export function getTranslationCoverageReport(
  dictionaries: TranslationDictionaries,
): TranslationCoverageReport {
  const keys = Object.keys(dictionaries.fa);
  const enDict = dictionaries.en ?? {};
  const untranslatedKeys: UntranslatedKeyEntry[] = [];
  let translatedKeysCount = 0;

  for (const key of keys) {
    const enValue = Object.prototype.hasOwnProperty.call(enDict, key) ? enDict[key] : undefined;
    if (typeof enValue === 'string' && enValue.trim().length > 0) {
      translatedKeysCount += 1;
    } else {
      untranslatedKeys.push({
        key,
        faValue: dictionaries.fa[key] ?? '',
      });
    }
  }

  const totalKeysCount = keys.length;
  const untranslatedKeysCount = untranslatedKeys.length;
  const coveragePercent =
    totalKeysCount > 0
      ? Math.round((translatedKeysCount / totalKeysCount) * 1000) / 10
      : 100;

  return {
    totalKeysCount,
    translatedKeysCount,
    untranslatedKeysCount,
    coveragePercent,
    untranslatedKeys,
  };
}

export function toLatinDigits(value: string | number): string {
  return String(value)
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

export function toPersianNumeralDigits(value: string | number): string {
  return String(value)
    .replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit)
    .replace(/[٠-٩]/g, (digit) => {
      const code = digit.charCodeAt(0) - 0x0660;
      return PERSIAN_DIGITS[code] ?? digit;
    });
}

export function formatLocalizedNumber(
  value: string | number,
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
): string {
  const config = getLocaleConfig(lang);
  return config.usePersianDigits
    ? toPersianNumeralDigits(value)
    : toLatinDigits(value);
}

function gregorianToJalaliTuple(gy: number, gm: number, gd: number): [number, number, number] {
  const gDaysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    gDaysInMonth[gm - 1];

  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

function padTwoDigits(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatLocalizedDate(
  isoTimestamp: string | null | undefined,
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
): string {
  if (!isoTimestamp) {
    return '—';
  }
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const config = getLocaleConfig(lang);
  if (config.calendar === 'gregorian') {
    const formatted = `${date.getFullYear()}/${padTwoDigits(date.getMonth() + 1)}/${padTwoDigits(date.getDate())}`;
    return formatLocalizedNumber(formatted, lang);
  }

  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const formatted = formatter.format(date);
    if (formatted && formatted.trim().length > 0) {
      return formatLocalizedNumber(formatted, lang);
    }
  } catch {
    // Fallback to pure Jalali arithmetic below
  }

  const [jy, jm, jd] = gregorianToJalaliTuple(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
  return formatLocalizedNumber(`${jy}/${padTwoDigits(jm)}/${padTwoDigits(jd)}`, lang);
}

export function formatLocalizedDateTime(
  isoTimestamp: string | null | undefined,
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
): string {
  if (!isoTimestamp) {
    return '—';
  }
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const config = getLocaleConfig(lang);
  if (config.calendar === 'gregorian') {
    const datePart = formatLocalizedDate(isoTimestamp, lang);
    const timePart = `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`;
    return formatLocalizedNumber(`${datePart} ${timePart}`, lang);
  }

  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const formatted = formatter.format(date);
    if (formatted && formatted.trim().length > 0) {
      return formatLocalizedNumber(formatted, lang);
    }
  } catch {
    // Fallback below
  }

  const datePart = formatLocalizedDate(isoTimestamp, lang);
  const timePart = formatLocalizedNumber(
    `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`,
    lang,
  );
  return `${datePart} - ${timePart}`;
}

export function filterContentsByLanguageWithFallback<
  T extends { languageCode?: string | null },
>(items: readonly T[], activeLang: SupportedLanguage): T[] {
  const normalizeCode = (raw: string | null | undefined): string =>
    (raw ?? DEFAULT_LANGUAGE).trim().toLowerCase() || DEFAULT_LANGUAGE;

  const faItems = items.filter((item) => normalizeCode(item.languageCode) === 'fa');
  if (activeLang === 'fa') {
    return faItems;
  }

  const targetItems = items.filter(
    (item) => normalizeCode(item.languageCode) === activeLang,
  );
  if (targetItems.length > 0) {
    return targetItems;
  }

  // Safe fallback to Persian items when no English content is published yet
  return faItems;
}
