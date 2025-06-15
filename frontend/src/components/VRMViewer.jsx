import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const VRMViewer = () => {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // 기본 Three.js 설정
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
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
    
    // 카메라 컨트롤
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1.3, 0)
    camera.position.set(0, 1.3, 1.5)
    controls.update()
    
    // VRM 로드
    const loadVRM = async () => {
      try {
        const loader = new GLTFLoader()
        loader.register((parser) => new VRMLoaderPlugin(parser))
        
        const gltf = await loader.loadAsync('/amica/vrm/AvatarSample_B.vrm')
        const vrm = gltf.userData.vrm
        
        if (!vrm) throw new Error('VRM 데이터를 찾을 수 없습니다')
        
        // VRM 씬에 추가
        scene.add(vrm.scene)
        
        // VRM 최적화
        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        
        // 모델 위치 조정
        vrm.scene.position.set(0, 0, 0)
        vrm.scene.rotation.y = Math.PI
        
        // 팔 내리기
        const leftUpperArm = vrm.humanoid?.getNormalizedBoneNode('leftUpperArm')
        const rightUpperArm = vrm.humanoid?.getNormalizedBoneNode('rightUpperArm')
        
        if (leftUpperArm) {
          leftUpperArm.rotation.z = 1.2 // 왼팔 내리기
        }
        if (rightUpperArm) {
          rightUpperArm.rotation.z = -1.2 // 오른팔 내리기
        }
        
        // frustumCulled 설정
        vrm.scene.traverse((obj) => {
          if (obj.isMesh) {
            obj.frustumCulled = false
          }
        })
        
        setLoading(false)
        
        // 애니메이션 루프
        const animate = () => {
          requestAnimationFrame(animate)
          
          const deltaTime = 0.016
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
      renderer.dispose()
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '18px'
        }}>
          VRM 로딩 중...
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'red',
          fontSize: '18px'
        }}>
          오류: {error}
        </div>
      )}
    </div>
  )
}

export default VRMViewer 