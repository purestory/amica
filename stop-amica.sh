#!/bin/bash

echo "=== Amica 서버 완전 종료 스크립트 ==="

# 1. 포트 3100을 사용하는 프로세스 찾기 (lsof)
echo "1. lsof로 포트 3100 사용 프로세스 확인..."
LSOF_PIDS=$(sudo lsof -t -i :3100 2>/dev/null)
if [ ! -z "$LSOF_PIDS" ]; then
    echo "lsof로 발견된 프로세스: $LSOF_PIDS"
    for pid in $LSOF_PIDS; do
        echo "PID $pid 종료 중..."
        sudo kill -9 $pid 2>/dev/null
    done
else
    echo "lsof로 포트 3100 사용 프로세스를 찾지 못했습니다."
fi

# 2. netstat으로 포트 3100 사용 프로세스 찾기
echo "2. netstat으로 포트 3100 사용 프로세스 확인..."
NETSTAT_PIDS=$(sudo netstat -tulpn 2>/dev/null | grep :3100 | awk '{print $7}' | cut -d'/' -f1 | grep -v '-' | sort -u)
if [ ! -z "$NETSTAT_PIDS" ]; then
    echo "netstat으로 발견된 프로세스: $NETSTAT_PIDS"
    for pid in $NETSTAT_PIDS; do
        if [ "$pid" != "" ] && [ "$pid" != "-" ]; then
            echo "PID $pid 종료 중..."
            sudo kill -9 $pid 2>/dev/null
        fi
    done
else
    echo "netstat으로 포트 3100 사용 프로세스를 찾지 못했습니다."
fi

# 3. npm run dev 프로세스 찾기
echo "3. npm run dev 프로세스 확인..."
NPM_DEV_PIDS=$(ps aux | grep "npm run dev" | grep -v grep | awk '{print $2}')
if [ ! -z "$NPM_DEV_PIDS" ]; then
    echo "npm run dev 프로세스 발견: $NPM_DEV_PIDS"
    for pid in $NPM_DEV_PIDS; do
        echo "PID $pid 종료 중..."
        sudo kill -9 $pid 2>/dev/null
    done
else
    echo "npm run dev 프로세스를 찾지 못했습니다."
fi

# 4. npm run start 프로세스 찾기
echo "4. npm run start 프로세스 확인..."
NPM_START_PIDS=$(ps aux | grep "npm run start" | grep -v grep | awk '{print $2}')
if [ ! -z "$NPM_START_PIDS" ]; then
    echo "npm run start 프로세스 발견: $NPM_START_PIDS"
    for pid in $NPM_START_PIDS; do
        echo "PID $pid 종료 중..."
        sudo kill -9 $pid 2>/dev/null
    done
else
    echo "npm run start 프로세스를 찾지 못했습니다."
fi

# 5. next 관련 프로세스 찾기
echo "5. next 관련 프로세스 확인..."
NEXT_PIDS=$(ps aux | grep "next " | grep -v grep | awk '{print $2}')
if [ ! -z "$NEXT_PIDS" ]; then
    echo "next 프로세스 발견: $NEXT_PIDS"
    for pid in $NEXT_PIDS; do
        echo "PID $pid 종료 중..."
        sudo kill -9 $pid 2>/dev/null
    done
else
    echo "next 프로세스를 찾지 못했습니다."
fi

# 6. pkill로 패턴 매칭 종료
echo "6. pkill로 패턴 매칭 종료..."
sudo pkill -f "npm run dev" 2>/dev/null
sudo pkill -f "npm run start" 2>/dev/null
sudo pkill -f "next dev" 2>/dev/null
sudo pkill -f "next start" 2>/dev/null

# 7. 잠시 대기 후 최종 확인
echo "7. 3초 대기 후 최종 확인..."
sleep 3

# 8. 최종 포트 확인
echo "8. 최종 포트 3100 상태 확인..."
FINAL_CHECK=$(sudo lsof -i :3100 2>/dev/null)
if [ -z "$FINAL_CHECK" ]; then
    echo "✅ 포트 3100이 완전히 해제되었습니다!"
else
    echo "❌ 아직 포트 3100을 사용하는 프로세스가 있습니다:"
    sudo lsof -i :3100
fi

echo "=== 종료 스크립트 완료 ===" 