/**
 * Simple i18n stubs implementation
 * Provides direct English text with minimal overhead
 */

export const t = (key: string, text?: string | object, _options?: any): string => {
  // Return text if provided directly
  if (typeof text === 'string') return text;
  
  // Handle object format (with defaultValue)
  if (text && typeof text === 'object' && 'defaultValue' in text) {
    return (text as any).defaultValue || key;
  }
  
  // Return key as is (English only)
  return key;
};

// Simple useTranslation hook
export const useTranslation = () => {
  return {
    t: t,
    i18n: {
      resolvedLanguage: 'en',
      changeLanguage: () => Promise.resolve()
    }
  };
};

// Dummy Trans component
export const Trans = ({ i18nKey, children }: any) => {
  return children || i18nKey || null;
};

// Dummy withTranslation HOC
export const withTranslation = () => (Component: any) => Component;

// Minimal i18n object
export const i18n = {
  t,
  use: () => i18n,
  init: () => Promise.resolve(i18n),
  changeLanguage: () => Promise.resolve(),
  resolvedLanguage: 'en',
  language: 'en',
  languages: ['en'],
  getFixedT: () => t,
  exists: () => true,
  on: () => i18n,
  off: () => i18n
};

export default i18n;

// Additional exports for compatibility
export const initReactI18next = { type: 'i18nextPlugin' };
export const LanguageDetector = { type: 'languageDetector' };

// Languages array with only English
export const langs = [
  { nativeName: 'English', code: 'en' }
]; 