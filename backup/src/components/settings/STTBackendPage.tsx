import { useTranslation } from '@/utils/i18n-stubs';
import { Link } from './common';
import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { clsx } from 'clsx';
import { updateConfig, isLocalhost } from '@/utils/config';

interface STTProvider {
  id: string;
  name: string;
  description: string;
  configKey?: string;
  configLabel?: string;
}

// STT 제공자 목록 정의
const STTProviders: STTProvider[] = [
  { id: 'none', name: 'None', description: '음성 인식을 사용하지 않습니다.' },
  { id: 'whisper_browser', name: 'Whisper (Browser)', description: '브라우저에서 실행되는 Whisper 음성 인식' },
  { id: 'whisper_server', name: 'Whisper (OpenAI)', description: 'OpenAI API를 사용한 Whisper 음성 인식', configKey: 'whisper_openai_settings', configLabel: 'Whisper (OpenAI)' },
  { id: 'whispercpp', name: 'Whisper.cpp', description: '로컬에서 실행되는 Whisper.cpp', configKey: 'whispercpp_settings', configLabel: 'Whisper.cpp' }
];

export default function STTBackendPage({
  sttBackend,
  setSTTBackend,
  setSettingsUpdated,
  setPage,
  breadcrumbs,
  setBreadcrumbs,
}: {
  sttBackend: string;
  setSTTBackend: (value: string) => void;
  setSettingsUpdated: (value: boolean) => void;
  setPage: (value: string) => void;
  breadcrumbs: Link[];
  setBreadcrumbs: (value: Link[]) => void;
}) {
  const { t } = useTranslation();
  const isLocal = isLocalhost();

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">{t('settings.stt_backend')}</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>{t('settings.stt_backend_description')}</p>
        </div>
        <div className="mt-4">
          <div className="flex flex-col">
            <div className="md:w-full w-96">
              <div className="space-y-4">
                <RadioGroup value={sttBackend} onChange={(value) => {
                  setSTTBackend(value);
                  updateConfig('stt_backend', value);
                  setSettingsUpdated(true);
                }}>
                  <RadioGroup.Label className="sr-only">STT Backend</RadioGroup.Label>
                  <div className="-space-y-px rounded-md bg-white">
                    {STTProviders.map((provider, providerIdx) => (
                      <RadioGroup.Option
                        key={provider.id}
                        value={provider.id}
                        className={({ checked }) =>
                          clsx(
                            providerIdx === 0 ? 'rounded-tl-md rounded-tr-md' : '',
                            providerIdx === STTProviders.length - 1 ? 'rounded-bl-md rounded-br-md' : '',
                            checked ? 'z-10 border-indigo-200 bg-indigo-50' : 'border-gray-200',
                            'relative flex cursor-pointer border p-4 focus:outline-none'
                          )
                        }
                      >
                        {({ active, checked }) => (
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
                              {checked && sttBackend === provider.id && isLocal && provider.configKey && (
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
