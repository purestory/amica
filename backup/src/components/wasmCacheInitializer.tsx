import { useEffect, useState } from 'react';
import { fetchAndCacheWasm, isWasmCached } from '@/utils/wasmCacheDB';
import { getBasePath } from '@/components/settings/common';

// 캐싱할 WASM 파일 목록 (basePath 제외)
const WASM_FILE_NAMES = [
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm',
  'ort-wasm.wasm',
  'ort-wasm-simd-threaded.jsep.wasm',
  'ort-wasm-simd.jsep.wasm'
];

export default function WasmCacheInitializer() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cachedFiles, setCachedFiles] = useState<number>(0);
  const [downloadedFiles, setDownloadedFiles] = useState<number>(0);

  useEffect(() => {
    const cacheWasmFiles = async () => {
      setIsLoading(true);
      try {
        const basePath = getBasePath();
        // basePath를 포함한 전체 WASM 파일 경로 생성
        const WASM_FILES = WASM_FILE_NAMES.map(fileName => 
          `${basePath}/static/chunks/${fileName}`
        );
        
        let completed = 0;
        let cached = 0;
        let downloaded = 0;
        
        console.log('🔄 WASM 파일 캐싱 시작: 총 ' + WASM_FILES.length + '개 파일');
        console.log('📍 Base Path:', basePath);
        
        for (const url of WASM_FILES) {
          const isCached = await isWasmCached(url);
          if (isCached) {
            console.log(`✅ 캐시에서 로드: ${url}`);
            cached++;
          } else {
            console.log(`⬇️ 새로 다운로드 필요: ${url}`);
            try {
              await fetchAndCacheWasm(url);
              downloaded++;
              console.log(`💾 다운로드 및 캐싱 완료: ${url}`);
            } catch (error) {
              console.error(`❌ WASM 파일 캐싱 실패: ${url}`, error);
            }
          }
          
          completed++;
          setProgress(Math.floor((completed / WASM_FILES.length) * 100));
        }
        
        setCachedFiles(cached);
        setDownloadedFiles(downloaded);
        
        console.log('✅ 모든 WASM 파일 처리 완료');
        console.log(`📊 통계: 캐시에서 로드 ${cached}개, 새로 다운로드 ${downloaded}개`);
        
        if (downloaded === 0 && cached > 0) {
          console.log('🚀 모든 WASM 파일이 캐시에서 로드되었습니다. 추가 다운로드 없음');
        } else if (downloaded > 0) {
          console.log(`🔄 ${downloaded}개의 WASM 파일이 새로 다운로드되었습니다`);
        }
      } catch (error) {
        console.error('❌ WASM 파일 캐싱 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // 페이지 로드 후 약간 지연시켜 초기 렌더링에 영향을 최소화
    const timer = setTimeout(() => {
      cacheWasmFiles();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
} 