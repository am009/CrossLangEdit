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

  private buildOpenAIPayload(apiConfig: ApiConfig, text: string, prompt: string, stream = false) {
    const payload: any = {
      model: apiConfig.model,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\n${text}`
        }
      ],
      max_tokens: 1000,
      stream
    };

    if (apiConfig.temperature !== undefined) {
      payload.temperature = apiConfig.temperature;
    }

    return payload;
  }

  private buildOllamaPayload(apiConfig: ApiConfig, text: string, prompt: string, stream = false) {
    const payload: any = {
      model: apiConfig.model,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\n${text}`
        }
      ],
      stream
    };

    if (apiConfig.temperature !== undefined) {
      payload.options = {
        temperature: apiConfig.temperature
      };
    }

    return payload;
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

  private async *readStreamResponse(reader: ReadableStreamDefaultReader<Uint8Array>, apiType: string): AsyncGenerator<string, void, unknown> {
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              if (apiType === 'openai') {
                if (parsed.choices?.[0]?.delta?.content) {
                  yield parsed.choices[0].delta.content;
                }
              } else if (apiType === 'ollama') {
                if (parsed.message?.content) {
                  yield parsed.message.content;
                }
              }
            } catch (e) {
              console.error('Failed to parse stream chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async translateStream(
    text: string,
    onChunk: (chunk: string) => void,
    prefix?: string
  ): Promise<void> {
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
          payload = this.buildOpenAIPayload(apiConfig, text, prefixConfig.prompt, true);
          break;
        case 'ollama':
          payload = this.buildOllamaPayload(apiConfig, text, prefixConfig.prompt, true);
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

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      for await (const chunk of this.readStreamResponse(reader, apiConfig.type)) {
        onChunk(chunk);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('翻译请求失败');
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
          payload = this.buildOpenAIPayload(apiConfig, text, prefixConfig.prompt, false);
          break;
        case 'ollama':
          payload = this.buildOllamaPayload(apiConfig, text, prefixConfig.prompt, false);
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