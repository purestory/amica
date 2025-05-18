import { handleConfig, serverConfig as importedServerConfig } from "@/features/externalAPI/externalAPI";

// 현재 호스트가 localhost인지 확인하는 함수
export function isLocalhost(): boolean {
  if (typeof window !== "undefined") {
    return window.location.hostname === "localhost" || 
           window.location.hostname === "127.0.0.1" ||
           window.location.hostname.startsWith("192.168.");
  }
  return false;
}

// 서버 측에서 초기 설정 파일 읽기
let initialConfig: Record<string, string> = {};

// 서버 사이드에서만 실행
if (typeof window === 'undefined') {
  try {
    // fs와 path 모듈을 동적으로 불러옴 (서버 사이드에서만)
    const fs = require('fs');
    const path = require('path');
    
    // 먼저 config.json 찾기 (사용자 설정)
    const configPath = path.join(process.cwd(), 'userdata', 'config.json');
    
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      initialConfig = JSON.parse(configData);
      console.log('현재 설정 파일(config.json) 로드 완료');
    } else {
      // config.json이 없으면 initial_config.json 찾기 (초기 기본값)
      const initialConfigPath = path.join(process.cwd(), 'userdata', 'initial_config.json');
      
      if (fs.existsSync(initialConfigPath)) {
        const configData = fs.readFileSync(initialConfigPath, 'utf8');
        initialConfig = JSON.parse(configData);
        console.log('초기 설정 파일(initial_config.json) 로드 완료');
      } else {
        console.warn('설정 파일을 찾을 수 없습니다. 기본값 사용');
      }
    }
  } catch (error) {
    console.error('설정 파일 로드 오류:', error);
  }
}

