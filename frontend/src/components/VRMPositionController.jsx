import React, { useState, useEffect } from 'react'

const VRMPositionController = ({ 
  position, 
  setPosition, 
  rotation, 
  setRotation,
  cameraPosition,
  setCameraPosition,
  cameraTarget,
  setCameraTarget,
  onReset 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // 슬라이더 변경 핸들러
  const handlePositionChange = (axis, value) => {
    setPosition(prev => ({
      ...prev,
      [axis]: parseFloat(value)
    }))
  }

  const handleRotationChange = (axis, value) => {
    setRotation(prev => ({
      ...prev,
      [axis]: parseFloat(value)
    }))
  }

  const handleCameraPositionChange = (axis, value) => {
    setCameraPosition(prev => ({
      ...prev,
      [axis]: parseFloat(value)
    }))
  }

  const handleCameraTargetChange = (axis, value) => {
    setCameraTarget(prev => ({
      ...prev,
      [axis]: parseFloat(value)
    }))
  }

  // 키보드 단축키 (Ctrl + P로 패널 토글)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault()
        setIsVisible(!isVisible)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0, 100, 200, 0.8)',
          color: 'white',
          border: 'none',
          padding: '10px 15px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}
      >
        🎮 위치 조절
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '12px',
      fontSize: '13px',
      maxWidth: '350px',
      minWidth: '320px',
      zIndex: 1000,
      fontFamily: 'monospace',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      maxHeight: isMinimized ? '50px' : '70vh',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: isMinimized ? '0' : '15px',
        borderBottom: isMinimized ? 'none' : '1px solid rgba(255,255,255,0.2)',
        paddingBottom: isMinimized ? '0' : '10px'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
          🎮 캐릭터 위치 조절
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '5px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {isMinimized ? '🔼' : '🔽'}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: 'rgba(255, 0, 0, 0.6)',
              border: 'none',
              color: 'white',
              padding: '5px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          {/* 캐릭터 위치 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4FC3F7' }}>
              👤 캐릭터 위치
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px' }}>
                X: {position.x.toFixed(2)}
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={position.x}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px' }}>
                Y: {position.y.toFixed(2)}
              </label>
              <input
                type="range"
                min="-3"
                max="3"
                step="0.1"
                value={position.y}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px' }}>
                Z: {position.z.toFixed(2)}
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={position.z}
                onChange={(e) => handlePositionChange('z', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* 캐릭터 회전 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#81C784' }}>
              🔄 캐릭터 회전
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px' }}>
                Y축 회전: {(rotation.y * 180 / Math.PI).toFixed(0)}°
              </label>
              <input
                type="range"
                min="0"
                max={2 * Math.PI}
                step="0.1"
                value={rotation.y}
                onChange={(e) => handleRotationChange('y', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* 카메라 위치 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#FFB74D' }}>
              📷 카메라 위치
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px' }}>
                X: {cameraPosition.x.toFixed(2)}
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={cameraPosition.x}
                onChange={(e) => handleCameraPositionChange('x', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px' }}>
                Y: {cameraPosition.y.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={cameraPosition.y}
                onChange={(e) => handleCameraPositionChange('y', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px' }}>
                Z: {cameraPosition.z.toFixed(2)}
              </label>
              <input
                type="range"
                min="1"
                max="8"
                step="0.1"
                value={cameraPosition.z}
                onChange={(e) => handleCameraPositionChange('z', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* 카메라 타겟 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#F06292' }}>
              🎯 카메라 타겟
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '3px' }}>
                Y: {cameraTarget.y.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={cameraTarget.y}
                onChange={(e) => handleCameraTargetChange('y', e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* 컨트롤 버튼들 */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '15px' }}>
            <button
              onClick={onReset}
              style={{
                background: 'rgba(244, 67, 54, 0.8)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                flex: '1'
              }}
            >
              🔄 리셋
            </button>
          </div>

          <div style={{ 
            fontSize: '11px', 
            marginTop: '10px', 
            opacity: 0.7,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '8px'
          }}>
            💡 단축키: Ctrl+P (패널 토글)
          </div>
        </div>
      )}
    </div>
  )
}

export default VRMPositionController 