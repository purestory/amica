// VRM 캐릭터 모델 캐싱을 위한 IndexedDB 유틸리티

const DB_NAME = 'AmicaVRMCache'
const DB_VERSION = 1
const STORE_NAME = 'vrm_models'

interface VRMCacheData {
  url: string
  data: ArrayBuffer
  timestamp: number
  fileSize: number
}

class VRMCache {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('fileSize', 'fileSize', { unique: false })
        }
      }
    })
  }

  async saveVRM(url: string, arrayBuffer: ArrayBuffer): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const data: VRMCacheData = {
        url: url,
        data: arrayBuffer,
        timestamp: Date.now(),
        fileSize: arrayBuffer.byteLength
      }
      
      const request = store.put(data)
      request.onsuccess = () => {
        const sizeInfo = this.formatFileSize(arrayBuffer.byteLength)
        console.log(`✅ VRM 모델 캐시 저장 완료 [${sizeInfo}]: ${url}`)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getVRM(url: string): Promise<ArrayBuffer | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(url)
      
      request.onsuccess = () => {
        if (request.result) {
          const sizeInfo = this.formatFileSize(request.result.fileSize)
          console.log(`📂 VRM 모델 캐시에서 로드 [${sizeInfo}]: ${url}`)
          resolve(request.result.data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async hasVRM(url: string): Promise<boolean> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(url)
      
      request.onsuccess = () => resolve(!!request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async clearCache(): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()
      
      request.onsuccess = () => {
        console.log('🗑️ VRM 모델 캐시 전체 삭제 완료')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getCacheSize(): Promise<number> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.count()
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 파일 크기를 읽기 쉬운 형태로 포맷
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes}B`
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)}KB`
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
    }
  }

  // 캐시 상세 정보 조회
  async getCacheDetails(): Promise<Array<{url: string, fileSize: string, timestamp: string}>> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const details = request.result.map(item => ({
          url: item.url,
          fileSize: this.formatFileSize(item.fileSize),
          timestamp: new Date(item.timestamp).toLocaleString()
        }))
        resolve(details)
      }
      request.onerror = () => reject(request.error)
    })
  }
}

// 싱글톤 인스턴스
const vrmCache = new VRMCache()

export default vrmCache 