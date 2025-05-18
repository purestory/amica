import type { NextApiRequest, NextApiResponse } from "next";
import { handleConfig } from "@/features/externalAPI/externalAPI";
import { defaults } from "@/utils/config";
import fs from 'fs';
import path from 'path';

// 초기 설정 파일 읽기 함수
async function loadInitialConfig(): Promise<Record<string, string>> {
  try {
    const initialConfigPath = path.join(process.cwd(), 'userdata', 'initial_config.json');
    if (fs.existsSync(initialConfigPath)) {
      const configData = fs.readFileSync(initialConfigPath, 'utf8');
      const initialConfig = JSON.parse(configData);
      console.log('초기 설정 파일 로드 완료');
      return initialConfig;
    } else {
      console.warn('초기 설정 파일을 찾을 수 없습니다. 기본값 사용');
      return {};
    }
  } catch (error) {
    console.error('초기 설정 파일 로드 오류:', error);
    return {};
  }
}

// TTS 서버 테스트 함수
async function testTtsServer(url: string): Promise<boolean> {
  try {
    console.log(`TTS 서버 테스트 중: ${url}`);
    const testUrl = `${url}?text=test`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      cache: 'no-cache'
    });
    
    if (response.ok) {
      console.log('TTS 서버 연결 성공!');
      return true;
    } else {
      console.warn(`TTS 서버 응답 상태 코드: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('TTS 서버 연결 실패:', error);
    return false;
  }
}

// 캐릭터 설정 타입 정의
type CharacterSetting = {
  name: string;
  vrm_url: string;
  bg_url: string;
};

type CharacterMap = {
  [key: string]: CharacterSetting;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 초기 설정 파일 로드
    const initialConfig = await loadInitialConfig();
    
    // config에서 설정 가져오기
    const initialSettings: Record<string, string> = {};
    
    // 초기 설정 파일 값을 우선 사용하고, 없으면 defaults 사용
    Object.keys(defaults).forEach(key => {
      initialSettings[key] = initialConfig[key] ?? (defaults as any)[key];
    });
    
    // 캐릭터 설정들 
    const characterSettings: CharacterMap = {
      // 첫 번째 캐릭터 "Amica" - 기본 캐릭터
      amica: {
        name: initialConfig.name ?? defaults.name,
        vrm_url: "/vrm/AvatarSample_A.vrm",
        bg_url: initialConfig.bg_url ?? defaults.bg_url
      },
      // 두 번째 캐릭터 "Mirai" - AvatarSample_B 캐릭터
      mirai: {
        name: "Mirai",
        vrm_url: "/vrm/AvatarSample_B.vrm",
        bg_url: initialConfig.bg_url ?? defaults.bg_url
      },
      // 세 번째 캐릭터 "Sakura" - AvatarSample_C 캐릭터
      sakura: {
        name: "Sakura",
        vrm_url: "/vrm/AvatarSample_C.vrm",
        bg_url: initialConfig.bg_url ?? defaults.bg_url 
      },
      // 네 번째 캐릭터 "Hana" - AvatarSample_D 캐릭터
      hana: {
        name: "Hana",
        vrm_url: "/vrm/AvatarSample_D.vrm",
        bg_url: initialConfig.bg_url ?? defaults.bg_url 
      }
    };
    
    // 캐릭터 선택 확인
    const { character } = req.query;
    
    // 캐릭터 설정 적용
    if (character && typeof character === 'string' && characterSettings[character]) {
      const selectedCharacter = characterSettings[character];
      initialSettings.name = selectedCharacter.name;
      initialSettings.vrm_url = selectedCharacter.vrm_url;
      initialSettings.bg_url = selectedCharacter.bg_url;
      
      console.log(`캐릭터 '${selectedCharacter.name}' 설정이 적용되었습니다.`);
    }
    
    // TTS 서버 URL들
    const ttsServerUrls = [
      initialSettings.piper_url,
      process.env.NEXT_PUBLIC_TTS_BACKUP_URL_1 ?? "https://api-01.heyamica.com/tts",
      process.env.NEXT_PUBLIC_TTS_BACKUP_URL_2 ?? "http://localhost:5002/api/tts"
    ];
    
    // TTS 서버 연결 테스트
    let ttsServerUrl = initialSettings.piper_url;
    let ttsServerConnected = await testTtsServer(ttsServerUrl);
    
    // 기본 TTS 서버 연결 실패 시 백업 URL 시도
    if (!ttsServerConnected) {
      console.log("기본 TTS 서버 연결 실패, 백업 URL 시도 중...");
      
      for (const backupUrl of ttsServerUrls) {
        if (backupUrl === ttsServerUrl) continue; // 이미 시도한 URL 건너뛰기
        
        ttsServerConnected = await testTtsServer(backupUrl);
        if (ttsServerConnected) {
          console.log(`백업 TTS 서버 연결 성공: ${backupUrl}`);
          initialSettings.piper_url = backupUrl;
          break;
        }
      }
      
      if (!ttsServerConnected) {
        console.warn("모든 TTS 서버 연결 실패, 기본 URL 사용");
      }
    }
    
    // 서버 설정 초기화
    await handleConfig("update", initialSettings);
    
    res.status(200).json({ 
      success: true, 
      message: "서버 설정이 초기화되었습니다.",
      settings: initialSettings,
      ttsStatus: ttsServerConnected ? "connected" : "disconnected",
      availableCharacters: Object.keys(characterSettings)
    });
  } catch (error) {
    console.error("서버 설정 초기화 중 오류 발생:", error);
    res.status(500).json({ success: false, message: "서버 설정 초기화 중 오류가 발생했습니다." });
  }
} 