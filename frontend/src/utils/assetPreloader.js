/**
 * 에셋 미리 로더
 * JS/CSS 번들 파일과 기타 중요한 에셋들을 미리 로드하여 캐시
 */

import fileCache from './fileCache';

class AssetPreloader {
  constructor() {
    this.preloadedAssets = new Set();
  }

  // 현재 페이지의 JS/CSS 에셋 자동 감지 및 캐시
  async preloadCurrentPageAssets() {
    const assets = [];
    
    // 현재 페이지의 모든 script 태그 확인
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && (src.includes('/assets/') || src.startsWith('/'))) {
        assets.push(src);
      }
    });
    
    // 현재 페이지의 모든 link 태그 (CSS) 확인
    const links = document.querySelectorAll('link[rel="stylesheet"][href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.includes('/assets/') || href.startsWith('/'))) {
        assets.push(href);
      }
    });
    
    console.log(`🔄 페이지 에셋 미리 로드 시작: ${assets.length}개`);
    
    // 병렬로 미리 로드
    const results = await Promise.allSettled(
      assets.map(url => this.preloadAsset(url))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ 페이지 에셋 미리 로드 완료: ${successful}/${assets.length}개 성공`);
    
    return { total: assets.length, successful };
  }

  // 개별 에셋 미리 로드
  async preloadAsset(url) {
    if (this.preloadedAssets.has(url)) {
      return { url, status: 'already_cached' };
    }
    
    try {
      // 이미 캐시되어 있는지 확인
      const isCached = await fileCache.hasFile(url);
      if (isCached) {
        this.preloadedAssets.add(url);
        return { url, status: 'already_cached' };
      }
      
      // 파일 로드 및 캐시
      await fileCache.getFile(url);
      this.preloadedAssets.add(url);
      
      return { url, status: 'cached' };
    } catch (error) {
      console.warn(`⚠️ 에셋 미리 로드 실패: ${url}`, error);
      return { url, status: 'failed', error };
    }
  }

  // 중요한 에셋들 미리 로드
  async preloadCriticalAssets() {
    const criticalAssets = [
      // VRM 모델들
      '/vrm/AvatarSample_B.vrm',
      '/vrm/AvatarSample_D.vrm',
      
      // 기본 애니메이션
      '/animations/idle_loop.vrma',
      '/animations/greeting.vrma',
      
      // 인기 배경 이미지들
      '/bg/bg-landscape1.jpg',
      '/bg/bg-room1.jpg',
      '/bg/bg-sunset1.jpg'
    ];
    
    console.log(`🔄 중요 에셋 미리 로드 시작: ${criticalAssets.length}개`);
    
    // 백그라운드에서 순차적으로 로드 (네트워크 부하 방지)
    let successful = 0;
    for (const url of criticalAssets) {
      try {
        await this.preloadAsset(url);
        successful++;
      } catch (error) {
        console.warn(`⚠️ 중요 에셋 로드 실패: ${url}`, error);
      }
      
      // 각 파일 사이에 약간의 지연 (네트워크 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ 중요 에셋 미리 로드 완료: ${successful}/${criticalAssets.length}개 성공`);
    return { total: criticalAssets.length, successful };
  }

  // 앱 시작 시 자동 미리 로드
  async initializePreloading() {
    try {
      // 1. 현재 페이지 에셋 즉시 캐시
      await this.preloadCurrentPageAssets();
      
      // 2. 중요 에셋들 백그라운드에서 로드
      setTimeout(() => {
        this.preloadCriticalAssets().catch(error => {
          console.warn('중요 에셋 미리 로드 실패:', error);
        });
      }, 2000); // 2초 후 시작
      
    } catch (error) {
      console.error('에셋 미리 로드 초기화 실패:', error);
    }
  }

  // 캐시 상태 확인
  async getCacheStatus() {
    const cacheInfo = await fileCache.getCacheSize();
    
    const assetFiles = cacheInfo.files.filter(f => f.url.includes('/assets/'));
    const vrmFiles = cacheInfo.files.filter(f => f.url.includes('.vrm'));
    const animationFiles = cacheInfo.files.filter(f => f.url.includes('.vrma'));
    const backgroundFiles = cacheInfo.files.filter(f => f.url.includes('/bg/'));
    
    return {
      total: cacheInfo.fileCount,
      totalSize: cacheInfo.formattedSize,
      assets: assetFiles.length,
      vrm: vrmFiles.length,
      animations: animationFiles.length,
      backgrounds: backgroundFiles.length,
      files: {
        assets: assetFiles,
        vrm: vrmFiles,
        animations: animationFiles,
        backgrounds: backgroundFiles
      }
    };
  }
}

// 전역 인스턴스
const assetPreloader = new AssetPreloader();

export default assetPreloader; 