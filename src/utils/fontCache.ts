import Dexie, { Table } from 'dexie';

interface FontCache {
  url: string;
  data: ArrayBuffer;
  timestamp: number;
}

class FontCacheDB extends Dexie {
  fontFiles!: Table<FontCache>;

  constructor() {
    super('AmicaFontCache');
    this.version(1).stores({
      fontFiles: 'url' // Primary key is url
    });
  }
}

export const fontDB = new FontCacheDB();

// 로컬 캐싱용 폰트 키 (Next.js가 최적화한 웹 폰트 URL은 빌드마다 변경됨)
export const FONT_KEYS = [
  'mplus2-regular',
  'mplus2-bold',
  'montserrat-regular',
  'montserrat-bold'
];

// 폰트 파일을 캐시에 저장
export async function cacheFontFile(key: string, data: ArrayBuffer): Promise<void> {
  try {
    console.log(`캐싱 폰트 파일: ${key}`);
    await fontDB.fontFiles.put({
      url: key,
      data,
      timestamp: Date.now()
    });
    console.log(`폰트 파일 캐싱 완료: ${key}`);
  } catch (error) {
    console.error('폰트 캐싱 실패:', error);
  }
}

// 폰트 파일을 캐시에서 가져오기
export async function getFontFromCache(key: string): Promise<ArrayBuffer | null> {
  try {
    const cached = await fontDB.fontFiles.get(key);
    if (cached) {
      console.log(`캐시에서 폰트 파일 로드: ${key}`);
      return cached.data;
    }
    return null;
  } catch (error) {
    console.error('폰트 캐시 로드 실패:', error);
    return null;
  }
}

// 특정 키에 대한 폰트 파일 캐싱 여부 확인
export async function isFontCached(key: string): Promise<boolean> {
  try {
    const cached = await fontDB.fontFiles.get(key);
    return !!cached;
  } catch (error) {
    console.error('폰트 캐시 확인 실패:', error);
    return false;
  }
}

// 현재 로드된 폰트 URL 추출 (Next.js가 로드한 폰트 URL)
export function extractLoadedFontUrls(): string[] {
  const fontUrls: string[] = [];
  
  try {
    // 로컬 폰트 CSS URL 확인
    const localFontsLinkElements = Array.from(document.querySelectorAll('link[href*="/fonts/fonts.css"]'));
    
    if (localFontsLinkElements.length > 0) {
      console.log(`발견된 로컬 폰트 링크: ${localFontsLinkElements.length}개`);
      // 로컬 폰트 파일 경로 반환
      return [
        '/fonts/mplus2-regular.ttf',
        '/fonts/mplus2-bold.ttf',
        '/fonts/montserrat-regular.ttf',
        '/fonts/montserrat-bold.ttf'
      ];
    }
    
    // Google Fonts CSS URL에서 직접 폰트 파일 가져오기
    const googleFontsLinkElements = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'));
    
    if (googleFontsLinkElements.length > 0) {
      console.log(`발견된 Google Fonts 링크: ${googleFontsLinkElements.length}개`);
      // 이미 Google Fonts를 사용 중이면 직접 ttf URL 생성
      return [
        'https://fonts.gstatic.com/s/mplus2/v12/7Auhp_Eq3gO_OGbGGhjdwrDdpeIBxlkwOa6Vxg.ttf',
        'https://fonts.gstatic.com/s/mplus2/v12/7Auhp_Eq3gO_OGbGGhjdwrDdpeIBxlkw3qmVxg.ttf',
        'https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf',
        'https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w-.ttf'
      ];
    }
    
    // Next.js 최적화 폰트 찾기
    const nextFontElements = Array.from(document.querySelectorAll('style[data-href*="/_next/static/media/"]'));
    if (nextFontElements.length > 0) {
      console.log(`발견된 Next.js 폰트 스타일 태그: ${nextFontElements.length}개`);
    }
    
    // 문서 내의 모든 링크 태그 확인
    const linkElements = Array.from(document.querySelectorAll('link[rel="preload"][as="font"]'));
    for (const link of linkElements) {
      const href = link.getAttribute('href');
      if (href && (href.includes('.woff2') || href.includes('.ttf') || href.includes('.otf'))) {
        fontUrls.push(href);
        console.log(`발견된 폰트 링크: ${href}`);
      }
    }
    
    // DOM에서 폰트 사용하는 요소 스타일 확인 (대체 폰트 URL 추출)
    const allElements = document.querySelectorAll('*');
    let fontElements = 0;
    
    for (const element of allElements) {
      try {
        const style = window.getComputedStyle(element);
        const fontFamily = style.getPropertyValue('font-family').toLowerCase();
        
        if (fontFamily.includes('m plus 2') || fontFamily.includes('montserrat')) {
          console.log(`M PLUS 2 또는 Montserrat 폰트를 사용하는 요소 발견: ${element.tagName}`);
          fontElements++;
          
          // 너무 많은 요소 확인 방지
          if (fontElements > 100) break;
        }
      } catch (error) {
        // DOM 스타일 접근 실패 무시
      }
    }
    
    if (fontUrls.length === 0) {
      // 폰트 URL을 발견하지 못한 경우, 로컬 폰트 파일 경로 사용
      return [
        '/fonts/mplus2-regular.ttf',
        '/fonts/mplus2-bold.ttf',
        '/fonts/montserrat-regular.ttf',
        '/fonts/montserrat-bold.ttf'
      ];
    }
  } catch (error) {
    console.error('폰트 URL 추출 실패:', error);
    // 오류 발생 시 로컬 폰트 파일 경로 사용
    return [
      '/fonts/mplus2-regular.ttf',
      '/fonts/mplus2-bold.ttf',
      '/fonts/montserrat-regular.ttf',
      '/fonts/montserrat-bold.ttf'
    ];
  }
  
  return fontUrls;
}

