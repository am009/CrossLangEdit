import React, { useState, useEffect } from 'react';
import { TranslationModal } from '../components/TranslationModal';
import { SettingsModal, type SettingsConfig } from '../components/SettingsModal';
import { TranslationService } from '../services/TranslationService';
import { StorageService } from '../services/StorageService';

export const CrossLangEdit: React.FC = () => {
  const [settings, setSettings] = useState<SettingsConfig>(() => {
    if (typeof window === 'undefined') {
      return {
        enabled: true,
        apiConfigs: [{
          id: 'default-openai',
          name: 'OpenAI GPT',
          type: 'openai',
          endpoint: 'https://api.openai.com/v1/chat/completions',
          apiKey: '',
          model: 'gpt-3.5-turbo',
          temperature: 0.3
        }],
        prefixConfigs: [{
          id: 'default-zh',
          prefix: '#zh:',
          name: '中文翻译',
          prompt: '请将以下文本翻译成英文，保持原意和语调：',
          apiConfigId: 'default-openai'
        }],
        defaultApiConfigId: 'default-openai'
      };
    }
    return StorageService.getSettings();
  });
  const [translationService] = useState(() => new TranslationService(settings));
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentPrefix, setCurrentPrefix] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 确保组件在客户端渲染
  useEffect(() => {
    setIsClient(true);
    // 在客户端重新加载设置
    const clientSettings = StorageService.getSettings();
    setSettings(clientSettings);
  }, []);

  useEffect(() => {
    translationService.updateSettings(settings);
  }, [settings, translationService]);

  useEffect(() => {
    if (!isClient || !window.electronAPI?.clipboard) {
      if (isClient) {
        console.error('Electron API not available');
      }
      return;
    }

    const prefixes = settings.prefixConfigs.map(p => p.prefix);
    window.electronAPI.clipboard.updatePrefixes(prefixes);

    const unsubscribe = window.electronAPI.clipboard.onTextDetected((data) => {
      if (settings.enabled) {
        setCurrentText(data.originalText);
        setCurrentPrefix(data.prefix || '');
        setIsTranslationModalOpen(true);
      }
    });

    if (settings.enabled) {
      startMonitoring();
    }

    return () => {
      unsubscribe();
      stopMonitoring();
    };
  }, [settings.enabled, isClient]);

  const startMonitoring = async () => {
    if (!isClient || !window.electronAPI?.clipboard) return;

    try {
      await window.electronAPI.clipboard.startMonitoring();
      setIsMonitoring(true);
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const stopMonitoring = async () => {
    if (!isClient || !window.electronAPI?.clipboard) return;

    try {
      await window.electronAPI.clipboard.stopMonitoring();
      setIsMonitoring(false);
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    }
  };

  const handleTranslate = async (text: string): Promise<string> => {
    return await translationService.translate(text, currentPrefix);
  };

  const handleCopyResult = async (originalText: string, translatedText: string) => {
    if (!isClient || !window.electronAPI?.clipboard) return;

    const result = `${currentPrefix}${originalText}\n\n${translatedText}`;
    try {
      await window.electronAPI.clipboard.writeText(result);
    } catch (error) {
      console.error('Failed to write to clipboard:', error);
    }
  };

  const handleSettingsSave = (newSettings: SettingsConfig) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);

    if (window.electronAPI?.clipboard) {
      const prefixes = newSettings.prefixConfigs.map(p => p.prefix);
      window.electronAPI.clipboard.updatePrefixes(prefixes);
    }

    if (newSettings.enabled && !isMonitoring) {
      startMonitoring();
    } else if (!newSettings.enabled && isMonitoring) {
      stopMonitoring();
    }
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">CrossLangEdit</h1>
          <p className="text-gray-600 text-sm">
            跨语言编辑工具
          </p>
        </div>

        {!isClient ? (
          <div className="text-center py-8">
            <div className="text-gray-500">正在加载...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">剪切板监听状态:</span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isMonitoring ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className={`text-sm ${
                  isMonitoring ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isMonitoring ? '运行中' : '已停止'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={toggleMonitoring}
                className={`w-full py-3 px-4 rounded-md font-medium ${
                  isMonitoring
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isMonitoring ? '停止监听' : '开始监听'}
              </button>

              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="w-full py-3 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
              >
                设置
              </button>
            </div>

            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="font-medium text-gray-800 mb-2">使用说明:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 复制以配置的前缀开头的文本</li>
                <li>• 当前支持的前缀: {settings.prefixConfigs.map(p => p.prefix).join(', ')}</li>
                <li>• 系统会自动弹出翻译界面</li>
                <li>• 点击翻译按钮进行翻译</li>
                <li>• 按 Esc 或点击完成自动复制结果</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                API配置: {settings.apiConfigs.length}个 | 前缀配置: {settings.prefixConfigs.length}个
              </p>
            </div>
          </div>
        )}
      </div>

      {isClient && (
        <>
          <TranslationModal
            isOpen={isTranslationModalOpen}
            originalText={currentText}
            onClose={() => setIsTranslationModalOpen(false)}
            onTranslate={handleTranslate}
            onCopyResult={handleCopyResult}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />

          <SettingsModal
            isOpen={isSettingsModalOpen}
            settings={settings}
            onClose={() => setIsSettingsModalOpen(false)}
            onSave={handleSettingsSave}
          />
        </>
      )}
    </div>
  );
};