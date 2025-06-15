/* eslint-disable camelcase */
// 웹 워커 환경에서 실행되는 독립 스크립트

// Transformers 라이브러리의 필요한 기능을 가져오는 대신, 
// 필요한 기능은 메인 스레드에서 메시지로 받음

// WASM 파일 로드 설정
const env = {
  allowLocalModels: false,
  remoteHost: "http://localhost:3001/",
  backends: {
    onnx: {
      wasm: {
        // WASM 파일은 메인 스레드에서 로드하고 결과만 받음
      }
    }
  }
};

// 워커 메시지 수신 리스너
self.addEventListener("message", async (event) => {
  const message = event.data;

  // 메인 스레드에 상태 알림
  self.postMessage({
    status: "processing",
    task: "automatic-speech-recognition",
    data: "음성 인식 시작 중..."
  });

  try {
    // 실제 처리는 메인 스레드에서 수행하고 결과만 받음
    // 사용자의 음성 데이터가 메시지로 전달됨
    setTimeout(() => {
      // 가상의 결과 처리 (실제 구현이 필요함)
      self.postMessage({
        status: "complete",
        task: "automatic-speech-recognition",
        data: {
          text: "음성 인식 결과 텍스트 (데모)"
        }
      });
    }, 1000);
  } catch (error) {
    self.postMessage({
      status: "error",
      task: "automatic-speech-recognition",
      data: error.toString()
    });
  }
});
