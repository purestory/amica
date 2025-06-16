# 🎯 Amica AI Assistant 프로젝트 재구성 계획서

## 📋 **프로젝트 개요**

기존의 복잡한 Next.js 구조를 **Frontend/Backend 분리 아키텍처**로 재구성하여 유지보수성과 확장성을 향상시킵니다.

## 🏗️ **새로운 아키텍처**

```
amica/
├── backup/                    # 기존 프로젝트 백업 ✅
├── frontend/                  # React 프론트엔드 ✅
│   ├── public/               ✅
│   │   ├── vrm/             ✅ - VRM 모델 파일들 (A,B,C,D)
│   │   ├── animations/      ✅ - 애니메이션 파일들
│   │   └── backgrounds/     ✅ - 배경 이미지들
│   ├── src/                  ✅
│   │   ├── components/       ✅ - UI 컴포넌트
│   │   │   ├── VRMViewer.jsx           ✅ - VRM 뷰어
│   │   │   ├── SettingsPanel.jsx       ✅ - 설정 패널
│   │   │   ├── AnimationCachePanel.jsx ✅ - 캐시 관리
│   │   │   ├── VRMPositionController.jsx ✅ - 위치 조절
│   │   │   └── LoadingOverlay.jsx      ✅ - 로딩 화면
│   │   ├── lib/             ✅ - 라이브러리
│   │   │   ├── loadVRM.ts              ✅ - VRM 로더
│   │   │   └── loadVRMAnimation.ts     ✅ - 애니메이션 로더
│   │   ├── utils/           ✅ - 유틸리티 함수
│   │   │   ├── fileCache.js            ✅ - 파일 캐싱 시스템
│   │   │   └── positionAPI.js          ✅ - 위치 API
│   │   └── styles/          ✅ - CSS/스타일
│   ├── package.json         ✅ - 생성 완료
│   ├── vite.config.js       ✅ - Vite 설정
│   └── dist/                ✅ - 빌드 결과물
├── backend/                   # Node.js Express 백엔드 ✅
│   ├── src/                  ✅
│   │   ├── routes/          ✅ - API 라우트
│   │   │   └── position.js         ✅ - 위치/모델 관리 API
│   │   ├── controllers/     ✅ - 비즈니스 로직
│   │   │   └── positionController.js ✅ - 위치 컨트롤러
│   │   ├── middleware/      ✅ - 미들웨어
│   │   └── services/        ✅ - 서비스 레이어
│   ├── userdata/            ✅ - 사용자 데이터
│   │   └── position_config.json    ✅ - 위치 설정 저장
│   ├── config/              ✅ - 백엔드 설정
│   ├── package.json         ✅ - 생성 완료
│   └── server.js            ✅ - Express 서버
└── README.md                🔄 - 업데이트 예정
```

## 🎯 **기술 스택**

### **Frontend (React)** ✅
- **Framework**: React 18 + Vite ✅
- **3D Engine**: Three.js + @pixiv/three-vrm ✅
- **File Caching**: IndexedDB 기반 캐싱 시스템 ✅
- **Build Tool**: Vite ✅
- **Type Safety**: TypeScript (부분적) ✅

### **Backend (Express)** ✅
- **Runtime**: Node.js 22 ✅
- **Framework**: Express.js ✅
- **File Handling**: 정적 파일 서빙 ✅
- **Configuration**: JSON 파일 기반 ✅
- **Process Manager**: SystemD 서비스 ✅

## 🌐 **네트워크 구성** ✅

### **Frontend 서비스** ✅
- **서비스**: Nginx (Static File Serving) ✅
- **URL**: `https://amica.ai-open.kr/` ✅
- **Build 결과물**: `/frontend/dist/` ✅

### **Backend API** ✅
- **서비스**: Express Server ✅
- **포트**: 3101 ✅
- **URL**: `http://localhost:3101` ✅
- **SystemD**: amica-backend.service ✅

