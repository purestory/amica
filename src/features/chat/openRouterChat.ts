import { Message } from './messages';
import { config } from '@/utils/config';
import { serverConfig } from '@/features/externalAPI/externalAPI';

/**
 * Gets a streaming chat response from OpenRouter API.
 * OpenRouter provides an OpenAI-compatible API with access to multiple models.
 */
export async function getOpenRouterChatResponseStream(messages: Message[]): Promise<ReadableStream> {
  // 1. 로컬 스토리지에서 API 키 확인 시도
  let apiKey = config('openrouter_apikey');
  
  // 2. 로컬 스토리지에 없으면 서버 설정에서 직접 확인
  if (!apiKey && serverConfig && serverConfig.openrouter_apikey) {
    console.log('로컬 스토리지에 API 키 없음, 서버 설정에서 가져오기 시도');
    apiKey = serverConfig.openrouter_apikey;
  }
  
  // 3. 그래도 없으면 오류 발생
  if (!apiKey) {
    console.error('OpenRouter API 키가 필요합니다. 설정 메뉴에서 OpenRouter API 키를 설정해주세요.');
    throw new Error('OpenRouter API key is required');
  }

  // 서버 URL 및 모델 설정 확인 (마찬가지로 서버 설정에서 확인)
  let baseUrl = config('openrouter_url');
  if (!baseUrl && serverConfig && serverConfig.openrouter_url) {
    baseUrl = serverConfig.openrouter_url;
  }
  baseUrl = baseUrl ?? 'https://openrouter.ai/api/v1';
  
  let model = config('openrouter_model');
  if (!model && serverConfig && serverConfig.openrouter_model) {
    model = serverConfig.openrouter_model;
  }
  model = model ?? 'openai/gpt-3.5-turbo';
  
  const appUrl = 'https://amica.arbius.ai';

  console.log(`OpenRouter 호출: 모델=${model}, API 키 길이=${apiKey.length}`);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': appUrl,
      'X-Title': 'Amica Chat'
    },
    body: JSON.stringify({
      model,
      messages: messages.map(({ role, content }) => ({ role, content })),
      stream: true
    })
  });

  const reader = response.body?.getReader();
  if (!response.ok || !reader) {
    const error = await response.json();
    // Handle OpenRouter-specific error format
    if (error.error?.message) {
      throw new Error(`OpenRouter error: ${error.error.message}`);
    }
    throw new Error(`OpenRouter request failed with status ${response.status}`);
  }

  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      const decoder = new TextDecoder("utf-8");
      try {
        // sometimes the response is chunked, so we need to combine the chunks
        let combined = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const data = decoder.decode(value);
          const chunks = data
            .split("data:")
            .filter((val) => !!val && val.trim() !== "[DONE]");

          for (const chunk of chunks) {
            // skip comments
            if (chunk.length > 0 && chunk[0] === ":") {
              continue;
            }
            combined += chunk;

            try {
              const json = JSON.parse(combined);
              const messagePiece = json.choices[0].delta.content;
              combined = "";
              if (!!messagePiece) {
                controller.enqueue(messagePiece);
              }
            } catch (error) {
              console.error(error);
            }
          }
        }
      } catch (error) {
        console.error(error);
        controller.error(error);
      } finally {
        reader?.releaseLock();
        controller.close();
      }
    },
    async cancel() {
      await reader?.cancel();
      reader?.releaseLock();
    }
  });
  return stream;
}
