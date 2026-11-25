import type { SupportedLanguage } from '../domain/i18n';

export interface ICultureStorage {
  getLanguage(): SupportedLanguage | null;
  setLanguage(lang: SupportedLanguage, maxAgeSeconds?: number): void;
  clearLanguage(): void;
}
