const fs = require('fs').promises;
const path = require('path');

// 설정 파일 경로
const ENV_FILE = path.join(__dirname, '../../.env');

// 기본 위치 설정 (.env에서 읽어옴)
const getDefaultConfig = () => ({
  character: {
    position: {
      x: parseFloat(process.env.CHARACTER_POSITION_X) || 0.10,
      y: parseFloat(process.env.CHARACTER_POSITION_Y) || -0.20,
      z: parseFloat(process.env.CHARACTER_POSITION_Z) || -0.10
    },
    rotation: {
      x: parseFloat(process.env.CHARACTER_ROTATION_X) || 0,
      y: parseFloat(process.env.CHARACTER_ROTATION_Y) || 172,
      z: parseFloat(process.env.CHARACTER_ROTATION_Z) || 0
    }
  },
  camera: {
    position: {
      x: parseFloat(process.env.CAMERA_POSITION_X) || 0.00,
      y: parseFloat(process.env.CAMERA_POSITION_Y) || 1.40,
      z: parseFloat(process.env.CAMERA_POSITION_Z) || 1.60
    },
    target: {
      x: parseFloat(process.env.CAMERA_TARGET_X) || 0,
      y: parseFloat(process.env.CAMERA_TARGET_Y) || 1.20,
      z: parseFloat(process.env.CAMERA_TARGET_Z) || 0
    }
  },
  lastUpdated: new Date().toISOString()
});

// .env 파일에서 직접 설정 읽기 (최신값)
const readConfigFromEnv = async () => {
  try {
    const envContent = await fs.readFile(ENV_FILE, 'utf8');
    const envVars = {};
    
    // .env 파일 파싱
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=');
        }
      }
    });

    // 설정 객체 생성
    const config = {
      character: {
        position: {
          x: parseFloat(envVars.CHARACTER_POSITION_X) || 0.10,
          y: parseFloat(envVars.CHARACTER_POSITION_Y) || -0.20,
          z: parseFloat(envVars.CHARACTER_POSITION_Z) || -0.10
        },
        rotation: {
          x: parseFloat(envVars.CHARACTER_ROTATION_X) || 0,
          y: parseFloat(envVars.CHARACTER_ROTATION_Y) || 172,
          z: parseFloat(envVars.CHARACTER_ROTATION_Z) || 0
        }
      },
      camera: {
        position: {
          x: parseFloat(envVars.CAMERA_POSITION_X) || 0.00,
          y: parseFloat(envVars.CAMERA_POSITION_Y) || 1.40,
          z: parseFloat(envVars.CAMERA_POSITION_Z) || 1.60
        },
        target: {
          x: parseFloat(envVars.CAMERA_TARGET_X) || 0,
          y: parseFloat(envVars.CAMERA_TARGET_Y) || 1.20,
          z: parseFloat(envVars.CAMERA_TARGET_Z) || 0
        }
      },
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ .env 파일에서 최신 설정을 읽었습니다.');
    return config;
  } catch (error) {
    console.log('⚠️ .env 파일 읽기 실패, 기본값 사용:', error.message);
    return getDefaultConfig();
  }
};

