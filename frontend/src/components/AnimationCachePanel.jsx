import React, { useState, useEffect } from 'react'
import animationCache from '../lib/animationCache'
import vrmCache from '../lib/vrmCache'

const AnimationCachePanel = () => {
  const [cacheInfo, setCacheInfo] = useState({ 
    animationSize: 0, 
    vrmSize: 0, 
    hasIdle: false,
    hasCurrentVRM: false
  })
  const [cacheDetails, setCacheDetails] = useState([])
  const [vrmDetails, setVrmDetails] = useState([])
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 모든 애니메이션 URL 목록
  const allAnimationUrls = [
    '/amica/animations/dance.vrma',
    '/amica/animations/greeting.vrma', 
    '/amica/animations/idle_loop.vrma',
    '/amica/animations/modelPose.vrma',
    '/amica/animations/peaceSign.vrma',
    '/amica/animations/shoot.vrma',
    '/amica/animations/showFullBody.vrma',
    '/amica/animations/spin.vrma',
    '/amica/animations/squat.vrma'
  ]

  // VRM 모델 URL 목록  
  const allVRMUrls = [
    '/amica/vrm/AvatarSample_A.vrm',
    '/amica/vrm/AvatarSample_B.vrm',
    '/amica/vrm/AvatarSample_C.vrm',
    '/amica/vrm/AvatarSample_D.vrm'
  ]

  // 캐시 정보 업데이트
  const updateCacheInfo = async () => {
    setIsLoading(true)
    try {
      // 애니메이션 캐시 정보
      const animationSize = await animationCache.getCacheSize()
      const hasIdle = await animationCache.hasAnimation('/amica/animations/idle_loop.vrma')
      
      // VRM 모델 캐시 정보
      const vrmSize = await vrmCache.getCacheSize()
      const hasCurrentVRM = await vrmCache.hasVRM('/amica/vrm/AvatarSample_B.vrm')
      
      setCacheInfo({ animationSize, vrmSize, hasIdle, hasCurrentVRM })

      // 각 애니메이션의 캐시 상태 확인
      const animDetails = []
      for (const url of allAnimationUrls) {
        const isCached = await animationCache.hasAnimation(url)
        const fileName = url.split('/').pop()
        animDetails.push({ fileName, url, isCached, type: 'animation' })
      }
      setCacheDetails(animDetails)

      // 각 VRM 모델의 캐시 상태 확인
      const vrmDetailsList = []
      for (const url of allVRMUrls) {
        const isCached = await vrmCache.hasVRM(url)
        const fileName = url.split('/').pop()
        vrmDetailsList.push({ fileName, url, isCached, type: 'vrm' })
      }
      setVrmDetails(vrmDetailsList)

    } catch (error) {
      console.error('캐시 정보 업데이트 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 애니메이션 캐시 삭제 처리
  const handleClearAnimationCache = async () => {
    if (confirm('정말로 모든 애니메이션 캐시를 삭제하시겠습니까?')) {
      setIsLoading(true)
      try {
        await animationCache.clearCache()
        await updateCacheInfo()
        alert('애니메이션 캐시가 성공적으로 삭제되었습니다!')
      } catch (error) {
        console.error('애니메이션 캐시 삭제 실패:', error)
        alert('캐시 삭제 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  // VRM 모델 캐시 삭제 처리
  const handleClearVRMCache = async () => {
    if (confirm('정말로 모든 VRM 모델 캐시를 삭제하시겠습니까?')) {
      setIsLoading(true)
      try {
        await vrmCache.clearCache()
        await updateCacheInfo()
        alert('VRM 모델 캐시가 성공적으로 삭제되었습니다!')
      } catch (error) {
        console.error('VRM 캐시 삭제 실패:', error)
        alert('캐시 삭제 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  // 컴포넌트 마운트 시 캐시 정보 로드
  useEffect(() => {
    updateCacheInfo()
    
    // 10초마다 캐시 정보 업데이트
    const interval = setInterval(updateCacheInfo, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '14px',
      minWidth: '300px',
      maxWidth: '400px',
      zIndex: 1000,
      fontFamily: 'monospace'
    }}>
      <div style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>
        💾 파일 캐시 상태
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <div>🎭 애니메이션: {cacheInfo.animationSize}개 / {allAnimationUrls.length}개</div>
        <div>🤖 VRM 모델: {cacheInfo.vrmSize}개 / {allVRMUrls.length}개</div>
        <div>🔄 Idle: {cacheInfo.hasIdle ? '✅' : '❌'}</div>
        <div>👤 현재 모델: {cacheInfo.hasCurrentVRM ? '✅' : '❌'}</div>
      </div>

      {/* 상세 정보 토글 버튼 */}
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {showDetails ? '🔼 상세 정보 숨기기' : '🔽 상세 정보 보기'}
        </button>
      </div>

      {/* 상세 정보 표시 */}
      {showDetails && (
        <div style={{ marginBottom: '10px', fontSize: '12px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🎭 애니메이션:</div>
          {cacheDetails.map((detail, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '2px',
              paddingLeft: '10px'
            }}>
              <span>{detail.fileName}</span>
              <span>{detail.isCached ? '✅' : '❌'}</span>
            </div>
          ))}
          
          <div style={{ fontWeight: 'bold', marginTop: '10px', marginBottom: '5px' }}>🤖 VRM 모델:</div>
          {vrmDetails.map((detail, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '2px',
              paddingLeft: '10px'
            }}>
              <span>{detail.fileName}</span>
              <span>{detail.isCached ? '✅' : '❌'}</span>
            </div>
          ))}
        </div>
      )}

      {/* 컨트롤 버튼들 */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          onClick={updateCacheInfo}
          disabled={isLoading}
          style={{
            background: isLoading ? 'rgba(100, 100, 100, 0.5)' : 'rgba(0, 100, 200, 0.7)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          {isLoading ? '⏳' : '🔄 새로고침'}
        </button>
        
        <button 
          onClick={handleClearAnimationCache}
          disabled={isLoading}
          style={{
            background: isLoading ? 'rgba(100, 100, 100, 0.5)' : 'rgba(200, 100, 0, 0.7)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          🎭🗑️
        </button>
        
        <button 
          onClick={handleClearVRMCache}
          disabled={isLoading}
          style={{
            background: isLoading ? 'rgba(100, 100, 100, 0.5)' : 'rgba(200, 0, 100, 0.7)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '12px'
          }}
        >
          🤖🗑️
        </button>
      </div>
      
      <div style={{ fontSize: '10px', marginTop: '8px', opacity: 0.7 }}>
        💡 파일들은 필요할 때 자동으로 캐시됩니다
      </div>
    </div>
  )
}

export default AnimationCachePanel 