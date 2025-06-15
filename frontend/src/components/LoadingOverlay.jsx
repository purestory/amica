import React from 'react'

const LoadingOverlay = ({ loading, error }) => {
  if (loading) {
    return (
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
    )
  }

  if (error) {
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'red',
        fontSize: '18px'
      }}>
        에러: {error}
      </div>
    )
  }

  return null
}

export default LoadingOverlay 