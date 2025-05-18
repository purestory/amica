import { useTranslation } from 'react-i18next';
import { langs } from '@/i18n/langs';

interface Props {
  goBack: () => void;
}

export default function LanguagePage({ goBack }: Props) {
  const { t } = useTranslation();

  // 언어 변경을 비활성화하고 영어만 사용하도록 함
  return (
    <div className="mx-auto max-h-[calc(100vh-80px)] overflow-y-auto pb-12 no-scrollbar w-full">
      <div className="px-4 py-4 flex items-center border-b border-gray-200">
        <button 
          onClick={goBack} 
          className="mr-2 text-gray-500 hover:text-gray-700"
        >
          ←
        </button>
        <h1 className="text-lg font-medium">{t("Language")}</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow my-4 mx-2">
        <p className="px-4 py-2 text-neutral-400">
          {t("Language settings are disabled. Only English is available.")}
        </p>

        <div className="flex items-center px-4 py-2 border-t border-gray-100">
          <span className="flex-1 text-left">English</span>
          <span className="bg-blue-500 text-white px-2 py-1 text-xs rounded-full">
            {t("Active")}
          </span>
        </div>
      </div>
    </div>
  );
}
