import type { NextApiRequest } from 'next';

// 환경 변수에서 내부 IP 목록을 가져오거나 기본값 사용
export function getInternalIps(): string[] {
  // 환경 변수에서 내부 IP 목록을 가져옴
  const envInternalIps = process.env.INTERNAL_IPS;
  
  // 기본 내부 IP 목록 - localhost와 192.168.0.x 대역만
  const defaultInternalIps = [
    'localhost',
    '127.0.0.1',
    '192.168.0.'  // 사용자 요청에 따라 192.168.0.x 대역만 내부로 인정
  ];
  
  if (envInternalIps) {
    // 환경 변수가 있으면 쉼표로 분리하여 사용
    return envInternalIps.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
  }
  
  return defaultInternalIps;
}

// 클라이언트가 내부 IP에서 접속했는지 확인하는 함수 (서버용)
export function isInternalRequest(req: NextApiRequest): boolean {
  const host = req.headers.host || '';
  const forwardedHost = req.headers['x-forwarded-host'] as string || '';
  const clientHost = forwardedHost || host;
  
  console.log("내부 IP 확인 - 요청 호스트:", { host, forwardedHost, clientHost });
  
  const internalIps = getInternalIps();
  console.log("내부 IP 목록:", internalIps);
  
  // 각 내부 IP 패턴과 비교
  for (const internalIp of internalIps) {
    if (clientHost.includes(internalIp) || 
        clientHost.startsWith(internalIp + ':') ||
        clientHost === internalIp) {
      console.log(`내부 접속 확인됨: ${clientHost} (패턴: ${internalIp})`);
      return true;
    }
  }
  
  console.log(`외부 접속으로 판단됨: ${clientHost}`);
  return false;
}

// 클라이언트 측에서 내부 접속인지 확인하는 함수 (브라우저용)
let clientCheckCache: { isInternal: boolean; checked: boolean } = { isInternal: false, checked: false };

export function isInternalHostClient(): boolean {
  if (typeof window === "undefined") {
    return true; // 서버 사이드에서는 허용
  }
  
  // 이미 확인했으면 캐시된 결과 반환
  if (clientCheckCache.checked) {
    return clientCheckCache.isInternal;
  }
  
  // 포트 번호를 포함한 전체 호스트 확인
  const fullHost = window.location.host;
  const hostname = window.location.hostname;
  
  // 내부 IP 목록 - localhost와 192.168.0.x 대역만
  const internalIps = [
    'localhost',
    '127.0.0.1',
    '192.168.0.'
  ];
  
  let isInternal = false;
  
  // 각 내부 IP 패턴과 비교
  for (const internalIp of internalIps) {
    if (fullHost.includes(internalIp) || 
        fullHost.startsWith(internalIp + ':') ||
        fullHost === internalIp ||
        hostname.includes(internalIp) ||
        hostname === internalIp) {
      console.log(`[isInternalHostClient] 내부 접속 확인됨: ${fullHost} (패턴: ${internalIp})`);
      isInternal = true;
      break;
    }
  }
  
  if (!isInternal) {
    console.log(`[isInternalHostClient] 외부 접속으로 판단됨: ${fullHost}`);
  }
  
  // 결과 캐시
  clientCheckCache.isInternal = isInternal;
  clientCheckCache.checked = true;
  
  return isInternal;
} 