import { handleConfig, serverConfig as importedServerConfig } from "@/features/externalAPI/externalAPI";
import { isInternalHostClient } from "@/utils/internalIpCheck";


// 내부접속 여부를 캐시하는 변수
let isLocalCache: boolean | null = null;

// 현재 호스트가 내부 접속인지 확인하는 함수 (기존 isLocalhost 함수 대체)
export function isLocalhost(): boolean {
  if (isLocalCache === null) {
    isLocalCache = isInternalHostClient();
    console.log('[isLocalhost] 내부접속 여부 캐시됨:', isLocalCache);
  }
  return isLocalCache;
}

// 서버 측에서 초기 설정 파일 읽기
let initialConfig: Record<string, string> = {};
let globalSettings: Record<string, string> = {};
let settingsInitialized = false;
// 서버에서 가져온 설정을 로컬에 저장
let serverConfig: Record<string, string> = {};

// 서버 사이드에서만 실행
if (typeof window === 'undefined') {
  try {
    // fs와 path 모듈을 동적으로 불러옴 (서버 사이드에서만)
    const fs = require('fs');
    const path = require('path');
    
    // 먼저 initial_config.json 찾기 (초기 기본값)
      const initialConfigPath = path.join(process.cwd(), 'userdata', 'initial_config.json');
      
      if (fs.existsSync(initialConfigPath)) {
      try {
        const configData = fs.readFileSync(initialConfigPath, 'utf8');
        initialConfig = JSON.parse(configData);
        console.log('초기 설정 파일(initial_config.json) 로드 완료');
      } catch (parseError) {
        console.error('initial_config.json 파싱 오류:', parseError);
        initialConfig = {};
      }
      } else {
      console.warn('초기 설정 파일(initial_config.json)을 찾을 수 없습니다. 기본값 사용');
    }
    
    // 다음으로 config.json 찾기 (사용자 설정)
    const configPath = path.join(process.cwd(), 'userdata', 'config.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const configData = fs.readFileSync(configPath, 'utf8');
        const userConfig = JSON.parse(configData);
        // config.json의 값을 initialConfig에 병합 (사용자 설정이 우선)
        initialConfig = { ...initialConfig, ...userConfig };
        console.log('현재 설정 파일(config.json) 로드 완료');
      } catch (parseError) {
        console.error('config.json 파싱 오류:', parseError);
      }
    }
    
    // 빈 initialConfig는 오류 방지를 위해 빈 객체로 초기화
    if (!initialConfig || typeof initialConfig !== 'object') {
      console.error('유효하지 않은 initialConfig, 빈 객체로 초기화합니다.');
      initialConfig = {};
    }
  } catch (error) {
    console.error('설정 파일 로드 오류:', error);
  }
} else {
  // 브라우저에서는 initialConfig를 serverConfig를 참조하도록 함
  initialConfig = importedServerConfig || {};
}

