import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/utils/i18n-stubs';
import { BasicPage, FormRow, NotUsingAlert } from "./common";
import { TextInput } from "@/components/textInput";
import { config, updateConfig } from "@/utils/config";


interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export function OllamaSettingsPage({
  ollamaUrl,
  setOllamaUrl,
  ollamaModel,
  setOllamaModel,
  setSettingsUpdated,
}: {
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
  ollamaModel: string;
  setOllamaModel: (url: string) => void;
  setSettingsUpdated: (updated: boolean) => void;
}) {
  const { t } = useTranslation();
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // 올라마 모델 목록 가져오기
  const fetchModels = async () => {
    if (!ollamaUrl) {
      setError("올라마 URL을 먼저 설정하세요");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 타임아웃을 위한 AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

      try {
        // Next.js API 라우트를 통해 프록시로 요청 (amica 경로 포함)
        const response = await fetch(`/amica-api/ollama-models?url=${encodeURIComponent(ollamaUrl)}`, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setModels(data.models || []);
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        
        if (fetchErr.name === 'AbortError') {
          throw new Error('요청 시간 초과 (10초)');
        }
        throw fetchErr;
      }
    } catch (err: any) {
      console.error('올라마 모델 목록 가져오기 실패:', err);
      setError(`연결 실패: ${err.message}`);
      setModels([]);
    } finally {
      setIsLoading(false);
    }
  };

  // URL 변경시 자동으로 모델 목록 가져오기
  useEffect(() => {
    if (ollamaUrl) {
      const timeoutId = setTimeout(() => {
        fetchModels();
      }, 1500); // 1.5초 딜레이로 너무 빈번한 요청 방지

      return () => clearTimeout(timeoutId);
    } else {
      // URL이 비어있으면 초기화
      setModels([]);
      setError("");
    }
  }, [ollamaUrl]);

  const handleUrlChange = (value: string) => {
    setOllamaUrl(value);
    updateConfig("ollama_url", value);
    setSettingsUpdated(true);
  };

  const handleModelChange = (value: string) => {
    setOllamaModel(value);
    updateConfig("ollama_model", value);
    setSettingsUpdated(true);
  };

  const formatModelSize = (size: number) => {
    const gb = size / (1024 * 1024 * 1024);
    return gb >= 1 ? `${gb.toFixed(1)}GB` : `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  const description = <>{t("ollama_desc", "Ollama lets you get up and running with large language models locally. Download from")} <a href="https://ollama.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">{t("ollama.ai")}</a></>;

  return (
    <BasicPage
      title={t("Ollama") + " " + t("Settings")}
      description={description}
    >
      { config("chatbot_backend") !== "ollama" && (
        <NotUsingAlert>
          {t("not_using_alert", "You are not currently using {{name}} as your {{what}} backend. These settings will not be used.", {name: t("Ollama"), what: t("ChatBot")})}
        </NotUsingAlert>
      ) }
      <ul role="list" className="divide-y divide-gray-100 max-w-md">
        <li className="py-4">
          <FormRow label={t("API URL")}>
            <div className="space-y-2">
              <TextInput
                value={ollamaUrl}
                onChange={(event: React.ChangeEvent<any>) => handleUrlChange(event.target.value)}
              />
              <div className="text-xs text-gray-500">
                기본값: http://localhost:11434
              </div>
            </div>
          </FormRow>
        </li>
        
        <li className="py-4">
          <FormRow label={t("Model")}>
            <div className="space-y-3">
              {/* 모델 새로고침 버튼 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchModels}
                  disabled={isLoading || !ollamaUrl}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? '불러오는 중...' : '모델 목록 새로고침'}
                </button>
                {error && (
                  <span className="text-xs text-red-500">{error}</span>
                )}
              </div>

              {/* 모델 선택 드롭다운 */}
              {models.length > 0 ? (
                <select
                  value={ollamaModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">모델을 선택하세요</option>
                  {models.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name} ({formatModelSize(model.size)})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-500">
                  {isLoading ? '모델 목록을 불러오는 중...' : '사용 가능한 모델이 없습니다'}
                </div>
              )}

              {/* 직접 입력 옵션 */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">또는 직접 입력:</label>
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleModelChange(event.target.value)}
                  placeholder="llama3.2:latest"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-400 sm:text-sm sm:leading-6"
                />
              </div>

              {/* 현재 선택된 모델 정보 */}
              {ollamaModel && (
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <strong>현재 선택된 모델:</strong> {ollamaModel}
                </div>
              )}

              {/* 추천 모델 목록 */}
              <div className="text-xs text-gray-600">
                <strong>추천 모델:</strong>
                <ul className="mt-1 space-y-1 ml-2">
                  <li>• llama3.2:latest - 범용 대화 (3B, 빠름)</li>
                  <li>• llama3.1:8b - 고품질 대화 (8B, 보통)</li>
                  <li>• codellama:latest - 코딩 전문</li>
                  <li>• mistral:latest - 빠른 응답</li>
                  <li>• qwen2.5:latest - 다국어 지원</li>
                </ul>
              </div>
            </div>
          </FormRow>
        </li>

        {/* 연결 상태 표시 */}
        <li className="py-4">
          <div className="text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-medium">연결 상태:</span>
              {error ? (
                <span className="text-red-500">❌ 연결 실패</span>
              ) : models.length > 0 ? (
                <span className="text-green-500">✅ 연결됨 ({models.length}개 모델 발견)</span>
              ) : (
                <span className="text-gray-500">⏸️ 대기 중</span>
              )}
            </div>
            {models.length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                사용 가능한 모델: {models.map(m => m.name).join(', ')}
              </div>
            )}
          </div>
        </li>
      </ul>
    </BasicPage>
  );
}
