import type { SettingsConfig } from '../components/SettingsModal';

const STORAGE_KEY = 'crosslangedit-settings';

const defaultSettings: SettingsConfig = {
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  prompt: '请将以下文本翻译成英文，保持原意和语调：',
  enabled: true
};

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