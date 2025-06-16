import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { loadVRMAnimation } from '../lib/loadVRMAnimation'
import { loadVRM } from '../lib/loadVRM'
import AnimationCachePanel from './AnimationCachePanel'
import VRMPositionController from './VRMPositionController'
import LoadingOverlay from './LoadingOverlay'

const VRMViewer = () => {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // 위치 및 회전 상태
  const [characterPosition, setCharacterPosition] = useState({ x: 0, y: 0, z: 0 })
  const [characterRotation, setCharacterRotation] = useState({ x: 0, y: Math.PI, z: 0 })
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 1.5, z: 3 })
  const [cameraTarget, setCameraTarget] = useState({ x: 0, y: 1.5, z: 0 })
  
  // Three.js 객체 참조
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const vrmRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    let vrm = null
    let mixer = null
    let currentAction = null

    // 기본 Three.js 설정
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(20.0, window.innerWidth / window.innerHeight, 0.1, 20.0)
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true,
      alpha: true
    })
    
    sceneRef.current = scene
    cameraRef.current = camera
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0x000000, 0)
    
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
        // VRM 모델 로드 (캐시 적용)
        const gltf = await loadVRM('/amica/vrm/AvatarSample_B.vrm')
        vrm = gltf.userData.vrm
        vrmRef.current = vrm
        
        if (!vrm) throw new Error('VRM 데이터를 찾을 수 없습니다')
        
        // VRM 씬에 추가
        scene.add(vrm.scene)
        
        // VRM 최적화
        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        
        // 초기 위치 계산 (이후 컨트롤러로 조절 가능)
        vrm.scene.updateMatrixWorld(true)
        const box = new THREE.Box3().setFromObject(vrm.scene)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        // 초기 캐릭터 위치 설정
        const initialPosition = { x: -center.x, y: -box.min.y, z: -center.z }
        setCharacterPosition(initialPosition)
        
        // 초기 카메라 설정
        const targetY = size.y * 0.75
        const dist = size.y / (2 * Math.tan(camera.fov * Math.PI / 180 / 2))
        setCameraPosition({ x: 0, y: targetY, z: dist * 1.1 })
        setCameraTarget({ x: 0, y: targetY, z: 0 })
        
        console.log('캐릭터 크기 (size):', size)
        console.log('초기 위치 설정 완료')
        
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
        
        // idle 애니메이션 로드 (필요할 때 캐싱)
        try {
          const idleAnimation = await loadVRMAnimation('/amica/animations/idle_loop.vrma')
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
      window.removeEventListener('resize', handleResize)
      if (mixer) {
        mixer.stopAllAction()
      }
      renderer.dispose()
    }
  }, [])

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

  // 리셋 함수
  const handleReset = () => {
    if (vrmRef.current) {
      // 초기 위치로 리셋
      vrmRef.current.scene.updateMatrixWorld(true)
      const box = new THREE.Box3().setFromObject(vrmRef.current.scene)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      
      const initialPosition = { x: -center.x, y: -box.min.y, z: -center.z }
      setCharacterPosition(initialPosition)
      setCharacterRotation({ x: 0, y: Math.PI, z: 0 })
      
      const targetY = size.y * 0.75
      const dist = size.y / (2 * Math.tan(cameraRef.current.fov * Math.PI / 180 / 2))
      setCameraPosition({ x: 0, y: targetY, z: dist * 1.1 })
      setCameraTarget({ x: 0, y: targetY, z: 0 })
      
      console.log('🔄 위치 리셋 완료')
    }
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      
      {/* 캐시 패널 (우측 상단) */}
      <AnimationCachePanel />
      
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