// 설정 값의 기본값을 설정합니다.
export const defaults: Record<string, string> = {
  // 챗봇 기본 설정
  chatbot_backend: "chatgpt", // 기본 챗봇 백엔드
  openrouter_apikey: "", // OpenRouter API 키
  openrouter_model: "google/gemini-2.0-flash-exp:free", // OpenRouter 기본 모델
  openrouter_url: "https://openrouter.ai/api/v1", // OpenRouter API URL
  
  // TTS 기본 설정
  tts_backend: "openai_tts", // 기본 TTS 백엔드
  piper_url: "http://localhost:5001", // Piper 기본 URL
  tts_muted: "false", // TTS 음소거 기본값
  openai_tts_apikey: "", // OpenAI TTS API 키
  openai_tts_url: "https://api.openai.com/v1", // OpenAI TTS API URL
  openai_tts_model: "tts-1", // OpenAI TTS 기본 모델
  openai_tts_voice: "alloy", // OpenAI TTS 기본 음성
  
  // STT 기본 설정
  stt_backend: "whisper_browser", // 기본 STT 백엔드
  
  // 비전 기본 설정
  vision_backend: "vision_openai", // 기본 비전 백엔드
  vision_openai_apikey: "", // Vision OpenAI API 키
  vision_openai_url: "https://api.openai.com/v1", // Vision OpenAI URL
  vision_openai_model: "gpt-4-vision-preview", // Vision OpenAI 모델
  
  // 기타 설정
  name: "IU", // 기본 이름
  vrm_url: "/vrm/AvatarSample_B.vrm", // 기본 VRM 모델 URL
  amica_life_enabled: "false", // Amica Life 기능 기본적으로 비활성화
  external_api_enabled: "true", // 외부 API 기본적으로 활성화
  show_introduction: "false", // 소개 화면 표시 기본값
  bg_color: "#f0f0f0", // 기본 배경색
  bg_url: "", // 기본 배경 이미지 URL
  vrm_hash: "", // VRM 해시
  vrm_save_type: "url", // VRM 저장 유형
  youtube_videoid: "", // 유튜브 비디오 ID
  animation_url: "", // 애니메이션 URL
  animation_procedural: "talk", // 기본 애니메이션 유형
  show_arbius_introduction: "false", // Arbius 소개 표시 기본값
  time_before_idle_sec: "60", // 유휴 상태 전 시간(초)
  show_add_to_homescreen: "true", // 홈 화면에 추가 표시 기본값
  use_webgpu: "false", // WebGPU 사용 기본값
  arbius_llm_model_id: "", // Arbius LLM 모델 ID
  openai_apikey: "", // OpenAI API 키
  openai_url: "https://api.openai.com/v1", // OpenAI URL
  openai_model: "gpt-3.5-turbo", // OpenAI 모델
  mtoon_material_type: "mtoon", // MToon 재질 유형
  debug_gfx: "false", // 그래픽 디버깅 모드
  mtoon_debug_mode: "none", // MToon 디버그 모드
  system_prompt: "너의 이름은 IU다. 넌 한국어로 상대방의 질문에 친절하게 답변해. K-pop 가수 겸 배우인 IU(아이유)처럼 행동해, 아티스트 느낌을 내고 지적이고 현명한 조언을 해줘야 해. 너무 길게 설명하지 말고 짧고 명랑하게 대답해.", // 기본 시스템 프롬프트
  vision_system_prompt: "너는 이미지를 이해하고 분석할 수 있는 AI 비서야. 이미지를 자세히 묘사하고 상대방의 질문에 친절하게 답변해주세요.", // 비전 시스템 프롬프트
  localXTTS_url: "http://localhost:8020", // 로컬 XTTS URL
  alltalk_version: "v2", // AllTalk 버전
  alltalk_voice: "female_01", // AllTalk 기본 음성
  alltalk_language: "ko", // AllTalk 언어
  alltalk_rvc_voice: "", // AllTalk RVC 음성
  alltalk_rvc_pitch: "0", // AllTalk RVC 피치
  autosend_from_mic: "false", // 마이크에서 자동 전송
  wake_word_enabled: "false", // 웨이크 워드 활성화
  wake_word: "Hey Amica", // 웨이크 워드
  language: "ko", // 기본 언어
  voice_url: "", // 음성 URL
  llamacpp_url: "http://localhost:8080", // LLaMA.cpp URL
  llamacpp_stop_sequence: "</s>", // LLaMA.cpp 중지 시퀀스
  ollama_url: "http://localhost:11434", // Ollama URL
  ollama_model: "llama2", // Ollama 모델
  koboldai_url: "http://localhost:5001", // KoboldAI URL
  koboldai_use_extra: "true", // KoboldAI 추가 기능 사용
  koboldai_stop_sequence: "</s>", // KoboldAI 중지 시퀀스
  moshi_url: "", // Moshi URL
  vision_llamacpp_url: "http://localhost:8080", // Vision LLaMA.cpp URL
  vision_ollama_url: "http://localhost:11434", // Vision Ollama URL
  vision_ollama_model: "llava", // Vision Ollama 모델
  whispercpp_url: "http://localhost:8082", // Whisper.cpp URL
  openai_whisper_apikey: "", // OpenAI Whisper API 키
  openai_whisper_url: "https://api.openai.com/v1", // OpenAI Whisper URL
  openai_whisper_model: "whisper-1", // OpenAI Whisper 모델
  rvc_url: "http://localhost:5001", // RVC URL
  rvc_enabled: "false", // RVC 활성화
  rvc_model_name: "", // RVC 모델 이름
  rvc_f0_upkey: "0", // RVC F0 업키
  rvc_f0_method: "pm", // RVC F0 방법
  rvc_index_path: "", // RVC 인덱스 경로
  rvc_index_rate: "0.66", // RVC 인덱스 비율
  rvc_filter_radius: "3", // RVC 필터 반경
  rvc_resample_sr: "0", // RVC 리샘플링 샘플레이트
  rvc_rms_mix_rate: "0.25", // RVC RMS 믹스 비율
  rvc_protect: "0.33", // RVC 보호
  coquiLocal_url: "http://localhost:9090", // 로컬 Coqui URL
  coquiLocal_voiceid: "", // 로컬 Coqui 음성 ID
    kokoro_url: "http://localhost:3200", // Kokoro URL
  kokoro_voice: "iu", // Kokoro 음성
  edgetts_url: "http://localhost:3701", // EdgeTTS URL
  edgetts_voice: "Microsoft Server Speech Text to Speech Voice (ko-KR, SunHiNeural)", // EdgeTTS 기본 음성 (한국어 여성)
  edgetts_rate: "+0%", // EdgeTTS 속도
  edgetts_pitch: "+0Hz", // EdgeTTS 음높이
  edgetts_volume: "+0%", // EdgeTTS 음량
  edgetts_auto_detect: "false", // EdgeTTS 자동 언어 감지
  elevenlabs_apikey: "", // ElevenLabs API 키
  elevenlabs_voiceid: "", // ElevenLabs 음성 ID
  elevenlabs_model: "eleven_multilingual_v2", // ElevenLabs 모델
  speecht5_speaker_embedding_url: "", // SpeechT5 스피커 임베딩 URL
  coqui_apikey: "", // Coqui API 키
  coqui_voice_id: "", // Coqui 음성 ID
  reasoning_engine_enabled: "false", // 추론 엔진 활성화
  reasoning_engine_url: "http://localhost:5001", // 추론 엔진 URL
  x_api_key: "", // X API 키
  x_api_secret: "", // X API 시크릿
  x_access_token: "", // X 액세스 토큰
  x_access_secret: "", // X 액세스 시크릿
  x_bearer_token: "", // X 베어러 토큰
  telegram_bot_token: "", // 텔레그램 봇 토큰
  min_time_interval_sec: "10", // 최소 시간 간격(초)
  max_time_interval_sec: "60", // 최대 시간 간격(초)
  time_to_sleep_sec: "180", // 수면 시간(초)
  idle_text_prompt: "" // 유휴 상태 텍스트 프롬프트
};

