import * as ort from "onnxruntime-web"
ort.env.wasm.wasmPaths = '/_next/static/chunks/'

import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useMicVAD } from "@ricky0123/vad-react"
import { IconButton } from "./iconButton";
import { useTranscriber } from "@/hooks/useTranscriber";
import { cleanTranscript, cleanFromPunctuation, cleanFromWakeWord } from "@/utils/stringProcessing";
import { hasOnScreenKeyboard } from "@/utils/hasOnScreenKeyboard";
import { AlertContext } from "@/features/alert/alertContext";
import { ChatContext } from "@/features/chat/chatContext";
import { openaiWhisper  } from "@/features/openaiWhisper/openaiWhisper";
import { whispercpp  } from "@/features/whispercpp/whispercpp";
import { config } from "@/utils/config";
import { WaveFile } from "wavefile";
import { AmicaLifeContext } from "@/features/amicaLife/amicaLifeContext";
import { AudioControlsContext } from "@/features/moshi/components/audioControlsContext";


export default function MessageInput({
  userMessage,
  setUserMessage,
  isChatProcessing,
  onChangeUserMessage,
}: {
  userMessage: string;
  setUserMessage: (message: string) => void;
  isChatProcessing: boolean;
  onChangeUserMessage: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}) {
  const transcriber = useTranscriber();
  const inputRef = useRef<HTMLInputElement>(null);
  const [whisperOpenAIOutput, setWhisperOpenAIOutput] = useState<any | null>(null);
  const [whisperCppOutput, setWhisperCppOutput] = useState<any | null>(null);
  const { chat: bot } = useContext(ChatContext);
  const { alert } = useContext(AlertContext);
  const { amicaLife } = useContext(AmicaLifeContext);
  const { audioControls: moshi } = useContext(AudioControlsContext);
  const [ moshiMuted, setMoshiMuted] = useState(moshi.isMuted());
  const [isBotAwake, setIsBotAwake] = useState(bot.isAwake());

  // VAD 초기화 - startOnLoad를 false로 설정하여 자동 시작 방지
  const vad = useMicVAD({
    startOnLoad: false,
    onSpeechStart: () => {
      console.debug('vad', 'on_speech_start');
      console.time('performance_speech');
    },
    onSpeechEnd: (audio: Float32Array) => {
      console.debug('vad', 'on_speech_end');
      console.timeEnd('performance_speech');
      console.time('performance_transcribe');
      (window as any).chatvrm_latency_tracker = {
        start: +Date.now(),
        active: true,
      };

      try {
        switch (config("stt_backend")) {
          case 'whisper_browser': {
            console.debug('whisper_browser attempt');
            // since VAD sample rate is same as whisper we do nothing here
            // both are 16000
            const audioCtx = new AudioContext();
            const buffer = audioCtx.createBuffer(1, audio.length, 16000);
            buffer.copyToChannel(audio, 0, 0);
            transcriber.start(buffer);
            break;
          }
          case 'whisper_openai': {
            console.debug('whisper_openai attempt');
            const wav = new WaveFile();
            wav.fromScratch(1, 16000, '32f', audio);
            const file = new File([wav.toBuffer()], "input.wav", { type: "audio/wav" });

            let prompt;
            // TODO load prompt if it exists

            (async () => {
              try {
                const transcript = await openaiWhisper(file, prompt);
                setWhisperOpenAIOutput(transcript);
              } catch (e: any) {
                console.error('whisper_openai error', e);
                alert.error('whisper_openai error', e.toString());
              }
            })();
            break;
          }
          case 'whispercpp': {
            console.debug('whispercpp attempt');
            const wav = new WaveFile();
            wav.fromScratch(1, 16000, '32f', audio);
            wav.toBitDepth('16');
            const file = new File([wav.toBuffer()], "input.wav", { type: "audio/wav" });

            let prompt;
            // TODO load prompt if it exists

            (async () => {
              try {
                const transcript = await whispercpp(file, prompt);
                setWhisperCppOutput(transcript);
              } catch (e: any) {
                console.error('whispercpp error', e);
                alert.error('whispercpp error', e.toString());
              }
            })();
            break;
          }
        }
      } catch (e: any) {
        console.error('stt_backend error', e);
        alert.error('STT backend error', e.toString());
      }
    },
  });

  // 에러 발생 시 한 번만 표시하고 재시도하지 않음
  useEffect(() => {
    if (vad.errored) {
      console.error('vad error', vad.errored);
    }
  }, [vad.errored]);

  const handleTranscriptionResult = useCallback((preprocessed: string) => {
    const cleanText = cleanTranscript(preprocessed);
    const wakeWordEnabled = config("wake_word_enabled") === 'true';
    const textStartsWithWakeWord = wakeWordEnabled && cleanFromPunctuation(cleanText).startsWith(cleanFromPunctuation(config("wake_word")));
    const text = wakeWordEnabled && textStartsWithWakeWord ? cleanFromWakeWord(cleanText, config("wake_word")) : cleanText;

    if (wakeWordEnabled) {
      // Text start with wake word
      if (textStartsWithWakeWord) {
        // Pause amicaLife and update bot's awake status when speaking
        if (config("amica_life_enabled") === "true") {
          amicaLife.pause();
        }
        bot.updateAwake();
        setIsBotAwake(true);
      // Case text doesn't start with wake word and not receive trigger message in amica life
      } else {
        if (config("amica_life_enabled") === "true" && amicaLife.triggerMessage !== true && !isBotAwake) {
          bot.updateAwake();
          setIsBotAwake(true);
        }
      }
    } else {
      // If wake word off, update bot's awake when speaking
      if (config("amica_life_enabled") === "true") {
        amicaLife.pause();
        if (!isBotAwake) {
          bot.updateAwake();
          setIsBotAwake(true);
        }
      }
    }

    if (text === "") {
      return;
    }

    if (config("autosend_from_mic") === 'true') {
      if (!wakeWordEnabled || isBotAwake) {
        bot.receiveMessageFromUser(text,false);
      } 
    } else {
      setUserMessage(text);
    }
    console.timeEnd('performance_transcribe');
  }, [amicaLife, bot, isBotAwake, setUserMessage]);

  // 입력 변경 핸들러 - 디바운스 기능 추가
  const [inputDebounceTimer, setInputDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChangeUserMessage(event);
    
    // 이전 타이머 취소
    if (inputDebounceTimer) {
      clearTimeout(inputDebounceTimer);
    }
    
    // 디바운스 적용 (300ms)
    const timer = setTimeout(() => {
      // Pause amicaLife and update bot's awake status when typing (only if not already awake)
      if (config("amica_life_enabled") === "true" && !isBotAwake) {
        amicaLife.pause();
        bot.updateAwake();
        setIsBotAwake(true);
      }
    }, 300);
    
    setInputDebounceTimer(timer);
  }, [amicaLife, bot, isBotAwake, inputDebounceTimer, onChangeUserMessage]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (inputDebounceTimer) {
        clearTimeout(inputDebounceTimer);
      }
    };
  }, [inputDebounceTimer]);

  // for whisper_browser
  useEffect(() => {
    if (transcriber.output && !transcriber.isBusy) {
      const output = transcriber.output?.text;
      handleTranscriptionResult(output);
    }
  }, [transcriber, handleTranscriptionResult]);

  // for whisper_openai
  useEffect(() => {
    if (whisperOpenAIOutput) {
      const output = whisperOpenAIOutput?.text;
      handleTranscriptionResult(output);
    }
  }, [whisperOpenAIOutput, handleTranscriptionResult]);

  // for whispercpp
  useEffect(() => {
    if (whisperCppOutput) {
      const output = whisperCppOutput?.text;
      handleTranscriptionResult(output);
    }
  }, [whisperCppOutput, handleTranscriptionResult]);

  // 메시지 전송 핸들러
  const clickedSendButton = useCallback(() => {
    bot.receiveMessageFromUser(userMessage, false);
    // only if we are using non-VAD mode should we focus on the input
    if (!vad.listening) {
      if (!hasOnScreenKeyboard()) {
        inputRef.current?.focus();
      }
    }
    setUserMessage("");
  }, [bot, userMessage, vad.listening, setUserMessage]);

  return (
    <div className="fixed bottom-2 z-20 w-full">
      <div className="mx-auto max-w-4xl p-2 backdrop-blur-lg border-0 rounded-lg">
        <div className="grid grid-flow-col grid-cols-[min-content_1fr_min-content] gap-[8px]">
          <div>
            <div className='flex flex-col justify-center items-center'>
              {config("chatbot_backend") === "moshi" ? (
                <IconButton
                iconName={!moshiMuted ? "24/PauseAlt" : "24/Microphone"}
                className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
                isProcessing={moshiMuted && moshi.getRecorder() != null}
                disabled={!moshi.getRecorder()}
                onClick={() => {
                  moshi.toggleMute();
                  setMoshiMuted(!moshiMuted);
                }}
              />
              ) : (
                <IconButton
                iconName={vad.listening ? "24/PauseAlt" : "24/Microphone"}
                className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
                isProcessing={vad.userSpeaking}
                disabled={config('stt_backend') === 'none' || vad.loading || Boolean(vad.errored)}
                onClick={vad.toggle}
              />
              )}
            </div>
          </div>

          <input
            type="text"
            ref={inputRef}
            placeholder={config("chatbot_backend") === "moshi" ? "Disabled in moshi chatbot" : "Write message here..."}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (hasOnScreenKeyboard()) {
                  inputRef.current?.blur();
                }

                e.preventDefault();
                if (userMessage.trim() !== "") {
                  clickedSendButton();
                }
              }
            }}
            className={`h-10 w-full rounded-lg px-3 text-sm transition-all duration-200 focus:ring-1 focus:ring-primary dark:bg-black/30 dark:text-white`}
            value={userMessage}
            disabled={
              isChatProcessing ||
              config("chatbot_backend") === "moshi"
            }
          />

          <div>
            <IconButton
              iconName={"24/Send"}
              className="bg-primary hover:bg-primary-hover active:bg-primary-press disabled:bg-primary-disabled"
              isProcessing={isChatProcessing}
              disabled={
                userMessage.trim() === "" ||
                isChatProcessing ||
                config("chatbot_backend") === "moshi"
              }
              onClick={clickedSendButton}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
