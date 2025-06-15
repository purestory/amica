# VRM T-pose 문제 해결 과정 및 원인 분석

## 📋 문제 개요

**증상**: VRM 캐릭터가 T-pose(팔을 양옆으로 벌린 기본 포즈)로 고정되어 자연스러운 포즈로 변경되지 않는 문제

**목표**: 원본 Amica 프로젝트처럼 자연스러운 포즈(팔이 내려온 상태)와 미세한 호흡 애니메이션 구현

## 🔍 시도했던 해결 방법들과 실패 원인

### 1. 애니메이션 파일 로드 시도 (실패)
```javascript
// 시도한 방법
const animation = await loadVRMAnimation('/amica/animations/idle_loop.vrma')
```

**실패 원인**: 
- PropertyBinding 에러 발생 ("No target node found for track")
- VRM 본 구조와 애니메이션 파일의 본 이름 불일치
- root.position, root.quaternion, torso_1-7.quaternion 등의 트랙을 찾을 수 없음

### 2. 수동 포즈 조정 시도 (실패)
```javascript
// 시도한 방법
const leftUpperArm = humanoid.getNormalizedBoneNode('leftUpperArm')
leftUpperArm.rotation.set(0, 0, 1.3)
```

**실패 원인**:
- VRM.update()가 매 프레임마다 포즈를 초기화
- 포즈 조정 후 VRM.update() 호출 시 T-pose로 되돌아감
- 매 프레임마다 포즈를 재적용해도 시각적 변화 없음

### 3. VRM 업데이트 비활성화 시도 (실패)
```javascript
// 시도한 방법
// vrm.update(deltaTime)  // 완전히 비활성화
```

**실패 원인**:
- VRM 업데이트를 비활성화하면 다른 기능들도 작동하지 않음
- 표정, 시선 처리 등이 모두 중단됨

## ✅ 최종 해결 방법

### 핵심 발견: 원본 코드 분석
원본 `backup/src/features/proceduralAnimation/proceduralAnimation.ts` 분석 결과:

1. **ProceduralAnimation 클래스 사용**
2. **VRM.update() 후에 ProceduralAnimation.update() 호출**
3. **매 프레임마다 본 회전값 재설정**
4. **elapsedTime 기반 미세한 애니메이션**

### 해결 코드 구조

```javascript
// 1. ProceduralAnimation 클래스 정의 (컴포넌트 외부)
class ProceduralAnimation {
  constructor(vrm) {
    this.vrm = vrm
    this.elapsedTime = 0
  }

  update(delta) {
    this.elapsedTime += delta
    const humanoid = this.vrm.humanoid
    const pi = Math.PI
    const sin = Math.sin

    // 원본과 동일한 값들
    humanoid.getNormalizedBoneNode("spine").rotation.x = 
      -0.2 - 0.04 * pi * sin(this.elapsedTime)
    humanoid.getNormalizedBoneNode("leftUpperArm").rotation.z = 1.3
    humanoid.getNormalizedBoneNode("rightUpperArm").rotation.z = -1.3
    // ... 기타 본들
  }
}

// 2. 애니메이션 루프에서 올바른 순서로 호출
const animate = () => {
  if (window.proceduralAnimation) {
    // 1단계: VRM 업데이트
    window.proceduralAnimation.vrm.update(deltaTime)
    // 2단계: ProceduralAnimation 업데이트 (포즈 재설정)
    window.proceduralAnimation.update(deltaTime)
  }
}
```

## 🚨 주요 실패 원인들

### 1. React 클로저 문제
```javascript
// 문제가 있던 코드
const animate = () => {
  if (vrm) {  // ❌ React state가 클로저에 갇혀 업데이트되지 않음
    vrm.update(deltaTime)
  }
}
```

**해결**: `window.proceduralAnimation`을 통한 전역 접근

### 2. 업데이트 순서 문제
```javascript
// 잘못된 순서
proceduralAnimation.update(deltaTime)  // 먼저 포즈 설정
vrm.update(deltaTime)                  // 포즈가 다시 초기화됨

// 올바른 순서
vrm.update(deltaTime)                  // VRM 시스템 업데이트
proceduralAnimation.update(deltaTime)  // 포즈 재설정
```

### 3. 클래스 스코프 문제
- ProceduralAnimation 클래스를 React 컴포넌트 내부에 정의
- 애니메이션 루프에서 클래스에 접근할 수 없음
- **해결**: 클래스를 컴포넌트 외부로 이동

### 4. 빌드/캐시 문제
- 코드 수정 후 `npm run build` 없이 테스트
- 브라우저 캐시로 인한 이전 코드 실행
- **해결**: 매번 빌드 후 강제 새로고침

## 📊 성능 최적화

### 로그 출력 최적화
```javascript
// 매 프레임마다 로그 출력 방지
if (this.elapsedTime < 0.1) {
  console.log('✅ ProceduralAnimation 업데이트 중:', {
    elapsedTime: this.elapsedTime,
    leftUpperArm: leftUpperArm?.rotation.z,
    rightUpperArm: rightUpperArm?.rotation.z
  })
}
```

### Null 체크 추가
```javascript
const leftUpperArm = humanoid.getNormalizedBoneNode("leftUpperArm")
if (leftUpperArm) {
  leftUpperArm.rotation.z = 1.3
}
```

## 🎯 최종 작동 원리

1. **VRM 로드 시**: ProceduralAnimation 인스턴스 생성
2. **매 프레임마다**:
   - VRM 시스템 업데이트 (표정, 물리 등)
   - ProceduralAnimation 업데이트 (포즈 재설정)
3. **결과**: T-pose 방지 + 자연스러운 포즈 + 미세한 호흡 애니메이션

## 🔧 디버깅 팁

### 1. ProceduralAnimation 상태 확인
```javascript
console.log('window.proceduralAnimation:', window.proceduralAnimation)
console.log('elapsedTime:', window.proceduralAnimation?.elapsedTime)
```

### 2. 수동 업데이트 테스트
```javascript
window.proceduralAnimation.update(0.016)
```

### 3. 본 회전값 확인
```javascript
const leftArm = window.proceduralAnimation.vrm.humanoid.getNormalizedBoneNode("leftUpperArm")
console.log('Left arm rotation:', leftArm.rotation.z)
```

## 📝 교훈

1. **원본 코드 분석의 중요성**: 추측보다는 실제 작동하는 코드 분석
2. **React 클로저 주의**: 애니메이션 루프에서 state 접근 시 주의
3. **업데이트 순서 중요**: VRM 시스템과 커스텀 애니메이션의 실행 순서
4. **빌드 프로세스 확인**: 정적 파일 서빙 시 빌드 필수
5. **단계별 디버깅**: 복잡한 문제를 작은 단위로 나누어 해결

## 🚀 최종 결과

- ✅ T-pose 문제 완전 해결
- ✅ 자연스러운 팔 포즈 (1.3, -1.3 라디안)
- ✅ 미세한 호흡 애니메이션 (척추, 목, 다리)
- ✅ 원본 프로젝트와 동일한 동작
- ✅ 60fps 부드러운 애니메이션

**최종 성공 로그**:
```
🎯 ProceduralAnimation 인스턴스 생성
✅ ProceduralAnimation 설정 완료!
✅ ProceduralAnimation 업데이트 중: {elapsedTime: 0.016, leftUpperArm: 1.3, rightUpperArm: -1.3}
``` 