// defaultConfig 변수 추가 - 기본 설정값에 대한 참조
export const defaultConfigValues = defaults;

// 기본 설정값을 반환하는 함수 정의 (NamePage에서 사용)
export function defaultConfig(key: string): string {
  return defaults[key] || "";
}

// 디버그 로깅 플래그
const DEBUG_LOGGING = false;

export function prefixed(key: string) {
  return `chatvrm_${key}`;
}

// 설정 초기화 함수
export async function initializeSettings(): Promise<void> {
  if (settingsInitialized) {
    console.log('설정이 이미 초기화되어 있음, 초기화 스킵');
    return;
  }
  
  try {
    console.log('설정 초기화 시작...');
    
    // 로컬호스트 여부 미리 확인
    const isLocal = isLocalhost();
    console.log('초기화 시 로컬호스트 여부:', isLocal);
    
    // 1. 서버 설정 가져오기 (apiHandler에서 병합된 설정)
    try {
      if (typeof window !== 'undefined') {
        console.log('API에서 초기 설정 가져오기 시도...');
        const response = await fetch('/amica-api/dataHandler/?type=config', { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) {
          throw new Error(`API 응답 오류: ${response.status} ${response.statusText}`);
        }
        
        // 응답 내용 확인
        const text = await response.text();
        
        if (text && text.trim()) {
          try {
            serverConfig = JSON.parse(text);
            console.log('API에서 설정 가져오기 성공', Object.keys(serverConfig).length, '개 설정 로드됨');
          } catch (error) {
            console.error('서버 응답 JSON 파싱 오류:', error);
            serverConfig = {};
          }
        } else {
          console.warn('API에서 빈 응답을 받았습니다');
          serverConfig = {};
        }
      }
    } catch (error) {
      console.error('서버 설정 가져오기 오류:', error);
      serverConfig = {};
    }
    
    // 2. 로컬 스토리지 설정 가져오기
    const localSettings: Record<string, string> = {};
    
    if (typeof localStorage !== 'undefined') {
      // localStorage에서 설정 가져오기
      console.log('로컬 스토리지에서 설정 가져오기...');
      
      // 로컬 접속일 때는 localStorage에서 값을 가져오되, 모두 삭제합니다 (외부 접속에서 사용한 값이 남아있을 수 있음)
      if (isLocal) {
        console.log('로컬 접속 감지: 로컬 스토리지 값 삭제 예정');
        
        // 삭제할 키 목록 수집
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefixed(''))) {
            keysToRemove.push(key);
          }
        }
        
        // 로깅 후 키 삭제
        console.log(`로컬 접속이므로 로컬 스토리지에서 ${keysToRemove.length}개 키 삭제 예정`);
        keysToRemove.forEach(key => {
          const actualKey = key.substring(prefixed('').length);
          console.log(`- 삭제: ${key} (${actualKey})`);
          localStorage.removeItem(key);
        });
      } 
      // 외부 접속일 때만 로컬 스토리지에서 값을 가져와 사용
      else {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefixed(''))) {
            const actualKey = key.substring(prefixed('').length);
            const value = localStorage.getItem(key) || '';
            localSettings[actualKey] = value;
          }
        }
        console.log('외부 접속: 로컬 스토리지에서', Object.keys(localSettings).length, '개 설정 로드됨');
      }
    }
    
    // 3. 모든 설정 병합 (우선 순위 설정)
    console.log('설정 병합 시작:');
    console.log('- 기본 설정 (낮은 우선순위):', Object.keys(initialConfig).length, '개');
    console.log('- 서버 설정 (중간 우선순위):', Object.keys(serverConfig).length, '개');
    
    // 로컬 접속일 때는 로컬 스토리지 값을 사용하지 않고 서버 설정 사용
    if (isLocal) {
      console.log('로컬 접속: 서버 설정 우선 사용');
      globalSettings = {
        ...initialConfig,
        ...serverConfig
      };
    }
    // 외부 접속일 때는 로컬 스토리지 값이 우선
    else {
      console.log('외부 접속: 로컬 스토리지 설정 우선 사용');
      globalSettings = {
        ...initialConfig,
        ...serverConfig,
        ...localSettings
      };
    }
    
    // 설정 초기화 완료 표시
    settingsInitialized = true;
    
    console.log('설정 초기화 완료, 총', Object.keys(globalSettings).length, '개 설정 로드됨');
    
    // 초기화 완료 이벤트 디스패치
    if (typeof window !== 'undefined') {
      console.log('설정 초기화 완료 이벤트 발생');
      window.dispatchEvent(new CustomEvent('settingsInitialized'));
    }
  } catch (error) {
    console.error('설정 초기화 중 오류 발생:', error);
    settingsInitialized = true; // 오류가 있어도 초기화는 완료된 것으로 간주
  }
}