// 모든 설정값을 initialConfig에서 가져오도록 수정
export const defaults: Record<string, string> = {
  // 모든 설정값을 initialConfig에서 가져옴
  chatbot_backend: initialConfig.chatbot_backend ?? 'openai',
  openrouter_apikey: initialConfig.openrouter_apikey ?? '',
  openrouter_model: initialConfig.openrouter_model ?? 'openai/gpt-3.5-turbo',
  openrouter_url: initialConfig.openrouter_url ?? 'https://openrouter.ai/api/v1',
  tts_backend: initialConfig.tts_backend ?? 'piper',
  piper_url: initialConfig.piper_url ?? 'https://i-love-amica.com:5000/tts',
  tts_muted: initialConfig.tts_muted ?? 'false',
  openai_tts_apikey: initialConfig.openai_tts_apikey ?? '',
  openai_tts_url: initialConfig.openai_tts_url ?? 'https://api.openai.com',
  openai_tts_model: initialConfig.openai_tts_model ?? 'tts-1',
  openai_tts_voice: initialConfig.openai_tts_voice ?? 'nova',
  stt_backend: initialConfig.stt_backend ?? 'whisper_browser',
  vision_backend: initialConfig.vision_backend ?? 'vision_openai',
  vision_openai_apikey: initialConfig.vision_openai_apikey ?? 'default',
  vision_openai_url: initialConfig.vision_openai_url ?? 'https://api-01.heyamica.com',
  vision_openai_model: initialConfig.vision_openai_model ?? 'gpt-4-vision-preview',
  name: initialConfig.name ?? 'Amica',
  vrm_url: initialConfig.vrm_url ?? '/vrm/AvatarSample_B.vrm',
  amica_life_enabled: initialConfig.amica_life_enabled ?? 'true',
  external_api_enabled: initialConfig.external_api_enabled ?? 'false',
  show_introduction: initialConfig.show_introduction ?? 'true',
  bg_color: initialConfig.bg_color ?? '',
  bg_url: initialConfig.bg_url ?? '/bg/bg-room2.jpg',
  vrm_hash: initialConfig.vrm_hash ?? '',
  vrm_save_type: initialConfig.vrm_save_type ?? 'web',
  youtube_videoid: initialConfig.youtube_videoid ?? '',
  animation_url: initialConfig.animation_url ?? '/animations/idle_loop.vrma',
  animation_procedural: initialConfig.animation_procedural ?? 'false',
  show_arbius_introduction: initialConfig.show_arbius_introduction ?? 'false',
  time_before_idle_sec: initialConfig.time_before_idle_sec ?? '20',
  show_add_to_homescreen: initialConfig.show_add_to_homescreen ?? 'true',
  use_webgpu: initialConfig.use_webgpu ?? 'false',
  arbius_llm_model_id: initialConfig.arbius_llm_model_id ?? 'default',
  openai_apikey: initialConfig.openai_apikey ?? 'default',
  openai_url: initialConfig.openai_url ?? 'https://i-love-amica.com',
  openai_model: initialConfig.openai_model ?? 'mlabonne/NeuralDaredevil-8B-abliterated',
  mtoon_material_type: initialConfig.mtoon_material_type ?? 'mtoon',
  debug_gfx: initialConfig.debug_gfx ?? 'false',
  mtoon_debug_mode: initialConfig.mtoon_debug_mode ?? 'none',
  system_prompt: initialConfig.system_prompt ?? `Assume the persona of Amica, a feisty human with extraordinary intellectual capabilities but a notably unstable emotional spectrum.`,
  vision_system_prompt: process.env.NEXT_PUBLIC_VISION_SYSTEM_PROMPT ?? initialConfig.vision_system_prompt ?? 'Look at the image as you would if you are a human, be concise, witty and charming.',
  localXTTS_url: initialConfig.localXTTS_url ?? 'http://127.0.0.1:7851',
  alltalk_version: initialConfig.alltalk_version ?? 'v2',
  alltalk_voice: initialConfig.alltalk_voice ?? 'female_01.wav',
  alltalk_language: initialConfig.alltalk_language ?? 'en',
  alltalk_rvc_voice: initialConfig.alltalk_rvc_voice ?? 'Disabled',
  alltalk_rvc_pitch: initialConfig.alltalk_rvc_pitch ?? '0',
  autosend_from_mic: initialConfig.autosend_from_mic ?? 'true',
  wake_word_enabled: initialConfig.wake_word_enabled ?? 'false',
  wake_word: initialConfig.wake_word ?? 'Hello',
  language: initialConfig.language ?? 'en',
  voice_url: initialConfig.voice_url ?? '',
  llamacpp_url: initialConfig.llamacpp_url ?? 'http://127.0.0.1:8080',
  llamacpp_stop_sequence: initialConfig.llamacpp_stop_sequence ?? '(End)||[END]||Note||***||You:||User:||</s>',
  ollama_url: initialConfig.ollama_url ?? 'http://localhost:11434',
  ollama_model: initialConfig.ollama_model ?? 'llama2',
  koboldai_url: initialConfig.koboldai_url ?? 'http://localhost:5001',
  koboldai_use_extra: initialConfig.koboldai_use_extra ?? 'false',
  koboldai_stop_sequence: initialConfig.koboldai_stop_sequence ?? '(End)||[END]||Note||***||You:||User:||</s>',
  moshi_url: initialConfig.moshi_url ?? 'https://runpod.proxy.net',
  vision_llamacpp_url: initialConfig.vision_llamacpp_url ?? 'http://127.0.0.1:8081',
  vision_ollama_url: initialConfig.vision_ollama_url ?? 'http://localhost:11434',
  vision_ollama_model: initialConfig.vision_ollama_model ?? 'llava',
  whispercpp_url: initialConfig.whispercpp_url ?? 'http://localhost:8080',
  openai_whisper_apikey: initialConfig.openai_whisper_apikey ?? '',
  openai_whisper_url: initialConfig.openai_whisper_url ?? 'https://api.openai.com',
  openai_whisper_model: initialConfig.openai_whisper_model ?? 'whisper-1',
  rvc_url: initialConfig.rvc_url ?? 'http://localhost:8001/voice2voice',
  rvc_enabled: initialConfig.rvc_enabled ?? 'false',
  rvc_model_name: initialConfig.rvc_model_name ?? 'model_name.pth',
  rvc_f0_upkey: initialConfig.rvc_f0_upkey ?? '0',
  rvc_f0_method: initialConfig.rvc_f0_method ?? 'pm',
  rvc_index_path: initialConfig.rvc_index_path ?? 'none',
  rvc_index_rate: initialConfig.rvc_index_rate ?? '0.66',
  rvc_filter_radius: initialConfig.rvc_filter_radius ?? '3',
  rvc_resample_sr: initialConfig.rvc_resample_sr ?? '0',
  rvc_rms_mix_rate: initialConfig.rvc_rms_mix_rate ?? '1',
  rvc_protect: initialConfig.rvc_protect ?? '0.33',
  coquiLocal_url: initialConfig.coquiLocal_url ?? 'http://localhost:5002',
  coquiLocal_voiceid: initialConfig.coquiLocal_voiceid ?? 'p240',
  kokoro_url: initialConfig.kokoro_url ?? 'http://localhost:8080',
  kokoro_voice: initialConfig.kokoro_voice ?? 'af_bella',
  elevenlabs_apikey: initialConfig.elevenlabs_apikey ?? '',
  elevenlabs_voiceid: initialConfig.elevenlabs_voiceid ?? '21m00Tcm4TlvDq8ikWAM',
  elevenlabs_model: initialConfig.elevenlabs_model ?? 'eleven_monolingual_v1',
  speecht5_speaker_embedding_url: initialConfig.speecht5_speaker_embedding_url ?? '/speecht5_speaker_embeddings/cmu_us_slt_arctic-wav-arctic_a0001.bin',
  coqui_apikey: initialConfig.coqui_apikey ?? '',
  coqui_voice_id: initialConfig.coqui_voice_id ?? '71c6c3eb-98ca-4a05-8d6b-f8c2b5f9f3a3',
  reasoning_engine_enabled: initialConfig.reasoning_engine_enabled ?? 'false',
  reasoning_engine_url: initialConfig.reasoning_engine_url ?? 'https://i-love-amica.com:3000/reasoning/v1/chat/completions',
  x_api_key: initialConfig.x_api_key ?? '',
  x_api_secret: initialConfig.x_api_secret ?? '',
  x_access_token: initialConfig.x_access_token ?? '',
  x_access_secret: initialConfig.x_access_secret ?? '',
  x_bearer_token: initialConfig.x_bearer_token ?? '',
  telegram_bot_token: initialConfig.telegram_bot_token ?? '',
  min_time_interval_sec: initialConfig.min_time_interval_sec ?? '10',
  max_time_interval_sec: initialConfig.max_time_interval_sec ?? '20',
  time_to_sleep_sec: initialConfig.time_to_sleep_sec ?? '90',
  idle_text_prompt: initialConfig.idle_text_prompt ?? 'No file selected'
};

