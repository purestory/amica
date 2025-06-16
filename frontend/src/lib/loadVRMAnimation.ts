import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMAnimation } from './VRMAnimation';
import { VRMAnimationLoaderPlugin } from './VRMAnimationLoaderPlugin';
import fileCache from '../utils/fileCache';

const loader = new GLTFLoader();
loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

export async function loadVRMAnimation(url: string): Promise<VRMAnimation | null> {
  try {
    // 1. 새로운 파일 캐시에서 로드
    const startTime = performance.now();
    const blob = await fileCache.getFile(url); // 애니메이션 파일은 무조건 캐시
    
    const loadTime = (performance.now() - startTime).toFixed(0);
    const sizeInfo = formatFileSize(blob.size);
    console.log(`🎭 애니메이션 로드 완료 [${sizeInfo}, ${loadTime}ms]: ${url}`);
    
    // Blob을 Object URL로 변환하여 GLTF 로더에서 사용
    const objectURL = fileCache.createBlobURL(blob);
    
    try {
      const gltf = await loader.loadAsync(objectURL);
      const vrmAnimations: VRMAnimation[] = gltf.userData.vrmAnimations;
      const vrmAnimation: VRMAnimation | undefined = vrmAnimations[0];
      
      return vrmAnimation ?? null;
    } finally {
      // 메모리 정리
      fileCache.revokeBlobURL(objectURL);
    }
    
  } catch (error) {
    console.error('애니메이션 로드 실패:', error);
    return null;
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