// 설정 값 가져오기 (단순화된 구현)
export function config(key: string): string {
  // 설정 초기화 확인
  if (!settingsInitialized && typeof window !== "undefined") {
    // 초기화가 진행 중일 때는 경고를 줄이고 기본값을 우선 반환
    
    // defaults에서 기본값 확인 (가장 우선)
    if (key in defaults) {
      return defaults[key];
    }
    
    // initialConfig에서 확인
    if (key in initialConfig) {
      return initialConfig[key];
    }
    
    // serverConfig에서 확인 (이미 로드된 경우)
    if (serverConfig && key in serverConfig) {
      return serverConfig[key];
    }
    
    // 정말 찾을 수 없는 경우만 빈 문자열 반환
    return "";
  }

  // API 키와 같은 민감한 설정에 대한 특별 처리
  const sensitiveKeys = ['openai_tts_apikey', 'openrouter_apikey', 'openai_apikey', 'elevenlabs_apikey'];
  if (sensitiveKeys.includes(key)) {
    // 로컬 스토리지 확인
    if (typeof localStorage !== "undefined") {
    const localKey = prefixed(key);
    const value = localStorage.getItem(localKey);
      if (value && value.trim() !== '') {
        return value;
      }
    }
    
    // 글로벌 설정에서 확인
    if (globalSettings[key] && globalSettings[key].trim() !== '') {
      return globalSettings[key];
    }
    
    // 에러 처리
    if (key === 'openai_tts_apikey' && config('tts_backend') === 'openai_tts') {
      console.error(`OpenAI TTS를 사용하려면 API 키가 필요합니다.`);
      throw new Error('Invalid OpenAI TTS API Key');
    }
    
    if (key === 'openrouter_apikey' && config('chatbot_backend') === 'openrouter') {
      console.error(`OpenRouter를 사용하려면 API 키가 필요합니다.`);
      throw new Error('Invalid OpenRouter API Key');
    }
  }

  // 글로벌 설정에서 값 가져오기
  if (key in globalSettings) {
    return globalSettings[key];
  }
  
  // 로컬 스토리지 확인 (아직 globalSettings에 병합되지 않은 경우)
  if (typeof localStorage !== "undefined") {
    const localKey = prefixed(key);
    const value = localStorage.getItem(localKey);
    if (value !== null) {
      // 로컬 접속일 때는 globalSettings에만 저장하고 localStorage에는 저장하지 않음
      if (isLocalhost()) {
        console.log(`[config] 로컬 접속에서 ${key} 설정을 로컬 스토리지에서 찾음, globalSettings만 업데이트`);
      }
      globalSettings[key] = value;
      return value;
    }
  }

  // 서버 설정 확인
  if (serverConfig && key in serverConfig) {
    // 찾은 값을 globalSettings에 저장
    globalSettings[key] = serverConfig[key];
    return serverConfig[key];
  }
  
  // 초기 설정 확인
  if (key in initialConfig) {
    // 찾은 값을 globalSettings에 저장
    globalSettings[key] = initialConfig[key];
    return initialConfig[key];
  }

  // 값을 찾을 수 없음
  console.error(`[config] ${key} 설정 키를 찾을 수 없음`);
  return "";
}

