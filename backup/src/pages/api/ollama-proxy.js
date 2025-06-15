import { serverConfig } from '@/features/externalAPI/externalAPI';

export default async function handler(req, res) {
  const { method, body } = req;
  
  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // serverConfig에서 ollama_url 가져오기, 없으면 기본값 사용
    const ollamaUrl = serverConfig.ollama_url || 'http://localhost:11434';
    
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API responded with ${response.status}`);
    }
    
    // Stream response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }
    
    res.end();
  } catch (error) {
    console.error('Ollama proxy error:', error);
    res.status(500).json({ error: error.message });
  }
} 