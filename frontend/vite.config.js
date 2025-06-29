import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

// 정적 자산 복사 플러그인
const copyAssetsPlugin = () => {
  return {
    name: 'copy-assets',
    writeBundle() {
      // animations 폴더 생성
      const animationsDir = resolve(__dirname, 'dist/animations')
      if (!existsSync(animationsDir)) {
        mkdirSync(animationsDir, { recursive: true })
      }
      
      // vrm 폴더 생성
      const vrmDir = resolve(__dirname, 'dist/vrm')
      if (!existsSync(vrmDir)) {
        mkdirSync(vrmDir, { recursive: true })
      }
      
      // 애니메이션 파일들 복사
      const backupAnimationsDir = resolve(__dirname, '../backup/public/animations')
      const animationFiles = [
        'dance.vrma', 'greeting.vrma', 'idle_loop.vrma', 'modelPose.vrma',
        'peaceSign.vrma', 'shoot.vrma', 'showFullBody.vrma', 'spin.vrma', 'squat.vrma'
      ]
      
      animationFiles.forEach(file => {
        try {
          copyFileSync(
            resolve(backupAnimationsDir, file),
            resolve(animationsDir, file)
          )
          console.log(`✅ 복사됨: ${file}`)
        } catch (err) {
          console.warn(`⚠️ 복사 실패: ${file}`, err.message)
        }
      })
      
      // VRM 파일들은 public 폴더에서 자동으로 복사됨
      console.log('✅ VRM 파일들은 public/vrm 폴더에서 자동으로 복사됩니다')
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyAssetsPlugin()],
  base: '/',
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}) 