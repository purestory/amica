import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { loadVRMAnimation } from '../lib/loadVRMAnimation'
import { loadVRM } from '../lib/loadVRM'
import AnimationCachePanel from './AnimationCachePanel'
import LoadingOverlay from './LoadingOverlay'

const VRMViewer = () => {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!canvasRef.current) return

    let vrm = null
    let mixer = null
    let currentAction = null

    // 기본 Three.js 설정
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(20.0, window.innerWidth / window.innerHeight, 0.1, 20.0) // FOV 20도
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true,
      alpha: true
    })
    
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
    
    // 카메라 컨트롤 - 캐릭터를 중앙에 배치하도록 수정
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.screenSpacePanning = true
    controls.minDistance = 0.5
    controls.maxDistance = 4
    
    // VRM 로드 후 동적으로 설정하므로 초기 설정 제거

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
        
        if (!vrm) throw new Error('VRM 데이터를 찾을 수 없습니다')
        
        // VRM 씬에 추가
        scene.add(vrm.scene)
        
        // VRM 최적화
        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        
        // 캐릭터가 정면을 보도록 180도 회전
        vrm.scene.rotation.y = Math.PI
        
        // 월드 매트릭스 업데이트 후 바운딩 박스로 정확한 중심 계산
        vrm.scene.updateMatrixWorld(true)
        const box = new THREE.Box3().setFromObject(vrm.scene)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        // 캐릭터를 x, z 축의 중앙, y축은 바닥에 맞춤
        vrm.scene.position.set(-center.x, -box.min.y, -center.z)

        // 카메라 타겟을 상반신(가슴 높이)으로 설정
        const targetY = size.y * 0.75
        controls.target.set(0, targetY, 0)

        // 캐릭터 전신이 보이도록 카메라 거리를 동적 계산
        const dist = size.y / (2 * Math.tan(camera.fov * Math.PI / 180 / 2))
        camera.position.set(0, targetY, dist * 1.1) // 10% 여유 추가
        
        controls.update()

        console.log('캐릭터 크기 (size):', size)
        console.log('조정된 위치:', vrm.scene.position)
        console.log('새 컨트롤 타겟 Y:', targetY)
        console.log('계산된 카메라 거리:', dist * 1.1)
        
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
          
          vrm.update(deltaTime)
          
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

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <AnimationCachePanel />
      <LoadingOverlay loading={loading} error={error} />
    </div>
  )
}

export default VRMViewer 