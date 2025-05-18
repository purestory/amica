/**
 * i18n 대체 더미 함수
 * 영어만 사용하는 경우, 이 간단한 스텁 구현으로 기존 i18n 기능을 대체합니다.
 */

// 간단한 t 함수 - 그냥 키 반환
export const t = (key: string, text?: string | object): string => {
  if (typeof text === 'string') return text;
  if (typeof text === 'object') return key;
  return key;
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