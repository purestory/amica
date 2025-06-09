#!/bin/bash

# prerender-manifest.json 파일 경로
MANIFEST_FILE="/home/purestory/amica/.next/prerender-manifest.json"

# 올바른 JSON 내용
CORRECT_JSON='{"version":3,"routes":{},"dynamicRoutes":{},"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}'

# 파일이 존재하고 잘못된 형식인지 확인
if [ -f "$MANIFEST_FILE" ]; then
    # JSON 유효성 검사
    if ! python3 -m json.tool "$MANIFEST_FILE" > /dev/null 2>&1; then
        echo "$(date): prerender-manifest.json 수정 중..."
        echo "$CORRECT_JSON" > "$MANIFEST_FILE"
        echo "$(date): prerender-manifest.json 수정 완료"
    fi
fi 