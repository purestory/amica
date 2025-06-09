import { useState, useEffect } from 'react';

export default function TestApi() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        
        console.log('API 요청 시작');
        const response = await fetch('/api/dataHandler/?type=config', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log('API 응답 받음:', response.status, response.statusText);
        console.log('응답 헤더:', JSON.stringify(Object.fromEntries([...response.headers])));
        
        if (!response.ok) {
          throw new Error(`API 오류: ${response.status} ${response.statusText}`);
        }
        
        // 응답 텍스트 확인
        const text = await response.text();
        setRawResponse(text);
        console.log('응답 텍스트:', text);
        
        // 텍스트가 있는 경우에만 JSON 파싱
        if (text && text.trim()) {
          const data = JSON.parse(text);
          setConfig(data);
          console.log('설정 데이터:', data);
        } else {
          setError('빈 응답을 받았습니다');
        }
      } catch (err) {
        console.error('API 호출 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    }
    
    fetchConfig();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>API 응답 테스트</h1>
      
      {loading ? (
        <p>로딩 중...</p>
      ) : error ? (
        <div style={{ color: 'red' }}>
          <h2>오류 발생</h2>
          <p>{error}</p>
          <h3>원본 응답</h3>
          <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
            {rawResponse || '응답 없음'}
          </pre>
        </div>
      ) : (
        <div>
          <h2>API 응답 성공</h2>
          
          <h3>원본 응답</h3>
          <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
            {rawResponse || '응답 없음'}
          </pre>
          
          <h3>파싱된 설정 데이터</h3>
          {config ? (
            <div>
              <p>
                <strong>설정 항목 수:</strong> {Object.keys(config).length}
              </p>
              <p>
                <strong>show_introduction 값:</strong> {config.show_introduction?.toString() || '(없음)'}
              </p>
              <p>
                <strong>chatbot_backend 값:</strong> {config.chatbot_backend?.toString() || '(없음)'}
              </p>
              <h4>모든 설정 데이터</h4>
              <pre style={{ background: '#f0f0f0', padding: '10px', maxHeight: '300px', overflow: 'auto' }}>
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          ) : (
            <p>파싱된 설정 데이터가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
} 