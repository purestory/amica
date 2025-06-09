import { config, defaults, prefixed } from "@/utils/config";
import isDev from "@/utils/isDev";
import {
  MAX_STORAGE_TOKENS,
  TimestampedPrompt,
} from "../amicaLife/eventHandler";
import { Message } from "../chat/messages";

export const getApiBaseUrl = () => {
  // 브라우저에서만 실행되는 코드
  if (typeof window !== 'undefined') {
    // 현재 URL에서 basePath 추출
    const pathname = window.location.pathname;
    let basePath = '';
    
    // pathname이 /amica/로 시작하면 basePath는 /amica
    if (pathname.startsWith('/amica/') || pathname === '/amica') {
      basePath = '/amica';
    }
    
    // 개발 환경(localhost)인 경우 환경 변수 사용
    if (window.location.hostname === 'localhost') {
      const baseUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_BASE_URL || 'http://localhost:3100';
      return baseUrl + basePath;
    }
    
    // 원격 접속인 경우 현재 호스트 URL 사용
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    
    return `${protocol}//${hostname}${port}${basePath}`;
  }
  
  // 서버 사이드에서는 환경 변수 또는 기본값 사용
  const baseUrl = process.env.NEXT_PUBLIC_DEVELOPMENT_BASE_URL || 'http://localhost:3100';
  const basePath = process.env.BASE_PATH || '';
  return baseUrl + basePath;
};

export const getConfigUrl = () => `${getApiBaseUrl()}/api/dataHandler/?type=config`;
export const getSubconsciousUrl = () => `${getApiBaseUrl()}/api/dataHandler/?type=subconscious`;
export const getLogsUrl = () => `${getApiBaseUrl()}/api/dataHandler/?type=logs`;
export const getUserInputMessagesUrl = () => `${getApiBaseUrl()}/api/dataHandler/?type=userInputMessages`;
export const getChatLogsUrl = () => `${getApiBaseUrl()}/api/dataHandler/?type=chatLogs`;

// Cached server config
export let serverConfig: Record<string, string> = {};

