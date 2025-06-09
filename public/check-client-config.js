// 클라이언트에서 서버 설정을 확인하는 스크립트
async function checkServerConfig() {
  const configDiv = document.getElementById('config-results');
  configDiv.innerHTML = '서버 설정 로드 중...';
  
  try {
    // 서버 설정 가져오기
    const response = await fetch('/api/dataHandler/?type=config');
    const serverConfig = await response.json();
    
    // localStorage에서 설정 가져오기
    const localConfig = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('amica_')) {
        const realKey = key.replace('amica_', '');
        localConfig[realKey] = localStorage.getItem(key);
      }
    }
    
    // 결과 표시
    configDiv.innerHTML = `
      <h3>서버 설정 (${Object.keys(serverConfig).length}개)</h3>
      <pre>${JSON.stringify(serverConfig, null, 2)}</pre>
      
      <h3>로컬 스토리지 설정 (${Object.keys(localConfig).length}개)</h3>
      <pre>${JSON.stringify(localConfig, null, 2)}</pre>
      
      <h3>중요 설정 확인</h3>
      <ul>
        <li>TTS 백엔드 (서버): ${serverConfig.tts_backend || '없음'}</li>
        <li>TTS 백엔드 (로컬): ${localConfig.tts_backend || '없음'}</li>
        <li>OpenAI TTS API 키 (서버): ${serverConfig.openai_tts_apikey ? '설정됨' : '없음'}</li>
        <li>OpenAI TTS API 키 (로컬): ${localConfig.openai_tts_apikey ? '설정됨' : '없음'}</li>
      </ul>
    `;
  } catch (error) {
    configDiv.innerHTML = `오류 발생: ${error.message}`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const root = document.createElement('div');
  root.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif;">
      <h2>Amica 설정 확인</h2>
      <button id="check-button">설정 확인하기</button>
      <div id="config-results" style="margin-top: 20px;"></div>
    </div>
  `;
  document.body.appendChild(root);
  
  document.getElementById('check-button').addEventListener('click', checkServerConfig);
}); 