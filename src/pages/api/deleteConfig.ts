import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const USERDATA_PATH = path.join(process.cwd(), 'userdata');

// 클라이언트가 localhost인지 확인하는 함수
function isLocalRequest(req: NextApiRequest): boolean {
  const host = req.headers.host || '';
  const forwardedHost = req.headers['x-forwarded-host'] as string || '';
  const clientHost = forwardedHost || host;
  
  return clientHost.includes('localhost') || 
         clientHost.includes('127.0.0.1') || 
         clientHost.startsWith('localhost:') ||
         clientHost.startsWith('127.0.0.1:') ||
         // 내부 IP 허용 (옵션)
         clientHost.includes('192.168.') ||
         clientHost.includes('10.') ||
         // 특정 도메인 허용 (필요에 따라 추가)
         clientHost.includes('itsmyzone.iptime.org');
}

// CORS 헤더 설정 함수
function setCorsHeaders(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS 헤더 설정
  setCorsHeaders(res);
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 로컬 요청인지 확인
  if (!isLocalRequest(req)) {
    console.log('외부 접속에서의 config.json 삭제 시도가 차단되었습니다. 호스트:', req.headers.host);
    return res.status(403).json({ error: '설정 파일 삭제는 로컬 접속에서만 가능합니다.' });
  }

  try {
    const configPath = path.join(USERDATA_PATH, 'config.json');
    
    // config.json 파일이 존재하는지 확인
    if (fs.existsSync(configPath)) {
      // 파일 삭제
      fs.unlinkSync(configPath);
      console.log('config.json 파일이 성공적으로 삭제되었습니다.');
      return res.status(200).json({ success: true, message: 'config.json 파일이 삭제되었습니다.' });
    } else {
      console.log('config.json 파일이 이미 존재하지 않습니다.');
      return res.status(200).json({ success: true, message: 'config.json 파일이 이미 존재하지 않습니다.' });
    }
  } catch (error) {
    console.error('config.json 파일 삭제 중 오류 발생:', error);
    return res.status(500).json({ error: '파일 삭제 중 오류가 발생했습니다.' });
  }
} 