import Dexie, { Table } from 'dexie';

export interface AnimationCache {
  url: string;
  data: ArrayBuffer;
  timestamp: number;
}

class AnimationCacheDB extends Dexie {
  animations!: Table<AnimationCache>;

  constructor() {
    super('AmicaAnimationCache');
    this.version(1).stores({
      animations: 'url' // Primary key is url
    });
  }
}

export const animationDB = new AnimationCacheDB();

// 애니메이션 파일을 캐시에 저장
export async function cacheAnimationFile(url: string, data: ArrayBuffer): Promise<void> {
  try {
    console.log(`💾 애니메이션 캐싱 시작 [${getFileSizeInfo(data)}]: ${getShortUrl(url)}`);
    await animationDB.animations.put({
      url,
      data,
      timestamp: Date.now()
    });
    console.log(`✅ 애니메이션 캐싱 완료 [${getFileSizeInfo(data)}]: ${getShortUrl(url)}`);
  } catch (error) {
    console.error(`❌ 애니메이션 캐싱 실패: ${getShortUrl(url)}`, error);
  }
}

// 애니메이션 파일을 캐시에서 가져오기
export async function getAnimationFromCache(url: string): Promise<ArrayBuffer | null> {
  try {
    const cached = await animationDB.animations.get(url);
    if (cached) {
      console.log(`📂 캐시에서 애니메이션 로드 [${getFileSizeInfo(cached.data)}]: ${getShortUrl(url)}`);
      return cached.data;
    }
    console.log(`🔍 애니메이션 캐시에 없음: ${getShortUrl(url)}`);
    return null;
  } catch (error) {
    console.error(`❌ 애니메이션 캐시 로드 실패: ${getShortUrl(url)}`, error);
    return null;
  }
}

// 특정 URL에 대한 애니메이션 파일 캐싱 여부 확인
export async function isAnimationCached(url: string): Promise<boolean> {
  try {
    const cached = await animationDB.animations.get(url);
    const isCached = !!cached;
    if (isCached) {
      console.log(`✓ 애니메이션 캐시 확인: ${getShortUrl(url)} [캐시됨: ${new Date(cached.timestamp).toLocaleString()}]`);
    } else {
      console.log(`✗ 애니메이션 캐시 확인: ${getShortUrl(url)} [캐시 없음]`);
    }
    return isCached;
  } catch (error) {
    console.error(`❌ 애니메이션 캐시 확인 실패: ${getShortUrl(url)}`, error);
    return false;
  }
}

// 애니메이션 파일을 가져오고 캐싱하는 함수
export async function fetchAndCacheAnimation(url: string): Promise<ArrayBuffer> {
  // 캐시에서 먼저 확인
  const cached = await getAnimationFromCache(url);
  if (cached) {
    console.log(`🚀 캐시에서 애니메이션 파일 로드 성공: ${getShortUrl(url)}`);
    return cached;
  }
  
  // 캐시에 없으면 서버에서 가져옴
  console.log(`⬇️ 서버에서 애니메이션 파일 다운로드 시작: ${getShortUrl(url)}`);
  const startTime = performance.now();
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`❌ 애니메이션 파일 다운로드 실패 (${response.status}): ${getShortUrl(url)} - ${response.statusText}`);
  }
  
  const animationBinary = await response.arrayBuffer();
  const endTime = performance.now();
  const downloadTime = (endTime - startTime).toFixed(2);
  
  console.log(`⏱️ 애니메이션 다운로드 완료 [${downloadTime}ms, ${getFileSizeInfo(animationBinary)}]: ${getShortUrl(url)}`);
  
  // 캐시에 저장
  await cacheAnimationFile(url, animationBinary);
  
  return animationBinary;
}

// 파일 크기 정보를 읽기 쉬운 포맷으로 변환
function getFileSizeInfo(data: ArrayBuffer): string {
  const bytes = data.byteLength;
  if (bytes < 1024) {
    return `${bytes}B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
}

// URL에서 파일명만 추출 (로그 간소화용)
function getShortUrl(url: string): string {
  // URL에서 파일명 부분만 추출
  const parts = url.split('/');
  return parts[parts.length - 1];
} 