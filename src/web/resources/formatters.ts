import type { SupportedLanguage } from '../../core/domain/i18n';
import {
  formatLocalizedDate,
  formatLocalizedDateTime,
  formatLocalizedNumber,
  toPersianNumeralDigits,
} from '../../core/services/localizationService';
import { getActiveLanguage } from './i18n';

/**
 * Converts Western/Arabic digits in a string or number strictly to Persian digits.
 * Preserved for Stage 2 compatibility and explicitly Persian contexts.
 */
export function toPersianDigits(value: string | number): string {
  return toPersianNumeralDigits(value);
}

/**
 * Formats numbers or digits according to the active language (`fa` -> Persian digits, `en` -> Latin digits).
 */
export function formatNumber(
  value: string | number,
  lang: SupportedLanguage = getActiveLanguage(),
): string {
  return formatLocalizedNumber(value, lang);
}

/**
 * Formats an ISO timestamp as Jalali (Persian) or Gregorian (English) date based on active language.
 */
export function formatDate(
  isoTimestamp: string | null | undefined,
  lang: SupportedLanguage = getActiveLanguage(),
): string {
  return formatLocalizedDate(isoTimestamp, lang);
}

/**
 * Formats an ISO timestamp with date & time according to active language.
 */
export function formatDateTime(
  isoTimestamp: string | null | undefined,
  lang: SupportedLanguage = getActiveLanguage(),
): string {
  return formatLocalizedDateTime(isoTimestamp, lang);
}

export function formatJalaliDatePersian(isoTimestamp: string | null | undefined): string {
  return formatLocalizedDate(isoTimestamp, 'fa');
}

export function formatJalaliDateTimePersian(isoTimestamp: string | null | undefined): string {
  return formatLocalizedDateTime(isoTimestamp, 'fa');
}

export function formatMediaSeconds(
  totalSeconds: number,
  lang: SupportedLanguage = getActiveLanguage(),
): string {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatted = hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  return formatLocalizedNumber(formatted, lang);
}

export function formatMediaSecondsPersian(totalSeconds: number): string {
  return formatMediaSeconds(totalSeconds, 'fa');
}

export function formatFileSizeParts(
  sizeBytes: number | null | undefined,
  lang: SupportedLanguage = getActiveLanguage(),
): {
  unit: 'bytes' | 'kb' | 'mb';
  value: string;
} | null {
  if (typeof sizeBytes !== 'number' || !Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return null;
  }
  if (sizeBytes < 1024) {
    return { unit: 'bytes', value: formatNumber(Math.round(sizeBytes), lang) };
  }
  const kb = sizeBytes / 1024;
  if (kb < 1024) {
    return { unit: 'kb', value: formatNumber(kb.toFixed(1).replace(/\.0$/, ''), lang) };
  }
  const mb = kb / 1024;
  return { unit: 'mb', value: formatNumber(mb.toFixed(1).replace(/\.0$/, ''), lang) };
}
