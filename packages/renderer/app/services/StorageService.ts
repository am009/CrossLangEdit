import type { SettingsConfig, ApiConfig, PrefixConfig } from '../components/SettingsModal';

const STORAGE_KEY = 'crosslangedit-settings';

const defaultApiConfig: ApiConfig = {
  id: 'default-openai',
  name: 'OpenAI GPT',
  type: 'openai',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.3
};

const defaultPrefixConfig: PrefixConfig = {
  id: 'default-zh',
  prefix: '#zh:',
  name: '中文翻译',
  prompt: '请将以下文本翻译成英文，保持原意和语调：',
  apiConfigId: 'default-openai'
};

const defaultSettings: SettingsConfig = {
  enabled: true,
  copyTranslationOnly: false,
  closeOnBlur: false,
  apiConfigs: [defaultApiConfig],
  prefixConfigs: [defaultPrefixConfig],
  defaultApiConfigId: 'default-openai'
};

interface LegacySettingsConfig {
  apiEndpoint: string;
  apiKey: string;
  prompt: string;
  enabled: boolean;
}

function isLegacySettings(settings: any): settings is LegacySettingsConfig {
  return settings &&
    typeof settings.apiEndpoint === 'string' &&
    typeof settings.apiKey === 'string' &&
    typeof settings.prompt === 'string' &&
    typeof settings.enabled === 'boolean' &&
    !settings.apiConfigs;
}

function migrateLegacySettings(legacy: LegacySettingsConfig): SettingsConfig {
  const migratedApiConfig: ApiConfig = {
    id: 'migrated-legacy',
    name: 'Legacy API',
    type: 'openai',
    endpoint: legacy.apiEndpoint,
    apiKey: legacy.apiKey,
    model: 'gpt-3.5-turbo',
    temperature: 0.3
  };

  const migratedPrefixConfig: PrefixConfig = {
    id: 'migrated-zh',
    prefix: '#zh:',
    name: '中文翻译',
    prompt: legacy.prompt,
    apiConfigId: 'migrated-legacy'
  };

  return {
    enabled: legacy.enabled,
    apiConfigs: [migratedApiConfig],
    prefixConfigs: [migratedPrefixConfig],
    defaultApiConfigId: 'migrated-legacy'
  };
}

function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export class StorageService {
  static getSettings(): SettingsConfig {
    if (!isLocalStorageAvailable()) {
      return defaultSettings;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        if (isLegacySettings(parsed)) {
          const migrated = migrateLegacySettings(parsed);
          this.saveSettings(migrated);
          return migrated;
        }

        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return defaultSettings;
  }

  static saveSettings(settings: SettingsConfig): void {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available, settings will not be persisted');
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  static clearSettings(): void {
    if (!isLocalStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing settings:', error);
    }
  }
}