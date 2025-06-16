import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import fileCache from '../utils/fileCache';

const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

export async function loadVRM(url: string): Promise<any> {
  try {
    // 1. 새로운 파일 캐시에서 먼저 확인
    const startTime = performance.now();
    const blob = await fileCache.getFile(url); // VRM 파일은 무조건 캐시
    
    const loadTime = (performance.now() - startTime).toFixed(0);
    const sizeInfo = formatFileSize(blob.size);
    console.log(`📥 VRM 로드 완료 [${sizeInfo}, ${loadTime}ms]: ${url}`);
    
    // Blob을 Object URL로 변환하여 GLTF 로더에서 사용
    const objectURL = fileCache.createBlobURL(blob);
    
    try {
      const gltf = await loader.loadAsync(objectURL);
      return gltf;
    } finally {
      // 메모리 정리
      fileCache.revokeBlobURL(objectURL);
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