// config.json 로드 테스트
const fs = require('fs');
const path = require('path');

// 경로 정의
const USERDATA_PATH = path.join(process.cwd(), 'userdata');
const CONFIG_PATH = path.join(USERDATA_PATH, 'config.json');
const INITIAL_CONFIG_PATH = path.join(USERDATA_PATH, 'initial_config.json');

console.log('===== 설정 파일 로드 테스트 =====');
console.log('userdata 경로:', USERDATA_PATH);
console.log('config.json 경로:', CONFIG_PATH);
console.log('initial_config.json 경로:', INITIAL_CONFIG_PATH);

// config.json 확인
console.log('\n----- config.json 확인 -----');
if (fs.existsSync(CONFIG_PATH)) {
  console.log('config.json 파일 존재함');
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    console.log('config.json 파일 크기:', configContent.length, '바이트');
    
    try {
      const configJson = JSON.parse(configContent);
      console.log('config.json 설정 개수:', Object.keys(configJson).length);
      console.log('show_introduction 값:', configJson.show_introduction);
      
      // show_introduction 설정을 false로 변경
      configJson.show_introduction = 'false';
      
      // 파일에 다시 저장
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(configJson, null, 2));
      console.log('show_introduction 값을 false로 저장함');
    } catch (jsonError) {
      console.error('config.json 파싱 오류:', jsonError);
    }
  } catch (readError) {
    console.error('config.json 파일 읽기 오류:', readError);
  }
} else {
  console.log('config.json 파일이 없음');
}

// initial_config.json 확인
console.log('\n----- initial_config.json 확인 -----');
if (fs.existsSync(INITIAL_CONFIG_PATH)) {
  console.log('initial_config.json 파일 존재함');
  try {
    const initialConfigContent = fs.readFileSync(INITIAL_CONFIG_PATH, 'utf8');
    console.log('initial_config.json 파일 크기:', initialConfigContent.length, '바이트');
    
    try {
      const initialConfigJson = JSON.parse(initialConfigContent);
      console.log('initial_config.json 설정 개수:', Object.keys(initialConfigJson).length);
      console.log('show_introduction 값:', initialConfigJson.show_introduction);
      
      // show_introduction 설정을 false로 변경
      initialConfigJson.show_introduction = 'false';
      
      // 파일에 다시 저장
      fs.writeFileSync(INITIAL_CONFIG_PATH, JSON.stringify(initialConfigJson, null, 2));
      console.log('show_introduction 값을 false로 저장함');
    } catch (jsonError) {
      console.error('initial_config.json 파싱 오류:', jsonError);
    }
  } catch (readError) {
    console.error('initial_config.json 파일 읽기 오류:', readError);
  }
} else {
  console.log('initial_config.json 파일이 없음');
}

console.log('\n설정 파일 테스트 완료'); 