export async function fetcher(method: string, url: string, data?: any) {
  let response: any;
  let result: any = null;
  
  switch (method) {
    case "POST":
      try {
        response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        
        if (response.ok) {
          // POST 요청이 성공적으로 완료되었는지 확인
          console.log("POST 요청 성공:", url);
          try {
            result = await response.json();
          } catch (e) {
            // 응답이 JSON이 아닐 수 있음
            result = { success: true };
          }
        } else {
          console.error("POST 요청 실패:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Failed to POST server config: ", error);
      }
      break;

    case "GET":
      try {
        console.log("서버 설정 가져오기 요청:", url);
        response = await fetch(url);
        if (response.ok) {
          try {
            const jsonData = await response.json();
            console.log("서버에서 가져온 설정 개수:", Object.keys(jsonData).length);
            
            // 서버 설정이 유효한 객체인지 확인
            if (jsonData && typeof jsonData === 'object') {
              // 기존 서버 설정을 유지하고 새로운 설정으로 병합
              serverConfig = { ...serverConfig, ...jsonData };
              
              // 주요 설정 로그 출력 (디버깅용)
              const importantKeys = ['tts_backend', 'chatbot_backend', 'system_prompt'];
              importantKeys.forEach(key => {
                if (key in jsonData) {
                  console.log(`서버 설정 ${key}=${jsonData[key]}`);
                }
              });
              
              // 유효한 설정이 있는지 확인 (개수 확인)
              const settingsCount = Object.keys(serverConfig).length;
              console.log(`총 ${settingsCount}개 서버 설정 로드됨`);
              
              result = serverConfig;
            } else {
              console.error("Invalid server config format:", jsonData);
              // 유효하지 않은 데이터인 경우 기존 serverConfig 유지
              result = serverConfig;
            }
          } catch (jsonError) {
            console.error("Failed to parse server config JSON:", jsonError);
            // JSON 파싱 오류 발생 시 기존 serverConfig 유지
            result = serverConfig;
          }
        } else {
          console.error("Failed to fetch server config: Server responded with", response.status);
          // 응답이 실패한 경우도 기존 serverConfig 유지
          result = serverConfig;
        }
      } catch (error) {
        console.error("Failed to fetch server config:", error);
        // 네트워크 오류 등으로 실패한 경우 기존 serverConfig 유지
        result = serverConfig;
      }
      break;

    default:
      break;
  }
  
  return result;
}

export async function handleConfig(
  type: string,
  data?: Record<string, string> | { key: string, value: string },
) {
  let result = null;
  
  switch (type) {
    // Call this function at the beginning of your application to load the server config and sync to localStorage if needed.
    case "init":
      console.log("설정 파일 초기화 시작");
      // 서버에서 설정 가져오기 수행
      result = await fetcher("GET", getConfigUrl());
      console.log("설정 초기화 완료, 서버 설정:", result);
      // 서버 설정이 로드되었음을 알리는 이벤트 발생
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('server-config-loaded', { detail: result }));
      }
      return result;

    case "fetch":
      // 서버에서 설정 가져오기만 수행
      result = await fetcher("GET", getConfigUrl());
      return result;

    case "update":
      // 설정 업데이트 (사용자 직접 변경 시)
      if (!data) {
        console.error("업데이트할 설정 데이터가 없습니다");
        return null;
      }
      
      // 단일 키/값 업데이트인 경우 처리
      if ('key' in data && 'value' in data) {
        const { key, value } = data;
        const updateData = { [key]: value };
        result = await fetcher("POST", getConfigUrl(), updateData);
        console.log(`서버 설정 키 ${key}가 업데이트 되었습니다:`, value);
      } else {
        // 여러 키/값 업데이트인 경우
        result = await fetcher("POST", getConfigUrl(), data);
        console.log("서버 설정이 업데이트 되었습니다:", data);
      }
      return result;
      
    case "reset":
      // 설정 초기화 (빈 객체로 재설정)
      console.log("설정 초기화를 시작합니다...");
      
      try {
        // 서버 설정을 빈 객체로 초기화
        Object.keys(serverConfig).forEach(key => {
          delete serverConfig[key];
        });
        
        // 빈 객체로 config.json 파일 업데이트
        result = await fetcher("POST", getConfigUrl(), {});
        console.log("설정이 빈 객체로 초기화되었습니다.");
      } catch (error) {
        console.error("설정 초기화 중 오류 발생:", error);
        // 오류 발생 시 다시 시도
        result = await fetcher("POST", getConfigUrl(), {});
      }
      return result;

    default:
      return null;
  }
}

export async function handleUserInput(message: string) {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }

  fetch(getUserInputMessagesUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt: config("system_prompt"),
      message: message,
    }),
  });
}

export async function handleChatLogs(messages: Message[]) {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }

  fetch(getChatLogsUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
}

export async function handleSubconscious(
  timestampedPrompt: TimestampedPrompt,
): Promise<any> {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }

  const data = await fetch(getSubconsciousUrl());
  if (!data.ok) {
    throw new Error("Failed to get subconscious data");
  }

  const currentStoredSubconscious: TimestampedPrompt[] = await data.json();
  currentStoredSubconscious.push(timestampedPrompt);

  let totalStorageTokens = currentStoredSubconscious.reduce(
    (totalTokens, prompt) => totalTokens + prompt.prompt.length,
    0,
  );
  while (totalStorageTokens > MAX_STORAGE_TOKENS) {
    const removed = currentStoredSubconscious.shift();
    totalStorageTokens -= removed!.prompt.length;
  }

  const response = await fetch(getSubconsciousUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subconscious: currentStoredSubconscious }),
  });

  if (!response.ok) {
    throw new Error("Failed to update subconscious data");
  }

  return currentStoredSubconscious;
}
