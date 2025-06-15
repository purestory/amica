import { config } from '@/utils/config';
import { Telegraf } from 'telegraf';

// 더미 텔레그램 봇 인터페이스
class DummyTelegrafBot {
  telegram = {
    sendMessage: async (chatId: string, message: string) => {
      console.log('Dummy Telegram message sent to chat:', chatId, 'Message:', message);
      return { message_id: 123, chat: { id: chatId } };
    }
  };
}

class TelegramClient {
  private bot: Telegraf | DummyTelegrafBot;
  private isDummyClient: boolean = false;

  constructor() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN as string;

    if (!botToken) {
      console.warn('TELEGRAM_BOT_TOKEN is not defined in the environment variables. Using dummy client...');
      this.bot = new DummyTelegrafBot();
      this.isDummyClient = true;
      return;
    }

    try {
      // 텔레그램 봇 초기화
      this.bot = new Telegraf(botToken);
    } catch (error) {
      console.warn('Error initializing Telegram bot:', error);
      this.bot = new DummyTelegrafBot();
      this.isDummyClient = true;
    }
  }

  // 특정 채팅에 메시지를 보내는 메서드
  public async postMessage(content: string): Promise<void> {
    const chatId = process.env.TELEGRAM_CHAT_ID as string || 'default-chat-id';
    
    if (this.isDummyClient) {
      console.log('Using dummy Telegram client to post message:', content);
      await (this.bot as DummyTelegrafBot).telegram.sendMessage(chatId, content);
      return;
    }
    
    try {
      await (this.bot as Telegraf).telegram.sendMessage(chatId, content);
      console.log('Message posted successfully');
    } catch (error) {
      console.error('Error posting message to Telegram:', error);
    }
  }

  public getBotInstance(): Telegraf | DummyTelegrafBot {
    return this.bot;
  }
}

// 사용을 위한 TelegramClient 클래스 인스턴스 내보내기
export const telegramClientInstance = new TelegramClient();

