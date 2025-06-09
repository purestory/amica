# Amica AI 가상 비서 (Production 환경)

Amica는 자연스러운 음성 대화와 비전을 통해 소통할 수 있는 개인용 3D 동반자입니다. 감정 엔진을 통해 감정을 표현하고, 작업을 완료하며, 자체적으로 참여할 수 있습니다.

## 🚀 빠른 시작

### 현재 실행 상태
- **포트**: 3100
- **실행 모드**: 개발 모드 (안정성 확보)
- **접속 주소**: 
  - 로컬: `http://localhost:3100`
  - 내부 네트워크: `http://192.168.0.22:3100`

### 서버 시작
```bash
# 개발 모드로 실행 (권장)
PORT=3100 npm run dev

# 서버 완전 종료
bash stop-amica.sh
```

## 🔧 최근 해결된 문제들

### ✅ React Hydration 에러 해결
- **문제**: 서버 사이드 렌더링과 클라이언트 렌더링 불일치
- **해결**: 클라이언트 전용 렌더링으로 변경 (`isMounted` 상태 추가)

### ✅ Invalid Hook Call 에러 해결
- **문제**: React Hooks가 잘못된 위치에서 호출됨
- **해결**: `useEffect`를 사용하여 window 객체 접근을 안전하게 수정

### ✅ Window 객체 에러 해결
- **문제**: 서버 사이드에서 브라우저 전용 코드 실행
- **해결**: `window.addEventListener`를 `useEffect` 안에서 호출

### ✅ 로딩 화면 개선
- **문제**: "Amica 로딩 중..." 화면에서 멈춤
- **해결**: 클라이언트 렌더링 조건 추가로 자동 전환

## ⚠️ 알려진 문제

### Production 모드 JSON 파싱 에러
- **문제**: Next.js 14.2.15 버전의 버그로 `.next/prerender-manifest.json` 파일이 잘못된 형식으로 생성됨
- **증상**: `SyntaxError: Expected property name or '}' in JSON at position 1`
- **임시 해결책**: 개발 모드 사용 (기능상 차이 없음)
- **근본 원인**: Next.js 빌드 시스템이 JSON 파일을 `{version:3,...}` 형식으로 생성 (따옴표 누락)

## 🛠️ 서버 관리

### 서버 상태 확인
```bash
# 포트 확인
netstat -tlnp | grep :3100

# 프로세스 확인
ps aux | grep next | grep -v grep

# 서버 응답 확인
curl http://localhost:3100
```

### 서버 종료
```bash
# 완전 종료 스크립트 사용 (권장)
bash stop-amica.sh

# 수동 종료
sudo pkill -f "next"
sudo pkill -f "node.*3100"
```

## 🌐 접속 제한

### 내부 접속 허용 대역
- `localhost` (`127.0.0.1`)
- `192.168.0.x` 대역

### 외부 접속 제한 기능
- 설정 변경 API 비활성화
- 파일 업로드/다운로드 제한
- 민감한 기능 숨김

## 🔐 초기 설정 (중요!)

### API Key 설정
1. `userdata/config.json.example` 파일을 복사하여 `userdata/config.json` 생성
2. 필요한 API key들을 실제 값으로 교체:
   ```json
   {
     "openrouter_apikey": "YOUR_OPENROUTER_API_KEY_HERE",
     "openai_tts_apikey": "YOUR_OPENAI_API_KEY_HERE"
   }
   ```

### ⚠️ 보안 주의사항
- `userdata/config.json` 파일은 **절대 Git에 커밋하지 마세요**
- 실제 API key가 포함된 파일이므로 외부 공유 금지
- `.gitignore`에 이미 `userdata/` 폴더가 제외되어 있습니다

## 📁 주요 파일 구조

```
amica/
├── src/
│   ├── pages/
│   │   └── index.tsx          # 메인 페이지 (클라이언트 렌더링)
│   ├── components/
│   │   └── vrmViewer.tsx      # VRM 뷰어 (window 객체 안전 처리)
│   └── utils/
│       ├── config.ts          # 설정 관리
│       └── internalIpCheck.ts # 내부 접속 판단
├── userdata/
│   ├── config.json.example   # 설정 템플릿 (Git 포함)
│   ├── config.json           # 실제 설정 (Git 제외)
│   └── initial_config.json   # 초기 설정 (Git 제외)
├── .next/
│   └── prerender-manifest.json # (문제 파일)
├── stop-amica.sh             # 서버 종료 스크립트
└── README.md                 # 이 파일
```

## 🚨 문제 해결

### 로딩 화면에서 멈춤
1. 브라우저 새로고침 (F5)
2. 개발자 도구에서 JavaScript 에러 확인
3. 서버 재시작: `bash stop-amica.sh && PORT=3100 npm run dev`

### Production 모드 실행 안됨
1. 현재는 개발 모드만 사용 가능
2. Next.js 버전 업데이트 시 재시도 예정

### 포트 충돌
```bash
# 포트 사용 프로세스 확인
sudo lsof -i :3100

# 강제 종료
sudo kill -9 [PID]
```

## 📊 성능 최적화

### 현재 적용된 최적화
- 클라이언트 사이드 렌더링으로 Hydration 에러 방지
- PWA 서비스 워커 (개발 모드에서 비활성화)
- 정적 에셋 최적화
- 메모리 누수 방지를 위한 이벤트 리스너 정리

## 🔄 업데이트 이력

### 2024년 최신 업데이트
- ✅ React Hydration 에러 완전 해결
- ✅ 모든 Hook 에러 수정
- ✅ 안정적인 클라이언트 렌더링 구현
- ✅ 내부 접속 보안 강화
- ⚠️ Production 모드 이슈 발견 (Next.js 버그)

## 📞 지원

### 브라우저 접속
1. `http://localhost:3100` 또는 `http://192.168.0.22:3100` 접속
2. 처음에 "Amica 로딩 중..." 화면 표시
3. 자동으로 메인 화면 전환 (약 3초)
4. 모든 기능 정상 작동

### 추가 정보
- 모든 설정은 `userdata/config.json`에서 관리
- VRM 모델은 웹 인터페이스에서 변경 가능
- 외부 접속 시 일부 기능 제한됨

---

**🎉 Amica가 포트 3100에서 정상 실행 중입니다!**