import type { SettingsConfig, ApiConfig, PrefixConfig } from '../components/SettingsModal';

export class TranslationService {
  private settings: SettingsConfig;

  constructor(settings: SettingsConfig) {
    this.settings = settings;
  }

  updateSettings(settings: SettingsConfig) {
    this.settings = settings;
  }

  private getApiConfigForPrefix(prefix: string): { apiConfig: ApiConfig; prefixConfig: PrefixConfig } | null {
    const prefixConfig = this.settings.prefixConfigs.find(p => p.prefix === prefix);
    if (!prefixConfig) return null;

    const apiConfig = this.settings.apiConfigs.find(a => a.id === prefixConfig.apiConfigId);
    if (!apiConfig) return null;

    return { apiConfig, prefixConfig };
  }

  private buildOpenAIPayload(apiConfig: ApiConfig, text: string, prompt: string) {
    return {
      model: apiConfig.model,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\n${text}`
        }
      ],
      temperature: apiConfig.temperature,
      max_tokens: 1000
    };
  }

  private buildOllamaPayload(apiConfig: ApiConfig, text: string, prompt: string) {
    return {
      model: apiConfig.model,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\n${text}`
        }
      ],
      stream: false,
      options: {
        temperature: apiConfig.temperature
      }
    };
  }

  private buildHeaders(apiConfig: ApiConfig) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (apiConfig.type === 'openai' && apiConfig.apiKey) {
      headers['Authorization'] = `Bearer ${apiConfig.apiKey}`;
    }

    return headers;
  }

  private extractResponse(data: any, apiType: string): string {
    switch (apiType) {
      case 'openai':
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('OpenAI API 返回格式错误');
        }
        return data.choices[0].message.content.trim();

      case 'ollama':
        if (!data.message || !data.message.content) {
          throw new Error('Ollama API 返回格式错误');
        }
        return data.message.content.trim();

      default:
        throw new Error(`不支持的API类型: ${apiType}`);
    }
  }

  async translate(text: string, prefix?: string): Promise<string> {
    let apiConfig: ApiConfig;
    let prefixConfig: PrefixConfig;

    if (prefix) {
      const config = this.getApiConfigForPrefix(prefix);
      if (!config) {
        throw new Error(`未找到前缀 "${prefix}" 的配置`);
      }
      apiConfig = config.apiConfig;
      prefixConfig = config.prefixConfig;
    } else {
      if (!this.settings.defaultApiConfigId) {
        throw new Error('未设置默认 API 配置');
      }
      apiConfig = this.settings.apiConfigs.find(a => a.id === this.settings.defaultApiConfigId)!;
      prefixConfig = this.settings.prefixConfigs[0];
      if (!apiConfig) {
        throw new Error('默认 API 配置不存在');
      }
    }

    if (!apiConfig.endpoint) {
      throw new Error('请先配置 API 端点');
    }

    if (apiConfig.type === 'openai' && !apiConfig.apiKey) {
      throw new Error('请先配置 API Key');
    }

    try {
      let payload: any;
      switch (apiConfig.type) {
        case 'openai':
          payload = this.buildOpenAIPayload(apiConfig, text, prefixConfig.prompt);
          break;
        case 'ollama':
          payload = this.buildOllamaPayload(apiConfig, text, prefixConfig.prompt);
          break;
        default:
          throw new Error(`不支持的API类型: ${apiConfig.type}`);
      }

      const response = await fetch(apiConfig.endpoint, {
        method: 'POST',
        headers: this.buildHeaders(apiConfig),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.extractResponse(data, apiConfig.type);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('翻译请求失败');
    }
  }
}