// 백엔드 API 기본 URL
const API_BASE_URL = '/amica-api';

// API 호출 헬퍼 함수
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API 호출 실패 (${endpoint}):`, error);
    throw error;
  }
};

// 현재 위치 설정 조회
export const getPositionConfig = async () => {
  try {
    const result = await apiCall('/position');
    console.log('위치 설정 조회 성공:', result.data);
    return result.data;
  } catch (error) {
    console.error('위치 설정 조회 실패:', error);
    // 백엔드 연결 실패 시 기본값 반환
    return getDefaultConfig();
  }
};

// 위치 설정 저장
export const savePositionConfig = async (config) => {
  try {
    const result = await apiCall('/position', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    console.log('위치 설정 저장 성공:', result.message);
    return result.data;
  } catch (error) {
    console.error('위치 설정 저장 실패:', error);
    throw error;
  }
};

// 위치 설정 초기화
export const resetPositionConfig = async () => {
  try {
    const result = await apiCall('/position/reset', {
      method: 'PUT'
    });
    console.log('위치 설정 초기화 성공:', result.message);
    return result.data;
  } catch (error) {
    console.error('위치 설정 초기화 실패:', error);
    throw error;
  }
};

// 기본 위치 설정 조회
export const getDefaultPositionConfig = async () => {
  try {
    const result = await apiCall('/position/default');
    console.log('기본 위치 설정 조회 성공:', result.data);
    return result.data;
  } catch (error) {
    console.error('기본 위치 설정 조회 실패:', error);
    return getDefaultConfig();
  }
};

// 백엔드 연결 실패 시 사용할 기본 설정
const getDefaultConfig = () => ({
  character: {
    position: { x: 0.10, y: -0.20, z: -0.10 },
    rotation: { x: 0, y: 172, z: 0 }
  },
  camera: {
    position: { x: 0.00, y: 1.40, z: 1.60 },
    target: { x: 0, y: 1.20, z: 0 }
  },
  lastUpdated: new Date().toISOString()
}); 