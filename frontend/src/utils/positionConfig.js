// 기본 위치 설정값
export const DEFAULT_POSITION_CONFIG = {
  character: {
    position: { x: 0.10, y: -0.20, z: -0.10 },
    rotation: { x: 0, y: 172, z: 0 }
  },
  camera: {
    position: { x: 0.00, y: 1.40, z: 1.60 },
    target: { x: 0, y: 1.20, z: 0 }
  }
};

// localStorage 키
const STORAGE_KEY = 'amica_position_config';

// 설정 저장
export const savePositionConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    console.log('위치 설정이 저장되었습니다:', config);
    return true;
  } catch (error) {
    console.error('설정 저장 실패:', error);
    return false;
  }
};

// 설정 불러오기
export const loadPositionConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const config = JSON.parse(saved);
      console.log('저장된 위치 설정을 불러왔습니다:', config);
      return config;
    }
  } catch (error) {
    console.error('설정 불러오기 실패:', error);
  }
  
  console.log('기본 위치 설정을 사용합니다:', DEFAULT_POSITION_CONFIG);
  return DEFAULT_POSITION_CONFIG;
};

// 설정 초기화
export const resetPositionConfig = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('위치 설정이 초기화되었습니다');
    return DEFAULT_POSITION_CONFIG;
  } catch (error) {
    console.error('설정 초기화 실패:', error);
    return DEFAULT_POSITION_CONFIG;
  }
};

// 현재 설정을 기본값으로 설정
export const setAsDefault = (config) => {
  // 이 함수는 현재 설정을 새로운 "기본값"으로 저장합니다
  return savePositionConfig(config);
}; 