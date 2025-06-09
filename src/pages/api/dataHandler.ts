import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { serverConfig } from '@/features/externalAPI/externalAPI';
import { isInternalRequest } from '@/utils/internalIpCheck';

// 서버 설정 객체 타입 선언 - any 타입으로 임시 해결
// 실제 애플리케이션 코드에서는 더 명확한 타입을 사용하는 것이 좋습니다
interface ServerConfig {
  [key: string]: string;
}

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

// 파일 경로 정의
const subconsciousFilePath = 'subconscious';
const logsFilePath = 'logs';
const userInputMessagesFilePath = 'userInputMessages';
const chatLogsFilePath = 'chatLogs';

// 디렉토리가 없다면 생성
function ensureDirectory() {
  if (!fs.existsSync(USERDATA_PATH)) {
    fs.mkdirSync(USERDATA_PATH, { recursive: true });
  }
}

// 데이터 파일 경로 가져오기
function getFilePath(type: string): string {
  const filePath = path.join(USERDATA_PATH, `${type}.json`);
  console.log(`getFilePath: 요청 타입 ${type}의 파일 경로: ${filePath}`);
  return filePath;
}

// 데이터 저장
function saveData(type: string, data: any): void {
  ensureDirectory();
  
  if (type === 'config') {
    console.log('saveData 시작:', type, data);
    // config 타입의 경우 기존 파일이 있다면 로드
    const filePath = getFilePath(type);
    console.log('파일 경로:', filePath);
    let existingConfig = {};
    
    if (fs.existsSync(filePath)) {
      console.log('기존 설정 파일 존재함');
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        try {
          existingConfig = JSON.parse(fileContent);
          console.log('기존 설정 로드 성공, 설정 수:', Object.keys(existingConfig).length);
        } catch (jsonError) {
          console.error('JSON 파싱 오류, 파일 내용:', fileContent);
          // JSON 형식이 깨진 경우 파일을 백업하고 새로 시작
          const backupPath = `${filePath}.backup.${Date.now()}`;
          fs.copyFileSync(filePath, backupPath);
          console.log(`손상된 설정 파일을 ${backupPath}에 백업합니다.`);
          existingConfig = {};
        }
      } catch (e) {
        console.error('기존 설정 파일 로드 오류:', e);
        // 오류 시 빈 객체 사용
      }
    } else {
      console.log('기존 설정 파일 없음, 새로 생성합니다');
    }
    
    // 새 데이터를 기존 설정에 병합 (누적 저장)
    const mergedConfig = { ...existingConfig, ...data };
    console.log('병합된 설정:', mergedConfig);
    
    // serverConfig 업데이트
    Object.keys(data).forEach(key => {
      serverConfigAny[key] = data[key];
    });
    console.log('serverConfig 업데이트 완료');
    
    try {
      // 병합된 설정을 파일에 저장
      const jsonString = JSON.stringify(mergedConfig, null, 2);
      fs.writeFileSync(filePath, jsonString);
      console.log('설정 파일 저장 완료');
      // 파일 내용 검증
      const verification = fs.readFileSync(filePath, 'utf-8');
      try {
        JSON.parse(verification);
        console.log('저장된 설정 파일 확인 완료, 유효한 JSON');
      } catch (jsonError) {
        console.error('저장된 JSON 파일 검증 실패:', jsonError);
        // 오류 발생 시 다시 저장 시도
        fs.writeFileSync(filePath, jsonString);
      }
    } catch (fsError) {
      console.error('설정 파일 저장 오류:', fsError);
    }
  } else {
    // 다른 타입의 데이터는 그대로 저장
    try {
      const jsonString = JSON.stringify(data, null, 2);
      fs.writeFileSync(getFilePath(type), jsonString);
    } catch (fsError) {
      console.error(`${type} 파일 저장 오류:`, fsError);
    }
  }
}

