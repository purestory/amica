import React, { useState, useEffect } from 'react';
import { getPositionConfig, savePositionConfig } from '../utils/positionAPI';
import fileCache from '../utils/fileCache';

const SettingsPanel = ({ 
  onBackgroundChange,
  currentModel,
  currentBackground 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('character');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // 설정 상태
  const [settings, setSettings] = useState({
    character: {
      model: 'AvatarSample_B.vrm'
    },
    background: {
      type: 'color',
      color: '#000000',
      image: '',
      videoId: ''
    }
  });

  // 사용 가능한 모델 목록
  const [availableModels, setAvailableModels] = useState([]);
  
  // 사용 가능한 배경 이미지 목록
  const [availableBackgrounds, setAvailableBackgrounds] = useState([]);

  // 키보드 단축키 (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // 컴포넌트 마운트 시 설정 및 목록 로드
  useEffect(() => {
    loadSettings();
    loadAvailableModels();
    loadAvailableBackgrounds();
  }, []);

  // 현재 설정 반영
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      character: {
        model: currentModel || 'AvatarSample_B.vrm'
      },
      background: currentBackground || {
        type: 'color',
        color: '#000000',
        image: '',
        videoId: ''
      }
    }));
    
    // 초기 배경 적용 (페이지 로드 시)
    if (currentBackground && currentBackground.type) {
      applyBackground(currentBackground);
    }
  }, [currentModel, currentBackground]);

  // 설정 불러오기
  const loadSettings = async () => {
    try {
      const config = await getPositionConfig();
      if (config.character?.model) {
        setSettings(prev => ({
          ...prev,
          character: {
            model: config.character.model
          },
          background: config.background || {
            type: 'color',
            color: '#000000',
            image: '',
            videoId: ''
          }
        }));
      }
    } catch (error) {
      console.error('설정 불러오기 실패:', error);
    }
  };

  // 사용 가능한 모델 목록 로드
  const loadAvailableModels = async () => {
    try {
      const response = await fetch('/amica-api/position/models');
      const result = await response.json();
      if (result.success) {
        // 모델에 아이콘과 설명 추가
        const modelsWithIcons = result.data.map(model => ({
          ...model,
          icon: getModelIcon(model.filename),
          description: getModelDescription(model.filename)
        }));
        setAvailableModels(modelsWithIcons);
      }
    } catch (error) {
      console.error('모델 목록 로드 실패:', error);
              // 기본 모델 목록 (아이콘 포함)
        setAvailableModels([
          { 
            filename: 'AvatarSample_A.vrm', 
            name: 'Avatar Sample A', 
            path: '/vrm/AvatarSample_A.vrm',
            icon: '💜',
            description: '보라머리 여성'
          },
          { 
            filename: 'AvatarSample_B.vrm', 
            name: 'Avatar Sample B', 
            path: '/vrm/AvatarSample_B.vrm',
            icon: '👧',
            description: '갈색머리 소녀'
          },
          { 
            filename: 'AvatarSample_C.vrm', 
            name: 'Avatar Sample C', 
            path: '/vrm/AvatarSample_C.vrm',
            icon: '🎤',
            description: '팝스타 소녀'
          },
          { 
            filename: 'AvatarSample_D.vrm', 
            name: 'Avatar Sample D', 
            path: '/vrm/AvatarSample_D.vrm',
            icon: '🏃‍♂️',
            description: '체육복 남성'
          }
        ]);
    }
  };

  // 모델 파일명에 따른 아이콘 반환
  const getModelIcon = (filename) => {
    const iconMap = {
      'AvatarSample_A.vrm': '💜',
      'AvatarSample_B.vrm': '👧', 
      'AvatarSample_C.vrm': '🎤',
      'AvatarSample_D.vrm': '🏃‍♂️'
    };
    return iconMap[filename] || '🧑';
  };

  // 모델 파일명에 따른 설명 반환
  const getModelDescription = (filename) => {
    const descMap = {
      'AvatarSample_A.vrm': '보라머리 여성',
      'AvatarSample_B.vrm': '갈색머리 소녀',
      'AvatarSample_C.vrm': '팝스타 소녀', 
      'AvatarSample_D.vrm': '체육복 남성'
    };
    return descMap[filename] || '기본 아바타';
  };

  // 사용 가능한 배경 이미지 목록 로드
  const loadAvailableBackgrounds = async () => {
    try {
      const response = await fetch('/amica-api/position/backgrounds');
      const result = await response.json();
      if (result.success) {
        setAvailableBackgrounds(result.data);
      }
    } catch (error) {
      console.error('배경 이미지 목록 로드 실패:', error);
      setAvailableBackgrounds([]);
    }
  };

  // 캐릭터 모델 변경 (설정에만 저장, 실시간 변경 없음)
  const handleModelChange = (modelFilename) => {
    setSettings(prev => ({
      ...prev,
      character: {
        ...prev.character,
        model: modelFilename
      }
    }));
    
    // 실시간 변경 제거 - 설정에만 저장
    // if (onModelChange) {
    //   onModelChange(modelFilename);
    // }
  };

  // 배경 타입 변경
  const handleBackgroundTypeChange = (type) => {
    const newBackground = {
      ...settings.background,
      type: type
    };
    
    setSettings(prev => ({
      ...prev,
      background: newBackground
    }));
    
    // 즉시 적용
    applyBackground(newBackground);
  };

  // 배경 색상 변경
  const handleBackgroundColorChange = (color) => {
    const newBackground = {
      ...settings.background,
      color: color
    };
    
    setSettings(prev => ({
      ...prev,
      background: newBackground
    }));
    
    // 즉시 적용
    applyBackground(newBackground);
  };

  // 배경 이미지 변경
  const handleBackgroundImageChange = (imageUrl) => {
    const newBackground = {
      ...settings.background,
      image: imageUrl,
      type: 'image'
    };
    
    setSettings(prev => ({
      ...prev,
      background: newBackground
    }));
    
    // 즉시 적용
    applyBackground(newBackground);
  };

  // YouTube 비디오 ID 변경
  const handleVideoIdChange = (videoId) => {
    const newBackground = {
      ...settings.background,
      videoId: videoId,
      type: 'video'
    };
    
    setSettings(prev => ({
      ...prev,
      background: newBackground
    }));
    
    // 즉시 적용
    applyBackground(newBackground);
  };

  // 배경 적용 (fileCache 사용)
  const applyBackground = async (background) => {
    // 기존 배경 제거
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '';
    
    // YouTube 비디오 제거
    const existingVideo = document.getElementById('youtube-background');
    if (existingVideo) {
      existingVideo.remove();
    }

    if (background.type === 'transparent') {
      document.body.style.backgroundColor = 'transparent';
    } else if (background.type === 'color') {
      document.body.style.backgroundColor = background.color;
    } else if (background.type === 'image' && background.image) {
      try {
        // fileCache를 사용하여 이미지 로드
        const blob = await fileCache.getFile(background.image); // 배경 이미지는 자동 판단
        const blobURL = fileCache.createBlobURL(blob);
        
        document.body.style.backgroundImage = `url(${blobURL})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        
        console.log(`🖼️ 배경 이미지 적용: ${background.image}`);
      } catch (error) {
        console.error('배경 이미지 로드 실패:', error);
        // 실패 시 원본 URL 사용
        document.body.style.backgroundImage = `url(${background.image})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
      }
    } else if (background.type === 'video' && background.videoId) {
      // YouTube 비디오 배경
      const iframe = document.createElement('iframe');
      iframe.id = 'youtube-background';
      iframe.src = `https://www.youtube.com/embed/${background.videoId}?autoplay=1&mute=1&loop=1&playlist=${background.videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`;
      iframe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: -1;
        pointer-events: none;
        border: none;
      `;
      document.body.appendChild(iframe);
    }

    // 콜백 호출
    if (onBackgroundChange) {
      onBackgroundChange(background);
    }
  };

  // 설정 저장
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // 현재 위치 설정도 함께 가져와서 저장
      const currentConfig = await getPositionConfig();
      
      const config = {
        character: {
          ...currentConfig.character,
          model: settings.character.model
        },
        camera: currentConfig.camera,
        background: settings.background
      };

      await savePositionConfig(config);
      setSaveMessage('설정이 성공적으로 저장되었습니다!');
    } catch (error) {
      setSaveMessage('설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  if (!isVisible) {
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={() => setIsVisible(true)}
          style={{
            background: 'rgba(156, 39, 176, 0.9)',
            border: 'none',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
          title="설정 패널 열기 (Ctrl+S)"
        >
          ⚙️ 설정
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      borderRadius: '12px',
      padding: '0',
      minWidth: '320px',
      maxWidth: '400px',
      maxHeight: '80vh',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.1)',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(156, 39, 176, 0.2)',
        borderRadius: '12px 12px 0 0'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          ⚙️ 설정
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
        <div style={{ padding: '16px', overflowY: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
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
                background: activeTab === 'character' ? 'rgba(156, 39, 176, 0.8)' : 'transparent',
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
              onClick={() => setActiveTab('background')}
              style={{
                background: activeTab === 'background' ? 'rgba(156, 39, 176, 0.8)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                flex: '1',
                fontWeight: activeTab === 'background' ? 'bold' : 'normal'
              }}
            >
              🖼️ 배경
            </button>
          </div>

          {/* 캐릭터 탭 */}
          {activeTab === 'character' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  👤 캐릭터 모델
                </h4>
                
                {/* 안내 메시지 */}
                <div style={{
                  background: 'rgba(255, 193, 7, 0.2)',
                  border: '1px solid rgba(255, 193, 7, 0.5)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginBottom: '12px',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  ⚠️ 모델 변경 후 <strong>저장</strong>하고 <strong>페이지 새로고침</strong>하면 적용됩니다.
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {availableModels.map(model => (
                    <label key={model.filename} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      background: settings.character.model === model.filename 
                        ? 'rgba(156, 39, 176, 0.3)' 
                        : 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      border: settings.character.model === model.filename 
                        ? '2px solid rgba(156, 39, 176, 0.8)' 
                        : '2px solid transparent',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="radio"
                        name="characterModel"
                        value={model.filename}
                        checked={settings.character.model === model.filename}
                        onChange={() => handleModelChange(model.filename)}
                        style={{ marginRight: '12px' }}
                      />
                      
                      {/* 캐릭터 아이콘 */}
                      <div style={{
                        fontSize: '24px',
                        marginRight: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%'
                      }}>
                        {model.icon || '🧑'}
                      </div>
                      
                      {/* 모델 정보 */}
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: 'bold',
                          marginBottom: '2px',
                          color: 'white'
                        }}>
                          {model.name}
                        </div>
                        <div style={{ 
                          fontSize: '10px',
                          color: 'rgba(255,255,255,0.7)'
                        }}>
                          {model.description || model.filename}
                        </div>
                      </div>
                      
                      {/* 선택 표시 */}
                      {settings.character.model === model.filename && (
                        <div style={{
                          color: 'rgba(156, 39, 176, 1)',
                          fontSize: '16px',
                          marginLeft: '8px'
                        }}>
                          ✓
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 배경 탭 */}
          {activeTab === 'background' && (
            <div>
              {/* 배경 타입 선택 */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  🎨 배경 타입
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { value: 'transparent', label: '투명', icon: '🔍' },
                    { value: 'color', label: '색상', icon: '🎨' },
                    { value: 'image', label: '이미지', icon: '🖼️' },
                    { value: 'video', label: '비디오', icon: '📹' }
                  ].map(type => (
                    <label key={type.value} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: settings.background.type === type.value 
                        ? 'rgba(156, 39, 176, 0.3)' 
                        : 'rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      justifyContent: 'center',
                      border: settings.background.type === type.value 
                        ? '1px solid rgba(156, 39, 176, 0.8)' 
                        : '1px solid transparent'
                    }}>
                      <input
                        type="radio"
                        name="backgroundType"
                        value={type.value}
                        checked={settings.background.type === type.value}
                        onChange={() => handleBackgroundTypeChange(type.value)}
                        style={{ marginRight: '6px' }}
                      />
                      <span>{type.icon} {type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 배경 색상 선택 */}
              {settings.background.type === 'color' && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    color: 'rgba(255,255,255,0.8)'
                  }}>
                    🎨 배경 색상
                  </h4>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={settings.background.color}
                      onChange={(e) => handleBackgroundColorChange(e.target.value)}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={settings.background.color}
                      onChange={(e) => handleBackgroundColorChange(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        flex: '1',
                        fontSize: '12px'
                      }}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              )}

              {/* 미리 정의된 배경 이미지 */}
              {settings.background.type === 'image' && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    color: 'rgba(255,255,255,0.8)'
                  }}>
                    🖼️ 배경 이미지
                  </h4>
                  
                  {/* 미리 정의된 이미지들 */}
                  {availableBackgrounds.length > 0 && (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      {availableBackgrounds
                        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
                        .map(bg => (
                        <button
                          key={bg.filename}
                          onClick={() => handleBackgroundImageChange(bg.path)}
                          style={{
                            background: settings.background.image === bg.path 
                              ? 'rgba(156, 39, 176, 0.3)' 
                              : 'rgba(255,255,255,0.1)',
                            border: settings.background.image === bg.path 
                              ? '2px solid rgba(156, 39, 176, 0.8)' 
                              : '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '6px',
                            padding: '4px',
                            cursor: 'pointer',
                            overflow: 'hidden'
                          }}
                          title={bg.name}
                        >
                          <img
                            src={bg.thumbnail}
                            alt={bg.name}
                            style={{
                              width: '100%',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '4px'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div style={{ 
                            fontSize: '10px', 
                            padding: '4px 2px',
                            textAlign: 'center',
                            color: 'white'
                          }}>
                            <div style={{ fontWeight: 'bold' }}>{bg.name}</div>
                            <div style={{ 
                              fontSize: '8px', 
                              color: 'rgba(255,255,255,0.6)',
                              textTransform: 'capitalize'
                            }}>
                              {bg.category}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* 사용자 정의 이미지 URL */}
                  <input
                    type="text"
                    value={settings.background.image}
                    onChange={(e) => handleBackgroundImageChange(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      width: '100%',
                      fontSize: '12px'
                    }}
                    placeholder="또는 이미지 URL 입력..."
                  />
                </div>
              )}

              {/* YouTube 비디오 ID */}
              {settings.background.type === 'video' && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    color: 'rgba(255,255,255,0.8)'
                  }}>
                    📹 YouTube 비디오 ID
                  </h4>
                  
                  <input
                    type="text"
                    value={settings.background.videoId}
                    onChange={(e) => handleVideoIdChange(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      width: '100%',
                      fontSize: '12px'
                    }}
                    placeholder="예: dQw4w9WgXcQ"
                  />
                  <div style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.6)',
                    marginTop: '4px'
                  }}>
                    YouTube URL에서 비디오 ID만 입력하세요
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 저장 버튼 */}
          <div style={{ 
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button
              onClick={saveSettings}
              disabled={isSaving}
              style={{
                background: isSaving ? 'rgba(100,100,100,0.8)' : 'rgba(156, 39, 176, 0.8)',
                border: 'none',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '6px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                width: '100%'
              }}
              title="현재 설정을 저장"
            >
              {isSaving ? '💾 저장중...' : '💾 설정 저장'}
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
            <p style={{ margin: '0 0 4px 0' }}>💡 <strong>Ctrl+S</strong>: 설정 패널 토글</p>
            <p style={{ margin: '0' }}>⚙️ 변경사항은 즉시 적용되며, 저장 버튼으로 영구 저장</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel; 