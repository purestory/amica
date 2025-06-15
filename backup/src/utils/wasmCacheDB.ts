import Dexie, { Table } from 'dexie';

export interface WasmCache {
  url: string;
  data: ArrayBuffer;
  timestamp: number;
}

class WasmCacheDB extends Dexie {
  wasmFiles!: Table<WasmCache>;

  constructor() {
    super('AmicaWasmCache');
    this.version(1).stores({
      wasmFiles: 'url' // Primary key is url
    });
  }
}

export const wasmDB = new WasmCacheDB();

// WASM 파일을 캐시에 저장
export async function cacheWasmFile(url: string, data: ArrayBuffer): Promise<void> {
  try {
    console.log(`💾 캐싱 시작 [${getFileSizeInfo(data)}]: ${getShortUrl(url)}`);
    await wasmDB.wasmFiles.put({
      url,
      data,
      timestamp: Date.now()
    });
    console.log(`✅ 캐싱 완료 [${getFileSizeInfo(data)}]: ${getShortUrl(url)}`);
  } catch (error) {
    console.error(`❌ 캐싱 실패: ${getShortUrl(url)}`, error);
  }
}

// WASM 파일을 캐시에서 가져오기
export async function getWasmFromCache(url: string): Promise<ArrayBuffer | null> {
  try {
    const cached = await wasmDB.wasmFiles.get(url);
    if (cached) {
      console.log(`📂 캐시에서 로드 [${getFileSizeInfo(cached.data)}]: ${getShortUrl(url)}`);
      return cached.data;
    }
    console.log(`🔍 캐시에 없음: ${getShortUrl(url)}`);
    return null;
  } catch (error) {
    console.error(`❌ 캐시 로드 실패: ${getShortUrl(url)}`, error);
    return null;
  }
}

// 특정 URL에 대한 WASM 파일 캐싱 여부 확인
export async function isWasmCached(url: string): Promise<boolean> {
  try {
    const cached = await wasmDB.wasmFiles.get(url);
    const isCached = !!cached;
    if (isCached) {
      console.log(`✓ 캐시 확인: ${getShortUrl(url)} [캐시됨: ${new Date(cached.timestamp).toLocaleString()}]`);
    } else {
      console.log(`✗ 캐시 확인: ${getShortUrl(url)} [캐시 없음]`);
    }
    return isCached;
  } catch (error) {
    console.error(`❌ 캐시 확인 실패: ${getShortUrl(url)}`, error);
    return false;
  }
}

// WASM 파일을 캐시에서 URL 객체로 가져오기
export async function getWasmBlobUrl(url: string): Promise<string | null> {
  const cachedData = await getWasmFromCache(url);
  if (!cachedData) {
    console.log(`⚠️ Blob URL 생성 실패 (캐시 없음): ${getShortUrl(url)}`);
    return null;
  }
  
  const blob = new Blob([cachedData], { type: 'application/wasm' });
  const blobUrl = URL.createObjectURL(blob);
  console.log(`🔗 Blob URL 생성 완료: ${getShortUrl(url)} -> ${blobUrl}`);
  return blobUrl;
}

// WASM 파일을 가져오고 캐싱하는 함수
export async function fetchAndCacheWasm(url: string): Promise<ArrayBuffer> {
  // 캐시에서 먼저 확인
  const cached = await getWasmFromCache(url);
  if (cached) {
    console.log(`🚀 캐시에서 WASM 파일 로드 성공: ${getShortUrl(url)}`);
    return cached;
  }
  
  // 캐시에 없으면 서버에서 가져옴
  console.log(`⬇️ 서버에서 WASM 파일 다운로드 시작: ${getShortUrl(url)}`);
  const startTime = performance.now();
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`❌ WASM 파일 다운로드 실패 (${response.status}): ${getShortUrl(url)} - ${response.statusText}`);
  }
  
  const wasmBinary = await response.arrayBuffer();
  const endTime = performance.now();
  const downloadTime = (endTime - startTime).toFixed(2);
  
  console.log(`⏱️ 다운로드 완료 [${downloadTime}ms, ${getFileSizeInfo(wasmBinary)}]: ${getShortUrl(url)}`);
  
  // 캐시에 저장
  await cacheWasmFile(url, wasmBinary);
  
  return wasmBinary;
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