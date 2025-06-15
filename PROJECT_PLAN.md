# 🎯 Amica AI Assistant 프로젝트 재구성 계획서

## 📋 **프로젝트 개요**

기존의 복잡한 Next.js 구조를 **Frontend/Backend 분리 아키텍처**로 재구성하여 유지보수성과 확장성을 향상시킵니다.

## 🏗️ **새로운 아키텍처**

```
amica/
├── backup/                    # 기존 프로젝트 백업 ✅
├── frontend/                  # React 프론트엔드
│   ├── public/               ✅
│   ├── src/                  ✅
│   │   ├── components/       ✅ - UI 컴포넌트
│   │   ├── features/         ✅ - 기능별 모듈
│   │   ├── utils/           ✅ - 유틸리티 함수
│   │   ├── hooks/           ✅ - React 커스텀 훅
│   │   ├── pages/           ✅ - 페이지 컴포넌트
│   │   └── styles/          ✅ - CSS/스타일
│   ├── package.json         🔄 - 생성 예정
│   └── nginx.conf           🔄 - Nginx 설정
├── backend/                   # Node.js Express 백엔드
│   ├── src/                  ✅
│   │   ├── routes/          ✅ - API 라우트
│   │   ├── controllers/     ✅ - 비즈니스 로직
│   │   ├── middleware/      ✅ - 미들웨어
│   │   └── services/        ✅ - 서비스 레이어
│   ├── userdata/            ✅ - 사용자 데이터
│   ├── config/              ✅ - 백엔드 설정
│   └── package.json         🔄 - 생성 예정
└── README.md                🔄 - 업데이트 예정
```

## 🎯 **기술 스택**

### **Frontend (React)**
- **Framework**: React 18 + Vite
- **UI Library**: Tailwind CSS
- **3D Engine**: Three.js + @react-three/fiber
- **Audio**: Web Audio API
- **Build Tool**: Vite
- **Type Safety**: TypeScript

### **Backend (Express)**
- **Runtime**: Node.js 22
- **Framework**: Express.js
- **File Handling**: Multer
- **Configuration**: JSON files
- **Logging**: Winston
- **Process Manager**: PM2

## 🌐 **네트워크 구성**

### **Frontend 서비스**
- **서비스**: Nginx (Static File Serving)
- **URL**: `https://ai-open.kr/amica/`
- **Build 결과물**: `/frontend/dist/`

### **Backend API**
- **서비스**: Express Server
- **포트**: 3101
- **URL**: `http://localhost:3101`
- **Proxy**: Nginx → Backend

### **Nginx 설정**
```nginx
# Frontend (Static Files)
location /amica/ {
    alias /home/purestory/amica/frontend/dist/;
    try_files $uri $uri/ /amica/index.html;
    index index.html;
}

# Backend API
location /amica/api/ {
    proxy_pass http://localhost:3101/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 🚀 **구현 단계**

### **1단계: Backend 구축** 🔄
- [ ] Express 서버 기본 구조
- [ ] API 라우트 (`/api/config`, `/api/dataHandler`)
- [ ] 설정 파일 관리 시스템
- [ ] CORS 및 보안 미들웨어
- [ ] 포트 3101에서 서비스

### **2단계: Frontend 구축** 🔄
- [ ] React + Vite 기본 구조
- [ ] Three.js VRM 뷰어 컴포넌트
- [ ] 음성 인식/합성 기능
- [ ] 채팅 인터페이스
- [ ] 설정 페이지

### **3단계: 통합 및 배포** 🔄
- [ ] Frontend/Backend 연동
- [ ] Nginx 설정 적용
- [ ] 빌드 및 배포 스크립트
- [ ] SystemD 서비스 설정

## 📊 **API 설계**

### **Backend Endpoints (Port 3101)**
```
GET  /config                   # 설정 조회
POST /config                   # 설정 업데이트
GET  /dataHandler?type=logs    # 로그 조회
POST /dataHandler?type=chatLogs # 채팅 로그 저장
GET  /files/vrm                # VRM 파일 목록
POST /files/upload             # 파일 업로드
```

### **Frontend API Calls**
```javascript
// 설정 조회
fetch('/amica/api/config')

// 채팅 로그 저장
fetch('/amica/api/dataHandler?type=chatLogs', {
  method: 'POST',
  body: JSON.stringify(messages)
})
```

## 🔒 **보안 고려사항**

1. **CORS 설정**: Frontend 도메인만 허용
2. **Rate Limiting**: API 요청 제한
3. **Input Validation**: 모든 입력 데이터 검증
4. **File Upload Security**: 안전한 파일 업로드
5. **Environment Variables**: 민감한 정보 분리

## 📦 **배포 구성**

### **Production 환경**
- **Frontend**: Nginx 정적 파일 서빙
- **Backend**: PM2로 프로세스 관리
- **Reverse Proxy**: Nginx → Express

### **Development 환경**
- **Frontend**: Vite Dev Server (HMR)
- **Backend**: Nodemon (Auto Restart)
- **Proxy**: Vite Proxy → Backend

## 🎉 **예상 효과**

1. **✅ 명확한 책임 분리**: Frontend(UI) ↔ Backend(API)
2. **✅ 독립적 개발**: 각 팀이 독립적으로 개발 가능
3. **✅ 확장성 향상**: 각 서비스를 독립적으로 스케일링
4. **✅ 유지보수성**: 코드베이스 분리로 관리 용이
5. **✅ 성능 최적화**: Static File + API 서버 분리

## 🚀 **다음 단계**

1. **Backend Express 서버 구축** (30분)
2. **Frontend React 앱 생성** (30분)
3. **기본 API 연동 테스트** (20분)
4. **Nginx 설정 적용** (20분)
5. **VRM 뷰어 포팅** (60분)

**🎯 목표: 2시간 내 기본 구조 완성!** 