// 폰트 URL과 키 매핑
export function mapFontUrlsToKeys(fontUrls: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  for (const url of fontUrls) {
    if (url.includes('mplus2-regular') || url.includes('mplus2/v') && url.includes('regular')) {
      mapping[url] = 'mplus2-regular';
    } else if (url.includes('mplus2-bold') || url.includes('mplus2/v') && url.includes('bold')) {
      mapping[url] = 'mplus2-bold';
    } else if (url.includes('montserrat-regular') || url.includes('montserrat/v') && !url.includes('bold')) {
      mapping[url] = 'montserrat-regular';
    } else if (url.includes('montserrat-bold') || url.includes('montserrat/v') && url.includes('bold')) {
      mapping[url] = 'montserrat-bold';
    }
  }
  
  console.log('폰트 매핑 결과:', mapping);
  return mapping;
}

// 모든 필요한 폰트 파일 캐싱 함수
export async function cacheAllFonts(): Promise<void> {
  let successCount = 0;
  let failCount = 0;
  
  try {
    // 현재 로드된 폰트 URL 확인
    const fontUrls = extractLoadedFontUrls();
    console.log('페이지에서 발견된 폰트 URL:', fontUrls);
    
    // 폰트 URL과 키 매핑
    let fontMapping = mapFontUrlsToKeys(fontUrls);
    
    // 매핑이 없으면 기본 매핑 사용
    if (Object.keys(fontMapping).length === 0) {
      // 로컬 폰트 파일 경로에 대한 기본 매핑
      fontMapping['/fonts/mplus2-regular.ttf'] = 'mplus2-regular';
      fontMapping['/fonts/mplus2-bold.ttf'] = 'mplus2-bold';
      fontMapping['/fonts/montserrat-regular.ttf'] = 'montserrat-regular';
      fontMapping['/fonts/montserrat-bold.ttf'] = 'montserrat-bold';
      
      console.log('기본 폰트 매핑 사용:', fontMapping);
    }
    
    // 각 폰트 URL 처리
    for (const [url, key] of Object.entries(fontMapping)) {
      try {
        // 이미 캐싱되었는지 확인
        const isCached = await isFontCached(key);
        if (isCached) {
          console.log(`폰트 이미 캐싱됨: ${key}`);
          successCount++;
          continue;
        }

        // 폰트 파일 가져오기
        console.log(`폰트 다운로드 시작: ${url}`);
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit' // CORS 문제 방지
        });
        
        if (!response.ok) {
          throw new Error(`폰트 다운로드 실패: ${response.statusText}`);
        }
        
        const fontData = await response.arrayBuffer();
        
        // 캐시에 저장
        await cacheFontFile(key, fontData);
        successCount++;
        
      } catch (error) {
        console.error(`폰트 캐싱 중 오류 발생: ${url}`, error);
        failCount++;
      }
    }
  } catch (error) {
    console.error('폰트 캐싱 과정 중 오류 발생:', error);
  }
  
  console.log(`폰트 캐싱 결과: 성공 ${successCount}, 실패 ${failCount}`);
}

// 캐시된 폰트를 사용할 Font-Face 규칙 생성 및 적용
export async function applyFontFaces(): Promise<void> {
  try {
    // 이미 설정된 폰트 스타일 시트 ID
    const STYLESHEET_ID = 'cached-font-styles';
    
    // 이미 스타일 시트가 있으면 제거
    const existingStylesheet = document.getElementById(STYLESHEET_ID);
    if (existingStylesheet) {
      existingStylesheet.remove();
    }
    
    // 새 스타일 시트 요소 생성
    const styleSheet = document.createElement('style');
    styleSheet.id = STYLESHEET_ID;
    let styleRules = '';
    
    // 각 폰트 키에 대해 처리
    for (const key of FONT_KEYS) {
      const fontData = await getFontFromCache(key);
      if (!fontData) continue;
      
      // 폰트 파일 확장자에 따라 MIME 타입 결정
      const isTTF = key.includes('.ttf') || FONT_KEYS.some(k => k.includes('ttf'));
      const mimeType = isTTF ? 'font/ttf' : 'font/woff2';
      
      // Blob URL 생성
      const blob = new Blob([fontData], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      
      // 폰트 패밀리 및 스타일 설정
      let fontFamily, fontWeight;
      
      if (key.includes('mplus')) {
        fontFamily = 'M PLUS 2';
        fontWeight = key.includes('bold') ? '700' : '400';
      } else if (key.includes('montserrat')) {
        fontFamily = 'Montserrat';
        fontWeight = key.includes('bold') ? '700' : '400';
      } else {
        continue;
      }
      
      // 폰트 페이스 규칙 추가 (폰트 형식도 확장자에 맞게 조정)
      styleRules += `
        @font-face {
          font-family: '${fontFamily}';
          font-style: normal;
          font-weight: ${fontWeight};
          font-display: swap;
          src: url('${blobUrl}') format('${isTTF ? 'truetype' : 'woff2'}');
        }
      `;
    }
    
    // 스타일 규칙이 있으면 문서에 추가
    if (styleRules) {
      styleSheet.textContent = styleRules;
      document.head.appendChild(styleSheet);
      console.log('캐시된 폰트 스타일 적용 완료');
    } else {
      console.log('적용할 캐시된 폰트가 없습니다');
    }
  } catch (error) {
    console.error('폰트 스타일 적용 실패:', error);
  }
} 