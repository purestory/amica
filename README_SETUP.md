# 아미카(Amica) 프로젝트 설정 및 구동 가이드

## 프로젝트 개요
Amica는 VRM 모델과 AI를 활용한 대화형 가상 비서 애플리케이션입니다. 3D 캐릭터와 자연스러운 대화를 통해 사용자에게 정보를 제공하고 소통하는 웹 기반 응용 프로그램입니다.

## 시스템 요구사항
- Node.js v16 이상
- npm 또는 yarn
- 모던 웹 브라우저 (Chrome, Firefox, Safari 최신 버전 권장)
- 1GB 이상의 가용 메모리
- TTS 서비스 (Piper, OpenAI TTS 등) 연결 필요
- LLM 서비스 (OpenAI, OpenRouter 등) 연결 필요

## 디렉토리 구조
주요 디렉토리 및 파일은 다음과 같습니다:
- `src/`: 소스 코드 폴더
  - `components/`: 리액트 컴포넌트
  - `features/`: 기능별 모듈
    - `chat/`: 채팅 기능
    - `externalAPI/`: 외부 API 연동
    - `amicaLife/`: 캐릭터 생명 활동 시뮬레이션
    - `vrmViewer/`: 3D 모델 뷰어
  - `utils/`: 유틸리티 함수
  - `pages/`: Next.js 페이지
    - `api/`: API 엔드포인트
      - `dataHandler.ts`: 데이터 처리 API
      - `amicaHandler.ts`: Amica 기능 핸들러
- `userdata/`: 사용자 데이터 저장 폴더
  - `config.json`: 사용자 설정 파일
  - `initial_config.json`: 초기 설정 파일
  - `chatLogs.json`: 채팅 로그 저장 파일
- `public/`: 정적 자산 폴더
  - `vrm/`: VRM 모델 파일
  - `bg/`: 배경 이미지
  - `animations/`: 애니메이션 파일

## 설정 관리

### 설정 파일
설정은 두 가지 JSON 파일로 관리됩니다:
1. `userdata/initial_config.json`: 기본 설정 값
2. `userdata/config.json`: 사용자가 변경한 설정 값 (없으면 생성됨)

### 설정 로직
1. 서버 시작 시 `config.json` 파일을 먼저 로드
2. 파일이 없으면 `initial_config.json`에서 기본값 로드
3. 설정 변경 시 `config.json`에 누적해서 저장 (기존 설정 + 새 설정)

### 현재 주요 설정값
```json
{
  "chatbot_backend": "openrouter",
  "openrouter_model": "google/gemini-2.0-flash-exp:free",
  "tts_backend": "piper",
  "piper_url": "https://i-love-amica.com:5000/tts",
  "name": "아이유",
  "vrm_url": "/vrm/AvatarSample_B.vrm",
  "bg_url": "/bg/bg-room2.jpg",
  "animation_url": "/animations/idle_loop.vrma",
  "system_prompt": "You are an AI assistant embodying the persona of IU (Lee Ji-eun)..."
}
```

## 서버 구동 방법

### 의존성 설치
```bash
cd /home/purestory/amica
npm install
```

### 개발 서버 실행
```bash
cd /home/purestory/amica
PORT=3001 npm run dev
```

### 프로덕션 빌드 및 실행
```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
PORT=3001 npm run start
```

### 포트가 이미 사용 중인 경우
```bash
# 포트 사용 중인 프로세스 확인
sudo lsof -i :3001

# 프로세스 종료 후 서버 실행
kill -9 $(lsof -t -i:3001) 2>/dev/null || true && PORT=3001 npm run dev
```

### 설정 초기화 후 서버 실행
```bash
# config.json 삭제 후 서버 실행
rm -f userdata/config.json && PORT=3001 npm run dev
```

### 캐시 정리 후 서버 실행
```bash
npm run clean:cache && rm -rf .next && PORT=3001 npm run dev
```

## 웹 접근
개발 서버 실행 시 다음 URL로 접속할 수 있습니다:
- 로컬 접속: `http://localhost:3001`
- 외부 접속: `http://서버IP:3001`

## 로컬 스토리지
브라우저의 로컬 스토리지에 다음과 같은 정보가 저장됩니다:
- `chatvrm_chat_mode_enabled`: 채팅 모드 활성화 상태
- `chatvrm_chat_log_visible`: 채팅 로그 표시 상태
- `chatvrm_show_introduction`: 소개 화면 표시 상태
- `chatvrm_show_add_to_homescreen`: 홈 화면 추가 안내 표시 상태
- `chatvrm_name`: 캐릭터 이름
- `chatvrm_system_prompt`: 시스템 프롬프트

## API 엔드포인트

### 설정 관련 API
- `GET /api/dataHandler/?type=config`: 설정 조회
- `POST /api/dataHandler/?type=config`: 설정 업데이트
- `GET /api/deleteConfig`: 설정 파일 삭제

### 채팅 관련 API
- `GET /api/dataHandler/?type=chatLogs`: 채팅 기록 조회
- `POST /api/dataHandler/?type=chatLogs`: 채팅 기록 저장
- `GET /api/dataHandler/?type=userInputMessages`: 사용자 입력 메시지 조회
- `POST /api/dataHandler/?type=userInputMessages`: 사용자 입력 메시지 저장

## 문제 해결

### 포트 충돌
3001 포트가 이미 사용 중인 경우:
```bash
# 포트 사용 중인 프로세스 확인
sudo lsof -i :3001
# 또는
sudo netstat -tulpn | grep :3001

# 프로세스 종료
sudo kill -9 [PID]
```

### 설정 초기화
설정을 기본값으로 초기화하려면:
```bash
rm -f userdata/config.json
```

### 빌드 문제 해결
빌드 중 오류가 발생하는 경우:
```bash
# 캐시 정리
npm run clean:cache
rm -rf .next

# 노드 모듈 정리 및 재설치
rm -rf node_modules
npm install

# 메모리 증가 후 빌드
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### 설정 문제 해결
설정이 저장되지 않거나 덮어쓰기 문제가 발생하는 경우:
- `dataHandler.ts`의 설정 저장 로직에서는 기존 설정과 병합하는 로직이 적용되어 있음
- API 호출 시 URL에 '?'가 아닌 '/?'로 끝나도록 해야 함 (예: `/api/dataHandler/?type=config`)
- 외부 접속 시에는 일부 설정만 변경 가능 (`name`, `system_prompt`)

### 자원 사용량 확인
자원 사용량이 높은 경우:
```bash
# 메모리 사용량 확인
free -h

# CPU 사용량 확인
top
```

## 주요 기능 사용법

### 채팅 모드
- 채팅 모드 버튼을 클릭하여 활성화/비활성화
- 상태는 브라우저 로컬 스토리지에 저장되어 페이지 새로고침 후에도 유지됨
- 채팅 모드에서는 전체 대화 내역이 화면에 표시됨

### 채팅 로그
- 채팅 로그 버튼을 클릭하여 대화 기록 표시/숨김
- 상태는 브라우저 로컬 스토리지에 저장되어 페이지 새로고침 후에도 유지됨
- 대화 기록은 `userdata/chatLogs.json` 파일에 저장됨

### 음성 출력
- 스피커 버튼을 클릭하여 음성 출력 켜기/끄기
- `tts_muted` 설정으로 관리됨
- TTS 서비스는 `tts_backend` 설정에 따라 선택됨 (piper, openai_tts 등) 