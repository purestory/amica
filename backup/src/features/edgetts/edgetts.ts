import { config } from "@/utils/config";

export async function edgetts(
  text: string
): Promise<{ audio: ArrayBuffer }> {
  try {
    const res = await fetch(`${config("edgetts_url")}/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text,
        voice: config("edgetts_voice"),
        rate: config("edgetts_rate") || "+0%",
        pitch: config("edgetts_pitch") || "+0Hz",
        volume: config("edgetts_volume") || "+0%",
        auto_detect_language: config("edgetts_auto_detect") || false
      }),
    });
    
    if (!res.ok) {
      console.error(`EdgeTTS API 오류 (상태: ${res.status}):`, res);
      throw new Error("EdgeTTS API Error");
    }
    
    const audio = await res.arrayBuffer();
    return { audio };
  } catch (e) {
    console.error('EdgeTTS API 호출 중 오류 발생:', e);
    throw new Error("EdgeTTS API Error");
  }
}

export async function edgettsVoiceList() {
  try {
    const response = await fetch(`${config("edgetts_url")}/voices`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    
    if (!response.ok) {
      console.error(`EdgeTTS 음성 목록 가져오기 오류 (상태: ${response.status}):`, response);
      return [];
    }
    
    const voices = await response.json();
    return voices;
  } catch (e) {
    console.error('EdgeTTS 음성 목록 가져오기 중 오류 발생:', e);
    return [];
  }
}

export async function edgettsKoreanVoices() {
  try {
    const response = await fetch(`${config("edgetts_url")}/voices/ko`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    
    if (!response.ok) {
      console.error(`EdgeTTS 한국어 음성 목록 가져오기 오류 (상태: ${response.status}):`, response);
      return [];
    }
    
    const voices = await response.json();
    return voices;
  } catch (e) {
    console.error('EdgeTTS 한국어 음성 목록 가져오기 중 오류 발생:', e);
    return [];
  }
} 