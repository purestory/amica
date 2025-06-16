import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { loadVRMAnimation } from '../lib/loadVRMAnimation'
import { loadVRM } from '../lib/loadVRM'
import AnimationCachePanel from './AnimationCachePanel'
import VRMPositionController from './VRMPositionController'
import SettingsPanel from './SettingsPanel'
import LoadingOverlay from './LoadingOverlay'
import { getPositionConfig } from '../utils/positionAPI'

const VRMViewer = () => {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  
  // 위치 및 회전 상태 - 기본값으로 초기화 (설정에서 덮어씀)
  const [characterPosition, setCharacterPosition] = useState({ x: 0.10, y: -0.20, z: -0.10 })
  const [characterRotation, setCharacterRotation] = useState({ x: 0, y: 172 * Math.PI / 180, z: 0 }) // 172도를 라디안으로
  const [cameraPosition, setCameraPosition] = useState({ x: 0.00, y: 1.40, z: 1.60 })
  const [cameraTarget, setCameraTarget] = useState({ x: 0, y: 1.20, z: 0 })
  
  // 설정 상태
  const [currentModel, setCurrentModel] = useState('AvatarSample_B.vrm')
  const [currentBackground, setCurrentBackground] = useState({
    type: 'color',
    color: '#000000',
    image: '',
    videoId: ''
  })
  
  // Three.js 객체 참조
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const controlsRef = useRef(null)
  const vrmRef = useRef(null)
  const mixerRef = useRef(null)
  const currentActionRef = useRef(null)

  // 초기 설정 로드
  useEffect(() => {
    const loadInitialSettings = async () => {
      try {
        // URL 파라미터에서 모델 확인 (페이지 새로고침 방식)
        const urlParams = new URLSearchParams(window.location.search)
        const urlModel = urlParams.get('model')
        
        const config = await getPositionConfig()
        
        // 위치 설정 적용
        if (config.character) {
          setCharacterPosition(config.character.position)
          // 백엔드에서 도 단위로 저장된 값을 라디안으로 변환
          setCharacterRotation({
            x: config.character.rotation.x * Math.PI / 180,
            y: config.character.rotation.y * Math.PI / 180,
            z: config.character.rotation.z * Math.PI / 180
          })
          
          // URL 파라미터 모델이 있으면 우선 사용, 없으면 설정값 사용
          if (urlModel) {
            setCurrentModel(urlModel)
            console.log('📄 URL 파라미터에서 모델 로드:', urlModel)
          } else if (config.character.model) {
            setCurrentModel(config.character.model)
          }
        }
        
        if (config.camera) {
          setCameraPosition(config.camera.position)
          setCameraTarget(config.camera.target)
        }
        
        if (config.background) {
          setCurrentBackground(config.background)
        }
        
        console.log('✅ 초기 설정 로드 완료:', config)
        setSettingsLoaded(true) // 설정 로드 완료 표시
      } catch (error) {
        console.warn('초기 설정 로드 실패, 기본값 사용:', error)
        setSettingsLoaded(true) // 실패해도 진행
      }
    }
    
    loadInitialSettings()
  }, [])

  useEffect(() => {
    if (!canvasRef.current || !settingsLoaded) return

    let vrm = null
    let mixer = null
    let currentAction = null

    console.log('🚀 새로운 WebGL 컨텍스트 초기화 시작')

    // 기본 Three.js 설정 (완전히 새로운 컨텍스트)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(20.0, window.innerWidth / window.innerHeight, 0.1, 20.0)
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance"
    })
    
    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x000000, 0) // 투명 배경
    
    // 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)
    
    // 카메라 컨트롤
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.screenSpacePanning = true
    controls.minDistance = 0.5
    controls.maxDistance = 8
    controlsRef.current = controls

    // 원본 코드의 loadAnimation 메서드 구현
    const loadAnimation = async (animation) => {
      if (!vrm || !mixer) {
        throw new Error("You have to load VRM first")
      }

      const clip = animation instanceof THREE.AnimationClip
        ? animation
        : animation.createAnimationClip(vrm)
      
      mixer.stopAllAction()
      currentAction = mixer.clipAction(clip)
      currentAction.loop = THREE.LoopRepeat
      currentAction.play()
    }
    
    // VRM 로드
    const loadVRMModel = async () => {
      try {
        // 기존 VRM 모델 완전 정리
        if (vrm) {
          console.log('🗑️ 기존 VRM 모델 정리 시작')
          
          // 애니메이션 먼저 정리
          if (mixer) {
            mixer.stopAllAction()
            mixer.uncacheRoot(vrm.scene)
          }
          
          // VRM 씬에서 제거
          scene.remove(vrm.scene)
          
          // 완전한 리소스 정리
          const texturesToDispose = new Set()
          const materialsToDispose = new Set()
          const geometriesToDispose = new Set()
          
          vrm.scene.traverse((child) => {
            if (child.isMesh) {
              // 지오메트리 수집
              if (child.geometry) {
                geometriesToDispose.add(child.geometry)
              }
              
              // 머티리얼과 텍스처 수집
              if (child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material]
                materials.forEach(material => {
                  materialsToDispose.add(material)
                  
                  // 모든 텍스처 타입 수집
                  Object.keys(material).forEach(key => {
                    const value = material[key]
                    if (value && value.isTexture && !value.isDisposed) {
                      texturesToDispose.add(value)
                    }
                  })
                })
              }
            }
          })
          
          // 안전하게 정리
          try {
            // 텍스처 정리 (WebGL 에러 방지)
            texturesToDispose.forEach(texture => {
              if (texture && !texture.isDisposed) {
                try {
                  texture.dispose()
                } catch (e) {
                  console.warn('텍스처 정리 에러 (무시됨):', e.message)
                }
              }
            })
            
            // 머티리얼 정리
            materialsToDispose.forEach(material => {
              if (material && !material.isDisposed) {
                try {
                  material.dispose()
                } catch (e) {
                  console.warn('머티리얼 정리 에러 (무시됨):', e.message)
                }
              }
            })
            
            // 지오메트리 정리
            geometriesToDispose.forEach(geometry => {
              if (geometry && !geometry.isDisposed) {
                try {
                  geometry.dispose()
                } catch (e) {
                  console.warn('지오메트리 정리 에러 (무시됨):', e.message)
                }
              }
            })
          } catch (disposeError) {
            console.warn('리소스 정리 중 에러 (무시됨):', disposeError.message)
          }
          
          // VRM 객체 정리
          if (vrm.dispose) {
            try {
              vrm.dispose()
            } catch (vrmDisposeError) {
              console.warn('VRM dispose 에러 (무시됨):', vrmDisposeError.message)
            }
          }
          
          vrm = null
          vrmRef.current = null
          console.log('🗑️ 기존 VRM 모델 완전 정리 완료')
        }
        
        // 기존 애니메이션 믹서 정리
        if (mixer) {
          mixer.stopAllAction()
          mixer = null
          mixerRef.current = null
        }
        
        // 렌더러 정리 (WebGL 컨텍스트 리셋)
        try {
          renderer.renderLists.dispose()
          renderer.info.memory.geometries = 0
          renderer.info.memory.textures = 0
        } catch (renderError) {
          console.warn('렌더러 정리 에러 (무시됨):', renderError.message)
        }
        
        // WebGL 가비지 컬렉션을 위한 지연
        await new Promise(resolve => setTimeout(resolve, 300))
        
        console.log('📥 새로운 VRM 모델 로딩 시작:', currentModel)
        
        // VRM 모델 로드 (캐시 적용)
        const gltf = await loadVRM(`/vrm/${currentModel}`)
        vrm = gltf.userData.vrm
        vrmRef.current = vrm
        
        if (!vrm) throw new Error('VRM 데이터를 찾을 수 없습니다')
        
        // WebGL 상태 안정화를 위한 추가 대기
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // VRM 씬에 추가
        scene.add(vrm.scene)
        
        // VRM 모델이 완전히 로드될 때까지 대기
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // WebGL 텍스처 강제 업로드 (에러 방지)
        renderer.compile(scene, camera)
        
        // VRM 최적화
        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        
        // 사용자 지정 위치로 설정
        vrm.scene.position.set(characterPosition.x, characterPosition.y, characterPosition.z)
        vrm.scene.rotation.set(characterRotation.x, characterRotation.y, characterRotation.z)
        
        // 카메라 초기 설정
        camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
        controls.target.set(cameraTarget.x, cameraTarget.y, cameraTarget.z)
        controls.update()
        
        console.log('✅ 사용자 지정 위치로 캐릭터 설정 완료')
        console.log('캐릭터 모델:', currentModel)
        console.log('캐릭터 위치:', characterPosition)
        console.log('캐릭터 회전:', { ...characterRotation, yDegrees: characterRotation.y * 180 / Math.PI })
        console.log('카메라 위치:', cameraPosition)
        console.log('카메라 타겟:', cameraTarget)
        
        // 팔 내리기
        const leftUpperArm = vrm.humanoid?.getNormalizedBoneNode('leftUpperArm')
        const rightUpperArm = vrm.humanoid?.getNormalizedBoneNode('rightUpperArm')
        if (leftUpperArm) leftUpperArm.rotation.z = 1.2
        if (rightUpperArm) rightUpperArm.rotation.z = -1.2
        
        // frustumCulled 설정
        vrm.scene.traverse((obj) => {
          if (obj.isMesh) obj.frustumCulled = false
        })

        // AnimationMixer 생성
        mixer = new THREE.AnimationMixer(vrm.scene)
        mixerRef.current = mixer
        
        // idle 애니메이션 로드 (필요할 때 캐싱)
        try {
          const idleAnimation = await loadVRMAnimation('/animations/idle_loop.vrma')
          if (idleAnimation) {
            await loadAnimation(idleAnimation)
            console.log('✅ Idle 애니메이션 로드 완료 (캐싱 적용)')
          }
        } catch (animError) {
          console.warn('Idle 애니메이션 로드 실패:', animError)
        }
        
        setLoading(false)
        
        // 애니메이션 루프
        const animate = () => {
          requestAnimationFrame(animate)
          
          const deltaTime = 0.016
          
          if (mixer) {
            mixer.update(deltaTime)
          }
          
          if (vrm) {
            vrm.update(deltaTime)
          }
          
          controls.update()
          renderer.render(scene, camera)
        }
        animate()
        
      } catch (err) {
        console.error('VRM 로딩 실패:', err)
        setError(err.message)
        setLoading(false)
      }
    }
    
    loadVRMModel()
    
    // 리사이즈 처리
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      console.log('🗑️ useEffect cleanup 시작')
      window.removeEventListener('resize', handleResize)
      
      // 애니메이션 정리
      if (mixer) {
        mixer.stopAllAction()
        mixer = null
      }
      
      // VRM 정리
      if (vrm) {
        scene.remove(vrm.scene)
        if (vrm.dispose) {
          try {
            vrm.dispose()
          } catch (e) {
            console.warn('VRM cleanup 에러 (무시됨):', e.message)
          }
        }
        vrm = null
      }
      
      // 렌더러 정리
      if (renderer) {
        try {
          renderer.renderLists.dispose()
          renderer.dispose()
          
          // WebGL 컨텍스트 강제 해제
          const gl = renderer.getContext()
          if (gl) {
            const loseContext = gl.getExtension('WEBGL_lose_context')
            if (loseContext) {
              loseContext.loseContext()
            }
          }
        } catch (e) {
          console.warn('렌더러 cleanup 에러 (무시됨):', e.message)
        }
      }
      
      console.log('🗑️ useEffect cleanup 완료')
    }
      }, [currentModel, settingsLoaded]) // currentModel 변경 시 재로드, 설정 로드 완료 후 실행

  // 배경 변경 처리 (DOM 기반으로 SettingsPanel에서 처리)
  useEffect(() => {
    console.log('🎨 배경 변경:', currentBackground)
  }, [currentBackground])

  // 캐릭터 위치 업데이트
  useEffect(() => {
    if (vrmRef.current) {
      vrmRef.current.scene.position.set(
        characterPosition.x,
        characterPosition.y,
        characterPosition.z
      )
    }
  }, [characterPosition])

  // 캐릭터 회전 업데이트
  useEffect(() => {
    if (vrmRef.current) {
      vrmRef.current.scene.rotation.set(
        characterRotation.x,
        characterRotation.y,
        characterRotation.z
      )
    }
  }, [characterRotation])

  // 카메라 위치 업데이트
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.set(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z
      )
    }
  }, [cameraPosition])

  // 카메라 타겟 업데이트
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(
        cameraTarget.x,
        cameraTarget.y,
        cameraTarget.z
      )
      controlsRef.current.update()
    }
  }, [cameraTarget])

  // 모델 변경 기능 제거됨 - 설정 저장 후 페이지 새로고침으로만 변경 가능

  // 배경 변경 핸들러
  const handleBackgroundChange = (background) => {
    console.log('🎨 배경 변경:', background)
    setCurrentBackground(background)
  }

  // 리셋 함수 - 사용자 지정 값으로 리셋
  const handleReset = () => {
    if (vrmRef.current) {
      // 사용자 지정 값으로 리셋
      setCharacterPosition({ x: 0.10, y: -0.20, z: -0.10 })
      setCharacterRotation({ x: 0, y: 172 * Math.PI / 180, z: 0 })
      setCameraPosition({ x: 0.00, y: 1.40, z: 1.60 })
      setCameraTarget({ x: 0, y: 1.20, z: 0 })
      
      console.log('🔄 사용자 지정 위치로 리셋 완료')
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      
      {/* 설정 패널 (좌측 상단) */}
      <SettingsPanel
        onBackgroundChange={handleBackgroundChange}
        currentModel={currentModel}
        currentBackground={currentBackground}
      />
      
      {/* 캐시 패널 (좌측 상단, 설정 패널 아래) */}
      <div style={{ position: 'fixed', top: '80px', left: '20px', zIndex: 999 }}>
        <AnimationCachePanel />
      </div>
      
      {/* 위치 조절 패널 (좌측 하단) */}
      <VRMPositionController
        position={characterPosition}
        setPosition={setCharacterPosition}
        rotation={characterRotation}
        setRotation={setCharacterRotation}
        cameraPosition={cameraPosition}
        setCameraPosition={setCameraPosition}
        cameraTarget={cameraTarget}
        setCameraTarget={setCameraTarget}
        onReset={handleReset}
      />
      
      <LoadingOverlay loading={loading} error={error} />
    </div>
  )
}

export default VRMViewer 