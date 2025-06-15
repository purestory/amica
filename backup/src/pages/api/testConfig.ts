import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { serverConfig } from '@/features/externalAPI/externalAPI';
import { isInternalRequest } from '@/utils/internalIpCheck';

const serverConfigAny = serverConfig as any;
const USERDATA_PATH = path.join(process.cwd(), 'userdata');

// 클라이언트가 내부 접속인지 확인하는 함수 (기존 isLocalRequest 함수 대체)
function isLocalRequest(req: NextApiRequest): boolean {
  return isInternalRequest(req);
}

// CORS 헤더 설정 함수
function setCorsHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 데이터 저장 함수
function saveConfig(data: Record<string, string>): boolean {
  try {
    // 디렉토리 확인
    if (!fs.existsSync(USERDATA_PATH)) {
      fs.mkdirSync(USERDATA_PATH, { recursive: true });
    }
    
    console.log("설정 데이터 저장 시작:", data);
    
    // 기존 파일 로드
    const filePath = path.join(USERDATA_PATH, 'config.json');
    let existingConfig = {};
    
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        existingConfig = JSON.parse(fileContent);
        console.log("기존 설정 파일 로드 완료:", Object.keys(existingConfig).length, "개 설정");
      } catch (error) {
        console.error("기존 설정 파일 로드 오류:", error);
      }
    }
    
    // 새 데이터 병합
    const mergedConfig = { ...existingConfig, ...data };
    console.log("병합된 설정:", mergedConfig);
    
    // 서버 설정 업데이트
    Object.keys(data).forEach(key => {
      serverConfigAny[key] = data[key];
    });
    
    // 파일에 저장
    const jsonString = JSON.stringify(mergedConfig, null, 2);
    fs.writeFileSync(filePath, jsonString);
    console.log("설정 파일 저장 완료");
    
    return true;
  } catch (error) {
    console.error("설정 저장 오류:", error);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS 헤더 설정
  setCorsHeaders(res);
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log("API 요청 시작 - 메서드:", req.method);
  
  // POST 요청 처리
  if (req.method === 'POST') {
    console.log("POST 요청 처리 - 헤더:", req.headers);
    
    // 로컬 요청 확인
    const isLocal = isLocalRequest(req);
    console.log("로컬 요청 확인 결과:", isLocal);
    
    if (!isLocal) {
      console.log("외부 접속에서의 설정 변경 시도가 차단됨:", req.headers.host);
      return res.status(403).json({ error: '설정 변경은 로컬 접속에서만 가능합니다.' });
    }
    
    try {
      const data = req.body;
      console.log("요청 본문:", data);
      
      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: '데이터가 비어 있습니다.' });
      }
      
      // 설정 저장 (로컬 스토리지에는 저장하지 않음)
      const success = saveConfig(data);
      
      if (success) {
        console.log("설정 저장 성공");
        return res.status(200).json({ success: true, message: '설정이 저장되었습니다.', data });
      } else {
        console.log("설정 저장 실패");
        return res.status(500).json({ error: '설정 저장 중 오류가 발생했습니다.' });
      }
    } catch (error) {
      console.error("API 처리 오류:", error);
      return res.status(500).json({ error: '내부 서버 오류' });
    }
  }
  
  // GET 요청 처리
  if (req.method === 'GET') {
    console.log("GET 요청 - 테스트 API가 정상 작동 중입니다");
    return res.status(200).json({ message: '테스트 API가 정상 작동 중입니다.' });
  }
  
  // 지원하지 않는 메서드
  res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
} 