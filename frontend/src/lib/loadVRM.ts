import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import vrmCache from './vrmCache';

const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

export async function loadVRM(url: string): Promise<any> {
  try {
    // 1. 캐시에서 먼저 확인
    const cachedData = await vrmCache.getVRM(url);
    
    let arrayBuffer: ArrayBuffer;
    
    if (cachedData) {
      // 캐시된 데이터 사용
      arrayBuffer = cachedData;
      console.log(`🚀 캐시에서 VRM 모델 로드: ${url}`);
    } else {
      // 네트워크에서 로드
      console.log(`⬇️ 네트워크에서 VRM 모델 로드: ${url}`);
      const startTime = performance.now();
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch VRM model: ${response.status}`);
      }
      
      arrayBuffer = await response.arrayBuffer();
      const downloadTime = (performance.now() - startTime).toFixed(0);
      const sizeInfo = formatFileSize(arrayBuffer.byteLength);
      
      console.log(`📥 VRM 다운로드 완료 [${sizeInfo}, ${downloadTime}ms]: ${url}`);
      
      // 캐시에 저장
      try {
        await vrmCache.saveVRM(url, arrayBuffer);
      } catch (cacheError) {
        console.warn('VRM 모델 캐시 저장 실패:', cacheError);
        // 캐시 저장 실패해도 VRM 로드는 계속 진행
      }
    }
    
    // ArrayBuffer를 Blob으로 변환하여 GLTF 로더에서 사용할 수 있도록 함
    const blob = new Blob([arrayBuffer]);
    const objectURL = URL.createObjectURL(blob);
    
    try {
      const gltf = await loader.loadAsync(objectURL);
      return gltf;
    } finally {
      // 메모리 정리
      URL.revokeObjectURL(objectURL);
    }
    
  } catch (error) {
    console.error('VRM 모델 로드 실패:', error);
    throw error;
  }
}

// 파일 크기를 읽기 쉬운 형태로 포맷
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
} 