### **Nginx 설정** ✅
```nginx
# Frontend (Static Files) ✅
location / {
    root /home/purestory/amica/frontend/dist;
    try_files $uri $uri/ /index.html;
    index index.html;
}

# Backend API ✅
location /amica-api/ {
    proxy_pass http://localhost:3101/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 🚀 **구현 단계**

### **1단계: Backend 구축** ✅ **완료**
- [x] Express 서버 기본 구조 ✅
- [x] API 라우트 (`/api/position/*`) ✅
- [x] 설정 파일 관리 시스템 ✅
- [x] CORS 및 보안 미들웨어 ✅
- [x] 포트 3101에서 서비스 ✅
- [x] SystemD 서비스 등록 ✅

### **2단계: Frontend 구축** ✅ **완료**
- [x] React + Vite 기본 구조 ✅
- [x] Three.js VRM 뷰어 컴포넌트 ✅
- [x] 파일 캐싱 시스템 (IndexedDB) ✅
- [x] 설정 패널 (캐릭터/배경) ✅
- [x] 위치 조절 컨트롤러 ✅
- [x] 애니메이션 캐시 관리 ✅

### **3단계: 통합 및 배포** ✅ **완료**
- [x] Frontend/Backend 연동 ✅
- [x] Nginx 설정 적용 ✅
- [x] 빌드 및 배포 스크립트 ✅
- [x] SystemD 서비스 설정 ✅

## 📊 **API 설계** ✅

### **Backend Endpoints (Port 3101)** ✅
```
GET  /api/position/config      # 위치 설정 조회 ✅
POST /api/position/config      # 위치 설정 업데이트 ✅
GET  /api/position/models      # VRM 모델 목록 ✅
GET  /api/position/backgrounds # 배경 이미지 목록 ✅
```

### **Frontend API Calls** ✅
```javascript
// 설정 조회 ✅
fetch('/amica-api/position/config')

// 설정 저장 ✅
fetch('/amica-api/position/config', {
  method: 'POST',
  body: JSON.stringify(config)
})
```

## 🎨 **주요 기능 구현 상태**

### **VRM 캐릭터 시스템** ✅
- [x] 4개 VRM 모델 지원 (A, B, C, D) ✅
- [x] 캐릭터별 아이콘 및 설명 ✅
  - 💜 보라머리 여성 (A)
  - 👧 갈색머리 소녀 (B)  
  - 🎤 팝스타 소녀 (C)
  - 🏃‍♂️ 체육복 남성 (D)
- [x] 모델 변경 시 설정 저장 후 새로고침 방식 ✅
- [x] WebGL 텍스처 에러 해결 ✅

### **파일 캐싱 시스템** ✅
- [x] IndexedDB 기반 스마트 캐싱 ✅
- [x] VRM 파일 (25MB) 12ms 로딩 ✅
- [x] 애니메이션 파일 자동 캐싱 ✅
- [x] 캐시 관리 패널 (접기/펼치기) ✅

### **UI/UX 개선** ✅
- [x] 설정 패널 왼쪽 배치 ✅
- [x] 캐시 패널 접힌 상태 기본 ✅
- [x] 캐릭터 선택 UI 개선 (아이콘 + 설명) ✅
- [x] 위치 조절 컨트롤러 ✅
- [x] 배경 변경 (색상/이미지/비디오) ✅

### **애니메이션 시스템** ✅
- [x] Idle 애니메이션 자동 로드 ✅
- [x] VRM 애니메이션 지원 ✅
- [x] 애니메이션 캐싱 ✅

## 🔒 **보안 구현 상태** ✅

1. **CORS 설정**: Frontend 도메인 허용 ✅
2. **Input Validation**: JSON 데이터 검증 ✅
3. **File Security**: 정적 파일 안전 서빙 ✅
4. **SSL**: Nginx SSL 적용 ✅

## 📦 **배포 구성** ✅

### **Production 환경** ✅
- **Frontend**: Nginx 정적 파일 서빙 ✅
- **Backend**: SystemD 서비스 관리 ✅
- **Reverse Proxy**: Nginx → Express ✅
- **SSL**: Let's Encrypt 인증서 ✅

### **서비스 상태** ✅
```bash
# 백엔드 서비스 ✅
sudo systemctl status amica-backend.service

# 프론트엔드 빌드 ✅
cd frontend && npm run build
```

## 🎉 **달성된 성과**

1. **✅ 완전한 Frontend/Backend 분리**: React ↔ Express API
2. **✅ 고성능 파일 캐싱**: 25MB VRM 파일 12ms 로딩
3. **✅ 안정적인 VRM 렌더링**: WebGL 에러 해결
4. **✅ 직관적인 UI**: 캐릭터 아이콘, 설정 패널 개선
5. **✅ 프로덕션 배포**: SSL, SystemD, Nginx 완료

## 🚀 **현재 상태 요약**

### **✅ 완료된 기능**
- VRM 캐릭터 뷰어 (4개 모델)
- 파일 캐싱 시스템 (IndexedDB)
- 설정 관리 (위치, 회전, 배경)
- 애니메이션 시스템
- 프로덕션 배포

### **🔄 개선 사항**
- 모델 실시간 변경 → 설정 저장 후 새로고침 방식으로 변경
- WebGL 텍스처 에러 완전 해결
- UI 레이아웃 최적화 (왼쪽 배치)

### **🎯 서비스 URL**
- **메인**: https://amica.ai-open.kr/
- **API**: https://amica.ai-open.kr/amica-api/

**🎉 프로젝트 재구성 성공적으로 완료!** 