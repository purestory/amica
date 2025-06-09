// 로컬 스토리지 상태를 확인하는 스크립트
// 브라우저 콘솔에서 실행하세요

(function checkLocalStorage() {
  console.log('==== 로컬 스토리지 확인 ====');
  
  // 모든 로컬 스토리지 항목 출력
  const allItems = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    allItems[key] = value;
  }
  
  console.log('모든 항목:', allItems);
  
  // 특정 항목 확인
  const keyToCheck = 'chatvrm_show_introduction';
  const value = localStorage.getItem(keyToCheck);
  console.log(`${keyToCheck} 값:`, value);
  
  // 서버 설정 값 확인
  const serverConfigStr = localStorage.getItem('debug_serverConfig');
  if (serverConfigStr) {
    try {
      const serverConfig = JSON.parse(serverConfigStr);
      console.log('서버 설정:', serverConfig);
      console.log('서버의 show_introduction 값:', serverConfig.show_introduction);
    } catch (e) {
      console.error('서버 설정 파싱 오류:', e);
    }
  } else {
    console.log('서버 설정이 로컬 스토리지에 없습니다');
  }
})(); 