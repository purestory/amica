# 프로덕션 배포 안내

## 최적화된 배포 방법

```bash
# 프로젝트 디렉토리로 이동
cd /home/purestory/amica

# 기존 빌드 파일 정리 후 프로덕션 빌드 실행
npm run clean && npm run build

# 프로덕션 서버 시작 (백그라운드 실행)
PORT=3001 NODE_ENV=production nohup npm run start:prod > server.log 2>&1 &

# 또는 한 번에 배포 (clean, build, start)
PORT=3001 nohup npm run deploy > server.log 2>&1 &

# 서버 상태 확인
curl http://localhost:3001
```

## 서버 중지 방법

```bash
# 현재 실행 중인 Node.js 프로세스 확인
lsof -i :3001 | grep LISTEN

# 프로세스 종료 (PID는 위 명령어 결과의 두 번째 열)
kill -15 <PID>
```

## 최적화된 설정 사항

1. **소스맵 제거**: 프로덕션 빌드에서는 소스맵이 생성되지 않아 용량 감소
2. **콘솔 로그 제거**: UglifyJS 플러그인을 통해 모든 console.log 제거
3. **PWA 최적화**: 개발 모드에서만 PWA 기능 비활성화, 프로덕션에서는 활성화
4. **메모리 최적화**: Node.js 메모리 한도 증가로 빌드 안정성 향상
5. **Next.js 최적화 기능**: 
   - 폰트 최적화
   - 코드 분할 최적화
   - 컴포넌트 최적화 (modularizedImports)

## 빌드 시 주의사항

1. 빌드 전 `.env.local` 파일이 올바르게 설정되어 있는지 확인하세요.
2. 메모리 부족 오류 발생 시 `NODE_OPTIONS` 값을 조정하세요.
3. 프로젝트 크기가 큰 경우 빌드 시간이 길어질 수 있습니다.

## 배포 후 확인사항

1. 모든 정적 파일(WASM, 모델 등)이 올바르게 로드되는지 확인하세요.
2. 서비스 워커가 올바르게 등록되었는지 확인하세요.
3. 메모리 사용량을 모니터링하세요.
4. 로그는 에러 메시지만 출력되므로 문제 발생 시 `server.log` 파일을 확인하세요.

## 성능 모니터링

프로덕션 환경의 성능을 모니터링하려면:

```bash
# 서버 리소스 모니터링
htop

# 로그 모니터링 (실시간)
tail -f server.log

# 특정 에러만 필터링
grep "Error" server.log
``` 