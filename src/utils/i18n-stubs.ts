/**
 * i18n 대체 더미 함수
 * 모든 텍스트를 영어로 직접 반환하는 간단한 구현입니다.
 */

export const t = (key: string, text?: string | object, _options?: any): string => {
  // 텍스트가 있으면 그 텍스트 반환 (영어라 가정)
  if (typeof text === 'string') return text;
  
  // 객체 형태의 옵션이 있는 경우 (defaultValue가 있을 수 있음)
  if (text && typeof text === 'object' && 'defaultValue' in text) {
    return (text as any).defaultValue || key;
  }
  
  // 기본 문자열 반환
  switch(key) {
    case "ElevenLabs": return "ElevenLabs";
    case "Settings": return "Settings";
    case "Piper": return "Piper";
    case "URL": return "URL";
    case "API Key": return "API Key";
    case "Voice ID": return "Voice ID";
    case "TTS": return "TTS";
    case "not_using_alert": return "You are not currently using this backend. These settings will not be used.";
    case "Save": return "Save";
    case "Cancel": return "Cancel";
    case "Delete": return "Delete";
    case "Edit": return "Edit";
    case "Add": return "Add";
    case "Remove": return "Remove";
    case "Back": return "Back";
    case "Next": return "Next";
    case "Previous": return "Previous";
    case "Yes": return "Yes";
    case "No": return "No";
    case "OK": return "OK";
    case "Close": return "Close";
    case "Open": return "Open";
    case "Language": return "Language";
    case "Active": return "Active";
    case "Language settings are disabled. Only English is available.": return "Language settings are disabled. Only English is available.";
    // 기본적으로 키 그대로 반환
    default: return key;
  }
};

// 더미 useTranslation 훅
export const useTranslation = () => {
  return {
    t: t,
    i18n: {
      resolvedLanguage: 'en',
      changeLanguage: () => Promise.resolve()
    }
  };
};

// 더미 Trans 컴포넌트
export const Trans = ({ i18nKey, children, components, values, t: tProp, i18n, count, ...rest }: any) => {
  return children || i18nKey || null;
};

// 영어 텍스트만 제공하는 더미 withTranslation HOC
export const withTranslation = () => (Component: any) => Component;

// 더미 다국어 처리 변수 및 함수
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

// 더 많은 컴포넌트나 훅이 필요하면 추가
export const initReactI18next = { type: 'i18nextPlugin' };
export const LanguageDetector = { type: 'languageDetector' };

// 더미 언어 배열
export const langs = [
  { nativeName: 'English', code: 'en' }
]; 