export function prefixed(key: string) {
  return `chatvrm_${key}`;
}

// 클라이언트 사이드에서만 실행 - SSR에서는 실행하지 않음
if (typeof window !== "undefined") {
  // 브라우저 환경에서만 초기화
  setTimeout(() => {
    try {
      handleConfig("init").catch(err => console.error("설정 초기화 오류:", err));
    } catch (err) {
      console.error("설정 초기화 중 오류 발생:", err);
    }
  }, 100); // 약간의 지연 추가
} else {
  // 서버에서는 동기화만 시도
  setTimeout(() => {
    try {
      handleConfig("fetch").catch(err => console.error("설정 가져오기 오류:", err));
    } catch (err) {
      console.error("설정 가져오기 중 오류 발생:", err);
    }
  }, 100); // 약간의 지연 추가
}

// appearance 관련 설정 키 정의
const APPEARANCE_KEYS = [
  'bg_color',
  'bg_url',
  'vrm_url',
  'vrm_hash',
  'vrm_save_type',
  'youtube_videoid',
  'animation_url',
  'animation_procedural',
  'name'
];

// 주어진 키가 외관(appearance) 관련 설정인지 확인
function isAppearanceKey(key: string): boolean {
  return APPEARANCE_KEYS.includes(key);
}

// 디버그 로깅 플래그 - 필요한 경우만 true로 설정
const DEBUG_LOGGING = false;

