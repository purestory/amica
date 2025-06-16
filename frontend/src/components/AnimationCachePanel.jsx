import React, { useState, useEffect } from 'react'
import fileCache from '../utils/fileCache'

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
  const [isCollapsed, setIsCollapsed] = useState(true) // 기본적으로 접힌 상태

  // 모든 애니메이션 URL 목록
  const allAnimationUrls = [
    '/animations/dance.vrma',
    '/animations/greeting.vrma', 
    '/animations/idle_loop.vrma',
    '/animations/modelPose.vrma',
    '/animations/peaceSign.vrma',
    '/animations/shoot.vrma',
    '/animations/showFullBody.vrma',
    '/animations/spin.vrma',
    '/animations/squat.vrma'
  ]

  // VRM 모델 URL 목록  
  const allVRMUrls = [
    '/vrm/AvatarSample_A.vrm',
    '/vrm/AvatarSample_B.vrm',
    '/vrm/AvatarSample_C.vrm',
    '/vrm/AvatarSample_D.vrm'
  ]

  // 캐시 정보 업데이트
  const updateCacheInfo = async () => {
    setIsLoading(true)
    try {
      // 통합 파일 캐시 정보
      const cacheSize = await fileCache.getCacheSize()
      
      // 특정 파일들 확인
      const hasIdle = await fileCache.hasFile('/animations/idle_loop.vrma')
      const hasCurrentVRM = await fileCache.hasFile('/vrm/AvatarSample_B.vrm')
      
      // 애니메이션과 VRM 파일 개수 계산
      const animationFiles = cacheSize.files.filter(f => f.url.includes('/animations/'))
      const vrmFiles = cacheSize.files.filter(f => f.url.includes('/vrm/'))
      
      setCacheInfo({ 
        animationSize: animationFiles.length, 
        vrmSize: vrmFiles.length, 
        hasIdle, 
        hasCurrentVRM,
        totalSize: cacheSize.formattedSize,
        totalFiles: cacheSize.fileCount
      })

      // 각 애니메이션의 캐시 상태 확인
      const animDetails = []
      for (const url of allAnimationUrls) {
        const isCached = await fileCache.hasFile(url)
        const fileName = url.split('/').pop()
        animDetails.push({ fileName, url, isCached, type: 'animation' })
      }
      setCacheDetails(animDetails)

      // 각 VRM 모델의 캐시 상태 확인
      const vrmDetailsList = []
      for (const url of allVRMUrls) {
        const isCached = await fileCache.hasFile(url)
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

  // 전체 캐시 삭제 처리
  const handleClearAllCache = async () => {
    if (confirm('정말로 모든 파일 캐시를 삭제하시겠습니까?')) {
      setIsLoading(true)
      try {
        await fileCache.clearCache()
        await updateCacheInfo()
        alert('모든 파일 캐시가 성공적으로 삭제되었습니다!')
      } catch (error) {
        console.error('캐시 삭제 실패:', error)
        alert('캐시 삭제 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  // 애니메이션 캐시 삭제
  const handleClearAnimationCache = async () => {
    if (confirm('애니메이션 캐시를 삭제하시겠습니까?')) {
      setIsLoading(true)
      try {
        // 애니메이션 파일들만 삭제
        for (const url of allAnimationUrls) {
          await fileCache.deleteFile(url)
        }
        await updateCacheInfo()
        alert('애니메이션 캐시가 성공적으로 삭제되었습니다!')
      } catch (error) {
        console.error('애니메이션 캐시 삭제 실패:', error)
        alert('애니메이션 캐시 삭제 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  // VRM 캐시 삭제
  const handleClearVRMCache = async () => {
    if (confirm('VRM 모델 캐시를 삭제하시겠습니까?')) {
      setIsLoading(true)
      try {
        // VRM 파일들만 삭제
        for (const url of allVRMUrls) {
          await fileCache.deleteFile(url)
        }
        await updateCacheInfo()
        alert('VRM 모델 캐시가 성공적으로 삭제되었습니다!')
      } catch (error) {
        console.error('VRM 캐시 삭제 실패:', error)
        alert('VRM 캐시 삭제 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  // 캐시 정리 (오래된 파일 삭제)
  const handleCleanupCache = async () => {
    if (confirm('7일 이상 사용하지 않은 캐시를 정리하시겠습니까?')) {
      setIsLoading(true)
      try {
        const result = await fileCache.cleanupCache()
        await updateCacheInfo()
        alert(`캐시 정리 완료: ${result.deletedCount}개 파일 삭제`)
      } catch (error) {
        console.error('캐시 정리 실패:', error)
        alert('캐시 정리 중 오류가 발생했습니다.')
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

  // 접힌 상태일 때 간단한 버튼만 표시
  if (isCollapsed) {
    return (
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 1000,
        fontFamily: 'monospace',
        cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.2)'
      }}
      onClick={() => setIsCollapsed(false)}
      title="캐시 패널 열기"
      >
        💾 캐시 ({cacheInfo.totalFiles || 0})
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '0',
      borderRadius: '8px',
      fontSize: '14px',
      minWidth: '300px',
      maxWidth: '400px',
      zIndex: 1000,
      fontFamily: 'monospace',
      border: '1px solid rgba(255,255,255,0.2)',
      overflow: 'hidden'
    }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '12px 15px',
        background: 'rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          💾 파일 캐시 상태
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '4px'
          }}
          title="접기"
        >
          ✕
        </button>
      </div>
      
      {/* 내용 */}
      <div style={{ padding: '15px' }}>
      
      <div style={{ marginBottom: '10px' }}>
        <div>📁 전체 캐시: {cacheInfo.totalFiles || 0}개 ({cacheInfo.totalSize || '0 B'})</div>
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
    </div>
  )
}

export default AnimationCachePanel 