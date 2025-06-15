import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { loadVRMAnimation } from '../lib/loadVRMAnimation'
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
    
    // 카메라 컨트롤 - 원본 코드와 정확히 동일하게
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.screenSpacePanning = true
    controls.minDistance = 0.5
    controls.maxDistance = 4
    
    // 원본 코드와 동일한 초기 카메라 위치
    camera.position.set(0, 8.5, 3.5)
    controls.update()

    // 원본 코드의 resetCamera 메서드 구현
    const resetCamera = (vrm) => {
      const headNode = vrm.humanoid?.getNormalizedBoneNode("head")
      
      if (headNode) {
        const headPos = headNode.getWorldPosition(new THREE.Vector3())
        camera.position.set(camera.position.x, headPos.y, camera.position.z)
        controls.target.set(headPos.x, headPos.y, headPos.z)
        controls.update()
      }
    }

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
    const loadVRM = async () => {
      try {
        const loader = new GLTFLoader()
        loader.register((parser) => new VRMLoaderPlugin(parser))
        
        const gltf = await loader.loadAsync('/amica/vrm/AvatarSample_B.vrm')
        vrm = gltf.userData.vrm
        
        if (!vrm) throw new Error('VRM 데이터를 찾을 수 없습니다')
        
        // VRM 씬에 추가
        scene.add(vrm.scene)
        
        // VRM 최적화
        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        
        // 기본 설정
        vrm.scene.rotation.y = Math.PI
        
        // 팔 내리기
        const leftUpperArm = vrm.humanoid?.getNormalizedBoneNode('leftUpperArm')
        const rightUpperArm = vrm.humanoid?.getNormalizedBoneNode('rightUpperArm')
        if (leftUpperArm) leftUpperArm.rotation.z = 1.2
        if (rightUpperArm) rightUpperArm.rotation.z = -1.2
        
        // frustumCulled 설정
        vrm.scene.traverse((obj) => {
          if (obj.isMesh) obj.frustumCulled = false
        })

        // 카메라 조정
        resetCamera(vrm)

        // AnimationMixer 생성
        mixer = new THREE.AnimationMixer(vrm.scene)
        
        // idle 애니메이션 로드 (캐싱 적용)
        try {
          const idleAnimation = await loadVRMAnimation('/amica/animations/idle_loop.vrma')
          if (idleAnimation) {
            await loadAnimation(idleAnimation)
            console.log('Idle 애니메이션 로드 완료 (캐싱 적용)')
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
    
    loadVRM()
    
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
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <AnimationCachePanel />
      <LoadingOverlay loading={loading} error={error} />
    </div>
  )
}

export default VRMViewer 