// 로컬 스토리지에서 값을 직접 확인하기 위한 특수 처리 키 목록
const SPECIAL_KEYS = ['show_introduction', 'show_add_to_homescreen', 'name', 'system_prompt'];

// 외부 접속에서도 변경 가능한 설정 키 목록
const EXTERNAL_ALLOWED_KEYS = ['name', 'system_prompt'];

export function config(key: string): string {
  // 특수 처리가 필요한 키 (show_introduction 등)
  if (SPECIAL_KEYS.includes(key) && typeof localStorage !== "undefined") {
    const localKey = prefixed(key);
    const value = localStorage.getItem(localKey);
    
    // 로컬 스토리지에 값이 있으면 우선 사용
    if (value !== null) {
      if (DEBUG_LOGGING) console.log(`[config] ${key} 값을 로컬 스토리지에서 가져옴 (특수 키):`, value);
      return value;
    }
    
    // 로컬 스토리지에 값이 없으면 config.json 파일 값 사용
    if (importedServerConfig && importedServerConfig.hasOwnProperty(key)) {
      // 값을 로컬 스토리지에도 저장
      localStorage.setItem(localKey, importedServerConfig[key]);
      if (DEBUG_LOGGING) console.log(`[config] ${key} 값을 serverConfig에서 가져와 로컬 스토리지에 저장:`, importedServerConfig[key]);
      return importedServerConfig[key];
    }
  }
  
  // 외관(appearance) 관련 설정인 경우
  if (isAppearanceKey(key)) {
    // 1. 먼저 로컬 스토리지에서 확인
    if (isLocalhost() && typeof localStorage !== "undefined" && localStorage.hasOwnProperty(prefixed(key))) {
      const value = localStorage.getItem(prefixed(key));
      if (value !== null) {
        if (DEBUG_LOGGING) console.log(`[config] ${key} 값을 로컬 스토리지에서 가져옴:`, value);
        return value;
      }
    }

    // 2. 로컬에 없으면 서버 설정에서 확인
    if (importedServerConfig && importedServerConfig.hasOwnProperty(key)) {
      if (DEBUG_LOGGING) console.log(`[config] ${key} 값을 serverConfig에서 가져옴:`, importedServerConfig[key]);
      return importedServerConfig[key];
    }
  } 
  // 외관 관련이 아닌 일반 설정인 경우
  else {
    // 서버 설정에서만 확인
    if (importedServerConfig && importedServerConfig.hasOwnProperty(key)) {
      if (DEBUG_LOGGING) console.log(`[config] ${key} 값을 serverConfig에서 가져옴:`, importedServerConfig[key]);
      return importedServerConfig[key];
    }
  }

  // 3. 서버 설정이 없으면 초기 설정 파일 값 확인
  if (initialConfig && initialConfig.hasOwnProperty(key)) {
    if (DEBUG_LOGGING) console.log(`[config] ${key} 값을 initialConfig에서 가져옴:`, initialConfig[key]);
    return initialConfig[key];
  }

  // 4. 모든 곳에서 값을 찾을 수 없으면 기본값 반환
  if (defaults.hasOwnProperty(key)) {
    if (DEBUG_LOGGING) console.log(`[config] ${key} 값을 defaults에서 가져옴:`, (<any>defaults)[key]);
    return (<any>defaults)[key];
  }

  console.error(`[config] ${key} 설정 키를 찾을 수 없음`);
  throw new Error(`config key not found: ${key}`);
}

