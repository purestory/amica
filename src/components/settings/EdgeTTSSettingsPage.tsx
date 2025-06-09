import React, { useState, useEffect } from "react";
import { config, updateConfig } from "@/utils/config";
import { edgettsKoreanVoices } from '@/features/edgetts/edgetts';

export function EdgeTTSSettingsPage({
  edgettsUrl,
  edgettsVoice,
  edgettsRate,
  edgettsPitch,
  edgettsVolume,
  edgettsAutoDetect,
  setEdgettsUrl,
  setEdgettsVoice,
  setEdgettsRate,
  setEdgettsPitch,
  setEdgettsVolume,
  setEdgettsAutoDetect,
  setSettingsUpdated,
}: {
  edgettsUrl: string;
  edgettsVoice: string;
  edgettsRate: string;
  edgettsPitch: string;
  edgettsVolume: string;
  edgettsAutoDetect: string;
  setEdgettsUrl: (value: string) => void;
  setEdgettsVoice: (value: string) => void;
  setEdgettsRate: (value: string) => void;
  setEdgettsPitch: (value: string) => void;
  setEdgettsVolume: (value: string) => void;
  setEdgettsAutoDetect: (value: string) => void;
  setSettingsUpdated: (value: boolean) => void;
}) {
  const [voices, setVoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 한국어 음성 목록 가져오기
  useEffect(() => {
    const fetchVoices = async () => {
      setIsLoading(true);
      try {
        const koreanVoices = await edgettsKoreanVoices();
        setVoices(koreanVoices || []);
      } catch (error) {
        console.error('음성 목록 가져오기 실패:', error);
        setVoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoices();
  }, []);

  const handleUrlChange = (value: string) => {
    setEdgettsUrl(value);
    updateConfig("edgetts_url", value);
    setSettingsUpdated(true);
  };

  const handleVoiceChange = (value: string) => {
    setEdgettsVoice(value);
    updateConfig("edgetts_voice", value);
    setSettingsUpdated(true);
  };

  const handleRateChange = (value: string) => {
    setEdgettsRate(value);
    updateConfig("edgetts_rate", value);
    setSettingsUpdated(true);
  };

  const handlePitchChange = (value: string) => {
    setEdgettsPitch(value);
    updateConfig("edgetts_pitch", value);
    setSettingsUpdated(true);
  };

  const handleVolumeChange = (value: string) => {
    setEdgettsVolume(value);
    updateConfig("edgetts_volume", value);
    setSettingsUpdated(true);
  };

  const handleAutoDetectChange = (value: boolean) => {
    const stringValue = value ? "true" : "false";
    setEdgettsAutoDetect(stringValue);
    updateConfig("edgetts_auto_detect", stringValue);
    setSettingsUpdated(true);
  };

  return (
    <div className="rounded-lg shadow-lg bg-white p-4">
      <h2 className="text-xl w-full mb-4">EdgeTTS 설정</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">EdgeTTS 서버 URL</label>
        <input
          type="text"
          value={edgettsUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUrlChange(e.target.value)}
          placeholder="http://localhost:3701"
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">음성 선택</label>
        {isLoading ? (
          <div className="text-sm text-gray-500">음성 목록 로딩 중...</div>
        ) : (
          <select
            value={edgettsVoice}
            onChange={(e) => handleVoiceChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">음성을 선택하세요</option>
            {voices.map((voice, index) => (
              <option key={index} value={voice.name || voice}>
                {voice.display_name || voice.name || voice}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">속도 (Rate)</label>
        <input
          type="text"
          value={edgettsRate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRateChange(e.target.value)}
          placeholder="+0% (예: -20%, +50%)"
          className="w-full p-2 border border-gray-300 rounded"
        />
        <div className="text-xs text-gray-500 mt-1">
          음성 속도를 조절합니다. -50% ~ +200% 범위 권장
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">음높이 (Pitch)</label>
        <input
          type="text"
          value={edgettsPitch}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePitchChange(e.target.value)}
          placeholder="+0Hz (예: -100Hz, +50Hz)"
          className="w-full p-2 border border-gray-300 rounded"
        />
        <div className="text-xs text-gray-500 mt-1">
          음성 높이를 조절합니다. -200Hz ~ +200Hz 범위 권장
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">음량 (Volume)</label>
        <input
          type="text"
          value={edgettsVolume}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleVolumeChange(e.target.value)}
          placeholder="+0% (예: -20%, +100%)"
          className="w-full p-2 border border-gray-300 rounded"
        />
        <div className="text-xs text-gray-500 mt-1">
          음성 볼륨을 조절합니다. -100% ~ +100% 범위 권장
        </div>
      </div>

      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={edgettsAutoDetect === "true"}
            onChange={(e) => handleAutoDetectChange(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm font-medium">자동 언어 감지</span>
        </label>
        <div className="text-xs text-gray-500 mt-1">
          텍스트 언어를 자동으로 감지하여 적절한 음성을 선택합니다
        </div>
      </div>

      <div className="text-sm text-gray-600 mt-4 p-3 bg-blue-50 rounded">
        <strong>EdgeTTS 정보:</strong><br />
        • Microsoft의 고품질 음성 합성 서비스<br />
        • 한국어 여성/남성 음성 지원<br />
        • 실시간 음성 생성<br />
        • 현재 선택된 음성: {edgettsVoice ? edgettsVoice.split('(')[0] : '없음'}
      </div>
    </div>
  );
} 