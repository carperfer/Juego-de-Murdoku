import en from './en.json';
import es from './es.json';

export type LanguageCode = 'en' | 'es';

const translations = { en, es };

export function getTranslation(lang: LanguageCode, key: string, defaultValue: any = key): any {
  const keys = key.split('.');
  let current: any = translations[lang];

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return defaultValue;
    }
  }

  return current;
}

export function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/{(\w+)}/g, (_, key) => values[key] || `{${key}}`);
}

export function initializeLanguage(): LanguageCode {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('language');
    if (stored === 'es' || stored === 'en') {
      return stored;
    }
    const browserLang = navigator.language.startsWith('es') ? 'es' : 'en';
    localStorage.setItem('language', browserLang);
    return browserLang;
  }
  return 'en';
}

export function setLanguage(lang: LanguageCode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang);
  }
}
