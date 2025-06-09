const fs = require('fs');
const path = require('path');

// 설정 파일 읽기
const initialConfigPath = path.join(process.cwd(), 'userdata', 'initial_config.json');
const initialConfig = JSON.parse(fs.readFileSync(initialConfigPath, 'utf8'));

// defaults 객체의 키 목록 (하드코딩해서 사용)
const defaultKeys = [
  'chatbot_backend', 'openrouter_apikey', 'openrouter_model', 'openrouter_url', 'tts_backend',
  'piper_url', 'tts_muted', 'openai_tts_apikey', 'openai_tts_url', 'openai_tts_model', 'openai_tts_voice',
  'stt_backend', 'vision_backend', 'vision_openai_apikey', 'vision_openai_url', 'vision_openai_model',
  'name', 'vrm_url', 'amica_life_enabled', 'external_api_enabled', 'show_introduction', 'bg_color',
  'bg_url', 'vrm_hash', 'vrm_save_type', 'youtube_videoid', 'animation_url', 'animation_procedural',
  'show_arbius_introduction', 'time_before_idle_sec', 'show_add_to_homescreen', 'use_webgpu',
  'arbius_llm_model_id', 'openai_apikey', 'openai_url', 'openai_model', 'mtoon_material_type',
  'debug_gfx', 'mtoon_debug_mode', 'system_prompt', 'vision_system_prompt', 'localXTTS_url',
  'alltalk_version', 'alltalk_voice', 'alltalk_language', 'alltalk_rvc_voice', 'alltalk_rvc_pitch',
  'autosend_from_mic', 'wake_word_enabled', 'wake_word', 'language', 'voice_url', 'llamacpp_url',
  'llamacpp_stop_sequence', 'ollama_url', 'ollama_model', 'koboldai_url', 'koboldai_use_extra',
  'koboldai_stop_sequence', 'moshi_url', 'vision_llamacpp_url', 'vision_ollama_url',
  'vision_ollama_model', 'whispercpp_url', 'openai_whisper_apikey', 'openai_whisper_url',
  'openai_whisper_model', 'rvc_url', 'rvc_enabled', 'rvc_model_name', 'rvc_f0_upkey', 'rvc_f0_method',
  'rvc_index_path', 'rvc_index_rate', 'rvc_filter_radius', 'rvc_resample_sr', 'rvc_rms_mix_rate',
  'rvc_protect', 'coquiLocal_url', 'coquiLocal_voiceid', 'kokoro_url', 'kokoro_voice',
  'elevenlabs_apikey', 'elevenlabs_voiceid', 'elevenlabs_model', 'speecht5_speaker_embedding_url',
  'coqui_apikey', 'coqui_voice_id', 'reasoning_engine_enabled', 'reasoning_engine_url',
  'x_api_key', 'x_api_secret', 'x_access_token', 'x_access_secret', 'x_bearer_token',
  'telegram_bot_token', 'min_time_interval_sec', 'max_time_interval_sec', 'time_to_sleep_sec',
  'idle_text_prompt'
];

// initial_config.json의 키 목록
const initialKeys = Object.keys(initialConfig);

console.log('defaults 객체의 키 개수:', defaultKeys.length);
console.log('initial_config.json의 키 개수:', initialKeys.length);

// initial_config.json에 없는 키 찾기
const missingInInitial = defaultKeys.filter(key => !initialKeys.includes(key));
console.log('initial_config.json에 없는 키:', missingInInitial);

// defaults에 없는 키 찾기
const missingInDefaults = initialKeys.filter(key => !defaultKeys.includes(key));
console.log('defaults에 없는 키:', missingInDefaults);

// 중요한 키에 대해 빈 값 확인
const sensitiveKeys = ['openai_tts_apikey', 'openrouter_apikey', 'openai_apikey', 'elevenlabs_apikey', 'coqui_apikey'];
sensitiveKeys.forEach(key => {
  if (!initialConfig[key] || initialConfig[key].trim() === '') {
    console.log(`경고: 중요 설정 "${key}"의 값이 비어 있습니다.`);
  }
}); 