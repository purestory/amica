import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMAnimation } from './VRMAnimation';
import { VRMAnimationLoaderPlugin } from './VRMAnimationLoaderPlugin';
import animationCache from './animationCache';

const loader = new GLTFLoader();
loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

export async function loadVRMAnimation(url: string): Promise<VRMAnimation | null> {
  try {
    // 1. 캐시에서 먼저 확인
    const cachedData = await animationCache.getAnimation(url);
    
    let arrayBuffer: ArrayBuffer;
    
    if (cachedData) {
      // 캐시된 데이터 사용
      arrayBuffer = cachedData;
    } else {
      // 네트워크에서 로드
      console.log(`네트워크에서 애니메이션 로드: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch animation: ${response.status}`);
      }
      
      arrayBuffer = await response.arrayBuffer();
      
      // 캐시에 저장
      try {
        await animationCache.saveAnimation(url, arrayBuffer);
      } catch (cacheError) {
        console.warn('애니메이션 캐시 저장 실패:', cacheError);
        // 캐시 저장 실패해도 애니메이션 로드는 계속 진행
      }
    }
    
    // ArrayBuffer를 Blob으로 변환하여 GLTF 로더에서 사용할 수 있도록 함
    const blob = new Blob([arrayBuffer]);
    const objectURL = URL.createObjectURL(blob);
    
    try {
      const gltf = await loader.loadAsync(objectURL);
      const vrmAnimations: VRMAnimation[] = gltf.userData.vrmAnimations;
      const vrmAnimation: VRMAnimation | undefined = vrmAnimations[0];
      
      return vrmAnimation ?? null;
    } finally {
      // 메모리 정리
      URL.revokeObjectURL(objectURL);
    }
    
  } catch (error) {
    console.error('애니메이션 로드 실패:', error);
    return null;
  }
}
