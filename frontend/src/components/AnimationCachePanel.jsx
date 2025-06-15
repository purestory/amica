import React, { useState, useEffect } from 'react'
import animationCache from '../lib/animationCache'

const AnimationCachePanel = () => {
  const [cacheInfo, setCacheInfo] = useState({ size: 0, hasIdle: false })

  // 캐시 정보 업데이트
  const updateCacheInfo = async () => {
    try {
      const size = await animationCache.getCacheSize()
      const hasIdle = await animationCache.hasAnimation('/amica/animations/idle_loop.vrma')
      setCacheInfo({ size, hasIdle })
    } catch (error) {
      console.warn('캐시 정보 조회 실패:', error)
    }
  }

  // 캐시 클리어 함수
  const clearCache = async () => {
    try {
      await animationCache.clearCache()
      setCacheInfo({ size: 0, hasIdle: false })
      console.log('애니메이션 캐시가 삭제되었습니다')
    } catch (error) {
      console.error('캐시 삭제 실패:', error)
    }
  }

  useEffect(() => {
    updateCacheInfo()
  }, [])

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <div>캐시된 애니메이션: {cacheInfo.size}개</div>
      <div>Idle 캐시: {cacheInfo.hasIdle ? '✓' : '✗'}</div>
      <button 
        onClick={clearCache}
        style={{
          marginTop: '5px',
          padding: '2px 6px',
          fontSize: '10px',
          background: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        캐시 삭제
      </button>
    </div>
  )
}

export default AnimationCachePanel 