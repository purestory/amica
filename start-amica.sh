#!/bin/bash

# Amica 서비스를 시작하는 스크립트
# crontab에 등록하여 재부팅 시 자동으로 실행되도록 설정할 수 있습니다.
# 예: @reboot /home/purestory/amica/start-amica.sh > /home/purestory/amica/cron.log 2>&1

cd /home/purestory/amica

# 로그 디렉토리 생성
mkdir -p /home/purestory/amica/logs

# 현재 시간을 로그에 기록
echo "$(date) - Amica 서버 시작 스크립트 실행" >> /home/purestory/amica/logs/startup.log

# Node.js 관련 프로세스 확인 및 종료
echo "포트 3001에서 실행 중인 프로세스 확인" >> /home/purestory/amica/logs/startup.log
PORT_PIDS=$(lsof -i :3001 | grep LISTEN | awk '{print $2}')
if [ ! -z "$PORT_PIDS" ]; then
  echo "포트 3001에서 실행 중인 프로세스를 종료합니다. PID: $PORT_PIDS" >> /home/purestory/amica/logs/startup.log
  for PID in $PORT_PIDS; do
    kill -15 $PID 2>/dev/null
  done
  sleep 2
  
  # 여전히 프로세스가 실행 중인지 확인하고 강제 종료
  PORT_PIDS=$(lsof -i :3001 | grep LISTEN | awk '{print $2}')
  if [ ! -z "$PORT_PIDS" ]; then
    echo "프로세스가 여전히 실행 중입니다. 강제 종료합니다." >> /home/purestory/amica/logs/startup.log
    for PID in $PORT_PIDS; do
      kill -9 $PID 2>/dev/null
    done
    sleep 1
  fi
fi

# 백그라운드에서 실행 중인 npm 프로세스 확인 및 종료
NPM_PIDS=$(ps aux | grep "npm run dev" | grep -v grep | awk '{print $2}')
if [ ! -z "$NPM_PIDS" ]; then
  echo "npm 프로세스를 종료합니다. PID: $NPM_PIDS" >> /home/purestory/amica/logs/startup.log
  for PID in $NPM_PIDS; do
    kill -9 $PID 2>/dev/null
  done
  sleep 1
fi

# Next.js 관련 node 프로세스 종료
NODE_PIDS=$(ps aux | grep "node.*next" | grep -v grep | awk '{print $2}')
if [ ! -z "$NODE_PIDS" ]; then
  echo "Next.js node 프로세스를 종료합니다. PID: $NODE_PIDS" >> /home/purestory/amica/logs/startup.log
  for PID in $NODE_PIDS; do
    kill -9 $PID 2>/dev/null
  done
  sleep 1
fi

# 서버 시작 (개발 모드로 실행)
echo "$(date) - Amica 서버를 시작합니다." >> /home/purestory/amica/logs/startup.log
PORT=3001 nohup npm run dev > /home/purestory/amica/server.log 2>&1 &

# 서버 상태 체크
echo "서버 시작 상태를 확인합니다. 15초간 대기..." >> /home/purestory/amica/logs/startup.log
sleep 15

if lsof -i :3001 | grep LISTEN; then
  echo "$(date) - Amica 서버가 성공적으로 시작되었습니다." >> /home/purestory/amica/logs/startup.log
  echo "서버 프로세스 정보:" >> /home/purestory/amica/logs/startup.log
  ps aux | grep "npm run dev" | grep -v grep >> /home/purestory/amica/logs/startup.log
else
  echo "$(date) - Amica 서버 시작에 실패했습니다." >> /home/purestory/amica/logs/startup.log
  echo "서버 로그:" >> /home/purestory/amica/logs/startup.log
  tail -n 30 /home/purestory/amica/server.log >> /home/purestory/amica/logs/startup.log
fi 