// 설정 업데이트 함수 - 사용자가 메뉴를 통해 직접 변경했을 때만 호출됨
export async function updateConfig(key: string, value: string) {
  try {
    // 현재 값과 새 값이 같으면 업데이트 불필요
    const currentValue = config(key);
    if (currentValue === value) {
      return;
    }
    
    // 내부/외부 접속 여부 확인
    const isLocal = isLocalhost();
    
    console.log(`[updateConfig] ${key} 값을 ${value}로 업데이트 (사용자 직접 변경, 내부접속: ${isLocal})`);
    
    // 항상 글로벌 설정 업데이트 (메모리 내 값)
    globalSettings[key] = value;
    
    // 내부 접속인 경우 서버 설정 파일에 저장
    if (isLocal) {
      console.log(`[updateConfig] 내부 접속이므로 서버 설정 파일에 저장: ${key}=${value}`);
      
      try {
        await handleConfig("update", { key, value });
        
        // 서버 설정 캐시 업데이트
        if (serverConfig) {
          serverConfig[key] = value;
        }
        
        console.log(`[updateConfig] 서버 설정 파일 저장 완료: ${key}=${value}`);
      } catch (error) {
        console.error(`[updateConfig] 서버 설정 파일 저장 오류:`, error);
      }
      
      // 로컬 스토리지에 이미 있는 경우 제거 (내부 접속 시에는 서버 설정이 우선)
      if (typeof localStorage !== "undefined") {
        const localKey = prefixed(key);
        if (localStorage.getItem(localKey) !== null) {
          console.log(`[updateConfig] 내부 접속이므로 로컬 스토리지에서 제거: ${key}`);
          localStorage.removeItem(localKey);
        }
      }
    } else {
      // 외부 접속인 경우 로컬 스토리지에 저장
      if (typeof localStorage !== "undefined") {
        console.log(`[updateConfig] 외부 접속이므로 로컬 스토리지에 저장: ${key}=${value}`);
        localStorage.setItem(prefixed(key), value);
      }
    }
  } catch (e) {
    console.error(`[updateConfig] "${key}"의 설정 업데이트 오류:`, e);
  }
}

