import type { SettingsConfig } from '../components/SettingsModal';

export class TranslationService {
  private settings: SettingsConfig;

  constructor(settings: SettingsConfig) {
    this.settings = settings;
  }

  updateSettings(settings: SettingsConfig) {
    this.settings = settings;
  }

  async translate(text: string): Promise<string> {
    if (!this.settings.apiKey) {
      throw new Error('请先配置 API Key');
    }

    if (!this.settings.apiEndpoint) {
      throw new Error('请先配置 API 端点');
    }

    try {
      const response = await fetch(this.settings.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `${this.settings.prompt}\n\n${text}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API 返回格式错误');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('翻译请求失败');
    }
  }
}