// .env 파일 업데이트 (저장 시에만)
const updateEnvFile = async (config) => {
  try {
    // 현재 .env 파일 읽기
    let envContent = '';
    try {
      envContent = await fs.readFile(ENV_FILE, 'utf8');
    } catch (error) {
      console.log('.env 파일이 없어서 새로 생성합니다.');
    }

    // 새로운 설정값들
    const newValues = {
      'CHARACTER_POSITION_X': config.character.position.x.toString(),
      'CHARACTER_POSITION_Y': config.character.position.y.toString(),
      'CHARACTER_POSITION_Z': config.character.position.z.toString(),
      'CHARACTER_ROTATION_X': config.character.rotation.x.toString(),
      'CHARACTER_ROTATION_Y': config.character.rotation.y.toString(),
      'CHARACTER_ROTATION_Z': config.character.rotation.z.toString(),
      'CAMERA_POSITION_X': config.camera.position.x.toString(),
      'CAMERA_POSITION_Y': config.camera.position.y.toString(),
      'CAMERA_POSITION_Z': config.camera.position.z.toString(),
      'CAMERA_TARGET_X': config.camera.target.x.toString(),
      'CAMERA_TARGET_Y': config.camera.target.y.toString(),
      'CAMERA_TARGET_Z': config.camera.target.z.toString()
    };

    // 기존 .env 내용을 라인별로 분리
    let lines = envContent.split('\n');
    
    // 각 설정값 업데이트 또는 추가
    Object.entries(newValues).forEach(([key, value]) => {
      const lineIndex = lines.findIndex(line => line.startsWith(`${key}=`));
      const newLine = `${key}=${value}`;
      
      if (lineIndex !== -1) {
        // 기존 라인 업데이트
        lines[lineIndex] = newLine;
      } else {
        // 새 라인 추가
        lines.push(newLine);
      }
    });

    // 빈 라인 제거 및 정리
    lines = lines.filter(line => line.trim() !== '');
    
    // .env 파일에 쓰기
    await fs.writeFile(ENV_FILE, lines.join('\n') + '\n');
    console.log('✅ .env 파일이 업데이트되었습니다.');
    
    return true;
  } catch (error) {
    console.error('❌ .env 파일 업데이트 실패:', error);
    return false;
  }
};

// GET /api/position - 현재 위치 설정 조회 (.env에서 직접 읽기)
exports.getPosition = async (req, res) => {
  try {
    const config = await readConfigFromEnv();
    res.json({
      success: true,
      data: config,
      message: '위치 설정을 성공적으로 조회했습니다.'
    });
  } catch (error) {
    console.error('위치 설정 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '위치 설정 조회에 실패했습니다.'
    });
  }
};

// POST /api/position - 위치 설정 저장 (.env 파일에만 저장)
exports.savePosition = async (req, res) => {
  try {
    const { character, camera } = req.body;
    
    // 입력 데이터 검증
    if (!character || !camera) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'character와 camera 설정이 필요합니다.'
      });
    }
    
    const config = {
      character: {
        position: {
          x: parseFloat(character.position?.x) || 0,
          y: parseFloat(character.position?.y) || 0,
          z: parseFloat(character.position?.z) || 0
        },
        rotation: {
          x: parseFloat(character.rotation?.x) || 0,
          y: parseFloat(character.rotation?.y) || 0,
          z: parseFloat(character.rotation?.z) || 0
        }
      },
      camera: {
        position: {
          x: parseFloat(camera.position?.x) || 0,
          y: parseFloat(camera.position?.y) || 0,
          z: parseFloat(camera.position?.z) || 0
        },
        target: {
          x: parseFloat(camera.target?.x) || 0,
          y: parseFloat(camera.target?.y) || 0,
          z: parseFloat(camera.target?.z) || 0
        }
      }
    };
    
    const success = await updateEnvFile(config);
    
    if (success) {
      res.json({
        success: true,
        data: config,
        message: '위치 설정이 .env 파일에 성공적으로 저장되었습니다.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: '위치 설정 저장에 실패했습니다.'
      });
    }
  } catch (error) {
    console.error('위치 설정 저장 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '위치 설정 저장에 실패했습니다.'
    });
  }
};

// PUT /api/position/reset - 위치 설정 초기화
exports.resetPosition = async (req, res) => {
  try {
    const defaultConfig = getDefaultConfig();
    const success = await updateEnvFile(defaultConfig);
    
    if (success) {
      res.json({
        success: true,
        data: defaultConfig,
        message: '위치 설정이 기본값으로 초기화되었습니다.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: '위치 설정 초기화에 실패했습니다.'
      });
    }
  } catch (error) {
    console.error('위치 설정 초기화 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '위치 설정 초기화에 실패했습니다.'
    });
  }
};

// GET /api/position/default - 기본 위치 설정 조회
exports.getDefaultPosition = async (req, res) => {
  try {
    const defaultConfig = getDefaultConfig();
    res.json({
      success: true,
      data: defaultConfig,
      message: '기본 위치 설정을 성공적으로 조회했습니다.'
    });
  } catch (error) {
    console.error('기본 위치 설정 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: '기본 위치 설정 조회에 실패했습니다.'
    });
  }
}; 