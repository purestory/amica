# 삭제된 패키지 목록

프로젝트 사이즈 최적화를 위해 다음 패키지들이 제거되었습니다:

## UI 라이브러리
- `@charcoal-ui/icons` (v3.15.0)
- `@charcoal-ui/theme` (v3.15.0)
- `@iwer/devui` (v0.1.1)

## 블록체인/암호화폐 관련
- `@rainbow-me/rainbowkit` (v2.2.0)
- `viem` (v2.21.37)
- `wagmi` (v2.12.25)

## 기타 라이브러리
- `dexie` (v4.0.8) - 브라우저 DB 라이브러리
- `iwer` (v1.0.4)
- `telegraf` (v4.16.3) - 텔레그램 봇 API
- `twitter-api-v2` (v1.19.0) - 트위터 API
- `window.ai` (v0.2.4) - 웹 브라우저 AI 확장 연동 라이브러리

## 복구 방법

원래대로 복구하려면:

1. 백업된 package.json 파일을 복원:
```bash
cp package.json.backup package.json
```

2. 의존성 재설치:
```bash
npm install
```

## 부분 복구

특정 패키지만 다시 설치하려면:

```bash
npm install @charcoal-ui/icons@3.15.0 @charcoal-ui/theme@3.15.0
```

또는

```bash
npm install window.ai@0.2.4
```

## 코드 변경 사항

- `windowAiChat.ts` 파일이 수정되어 window.ai 패키지 없이도 작동하도록 변경되었습니다. (OpenRouter로 폴백) 