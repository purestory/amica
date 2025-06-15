import { config } from '@/utils/config';

export async function kokoro(
  message: string,
) {
  try {
    const res = await fetch(`${config("kokoro_url")}/v1/audio/speech`, {
      method: "POST",
      body: JSON.stringify({
        model: "tts-1", // 기본 TTS 모델
        input: message,
        voice: config("kokoro_voice"),
        response_format: "mp3"
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!res.ok) {
      console.error(`Kokoro API 오류 (상태: ${res.status}):`, res);
      throw new Error("Kokoro TTS API Error");
    }
    
    const data = await res.arrayBuffer();
    return { audio: data };
  } catch (e) {
    console.error('Kokoro TTS API 호출 중 오류 발생:', e);
    throw new Error("Kokoro TTS API Error");
  }
}

export async function kokoroVoiceList() {
  try {
    const response = await fetch(`${config("kokoro_url")}/v1/audio/voices`, {
      method: 'GET',
      headers: {
        'Accept': "application/json",
      }
    });
    
    if (!response.ok) {
      console.error(`Kokoro 음성 목록 가져오기 오류 (상태: ${response.status}):`, response);
      throw new Error("Failed to fetch voice list");
    }
    
    return response.json();
  } catch (error) {
    console.error('음성 목록 조회 중 오류 발생:', error);
    throw error;
  }
}
