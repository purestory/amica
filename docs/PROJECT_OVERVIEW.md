# Amica 프로젝트 개요

## 포트 정보

| 포트 | 용도 | 비고 |
|------|------|------|
| 3001 | Amica 전용 포트 | 무조건 이 포트만 사용 |
| 8880 | Kokoro TTS API | 외부 Docker 컨테이너 |

## 구동 방법

```bash
# 3001 포트로 실행 (무조건 이 포트만 사용)
cd /home/purestory/amica
PORT=3001 npm run dev

# 포트 3001이 이미 사용 중인 경우 해당 프로세스 종료 후 실행
sudo ss -tulpn | grep 3001
sudo kill -9 [PID]
PORT=3001 npm run dev

# Kokoro TTS Docker 컨테이너 상태 확인
docker ps | grep kokoro

# Kokoro TTS Docker 컨테이너 재시작
docker restart kokoro-fastapi
```

## 프로젝트 주요 기능

- **3D 아바타**: VRM 모델을 사용한 3D 캐릭터 렌더링
- **AI 챗봇**: 다양한 LLM 백엔드 연동 (OpenAI, Llama, Ollama 등)
- **음성 합성(TTS)**: 다양한 TTS 엔진 지원
  - Kokoro (포트 8880)
  - Piper 
  - Coqui
  - ElevenLabs
  - OpenAI TTS
  - 로컬 XTTS
  - RVC (AI 음성 변환)
- **음성 인식(STT)**: 
  - Whisper (브라우저 내 동작)
  - OpenAI Whisper API
  - WhisperCPP
- **비전 처리**: 
  - OpenAI Vision
  - Llama Vision
  - Ollama Vision

## 설정 관리 

- **설정 저장 위치**: `/src/features/externalAPI/dataHandlerStorage/config.json`
- **설정 변경 제한**: localhost에서만 설정 변경 가능
- **API 엔드포인트**: `/api/dataHandler?type=config`
- **설정 파일 목록**:
  - `/src/features/externalAPI/dataHandlerStorage/config.json` (기본 설정)
  - `/src/features/externalAPI/dataHandlerStorage/subconscious.json` (AI 서브컨셔스)
  - `/src/features/externalAPI/dataHandlerStorage/logs.json` (로그 데이터)
  - `/src/features/externalAPI/dataHandlerStorage/userInputMessages.json` (사용자 입력)
  - `/src/features/externalAPI/dataHandlerStorage/chatLogs.json` (채팅 이력)

## 보안 제한

이 프로젝트는 **localhost에서만 설정 변경이 가능**하도록 설계되어 있습니다. 원격 접속 시에는 설정 변경이 불가능하며, 서버에 저장된 설정을 그대로 사용합니다.

## 외부 연동 서비스

### Kokoro TTS API
- **기본 URL**: `http://localhost:8880`
- **Docker 컨테이너**: `kokoro-fastapi`
- **API 엔드포인트**: `/tts`, `/voices`
- **중요**: Kokoro URL을 `http://localhost:8880`로 설정해야 정상 작동합니다.

### 다국어 지원
- 영어(en)
- 중국어(zh)
- 독일어(de)
- 그루지야어(ka)

## 주의사항

1. **중요**: 무조건 3001 포트만 사용합니다. 다른 포트는 사용하지 않습니다.
2. 포트 충돌 시: `sudo ss -tulpn | grep 3001` 명령으로 확인 후 충돌 프로세스 종료
3. 설정 변경은 로컬에서만 가능합니다.
4. 설정 파일 백업: `/src/features/externalAPI/dataHandlerStorage/` 디렉토리를 복사

## 개발 환경

- Next.js 14.2.15
- TypeScript
- Three.js (3D 렌더링)
- i18next (다국어 처리)
- PWA 지원
