import { useEffect, useState } from 'react';
import { cacheAllFonts, applyFontFaces } from '@/utils/fontCache';

export default function FontCacheInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // 로컬 폰트를 직접 사용하므로 폰트 캐싱은 필요하지 않음
    console.log('로컬 폰트를 사용하므로 폰트 캐싱 초기화를 건너뜁니다.');
    setInitialized(true);

    // 필요시 아래 코드 주석 해제
    /*
    // 폰트 캐싱 초기화 함수
    async function initFontCache() {
      if (initialized) return;
      
      try {
        // 폰트 파일 캐싱
        await cacheAllFonts();
        
        // 캐시된 폰트 적용
        await applyFontFaces();
        
        setInitialized(true);
        console.log('폰트 캐싱 초기화 완료');
      } catch (error) {
        console.error('폰트 캐싱 초기화 실패:', error);
      }
    }
    
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      // 페이지가 완전히 로드된 후 폰트 캐싱 시작
      if (document.readyState === 'complete') {
        // 약간의 지연을 통해 초기 렌더링 성능에 영향을 주지 않도록 함
        setTimeout(initFontCache, 2000);
      } else {
        window.addEventListener('load', () => setTimeout(initFontCache, 2000));
        return () => window.removeEventListener('load', initFontCache);
      }
    }
    */
  }, [initialized]);

  // UI 렌더링 없음
  return null;
} 