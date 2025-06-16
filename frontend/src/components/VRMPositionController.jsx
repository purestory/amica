import React, { useState, useEffect } from 'react'
import { getPositionConfig, savePositionConfig, resetPositionConfig } from '../utils/positionAPI'

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
  const [activeTab, setActiveTab] = useState('character')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // 직접 입력을 위한 임시 상태
  const [tempValues, setTempValues] = useState({
    character: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    },
    camera: {
      position: { x: 0, y: 0, z: 0 },
      target: { x: 0, y: 0, z: 0 }
    }
  })

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

  // props 변경 시 임시 값 업데이트
  useEffect(() => {
    setTempValues({
      character: {
        position: { ...position },
        rotation: { 
          x: rotation.x,
          y: rotation.y * 180 / Math.PI, // 라디안을 도로 변환
          z: rotation.z
        }
      },
      camera: {
        position: { ...cameraPosition },
        target: { ...cameraTarget }
      }
    })
  }, [position, rotation, cameraPosition, cameraTarget])

  // 백엔드에서 설정 불러오기
  const loadSettings = async () => {
    try {
      const config = await getPositionConfig()
      
      // 불러온 설정을 적용
      setPosition(config.character.position)
      setRotation({
        x: config.character.rotation.x,
        y: config.character.rotation.y * Math.PI / 180, // 도를 라디안으로 변환
        z: config.character.rotation.z
      })
      setCameraPosition(config.camera.position)
      setCameraTarget(config.camera.target)
      
      setSaveMessage('설정을 성공적으로 불러왔습니다!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setSaveMessage('설정 불러오기에 실패했습니다.')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  // 현재 설정을 백엔드에 저장
  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const config = {
        character: {
          position: { ...position },
          rotation: {
            x: rotation.x,
            y: rotation.y * 180 / Math.PI, // 라디안을 도로 변환
            z: rotation.z
          }
        },
        camera: {
          position: { ...cameraPosition },
          target: { ...cameraTarget }
        }
      }

      await savePositionConfig(config)
      setSaveMessage('설정이 성공적으로 저장되었습니다!')
    } catch (error) {
      setSaveMessage('설정 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  // 설정 초기화
  const resetSettings = async () => {
    try {
      const config = await resetPositionConfig()
      
      // 초기화된 설정을 적용
      setPosition(config.character.position)
      setRotation({
        x: config.character.rotation.x,
        y: config.character.rotation.y * Math.PI / 180, // 도를 라디안으로 변환
        z: config.character.rotation.z
      })
      setCameraPosition(config.camera.position)
      setCameraTarget(config.camera.target)
      
      setSaveMessage('설정이 초기화되었습니다!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setSaveMessage('설정 초기화에 실패했습니다.')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  // 직접 입력 핸들러
  const handleDirectInput = (category, type, axis, value) => {
    const numValue = parseFloat(value) || 0
    setTempValues(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: {
          ...prev[category][type],
          [axis]: numValue
        }
      }
    }))
  }

  // 직접 입력 적용
  const applyDirectInput = (category, type) => {
    const value = tempValues[category][type]
    
    if (category === 'character') {
      if (type === 'position') {
        setPosition(value)
      } else if (type === 'rotation') {
        setRotation({
          x: value.x,
          y: value.y * Math.PI / 180, // 도를 라디안으로 변환
          z: value.z
        })
      }
    } else if (category === 'camera') {
      if (type === 'position') {
        setCameraPosition(value)
      } else if (type === 'target') {
        setCameraTarget(value)
      }
    }
  }

  // 미세 조절 함수
  const fineAdjust = (category, type, axis, delta) => {
    if (category === 'character') {
      if (type === 'position') {
        const newValue = position[axis] + delta
        setPosition(prev => ({ ...prev, [axis]: newValue }))
      } else if (type === 'rotation') {
        if (axis === 'y') {
          // Y축 회전은 도 단위로 조절
          const currentDegrees = rotation.y * 180 / Math.PI
          const newDegrees = currentDegrees + delta
          setRotation(prev => ({ ...prev, y: newDegrees * Math.PI / 180 }))
        } else {
          const newValue = rotation[axis] + delta * Math.PI / 180
          setRotation(prev => ({ ...prev, [axis]: newValue }))
        }
      }
    } else if (category === 'camera') {
      if (type === 'position') {
        const newValue = cameraPosition[axis] + delta
        setCameraPosition(prev => ({ ...prev, [axis]: newValue }))
      } else if (type === 'target') {
        const newValue = cameraTarget[axis] + delta
        setCameraTarget(prev => ({ ...prev, [axis]: newValue }))
      }
    }
  }

  if (!isVisible) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={() => setIsVisible(true)}
          style={{
            background: 'rgba(0, 100, 200, 0.9)',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
          title="위치 컨트롤러 열기 (Ctrl+P)"
        >
          📍 위치 조절
        </button>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      borderRadius: '12px',
      padding: '0',
      minWidth: '320px',
      maxWidth: '400px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.1)',
      zIndex: 1000
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px 12px 0 0'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          🎯 위치 컨트롤러
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '4px'
            }}
            title={isMinimized ? "확장" : "최소화"}
          >
            {isMinimized ? "📈" : "📉"}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '4px'
            }}
            title="닫기"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div style={{ padding: '16px' }}>
          {/* 탭 메뉴 */}
          <div style={{ 
            display: 'flex', 
            gap: '4px', 
            marginBottom: '16px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '4px'
          }}>
            <button
              onClick={() => setActiveTab('character')}
              style={{
                background: activeTab === 'character' ? 'rgba(0, 100, 200, 0.8)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                flex: '1',
                fontWeight: activeTab === 'character' ? 'bold' : 'normal'
              }}
            >
              🧍 캐릭터
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              style={{
                background: activeTab === 'camera' ? 'rgba(0, 100, 200, 0.8)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                flex: '1',
                fontWeight: activeTab === 'camera' ? 'bold' : 'normal'
              }}
            >
              📷 카메라
            </button>
          </div>

          {/* 캐릭터 탭 */}
          {activeTab === 'character' && (
            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {/* 캐릭터 위치 */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  📍 위치
                </h4>
                {['x', 'y', 'z'].map(axis => (
                  <div key={axis} style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}>
                      <label style={{ 
                        fontSize: '11px', 
                        color: 'rgba(255,255,255,0.6)',
                        textTransform: 'uppercase',
                        fontWeight: 'bold'
                      }}>
                        {axis}
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => fineAdjust('character', 'position', axis, -0.01)}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={tempValues.character.position[axis].toFixed(3)}
                          onChange={(e) => handleDirectInput('character', 'position', axis, e.target.value)}
                          onBlur={() => applyDirectInput('character', 'position')}
                          onKeyPress={(e) => e.key === 'Enter' && applyDirectInput('character', 'position')}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            width: '60px',
                            textAlign: 'center',
                            fontSize: '11px'
                          }}
                          step="0.001"
                        />
                        <button
                          onClick={() => fineAdjust('character', 'position', axis, 0.01)}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.001"
                      value={position[axis]}
                      onChange={(e) => setPosition(prev => ({ ...prev, [axis]: parseFloat(e.target.value) }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
              </div>

              {/* 캐릭터 회전 */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  🔄 회전
                </h4>
                {['x', 'y', 'z'].map(axis => (
                  <div key={axis} style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}>
                      <label style={{ 
                        fontSize: '11px', 
                        color: 'rgba(255,255,255,0.6)',
                        textTransform: 'uppercase',
                        fontWeight: 'bold'
                      }}>
                        {axis}
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => fineAdjust('character', 'rotation', axis, -1)}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={tempValues.character.rotation[axis].toFixed(0)}
                          onChange={(e) => handleDirectInput('character', 'rotation', axis, e.target.value)}
                          onBlur={() => applyDirectInput('character', 'rotation')}
                          onKeyPress={(e) => e.key === 'Enter' && applyDirectInput('character', 'rotation')}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            width: '60px',
                            textAlign: 'center',
                            fontSize: '11px'
                          }}
                          step="1"
                        />
                        <button
                          onClick={() => fineAdjust('character', 'rotation', axis, 1)}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={axis === 'y' ? rotation.y * 180 / Math.PI : rotation[axis] * 180 / Math.PI}
                      onChange={(e) => {
                        const degrees = parseFloat(e.target.value)
                        const radians = degrees * Math.PI / 180
                        setRotation(prev => ({ ...prev, [axis]: radians }))
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 카메라 탭 */}
          {activeTab === 'camera' && (
            <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
              {/* 카메라 위치 */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  📷 위치
                </h4>
                {['x', 'y', 'z'].map(axis => (
                  <div key={axis} style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}>
                      <label style={{ 
                        fontSize: '11px', 
                        color: 'rgba(255,255,255,0.6)',
                        textTransform: 'uppercase',
                        fontWeight: 'bold'
                      }}>
                        {axis}
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => fineAdjust('camera', 'position', axis, -0.01)}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={tempValues.camera.position[axis].toFixed(3)}
                          onChange={(e) => handleDirectInput('camera', 'position', axis, e.target.value)}
                          onBlur={() => applyDirectInput('camera', 'position')}
                          onKeyPress={(e) => e.key === 'Enter' && applyDirectInput('camera', 'position')}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            width: '60px',
                            textAlign: 'center',
                            fontSize: '11px'
                          }}
                          step="0.001"
                        />
                        <button
                          onClick={() => fineAdjust('camera', 'position', axis, 0.01)}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      step="0.001"
                      value={cameraPosition[axis]}
                      onChange={(e) => setCameraPosition(prev => ({ ...prev, [axis]: parseFloat(e.target.value) }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
              </div>

              {/* 카메라 타겟 */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  🎯 타겟
                </h4>
                {['x', 'y', 'z'].map(axis => (
                  <div key={axis} style={{ marginBottom: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}>
                      <label style={{ 
                        fontSize: '11px', 
                        color: 'rgba(255,255,255,0.6)',
                        textTransform: 'uppercase',
                        fontWeight: 'bold'
                      }}>
                        {axis}
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => fineAdjust('camera', 'target', axis, -0.01)}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={tempValues.camera.target[axis].toFixed(3)}
                          onChange={(e) => handleDirectInput('camera', 'target', axis, e.target.value)}
                          onBlur={() => applyDirectInput('camera', 'target')}
                          onKeyPress={(e) => e.key === 'Enter' && applyDirectInput('camera', 'target')}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            width: '60px',
                            textAlign: 'center',
                            fontSize: '11px'
                          }}
                          step="0.001"
                        />
                        <button
                          onClick={() => fineAdjust('camera', 'target', axis, 0.01)}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.001"
                      value={cameraTarget[axis]}
                      onChange={(e) => setCameraTarget(prev => ({ ...prev, [axis]: parseFloat(e.target.value) }))}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 버튼 그룹 */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button
              onClick={loadSettings}
              style={{
                background: 'rgba(76, 175, 80, 0.8)',
                border: 'none',
                color: 'white',
                padding: '10px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                flex: '1'
              }}
              title="저장된 설정 불러오기"
            >
              📥 불러오기
            </button>
            <button
              onClick={saveSettings}
              disabled={isSaving}
              style={{
                background: isSaving ? 'rgba(100,100,100,0.8)' : 'rgba(33, 150, 243, 0.8)',
                border: 'none',
                color: 'white',
                padding: '10px 12px',
                borderRadius: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                flex: '1'
              }}
              title="현재 설정을 기본값으로 저장"
            >
              {isSaving ? '💾 저장중...' : '💾 저장'}
            </button>
            <button
              onClick={resetSettings}
              style={{
                background: 'rgba(244, 67, 54, 0.8)',
                border: 'none',
                color: 'white',
                padding: '10px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                flex: '1'
              }}
              title="기본값으로 초기화"
            >
              🔄 초기화
            </button>
          </div>

          {/* 상태 메시지 */}
          {saveMessage && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              textAlign: 'center',
              background: saveMessage.includes('실패') || saveMessage.includes('에러')
                ? 'rgba(244, 67, 54, 0.8)'
                : 'rgba(76, 175, 80, 0.8)',
              color: 'white'
            }}>
              {saveMessage}
            </div>
          )}

          {/* 도움말 */}
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: '1.4'
          }}>
            <p style={{ margin: '0 0 4px 0' }}>💡 <strong>Ctrl+P</strong>: 패널 토글</p>
            <p style={{ margin: '0' }}>🎯 직접 입력 후 <strong>Enter</strong> 또는 포커스 해제로 적용</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default VRMPositionController 