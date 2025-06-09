const fs = require('fs');
const path = require('path');

// 파일 경로 수정
const configPath = path.join(__dirname, '..', 'userdata', 'config.json');
const initialConfigPath = path.join(__dirname, '..', 'userdata', 'initial_config.json');

// 각 파일 로드
console.log('설정 파일 테스트 시작...');

function loadAndPrintFile(filePath, label) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(fileContent);
    
    console.log(`${label} 파일 로드 성공: ${filePath}`);
    console.log(`${label} 크기: ${fileContent.length} 바이트`);
    console.log(`${label} 설정 수: ${Object.keys(config).length}`);
    
    // 중요 설정 값 확인
    console.log(`${label} show_introduction 값: ${config.show_introduction}`);
    console.log(`${label} tts_backend 값: ${config.tts_backend}`);
    console.log(`${label} chatbot_backend 값: ${config.chatbot_backend}`);
    
    return config;
  } catch (error) {
    console.error(`${label} 로드 실패:`, error.message);
    return null;
  }
}

// 파일 로드 및 내용 출력
const initialConfig = loadAndPrintFile(initialConfigPath, 'initialConfig');
const serverConfig = loadAndPrintFile(configPath, 'serverConfig');

// 설정 병합 로직 테스트
if (initialConfig && serverConfig) {
  console.log('\n설정 병합 시뮬레이션:');
  
  // 로컬 스토리지 상황 시뮬레이션
  const localSettings = {
    'test_setting': 'local_value',
    'tts_backend': 'local_tts_backend'
  };
  
  // 병합된 설정 생성
  const mergedSettings = {
    ...initialConfig,
    ...serverConfig,
    ...localSettings
  };
  
  console.log('병합된 설정의 설정 수:', Object.keys(mergedSettings).length);
  console.log('병합된 설정의 tts_backend 값:', mergedSettings.tts_backend);
  console.log('병합된 설정의 test_setting 값:', mergedSettings.test_setting);
}

console.log('\n설정 파일 테스트 완료'); 