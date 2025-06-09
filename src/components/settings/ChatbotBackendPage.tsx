import { useTranslation } from '@/utils/i18n-stubs';
import { Link } from './common';
import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { clsx } from 'clsx';
import { updateConfig, isLocalhost, config, defaultConfig, prefixed, loadRelatedSettings } from '@/utils/config';
import { useEffect, useState } from 'react';

interface ChatbotProvider {
  id: string;
  name: string;
  description: string;
  configKey?: string;
  configLabel?: string;
}

// 챗봇 백엔드 선택 페이지
export default function ChatbotBackendPage({
  chatbotBackend,
  setChatbotBackend,
  setSettingsUpdated,
  setPage,
  breadcrumbs,
  setBreadcrumbs,
}: {
  chatbotBackend: string;
  setChatbotBackend: (value: string) => void;
  setSettingsUpdated: (value: boolean) => void;
  setPage: (value: string) => void;
  breadcrumbs: Link[];
  setBreadcrumbs: (value: Link[]) => void;
}) {
  const { t } = useTranslation();
  const isLocal = isLocalhost();
  const [isLocallyStored, setIsLocallyStored] = useState<boolean>(false);

  // Chatbot 제공자 목록 정의
  const ChatbotProviders: ChatbotProvider[] = [
    { id: 'echo', name: 'Echo', description: t('settings.echo_description') },
    { id: 'chatgpt', name: 'ChatGPT', description: t('settings.chatgpt_description'), configKey: 'chatgpt_settings', configLabel: 'ChatGPT' },
    { id: 'ollama', name: 'Ollama', description: t('settings.ollama_description'), configKey: 'ollama_settings', configLabel: 'Ollama' },
    { id: 'openrouter', name: 'OpenRouter', description: t('settings.openrouter_description'), configKey: 'openrouter_settings', configLabel: 'OpenRouter' }
  ];

  // 유효한 백엔드 ID 목록
  const validBackendIds = ChatbotProviders.map(provider => provider.id);

  // 'openai'를 'chatgpt'로 매핑 (하위 호환성)
  useEffect(() => {
    // chatbotBackend가 'openai'인 경우 'chatgpt'로 변경
    if (chatbotBackend === 'openai') {
      console.log("[ChatbotBackendPage] 'openai' 백엔드를 'chatgpt'로 변환");
      setChatbotBackend('chatgpt');
      updateConfig('chatbot_backend', 'chatgpt');
      setSettingsUpdated(true);
    }
    // chatbotBackend가 유효하지 않은 값인 경우 'chatgpt'로 변경
    else if (!validBackendIds.includes(chatbotBackend)) {
      console.log(`[ChatbotBackendPage] 유효하지 않은 백엔드 '${chatbotBackend}'를 'chatgpt'로 변환`);
      setChatbotBackend('chatgpt');
      updateConfig('chatbot_backend', 'chatgpt');
      setSettingsUpdated(true);
    }
  }, [chatbotBackend]);

  // 디버깅 추가
  useEffect(() => {
    console.log("[ChatbotBackendPage] ======= DEBUG INFO START ========");
    console.log("[ChatbotBackendPage] Props chatbotBackend:", chatbotBackend);
    
    try {
      // 현재 config 값 확인
      const configValue = config("chatbot_backend");
      console.log("[ChatbotBackendPage] config('chatbot_backend'):", configValue);
      
      // 기본 config 값 확인
      const defaultValue = (defaultConfig as any).chatbot_backend;
      console.log("[ChatbotBackendPage] defaultConfig.chatbot_backend:", defaultValue);
      
      // localStorage에서 디버깅 정보 확인
      const serverConfig = localStorage.getItem("debug_serverConfig");
      if (serverConfig) {
        const serverConfigObj = JSON.parse(serverConfig);
        console.log("[ChatbotBackendPage] localStorage.debug_serverConfig:", serverConfigObj);
        if (serverConfigObj && serverConfigObj.chatbot_backend) {
          console.log("[ChatbotBackendPage] serverConfig.chatbot_backend:", serverConfigObj.chatbot_backend);
        }
      } else {
        console.log("[ChatbotBackendPage] localStorage.debug_serverConfig: 없음");
      }
      
      const initialConfig = localStorage.getItem("debug_initialConfig");
      if (initialConfig) {
        const initialConfigObj = JSON.parse(initialConfig);
        console.log("[ChatbotBackendPage] localStorage.debug_initialConfig:", initialConfigObj);
        if (initialConfigObj && initialConfigObj.chatbot_backend) {
          console.log("[ChatbotBackendPage] initialConfig.chatbot_backend:", initialConfigObj.chatbot_backend);
        }
      } else {
        console.log("[ChatbotBackendPage] localStorage.debug_initialConfig: 없음");
      }
      
      // 로컬 스토리지에 직접 저장된 값 확인
      const localValue = localStorage.getItem("chatvrm_chatbot_backend");
      console.log("[ChatbotBackendPage] localStorage.chatvrm_chatbot_backend:", localValue);
      setIsLocallyStored(localValue !== null);
    } catch (error) {
      console.error("[ChatbotBackendPage] 디버깅 정보 수집 중 오류:", error);
    }
    
    console.log("[ChatbotBackendPage] ======= DEBUG INFO END ========");
  }, [chatbotBackend]);

  // 로컬 스토리지 변경사항 확인 함수
  const checkLocalStorageState = (newValue: string) => {
    setTimeout(() => {
      // 비동기 처리 후 로컬 스토리지 값 확인
      const localStorageKey = prefixed("chatbot_backend");
      const localValue = localStorage.getItem(localStorageKey);
      console.log("[ChatbotBackendPage] !! 설정 변경 후 확인 !!");
      console.log(`localStorage.getItem('${localStorageKey}') = ${localValue}`);
      console.log(`업데이트된 값과 일치: ${localValue === newValue}`);
      
      // 내부 접속의 경우 로컬 스토리지에 저장되지 않음
      if (localValue === null && !isLocal) {
        console.log("[ChatbotBackendPage] 외부 접속이지만 로컬 스토리지에 값이 저장되지 않았습니다!");
      } else if (localValue === null && isLocal) {
        console.log("[ChatbotBackendPage] 내부 접속이므로 로컬 스토리지에 저장되지 않음");
      }
    }, 500);
  };

  // 관련 설정 로드 함수
  const loadBackendSettings = async (backendValue: string) => {
    try {
      console.log("[ChatbotBackendPage] 관련 설정 로드 시작:", backendValue);
      
      // 관련 설정 로드 (내부 접속이면 로컬에 저장하지 않음)
      const relatedSettings = await loadRelatedSettings('chatbot_backend', backendValue);
      
      if (Object.keys(relatedSettings).length > 0) {
        console.log("[ChatbotBackendPage] 로드된 관련 설정:", relatedSettings);
        console.log("[ChatbotBackendPage] 관련 설정은 필요시 updateConfig를 통해 업데이트됩니다");
      } else {
        console.log("[ChatbotBackendPage] 로드할 관련 설정이 없습니다.");
      }
    } catch (e) {
      console.error("[ChatbotBackendPage] 관련 설정 로드 오류:", e);
    }
  };

  // 현재 선택된 값 확인 및 유효하지 않은 경우 기본값 사용
  const selectedValue = validBackendIds.includes(chatbotBackend) ? chatbotBackend : 'chatgpt';

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">{t('settings.chatbot_backend')}</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>{t('settings.chatbot_backend_description')}</p>
        </div>
        
        {isLocallyStored && (
          <div className="mt-2 text-sm text-blue-600">
            이 설정은 로컬 스토리지에 저장되어 있습니다.
          </div>
        )}
        
        <div className="mt-4">
          <div className="flex flex-col">
            <div className="md:w-full w-96">
              <div className="space-y-4">
                <RadioGroup value={selectedValue} onChange={(value) => {
                  console.log("[ChatbotBackendPage] onChange 호출됨, 새 값:", value);
                  console.log("[ChatbotBackendPage] 이전 상태:", chatbotBackend);
                  
                  // 상태 업데이트
                  setChatbotBackend(value);
                  
                  console.log("[ChatbotBackendPage] updateConfig 호출 전");
                  
                  // 설정 업데이트
                  updateConfig('chatbot_backend', value);
                  
                  console.log("[ChatbotBackendPage] updateConfig 호출 후");
                  
                  // 관련 설정 로드
                  loadBackendSettings(value);
                  
                  // 설정 업데이트 상태 설정
                  setSettingsUpdated(true);
                  
                  // 로컬 스토리지 상태 확인
                  checkLocalStorageState(value);
                  
                  console.log("[ChatbotBackendPage] 백엔드 변경 완료:", value);
                }}>
                  <RadioGroup.Label className="sr-only">Chatbot Backend</RadioGroup.Label>
                  <div className="-space-y-px rounded-md bg-white">
                    {ChatbotProviders.map((provider, providerIdx) => (
                      <RadioGroup.Option
                        key={provider.id}
                        value={provider.id}
                        className={({ checked }) =>
                          clsx(
                            providerIdx === 0 ? 'rounded-tl-md rounded-tr-md' : '',
                            providerIdx === ChatbotProviders.length - 1 ? 'rounded-bl-md rounded-br-md' : '',
                            checked ? 'z-10 border-indigo-200 bg-indigo-50' : 'border-gray-200',
                            'relative flex cursor-pointer border p-4 focus:outline-none'
                          )
                        }
                      >
                        {({ active, checked }: { active: boolean, checked: boolean }) => (
                          <>
                            <span
                              className={clsx(
                                checked ? 'bg-indigo-600 border-transparent' : 'bg-white border-gray-300',
                                active ? 'ring-2 ring-offset-2 ring-indigo-600' : '',
                                'mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-full border flex items-center justify-center'
                              )}
                              aria-hidden="true"
                            >
                              <span className="rounded-full bg-white w-1.5 h-1.5" />
                            </span>
                            <span className="ml-3 flex flex-col">
                              <RadioGroup.Label
                                as="span"
                                className={clsx(
                                  checked ? 'text-indigo-900' : 'text-gray-900',
                                  'block text-sm font-medium'
                                )}
                              >
                                {provider.name}
                              </RadioGroup.Label>
                              <RadioGroup.Description
                                as="span"
                                className={clsx(
                                  checked ? 'text-indigo-700' : 'text-gray-500',
                                  'block text-sm'
                                )}
                              >
                                {provider.description || provider.name}
                              </RadioGroup.Description>
                              {checked && selectedValue === provider.id && isLocal && provider.configKey && (
                                <button
                                  type="button"
                                  className="mt-2 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                  onClick={() => {
                                    setPage(provider.configKey || '');
                                    setBreadcrumbs([...breadcrumbs, { key: provider.configKey || '', label: provider.configLabel || '' }]);
                                  }}
                                >
                                  Configure
                                  <CheckCircleIcon className="ml-1 h-5 w-5 text-green-500" aria-hidden="true" />
                                </button>
                              )}
                            </span>
                          </>
                        )}
                      </RadioGroup.Option>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
