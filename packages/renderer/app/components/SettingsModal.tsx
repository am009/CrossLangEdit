import React, { useState, useEffect } from 'react';

export interface SettingsConfig {
  apiEndpoint: string;
  apiKey: string;
  prompt: string;
  enabled: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  settings: SettingsConfig;
  onClose: () => void;
  onSave: (settings: SettingsConfig) => void;
}

const defaultSettings: SettingsConfig = {
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  prompt: '请将以下文本翻译成英文，保持原意和语调：',
  enabled: true
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave
}) => {
  const [localSettings, setLocalSettings] = useState<SettingsConfig>(defaultSettings);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleInputChange = (field: keyof SettingsConfig, value: string | boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-w-[90vw] shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">设置</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={localSettings.enabled}
                onChange={(e) => handleInputChange('enabled', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">启用剪切板监听</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API 端点:
            </label>
            <input
              type="text"
              value={localSettings.apiEndpoint}
              onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
              className="w-full p-3 border rounded-md"
              placeholder="https://api.openai.com/v1/chat/completions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key:
            </label>
            <input
              type="password"
              value={localSettings.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              className="w-full p-3 border rounded-md"
              placeholder="输入你的 API Key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              翻译提示词:
            </label>
            <textarea
              value={localSettings.prompt}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              className="w-full p-3 border rounded-md resize-none"
              rows={3}
              placeholder="请将以下文本翻译成英文，保持原意和语调："
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};