// 데이터 로드
function loadData(type: string): any {
  ensureDirectory();
  const filePath = getFilePath(type);
  
  // config 타입의 경우 initial_config.json 파일을 먼저 로드
  if (type === 'config') {
    let initialConfig = {};
    let userConfig = {};

    // 1. 먼저 initial_config.json 로드 (기본 설정)
    const initialConfigPath = path.join(USERDATA_PATH, 'initial_config.json');
    if (fs.existsSync(initialConfigPath)) {
      try {
        const initialFileContent = fs.readFileSync(initialConfigPath, 'utf-8');
        initialConfig = JSON.parse(initialFileContent);
        console.log('initial_config.json 파일 로드 성공');
      } catch (initError) {
        console.error('initial_config.json 로드 오류:', initError);
      }
    } else {
      console.warn('initial_config.json 파일이 없음');
    }

    // 2. 다음으로 config.json 로드 (사용자 설정)
    const configPath = path.join(USERDATA_PATH, 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const configFileContent = fs.readFileSync(configPath, 'utf-8');
        userConfig = JSON.parse(configFileContent);
        console.log('config.json 파일 로드 성공');
      } catch (configError) {
        console.error('config.json 로드 오류:', configError);
      }
    } else {
      console.warn('config.json 파일이 없음');
    }

    // 3. 설정 병합 (userConfig가 우선)
    const mergedConfig: {[key: string]: string} = { ...initialConfig, ...userConfig };
    
    // 4. serverConfig 업데이트
    Object.keys(mergedConfig).forEach(key => {
      serverConfigAny[key] = mergedConfig[key];
    });
    
    console.log('설정 병합 완료, 설정 수:', Object.keys(mergedConfig).length);
    return mergedConfig;
  }
  
  // 다른 타입의 데이터 처리
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (e) {
    console.error(`Error loading ${type} data:`, e);
    return [];
  }
}

// 초기화: 필요한 파일들을 빈 배열로 초기화
ensureDirectory();
saveData(subconsciousFilePath, []);
saveData(logsFilePath, []);
saveData(userInputMessagesFilePath, []);
saveData(chatLogsFilePath, []);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS 헤더 설정
  setCorsHeaders(res);
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { type } = req.query;

  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'Type parameter is required' });
  }

  // 요청 처리
  switch (req.method) {
    case 'GET':
      if (type === 'config') {
        console.log('API 핸들러: config 요청 처리 시작');
        
        // 설정 로드
        const config = loadData(type);
        
        // 로그 출력
        console.log('API 핸들러: 설정 로드 완료, 설정 수:', Object.keys(config).length);
        if ('show_introduction' in config) {
          console.log('API 핸들러: show_introduction 값 =', config.show_introduction);
        } else {
          console.log('API 핸들러: show_introduction 값이 없음');
        }
        
        // 캐싱 방지 헤더 추가
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // 응답 반환
        return res.status(200).json(config);
      }

      // 다른 타입의 GET 요청 처리
      return res.status(200).json(loadData(type));
    
    case 'POST':
      // POST 요청은 모든 설정 변경 시 localhost에서만 처리 (외부 접속 전부 차단)
      if (type === 'config') {
        console.log('POST 요청 처리 - 호스트 정보:', {
          host: req.headers.host,
          forwardedHost: req.headers['x-forwarded-host'],
          referer: req.headers.referer,
          origin: req.headers.origin
        });
        
        const localCheck = isLocalRequest(req);
        console.log('로컬 요청 확인 결과:', localCheck);
        
        if (!localCheck) {
          console.log('외부 접속에서의 설정 변경 시도가 차단되었습니다. 호스트:', req.headers.host);
          return res.status(403).json({ error: '설정 변경은 로컬 접속에서만 가능합니다.' });
        }
        
        try {
          const config = req.body;
          console.log('받은 설정 데이터:', config);
          
          // 빈 객체인 경우 config.json 파일을 완전히 초기화
          if (Object.keys(config).length === 0) {
            console.log('설정을 빈 객체로 초기화합니다.');
            // 모든 키를 순회하면서 삭제
            Object.keys(serverConfigAny).forEach(key => {
              delete serverConfigAny[key];
            });
            // 빈 객체로 저장
            fs.writeFileSync(path.join(process.cwd(), 'userdata', 'config.json'), '{}');
            return res.status(200).json({ success: true, message: '설정이 초기화되었습니다.' });
          }
          
          // 설정 저장 (누적)
          console.log('설정을 저장합니다:', config);
          saveData(type, config);
          console.log('설정 저장 완료');
          
          return res.status(200).json({ success: true });
        } catch (error) {
          console.error(`Error saving ${type} data:`, error);
          return res.status(500).json({ error: 'Internal server error' });
        }
      } else {
        // 기타 데이터 저장
        saveData(type, req.body);
        return res.status(200).json({ success: true });
      }
    
    default:
      res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}