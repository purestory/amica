import { config } from '@/utils/config';
import { TwitterApi, TwitterApiReadWrite, TwitterApiReadOnly, TweetV2PostTweetResult } from 'twitter-api-v2';

// 더미 클라이언트 생성을 위한 인터페이스
class DummyTwitterClient {
  // 더미 readWrite 클라이언트
  public readWrite = {
    v2: {
      tweet: async (content: string): Promise<any> => {
        console.log('Dummy tweet posted:', content);
        return { data: { id: 'dummy-tweet-id', text: content } };
      }
    }
  } as unknown as TwitterApiReadWrite;

  // 더미 readOnly 클라이언트
  public readOnly = {} as TwitterApiReadOnly;
}

class TwitterClient {
  private twitterClient: TwitterApiReadWrite;
  private twitterBearer: TwitterApiReadOnly;
  private isDummyClient: boolean = false;

  constructor() {
    const appKey = process.env.X_API_KEY as string;
    const appSecret = process.env.X_API_SECRET as string;
    const accessToken = process.env.X_ACCESS_TOKEN as string;
    const accessSecret = process.env.X_ACCESS_SECRET as string;
    const bearerToken = process.env.X_BEARER_TOKEN as string;

    // 필수 API 키가 없는 경우 더미 클라이언트 사용
    if (!appKey || !appSecret || !accessToken || !accessSecret || !bearerToken) {
      console.warn('Twitter API credentials are missing. Using dummy client...');
      const dummyClient = new DummyTwitterClient();
      this.twitterClient = dummyClient.readWrite;
      this.twitterBearer = dummyClient.readOnly;
      this.isDummyClient = true;
      return;
    }

    try {
      // 트위터 API 클라이언트 초기화
      const client = new TwitterApi({
        appKey,
        appSecret,
        accessToken,
        accessSecret,
      });

      // 읽기 전용 접근용 bearer 토큰 클라이언트 초기화
      const bearer = new TwitterApi(bearerToken);

      // 클라이언트 접근 모드 정의
      this.twitterClient = client.readWrite;
      this.twitterBearer = bearer.readOnly;
    } catch (error) {
      console.warn('Error initializing Twitter API client:', error);
      const dummyClient = new DummyTwitterClient();
      this.twitterClient = dummyClient.readWrite;
      this.twitterBearer = dummyClient.readOnly;
      this.isDummyClient = true;
    }
  }

  // 읽기-쓰기 클라이언트 제공 메서드
  public getReadWriteClient(): TwitterApiReadWrite {
    return this.twitterClient;
  }

  // 읽기 전용 클라이언트 제공 메서드
  public getReadOnlyClient(): TwitterApiReadOnly {
    return this.twitterBearer;
  }

  // 트윗 게시 함수
  public async postTweet(content: string): Promise<TweetV2PostTweetResult | undefined> {
    if (this.isDummyClient) {
      console.log('Using dummy client to post tweet:', content);
      return { data: { id: 'dummy-tweet-id', text: content } } as TweetV2PostTweetResult;
    }

    try {
      const response = await this.twitterClient.v2.tweet(content);
      return response;
    } catch (error) {
      console.error('Error posting tweet:', error);
      return;
    }
  }
}

// 사용을 위한 TwitterClient 클래스 인스턴스 내보내기
export const twitterClientInstance = new TwitterClient();
export const twitterReadWriteClient = twitterClientInstance.getReadWriteClient();
export const twitterReadOnlyClient = twitterClientInstance.getReadOnlyClient();