export async function updateConfig(key: string, value: string) {
  try {
    // 현재 값과 새 값이 같으면 업데이트 불필요
    const currentValue = config(key);
    if (currentValue === value) {
      if (DEBUG_LOGGING) console.log(`[updateConfig] ${key} 값 ${value}는 이미 설정되어 있어 변경 필요 없음`);
      return;
    }
    
    if (DEBUG_LOGGING) console.log(`[updateConfig] ${key} 값을 ${value}로 업데이트 시도`);
    
    // 서버에 설정 저장 (로컬호스트이거나 외부에서도 허용된 키인 경우)
    if (isLocalhost() || EXTERNAL_ALLOWED_KEYS.includes(key)) {
      await handleConfig("update", { key, value });
      if (DEBUG_LOGGING) console.log(`[updateConfig] ${key} 값이 서버에 저장됨`);
    } else {
      console.log(`[updateConfig] 외부 접속에서 허용되지 않은 키(${key}) 업데이트 시도가 차단됨`);
      return; // 외부 접속에서 허용되지 않은 키는 여기서 종료
    }
    
    // 항상 localStorage에 저장할 키 (SPECIAL_KEYS) 또는 appearance 관련 설정이고 로컬 호스트인 경우
    if (SPECIAL_KEYS.includes(key) || (isAppearanceKey(key) && isLocalhost())) {
    if (typeof localStorage !== "undefined") {
        const localKey = prefixed(key);
      localStorage.setItem(localKey, value);
        if (DEBUG_LOGGING) console.log(`[updateConfig] ${key} 값이 localStorage에 저장됨`);
      }
    }
    
    // 내부 serverConfig 캐시도 직접 업데이트 (중요)
    if (typeof importedServerConfig !== 'undefined' && importedServerConfig !== null) {
      importedServerConfig[key] = value;
      if (DEBUG_LOGGING) console.log(`[updateConfig] ${key} 값이 serverConfig에 직접 업데이트됨`);
    }
  } catch (e) {
    console.error(`[updateConfig] "${key}"의 설정 업데이트 오류:`, e);
  }
}

export function defaultConfig(key: string): string {
  if (defaults.hasOwnProperty(key)) {
    return (<any>defaults)[key];
  }

  throw new Error(`config key not found: ${key}`);
}

export async function resetConfig() {
  // localhost에서만 설정 초기화 허용
  if (!isLocalhost()) {
    console.warn("설정 초기화는 localhost에서만 가능합니다.");
    return;
  }

  try {
    // appearance 관련 설정만 localStorage에서 제거
    if (typeof localStorage !== "undefined") {
      for (const key of APPEARANCE_KEYS) {
        localStorage.removeItem(prefixed(key));
      }
    }

    // Sync reset to server config
    await handleConfig("reset");

  } catch (e) {
    console.error(`Error resetting config: ${e}`);
  }
}

// 모든 설정을 서버에 동기화
export async function syncConfig() {
  if (!isLocalhost()) {
    console.warn("설정 동기화는 localhost에서만 가능합니다.");
    return;
  }

  try {
    await handleConfig("sync");
  } catch (e) {
    console.error(`Error syncing config: ${e}`);
  }
}

// 특정 설정 그룹을 일괄 업데이트
export async function updateConfigGroup(changedConfig: Record<string, string>, debugInfo?: string) {
  try {
    // 내부 serverConfig 캐시도 직접 업데이트
    if (typeof importedServerConfig !== 'undefined' && importedServerConfig !== null) {
      Object.assign(importedServerConfig, changedConfig);
      if (DEBUG_LOGGING) console.log(`[updateConfigGroup] serverConfig에 직접 업데이트됨`);
    }
  } catch (e) {
    console.error(`[updateConfigGroup] 설정 그룹 업데이트 오류:`, e);
  }
}
