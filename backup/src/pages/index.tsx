import {
  Fragment,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Menu, Transition } from '@headlessui/react'
import { clsx } from "clsx";
import { useTranslation, Trans } from '@/utils/i18n-stubs';
import {
  ChatBubbleLeftIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowDownIcon,
  CodeBracketSquareIcon,
  CubeIcon,
  CubeTransparentIcon,
  LanguageIcon,
  ShareIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  Squares2X2Icon,
  SquaresPlusIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  WrenchScrewdriverIcon,
  SignalIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { IconBrain } from '@tabler/icons-react';

import { MenuButton } from "@/components/menuButton";
import { AssistantText } from "@/components/assistantText";
import { SubconciousText } from "@/components/subconciousText";
import { AddToHomescreen } from "@/components/addToHomescreen";
import { Alert } from "@/components/alert";
import { UserText } from "@/components/userText";
import { ChatLog } from "@/components/chatLog";
import VrmViewer from "@/components/vrmViewer";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { Introduction } from "@/components/introduction";
import { ArbiusIntroduction } from "@/components/arbiusIntroduction";
import { LoadingProgress } from "@/components/loadingProgress";
import { DebugPane } from "@/components/debugPane";
import { Settings } from "@/components/settings";
import { EmbeddedWebcam } from "@/components/embeddedWebcam";
import { Moshi } from "@/features/moshi/components/Moshi";
import WasmCacheInitializer from "@/components/wasmCacheInitializer";
import FontCacheInitializer from "@/components/fontCacheInitializer";

import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { Message, Role } from "@/features/chat/messages";
import { ChatContext } from "@/features/chat/chatContext";
import { AlertContext } from "@/features/alert/alertContext";

import { config, updateConfig, prefixed, isLocalhost, initializeSettings } from '@/utils/config';
import { VrmStoreProvider } from "@/features/vrmStore/vrmStoreContext";
import { AmicaLifeContext } from "@/features/amicaLife/amicaLifeContext";
import { ChatModeText } from "@/components/chatModeText";

import { TimestampedPrompt } from "@/features/amicaLife/eventHandler";
import { handleChatLogs, handleConfig } from "@/features/externalAPI/externalAPI";
import { serverConfig } from "@/features/externalAPI/externalAPI";
import { VerticalSwitchBox } from "@/components/switchBox";
import { ThoughtText } from "@/components/thoughtText";
import { langs } from '@/utils/i18n-stubs';


// 로컬 폰트 변수 정의 (CSS 변수 사용)
const fontClasses = {
  mplus2: "font-mplus2",
  montserrat: "font-montserrat",
};

function detectVRHeadset() {
  const userAgent = navigator.userAgent.toLowerCase();

  // Meta Quest detection
  // Quest 2 and 3 both use "oculus" in their user agent
  const isQuest = userAgent.includes('oculus') ||
                  userAgent.includes('quest 2') ||
                  userAgent.includes('quest 3');

  // Vision Pro detection
  // visionOS is the specific identifier for Apple Vision Pro
  const isVisionPro = userAgent.includes('visionos') ||
                      userAgent.includes('xros');

  // Detailed device information
  let deviceInfo = {
    isVRDevice: isQuest || isVisionPro,
    deviceType: '',
    browserInfo: userAgent
  };

  if (isQuest) {
    deviceInfo.deviceType = 'quest-3';
    if (userAgent.includes('quest 3')) {
      deviceInfo.deviceType = 'quest-3';
    } else if (userAgent.includes('quest 2')) {
      deviceInfo.deviceType = 'quest-2';
    }
  } else if (isVisionPro) {
    deviceInfo.deviceType = 'vision-pro';
  }

  return deviceInfo;
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const currLang = i18n.resolvedLanguage;
  const { viewer } = useContext(ViewerContext);
  const { alert } = useContext(AlertContext);
  const { chat: bot } = useContext(ChatContext);
  const { amicaLife: amicaLife } = useContext(AmicaLifeContext);

  const [chatSpeaking, setChatSpeaking] = useState(false);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [thoughtMessage, setThoughtMessage] = useState("");
  const [shownMessage, setShownMessage] = useState<Role>("system");
  const [subconciousLogs, setSubconciousLogs] = useState<TimestampedPrompt[]>([]);

  // 클라이언트 렌더링 상태
  const [isMounted, setIsMounted] = useState(false);
  
  // 설정 로드 완료 상태
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(true);  // 즉시 콘텐츠 표시

  const [showArbiusIntroduction, setShowArbiusIntroduction] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showChatMode, setShowChatMode] = useState(false);
  const [showSubconciousText, setShowSubconciousText] = useState(false);
  const [showMoshi, setShowMoshi] = useState(false);

  // 로컬 스토리지에서 채팅 관련 상태 키 상수
  const CHAT_MODE_STORAGE_KEY = 'chatvrm_chat_mode_enabled';
  const CHAT_LOG_STORAGE_KEY = 'chatvrm_chat_log_visible';

  // null indicates havent loaded config yet
  const [muted, setMuted] = useState<boolean|null>(null);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const [showStreamWindow, setShowStreamWindow] = useState(false);
  const videoRef = useRef(null);

  const [isARSupported, setIsARSupported] = useState(false);
  const [isVRSupported, setIsVRSupported] = useState(false);

  const [isVRHeadset, setIsVRHeadset] = useState(false);

  // 클라이언트에서만 렌더링되도록 설정
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 가장 먼저 설정 초기화 실행
  useEffect(() => {
    if (!isMounted) return;
    
    console.log("설정 초기화 시작");
    
    async function init() {
      try {
        // 1. 설정 초기화
        await initializeSettings();
        console.log("설정 초기화 완료");
        
        // 2. welcome 메시지 강제로 false로 설정
        // forceSetIntroductionToFalse();
        console.log("welcome 메시지 비활성화 완료");
        
        // 3. 설정 로드 완료 표시
        setSettingsLoaded(true);
      } catch (error) {
        console.error("설정 초기화 오류:", error);
        // 오류가 있어도 진행
        setSettingsLoaded(true);
      }
    }
    
    init();
    
    // 설정 초기화 이벤트 리스너 추가
    const handleSettingsInitialized = () => {
      console.log("설정 초기화 이벤트 수신");
      setSettingsLoaded(true);
    };
    
    window.addEventListener('settings-initialized', handleSettingsInitialized);
    
    // 타임아웃 추가: 3초 후에 강제로 설정 로드 완료 처리
    const timeoutId = setTimeout(() => {
      console.log("설정 초기화 타임아웃, 강제로 로드 완료 처리");
      setSettingsLoaded(true);
    }, 3000);
    
    return () => {
      window.removeEventListener('settings-initialized', handleSettingsInitialized);
      clearTimeout(timeoutId);
    };
  }, [isMounted]);

  // 설정이 로드된 후에만 앱 초기화 진행
  useEffect(() => {
    if (settingsLoaded) {
      console.log("설정 로드 완료, 앱 초기화 시작");
      
      // TTS 음소거 상태 설정
      setMuted(config('tts_muted') === 'true');
      
      // Arbius 소개 상태 설정
      setShowArbiusIntroduction(config("show_arbius_introduction") === 'true');

      // 로컬 스토리지에서 채팅 관련 상태 불러오기
      if (typeof window !== 'undefined') {
        const savedChatMode = localStorage.getItem(CHAT_MODE_STORAGE_KEY);
        if (savedChatMode !== null) {
          setShowChatMode(savedChatMode === 'true');
        }
        
        const savedChatLog = localStorage.getItem(CHAT_LOG_STORAGE_KEY);
        if (savedChatLog !== null) {
          setShowChatLog(savedChatLog === 'true');
        }
      }

      // 배경색 설정
      if (config("bg_color") !== '') {
        document.body.style.backgroundColor = config("bg_color");
      } else {
        document.body.style.backgroundImage = `url(/amica${config("bg_url")})`;
      }
      
      // WebXR 지원 확인
      if (typeof window !== 'undefined' && window.navigator.xr && window.navigator.xr.isSessionSupported) {
        let deviceInfo = detectVRHeadset();
        setIsVRHeadset(deviceInfo.isVRDevice);

        window.navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
          setIsARSupported(supported);
        });
        window.navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
          setIsVRSupported(supported);
        });
      }
      
      // 콘텐츠 표시 활성화
      setShowContent(true);
      console.log("앱 초기화 완료, 콘텐츠 표시");

      // TTS 백엔드 설정 확인 (openai → openai_tts로 변환)
      if (config("tts_backend") === 'openai') {
        updateConfig("tts_backend", "openai_tts");
      }
    }
  }, [settingsLoaded]);

  useEffect(() => {
    amicaLife.checkSettingOff(!showSettings);
  }, [showSettings, amicaLife]);

  useEffect(() => {
    if (viewer && videoRef.current && showStreamWindow) {
      viewer.startStreaming(videoRef.current);
    } else {
      viewer.stopStreaming();
    }
  }, [viewer, videoRef, showStreamWindow]);

  function toggleTTSMute() {
    updateConfig('tts_muted', config('tts_muted') === 'true' ? 'false' : 'true')
    setMuted(config('tts_muted') === 'true')
  }

  const toggleState = (
    setFunc: React.Dispatch<React.SetStateAction<boolean>>, 
    deps: React.Dispatch<React.SetStateAction<boolean>>[],
  ) => {
    setFunc(prev => {
      if (!prev) {
        deps.forEach(dep => dep(false));
      } 
      return !prev;
    });
  };
  
  const toggleChatLog = () => {
    setShowChatLog(prev => {
      // 다른 상태 false로 설정
      setShowSubconciousText(false);
      setShowChatMode(false);
      
      // 새로운 상태 값
      const newState = !prev;
      
      // 로컬 스토리지에 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem(CHAT_LOG_STORAGE_KEY, String(newState));
        console.log('채팅 로그 상태 저장:', newState);
      }
      
      return newState;
    });
  };
  
  const toggleShowSubconciousText = () => {
    if (subconciousLogs.length !== 0) {
      toggleState(setShowSubconciousText, [setShowChatLog, setShowChatMode]);
    }
  };
  
  const toggleChatMode = () => {
    setShowChatMode(prev => {
      // 다른 상태 false로 설정
      setShowChatLog(false);
      setShowSubconciousText(false);
      
      // 새로운 상태 값
      const newState = !prev;
      
      // 로컬 스토리지에 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem(CHAT_MODE_STORAGE_KEY, String(newState));
        console.log('채팅 모드 상태 저장:', newState);
      }
      
      return newState;
    });
  };

  const toggleXR = async (immersiveType: XRSessionMode) => {
    console.log('Toggle XR', immersiveType);

    if (! window.navigator.xr) {
      console.error("WebXR not supported");
      return;
    }
    if (! await window.navigator.xr.isSessionSupported(immersiveType)) {
      console.error("Session not supported");
      return;
    }

    if (! viewer.isReady) {
      console.error("Viewer not ready");
      return;
    }

    // TODO should hand tracking be required?
    let optionalFeatures: string[] = [
      'hand-tracking',
      'local-floor',
    ];
    if (immersiveType === 'immersive-ar') {
      optionalFeatures.push('dom-overlay');
    }

    const sessionInit = {
      optionalFeatures,
      domOverlay: { root: document.body },
    };

    if (viewer.currentSession) {
      viewer.onSessionEnded();

      try {
        await viewer.currentSession.end();
      } catch (err) {
        // some times session already ended not due to user interaction
        console.warn(err);
      }

      // @ts-ignore
      if (window.navigator.xr.offerSession !== undefined) {
        // @ts-ignore
        const session = await navigator.xr?.offerSession(immersiveType, sessionInit);
        viewer.onSessionStarted(session, immersiveType);
      }
      return;
    }

    // @ts-ignore
    if (window.navigator.xr.offerSession !== undefined ) {
      // @ts-ignore
      const session = await navigator.xr?.offerSession(immersiveType, sessionInit);
      viewer.onSessionStarted(session, immersiveType);
      return;
    }

    try {
      const session = await window.navigator.xr.requestSession(immersiveType, sessionInit);

      viewer.onSessionStarted(session, immersiveType);
    } catch (err) {
      console.error(err);
    }

  }


  useEffect(() => {
    bot.initialize(
      amicaLife,
      viewer,
      alert,
      setChatLog,
      setUserMessage,
      setAssistantMessage,
      setThoughtMessage,
      setShownMessage,
      setChatProcessing,
      setChatSpeaking,
    );

    // 설정 로드 검증
    console.log("[Home] 앱 초기화 시 주요 설정 확인:");
    console.log(" - 챗봇 백엔드:", config("chatbot_backend"));
    console.log(" - TTS 백엔드:", config("tts_backend"));
    console.log(" - 비전 백엔드:", config("vision_backend"));
    
    // 설정이 로컬 스토리지에 있는지 확인
    if (typeof localStorage !== "undefined") {
      const localChatbotBackend = localStorage.getItem("chatvrm_chatbot_backend");
      console.log(" - 로컬 스토리지 챗봇 백엔드:", localChatbotBackend);
    }
    
    // TODO remove in future
    // this change was just to make naming cleaner
    if (config("tts_backend") === 'openai') {
      updateConfig("tts_backend", "openai_tts");
    }
  }, [bot, viewer]);

  useEffect(() => {
    amicaLife.initialize(
      viewer,
      bot,
      setSubconciousLogs,
      chatSpeaking,
    );
  }, [amicaLife, bot, viewer]);

  useEffect(() => {
    handleChatLogs(chatLog);
  }, [chatLog]);

  return (
    <div className={clsx(
      fontClasses.mplus2,
      fontClasses.montserrat,
    )}>
      {/* 클라이언트에서만 렌더링 */}
      {!isMounted ? (
        <div className="flex items-center justify-center h-screen bg-gray-800 text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Amica 로딩 중...</h1>
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      ) : (
        <>
          {showStreamWindow && 

          <div className="fixed top-1/3 right-4 w-[200px] h-[150px] z-0">
            <video
              ref={videoRef} 
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover rounded-lg shadow-lg outline outline-2 outline-red-500"
            />
          </div> }

          { config("youtube_videoid") !== '' && (
            <div className="fixed video-container w-full h-full z-0">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${config("youtube_videoid")}?&autoplay=1&mute=1&playsinline=1&loop=1&controls=0&disablekb=1&fs=0&playlist=${config("youtube_videoid")}`}
                frameBorder="0"></iframe>
            </div>
          )}

          <Introduction open={config("show_introduction") === 'true'} />
          <ArbiusIntroduction open={showArbiusIntroduction} close={() => setShowArbiusIntroduction(false)} />

          <LoadingProgress />

          { webcamEnabled && <EmbeddedWebcam setWebcamEnabled={setWebcamEnabled} /> }
          { showDebug && <DebugPane onClickClose={() => setShowDebug(false) }/> }
          { config("chatbot_backend") === "moshi" && <Moshi setAssistantText={setAssistantMessage}/>  }

          <VrmStoreProvider>
            <VrmViewer chatMode={showChatMode}/>
            {showSettings && (
              <Settings
                onClickClose={() => setShowSettings(false)}
              />
            )}
          </VrmStoreProvider>
          
          <MessageInputContainer isChatProcessing={chatProcessing} />

          {/* main menu */}
          <div className="absolute z-10 m-2">
            <div className="grid grid-flow-col gap-[8px] place-content-end mt-2 bg-slate-800/40 rounded-md backdrop-blur-md shadow-sm">
              <div className='flex flex-col justify-center items-center p-1 space-y-3'>
                <MenuButton
                  large={isVRHeadset}
                  icon={WrenchScrewdriverIcon}
                  onClick={() => setShowSettings(true)}
                  label="show settings"
                />

                {showChatLog ? (
                  <MenuButton
                    large={isVRHeadset}
                    icon={ChatBubbleLeftIcon}
                    onClick={toggleChatLog}
                    label="hide chat log"
                  />
                ) : (
                  <MenuButton
                    large={isVRHeadset}
                    icon={ChatBubbleLeftRightIcon}
                    onClick={toggleChatLog}
                    label="show chat log"
                  />
                )}

                { muted ? (
                  <MenuButton
                    large={isVRHeadset}
                    icon={SpeakerXMarkIcon}
                    onClick={toggleTTSMute}
                    label="unmute"
                  />
                ) : (
                  <MenuButton
                    large={isVRHeadset}
                    icon={SpeakerWaveIcon}
                    onClick={toggleTTSMute}
                    label="mute"
                  />
                )}

                {/* 외부 접속시에는 아래 버튼들을 숨김 */}
                {isLocalhost() && (
                  <>
                    { webcamEnabled ? (
                      <MenuButton
                        large={isVRHeadset}
                        icon={VideoCameraIcon}
                        onClick={() => setWebcamEnabled(false)}
                        label="disable webcam"
                      />
                    ) : (
                      <MenuButton
                        large={isVRHeadset}
                        icon={VideoCameraSlashIcon}
                        onClick={() => setWebcamEnabled(true)}
                        label="enable webcam"
                      />
                    )}

                    <MenuButton
                      large={isVRHeadset}
                      icon={ShareIcon}
                      href="/share"
                      target="_blank"
                      label="share"
                    />
                    <MenuButton
                      large={isVRHeadset}
                      icon={CloudArrowDownIcon}
                      href="/import"
                      label="import"
                    />

                    { showSubconciousText ? (
                      <MenuButton
                        large={isVRHeadset}
                        icon={IconBrain}
                        onClick={toggleShowSubconciousText}
                        label="hide subconscious"
                      />
                    ) : (
                      <MenuButton
                        large={isVRHeadset}
                        icon={IconBrain}
                        onClick={toggleShowSubconciousText}
                        label="show subconscious"
                      />
                    )}

                    <MenuButton
                      large={isVRHeadset}
                      icon={CodeBracketSquareIcon}
                      onClick={() => setShowDebug(true)}
                      label="debug"
                    />

                    <div className="flex flex-row items-center space-x-2">
                        <VerticalSwitchBox
                          value={showChatMode}
                          label={""}
                          onChange={toggleChatMode}
                        />
                    </div>

                    <div className="flex flex-row items-center space-x-2">
                      { showStreamWindow ? (
                        <SignalIcon
                          className="h-7 w-7 text-white opacity-100 hover:opacity-50 active:opacity-100 hover:cursor-pointer"
                          aria-hidden="true"
                          onClick={() => setShowStreamWindow(false)}
                        />
                      ) : (
                        <SignalIcon
                          className="h-7 w-7 text-white opacity-50 hover:opacity-100 active:opacity-100 hover:cursor-pointer"
                          aria-hidden="true"
                          onClick={() => setShowStreamWindow(true)}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>    
          </div>

          {showChatLog && <ChatLog messages={chatLog} />}

          {/* Normal chat text */}
          {!showSubconciousText && ! showChatLog && ! showChatMode && (
            <>
              { shownMessage === 'assistant' && (
                <AssistantText message={assistantMessage} />
              )}
              { shownMessage === 'user' && (
                <UserText message={userMessage} />
              )}
            </>
          )}

          {/* Thought text */}
          {thoughtMessage !== "" && <ThoughtText message={thoughtMessage}/>}

          {/* Chat mode text */}
          {showChatMode && <ChatModeText messages={chatLog}/>}

          {/* Subconcious stored prompt text */}
          {showSubconciousText && <SubconciousText messages={subconciousLogs}/>}

          <WasmCacheInitializer />
          <FontCacheInitializer />
          
          <AddToHomescreen />

          <Alert />
        </>
      )}
    </div>
  );
}