/**
 * i18n 대체 더미 함수
 * 모든 텍스트를 영어로 직접 반환하는 간단한 구현입니다.
 */

export const t = (key: string, text?: string | object, _options?: any): string => {
  // 텍스트가 있으면 그 텍스트 반환 (영어라 가정)
  if (typeof text === 'string') return text;
  
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
    // 다른 필요한 키워드 추가
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
export const Trans = ({ i18nKey, children }: { i18nKey?: string, children?: React.ReactNode }) => {
  return children || i18nKey || null;
};

// 영어 텍스트만 제공하는 더미 withTranslation HOC
export const withTranslation = () => (Component: any) => Component; 