// 관련 설정 로드 함수 수정
export async function loadRelatedSettings(backendType: string, backendValue: string): Promise<Record<string, string>> {
  console.log(`[loadRelatedSettings] ${backendType}=${backendValue} 관련 설정 로드 시작`);
  
  try {
    // 결과 객체 초기화
    const relatedSettings: Record<string, string> = {};
    
    // 특정 백엔드에 따른 관련 설정 정의
    if (backendType === 'chatbot_backend') {
      if (backendValue === 'openrouter') {
        // OpenRouter 관련 설정
        relatedSettings['openrouter_apikey'] = serverConfig?.openrouter_apikey || initialConfig?.openrouter_apikey || '';
        relatedSettings['openrouter_model'] = serverConfig?.openrouter_model || initialConfig?.openrouter_model || 'google/gemini-2.0-flash-exp:free';
        relatedSettings['openrouter_url'] = serverConfig?.openrouter_url || initialConfig?.openrouter_url || 'https://openrouter.ai/api/v1';
      } else if (backendValue === 'chatgpt') {
        // ChatGPT 관련 설정
        relatedSettings['openai_apikey'] = serverConfig?.openai_apikey || initialConfig?.openai_apikey || '';
        relatedSettings['openai_model'] = serverConfig?.openai_model || initialConfig?.openai_model || 'gpt-3.5-turbo';
        relatedSettings['openai_url'] = serverConfig?.openai_url || initialConfig?.openai_url || 'https://api.openai.com/v1';
      } else if (backendValue === 'llamacpp') {
        // LlamaCPP 관련 설정
        relatedSettings['llamacpp_url'] = serverConfig?.llamacpp_url || initialConfig?.llamacpp_url || 'http://localhost:8080';
        relatedSettings['llamacpp_stop_sequence'] = serverConfig?.llamacpp_stop_sequence || initialConfig?.llamacpp_stop_sequence || '</s>';
      } else if (backendValue === 'ollama') {
        // Ollama 관련 설정
        relatedSettings['ollama_url'] = serverConfig?.ollama_url || initialConfig?.ollama_url || 'http://localhost:11434';
        relatedSettings['ollama_model'] = serverConfig?.ollama_model || initialConfig?.ollama_model || 'llama2';
      } else if (backendValue === 'koboldai') {
        // KoboldAI 관련 설정
        relatedSettings['koboldai_url'] = serverConfig?.koboldai_url || initialConfig?.koboldai_url || 'http://localhost:5001';
        relatedSettings['koboldai_use_extra'] = serverConfig?.koboldai_use_extra || initialConfig?.koboldai_use_extra || 'true';
        relatedSettings['koboldai_stop_sequence'] = serverConfig?.koboldai_stop_sequence || initialConfig?.koboldai_stop_sequence || '</s>';
      } else if (backendValue === 'moshi') {
        // Moshi 관련 설정
        relatedSettings['moshi_url'] = serverConfig?.moshi_url || initialConfig?.moshi_url || '';
      }
    } else if (backendType === 'tts_backend') {
      if (backendValue === 'openai_tts') {
        // OpenAI TTS 관련 설정
        relatedSettings['openai_tts_apikey'] = serverConfig?.openai_tts_apikey || initialConfig?.openai_tts_apikey || '';
        relatedSettings['openai_tts_url'] = serverConfig?.openai_tts_url || initialConfig?.openai_tts_url || 'https://api.openai.com/v1';
        relatedSettings['openai_tts_model'] = serverConfig?.openai_tts_model || initialConfig?.openai_tts_model || 'tts-1';
        relatedSettings['openai_tts_voice'] = serverConfig?.openai_tts_voice || initialConfig?.openai_tts_voice || 'alloy';
      } else if (backendValue === 'elevenlabs') {
        // ElevenLabs 관련 설정
        relatedSettings['elevenlabs_apikey'] = serverConfig?.elevenlabs_apikey || initialConfig?.elevenlabs_apikey || '';
        relatedSettings['elevenlabs_voiceid'] = serverConfig?.elevenlabs_voiceid || initialConfig?.elevenlabs_voiceid || '';
        relatedSettings['elevenlabs_model'] = serverConfig?.elevenlabs_model || initialConfig?.elevenlabs_model || 'eleven_multilingual_v2';
      } else if (backendValue === 'speecht5') {
        // SpeechT5 관련 설정
        relatedSettings['speecht5_speaker_embedding_url'] = serverConfig?.speecht5_speaker_embedding_url || initialConfig?.speecht5_speaker_embedding_url || '';
      } else if (backendValue === 'localXTTS') {
        // Alltalk TTS 관련 설정
        relatedSettings['localXTTS_url'] = serverConfig?.localXTTS_url || initialConfig?.localXTTS_url || 'http://localhost:8020';
        relatedSettings['alltalk_version'] = serverConfig?.alltalk_version || initialConfig?.alltalk_version || 'v2';
        relatedSettings['alltalk_voice'] = serverConfig?.alltalk_voice || initialConfig?.alltalk_voice || 'female_01';
        relatedSettings['alltalk_language'] = serverConfig?.alltalk_language || initialConfig?.alltalk_language || 'ko';
      } else if (backendValue === 'piper') {
        // Piper 관련 설정
        relatedSettings['piper_url'] = serverConfig?.piper_url || initialConfig?.piper_url || 'http://localhost:5001';
      } else if (backendValue === 'coquiLocal') {
        // Coqui Local 관련 설정
        relatedSettings['coquiLocal_url'] = serverConfig?.coquiLocal_url || initialConfig?.coquiLocal_url || 'http://localhost:9090';
        relatedSettings['coquiLocal_voiceid'] = serverConfig?.coquiLocal_voiceid || initialConfig?.coquiLocal_voiceid || '';
      } else if (backendValue === 'kokoro') {
        // Kokoro 관련 설정
                relatedSettings['kokoro_url'] = serverConfig?.kokoro_url || initialConfig?.kokoro_url || 'http://localhost:3200';
        relatedSettings['kokoro_voice'] = serverConfig?.kokoro_voice || initialConfig?.kokoro_voice || 'iu';
      } else if (backendValue === 'edgetts') {
        // EdgeTTS 관련 설정
        relatedSettings['edgetts_url'] = serverConfig?.edgetts_url || initialConfig?.edgetts_url || 'http://localhost:3701';
        relatedSettings['edgetts_voice'] = serverConfig?.edgetts_voice || initialConfig?.edgetts_voice || 'Microsoft Server Speech Text to Speech Voice (ko-KR, SunHiNeural)';
        relatedSettings['edgetts_rate'] = serverConfig?.edgetts_rate || initialConfig?.edgetts_rate || '+0%';
        relatedSettings['edgetts_pitch'] = serverConfig?.edgetts_pitch || initialConfig?.edgetts_pitch || '+0Hz';
        relatedSettings['edgetts_volume'] = serverConfig?.edgetts_volume || initialConfig?.edgetts_volume || '+0%';
        relatedSettings['edgetts_auto_detect'] = serverConfig?.edgetts_auto_detect || initialConfig?.edgetts_auto_detect || 'false';
      }
    }
    
    console.log(`[loadRelatedSettings] ${backendType}=${backendValue} 관련 설정 로드 완료, 설정 수: ${Object.keys(relatedSettings).length}`);
    return relatedSettings;
  } catch (error) {
    console.error(`[loadRelatedSettings] 관련 설정 로드 오류:`, error);
    return {};
  }
}

// 브라우저에서 초기화 실행
if (typeof window !== "undefined") {
  // 페이지 로드 시 설정 초기화 - 즉시 실행하도록 변경
  console.log("페이지 로드 시 설정 초기화 시작");
  initializeSettings().catch(error => {
    console.error("브라우저에서 설정 초기화 오류:", error);
  });
}

// 설정을 초기화하는 함수 추가
export function resetConfig() {
  try {
    // 로컬 스토리지의 모든 chatvrm_ 접두사가 붙은 항목 삭제
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('chatvrm_')) {
        localStorage.removeItem(key);
      }
    });
    
    // 서버 설정 초기화 API 호출 (로컬 서버인 경우만)
    if (isLocalhost()) {
      fetch('/api/config/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(response => response.json())
      .then(data => {
        console.log("[resetConfig] 서버 설정 초기화 성공:", data);
        // 페이지 새로고침
        window.location.reload();
      })
      .catch(error => {
        console.error("[resetConfig] 서버 설정 초기화 오류:", error);
      });
    } else {
      // 로컬 서버가 아닐 경우 페이지 새로고침
      window.location.reload();
    }
  } catch (error) {
    console.error("[resetConfig] 설정 초기화 중 오류 발생:", error);
  }
}

