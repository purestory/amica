// 애니메이션 캐싱을 위한 IndexedDB 유틸리티

const DB_NAME = 'AmicaAnimationCache'
const DB_VERSION = 1
const STORE_NAME = 'animations'

interface AnimationCacheData {
  url: string
  data: ArrayBuffer
  timestamp: number
}

class AnimationCache {
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
        }
      }
    })
  }

  async saveAnimation(url: string, arrayBuffer: ArrayBuffer): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const data: AnimationCacheData = {
        url: url,
        data: arrayBuffer,
        timestamp: Date.now()
      }
      
      const request = store.put(data)
      request.onsuccess = () => {
        console.log(`애니메이션 캐시 저장 완료: ${url}`)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAnimation(url: string): Promise<ArrayBuffer | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(url)
      
      request.onsuccess = () => {
        if (request.result) {
          console.log(`애니메이션 캐시에서 로드: ${url}`)
          resolve(request.result.data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async hasAnimation(url: string): Promise<boolean> {
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
        console.log('애니메이션 캐시 전체 삭제 완료')
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
}

// 싱글톤 인스턴스
const animationCache = new AnimationCache()

export default animationCache 