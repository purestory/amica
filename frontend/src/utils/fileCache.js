/**
 * 파일 캐시 시스템
 * IndexedDB를 사용하여 큰 파일들을 로컬에 저장하고 관리
 */

class FileCache {
  constructor(dbName = 'AmicaFileCache', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.storeName = 'files';
  }

  // IndexedDB 초기화
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 파일 저장소 생성
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'url' });
          store.createIndex('size', 'size', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          store.createIndex('contentType', 'contentType', { unique: false });
        }
      };
    });
  }

  // 파일이 캐시에 있는지 확인
  async hasFile(url) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(url);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // 마지막 접근 시간 업데이트
          this.updateLastAccessed(url);
          resolve(true);
        } else {
          resolve(false);
        }
      };
    });
  }

  // 파일 가져오기 (캐시에서 또는 네트워크에서)
  async getFile(url, options = {}) {
    const { forceRefresh = false, minSizeForCache = 100 * 1024 } = options; // 기본 100KB 이상만 캐시
    
    if (!this.db) await this.init();

    // 강제 새로고침이 아니면 캐시에서 먼저 확인
    if (!forceRefresh) {
      const cachedFile = await this.getCachedFile(url);
      if (cachedFile) {
        console.log(`📦 캐시에서 로드: ${url}`);
        return cachedFile.blob;
      }
    }

    // 네트워크에서 파일 다운로드
    console.log(`⬇️ 네트워크에서 다운로드: ${url}`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // 파일 타입별 캐시 정책
      const shouldCache = this.shouldCacheFile(url, blob.size, minSizeForCache);
      
      if (shouldCache) {
        await this.saveFile(url, blob, contentType);
        console.log(`💾 캐시에 저장: ${url} (${this.formatFileSize(blob.size)})`);
      }

      return blob;
    } catch (error) {
      console.error(`❌ 파일 다운로드 실패: ${url}`, error);
      throw error;
    }
  }

  // 파일 캐시 여부 결정
  shouldCacheFile(url, fileSize, minSizeForCache) {
    // VRM 파일: 무조건 캐시
    if (url.includes('.vrm')) {
      return true;
    }
    
    // 애니메이션 파일: 무조건 캐시
    if (url.includes('.vrma')) {
      return true;
    }
    
    // JS 번들 파일: 무조건 캐시
    if (url.includes('/assets/') && url.includes('.js')) {
      return true;
    }
    
    // CSS 파일: 무조건 캐시
    if (url.includes('/assets/') && url.includes('.css')) {
      return true;
    }
    
    // 배경 이미지: 200KB 이상만 캐시
    if (url.includes('/bg/') && !url.includes('thumb-')) {
      return fileSize >= 200 * 1024; // 200KB
    }
    
    // 기타 파일: 설정된 임계값 이상만 캐시
    return fileSize >= minSizeForCache;
  }

  // 캐시된 파일 가져오기
  async getCachedFile(url) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(url);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // 파일 캐시에 저장
  async saveFile(url, blob, contentType) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const fileData = {
        url: url,
        blob: blob,
        contentType: contentType,
        size: blob.size,
        savedAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };
      
      const request = store.put(fileData);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 마지막 접근 시간 업데이트
  async updateLastAccessed(url) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const getRequest = store.get(url);
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.lastAccessed = new Date().toISOString();
          const putRequest = store.put(data);
          putRequest.onerror = () => reject(putRequest.error);
          putRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // 캐시 크기 조회
  async getCacheSize() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const files = request.result;
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        resolve({
          fileCount: files.length,
          totalSize: totalSize,
          formattedSize: this.formatFileSize(totalSize),
          files: files.map(f => ({
            url: f.url,
            size: f.size,
            formattedSize: this.formatFileSize(f.size),
            contentType: f.contentType,
            savedAt: f.savedAt,
            lastAccessed: f.lastAccessed
          }))
        });
      };
    });
  }

  // 캐시 정리 (오래된 파일 삭제)
  async cleanupCache(maxAge = 7 * 24 * 60 * 60 * 1000) { // 기본 7일
    if (!this.db) await this.init();
    
    const cutoffDate = new Date(Date.now() - maxAge).toISOString();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('lastAccessed');
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffDate));
      
      let deletedCount = 0;
      let deletedSize = 0;
      
      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          deletedCount++;
          deletedSize += cursor.value.size;
          cursor.delete();
          cursor.continue();
        } else {
          console.log(`🧹 캐시 정리 완료: ${deletedCount}개 파일, ${this.formatFileSize(deletedSize)} 삭제`);
          resolve({ deletedCount, deletedSize });
        }
      };
    });
  }

  // 전체 캐시 삭제
  async clearCache() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('🗑️ 전체 캐시가 삭제되었습니다.');
        resolve();
      };
    });
  }

  // 특정 파일 삭제
  async deleteFile(url) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(url);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`🗑️ 파일 삭제: ${url}`);
        resolve();
      };
    });
  }

  // 파일 크기 포맷팅
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Blob URL 생성 (메모리 효율적)
  createBlobURL(blob) {
    return URL.createObjectURL(blob);
  }

  // Blob URL 해제
  revokeBlobURL(url) {
    URL.revokeObjectURL(url);
  }
}

// 전역 인스턴스
const fileCache = new FileCache();

export default fileCache; 