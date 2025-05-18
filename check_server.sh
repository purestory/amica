#!/bin/bash

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 스크립트 시작 메시지
echo -e "${GREEN}아미카 서버 확인 스크립트 시작${NC}"
echo "현재 디렉토리: $(pwd)"

# 포트 상태 확인 및 정리
check_port() {
  local port=$1
  echo -n "포트 $port 확인 중... "
  
  # lsof 명령어로 먼저 확인
  if lsof -i:$port -t &>/dev/null; then
    echo -e "${YELLOW}사용 중${NC}"
    echo "포트 $port를 사용 중인 프로세스를 강제 종료합니다."
    for pid in $(lsof -i:$port -t); do
      echo "PID $pid 종료 중..."
      kill -9 $pid || true
    done
    sleep 1
    
    # 다시 확인
    if lsof -i:$port -t &>/dev/null; then
      echo -e "${RED}포트 $port를 해제하지 못했습니다. sudo로 시도합니다.${NC}"
      sudo lsof -i:$port -t
      sudo kill -9 $(sudo lsof -i:$port -t) || true
      sleep 1
    fi
  else
    echo -e "${GREEN}사용 가능${NC}"
  fi
}

# 현재 디렉토리 확인 및 변경
if [[ "$(pwd)" != "/home/purestory/amica" ]]; then
  echo "아미카 디렉토리로 이동합니다."
  cd /home/purestory/amica
fi

# 모든 포트 확인
echo "사용할 포트를 확인합니다..."
for port in 3001 3002 3003 3004; do
  check_port $port
done

# 서버 시작
echo "아미카 서버를 시작합니다..."
PORT=3001 npm run dev &
server_pid=$!

# 서버 시작 대기
echo -e "${YELLOW}서버 시작 대기 중... (최대 60초)${NC}"
for i in {1..60}; do
  if curl -s http://localhost:3001 >/dev/null; then
    echo -e "\n${GREEN}서버가 성공적으로 시작되었습니다!${NC}"
    echo -e "${GREEN}브라우저: http://localhost:3001${NC}"
    break
  fi
  
  # 서버 프로세스가 종료되었는지 확인
  if ! ps -p $server_pid > /dev/null; then
    echo -e "\n${RED}서버 프로세스가 종료되었습니다. 로그를 확인하세요.${NC}"
    exit 1
  fi
  
  echo -n "."
  sleep 1
  
  # 30초 후에도 응답이 없으면 로그 일부 표시
  if [ $i -eq 30 ]; then
    echo -e "\n${YELLOW}서버가 아직 시작되지 않았습니다. 로그 일부:${NC}"
    tail -n 10 .next/logs/stdout*
  fi
done

# 서버 상태 확인
if ! curl -s http://localhost:3001 >/dev/null; then
  echo -e "${RED}서버 시작 실패! 로그를 확인하세요.${NC}"
  exit 1
fi

# 기본 페이지 확인
echo ""
echo "페이지 내용 확인 중..."
curl -s http://localhost:3001 | head -10

echo ""
echo -e "${GREEN}서버가 성공적으로 실행 중입니다. PID: $server_pid${NC}"
echo "중지하려면: kill $server_pid"
echo "프로세스 확인: ps -p $server_pid"
echo "로그 확인: tail -f .next/logs/stdout*" 