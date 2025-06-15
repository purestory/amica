import { useTranslation } from '@/utils/i18n-stubs';
import { Link } from './common';
import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { clsx } from 'clsx';
import { updateConfig, isLocalhost, loadRelatedSettings, prefixed } from '@/utils/config';
import { useEffect, useState } from 'react';

interface TTSProvider {
  id: string;
  name: string;
  description: string;
  configKey?: string;
  configLabel?: string;
}

// TTS 제공자 목록 정의
const TTSProviders: TTSProvider[] = [
  { id: 'none', name: 'None', description: '음성 출력을 사용하지 않습니다.' },
  { id: 'edgetts', name: 'EdgeTTS', description: 'Microsoft Edge 음성 합성 서비스 (한국어 여성 음성)', configKey: 'edgetts_settings', configLabel: 'EdgeTTS' },
  { id: 'elevenlabs', name: 'ElevenLabs', description: '고품질 음성 합성 서비스', configKey: 'elevenlabs_settings', configLabel: 'ElevenLabs' },
  { id: 'openai_tts', name: 'OpenAI TTS', description: 'OpenAI의 음성 합성 서비스', configKey: 'openai_tts_settings', configLabel: 'OpenAI TTS' },
  { id: 'piper', name: 'Piper', description: '무료 TTS 모델', configKey: 'piper_settings', configLabel: 'Piper' },
  { id: 'kokoro', name: 'Kokoro', description: 'Kokoro TTS 서비스', configKey: 'kokoro_settings', configLabel: 'Kokoro' }
];

export default function TTSBackendPage({
  ttsBackend,
  setTTSBackend,
  setSettingsUpdated,
  setPage,
  breadcrumbs,
  setBreadcrumbs,
}: {
  ttsBackend: string;
  setTTSBackend: (value: string) => void;
  setSettingsUpdated: (value: boolean) => void;
  setPage: (value: string) => void;
  breadcrumbs: Link[];
  setBreadcrumbs: (value: Link[]) => void;
}) {
  const { t } = useTranslation();
  const isLocal = isLocalhost();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 관련 설정 로드 함수
  const loadTTSSettings = async (backendValue: string) => {
    try {
      console.log("[TTSBackendPage] 관련 설정 로드 시작:", backendValue);
      setIsLoading(true);
      
      // 관련 설정 로드 (내부 접속이면 로컬에 저장하지 않음)
      const relatedSettings = await loadRelatedSettings('tts_backend', backendValue);
      
      if (Object.keys(relatedSettings).length > 0) {
        console.log("[TTSBackendPage] 로드된 관련 설정:", relatedSettings);
        console.log("[TTSBackendPage] 관련 설정은 필요시 updateConfig를 통해 업데이트됩니다");
      } else {
        console.log("[TTSBackendPage] 로드할 관련 설정이 없습니다.");
      }
    } catch (e) {
      console.error("[TTSBackendPage] 관련 설정 로드 오류:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 초기 설정 로드
  useEffect(() => {
    if (ttsBackend) {
      loadTTSSettings(ttsBackend);
    }
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">{t('settings.tts_backend')}</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>{t('settings.tts_backend_description')}</p>
        </div>
        {isLoading && (
          <div className="mt-2 text-sm text-blue-600">
            관련 설정을 로드 중입니다...
          </div>
        )}
        <div className="mt-4">
          <div className="flex flex-col">
            <div className="md:w-full w-96">
              <div className="space-y-4">
                <RadioGroup value={ttsBackend} onChange={(value) => {
                  setTTSBackend(value);
                  updateConfig('tts_backend', value);
                  loadTTSSettings(value);
                  setSettingsUpdated(true);
                }}>
                  <RadioGroup.Label className="sr-only">TTS Backend</RadioGroup.Label>
                  <div className="-space-y-px rounded-md bg-white">
                    {TTSProviders.map((provider, providerIdx) => (
                      <RadioGroup.Option
                        key={provider.id}
                        value={provider.id}
                        className={({ checked }) =>
                          clsx(
                            providerIdx === 0 ? 'rounded-tl-md rounded-tr-md' : '',
                            providerIdx === TTSProviders.length - 1 ? 'rounded-bl-md rounded-br-md' : '',
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
                                {provider.description}
                              </RadioGroup.Description>
                              {checked && ttsBackend === provider.id && isLocal && provider.configKey && (
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
