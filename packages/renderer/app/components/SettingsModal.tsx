import React, { useState, useEffect } from 'react';

export type ApiEndpointType = 'openai' | 'ollama';

export interface ApiConfig {
  id: string;
  name: string;
  type: ApiEndpointType;
  endpoint: string;
  apiKey: string;
  model: string;
  temperature?: number;
}

export interface PrefixConfig {
  id: string;
  prefix: string;
  name: string;
  prompt: string;
  apiConfigId: string;
}

export interface SettingsConfig {
  enabled: boolean;
  apiConfigs: ApiConfig[];
  prefixConfigs: PrefixConfig[];
  defaultApiConfigId?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  settings: SettingsConfig;
  onClose: () => void;
  onSave: (settings: SettingsConfig) => void;
}

const defaultApiConfig: ApiConfig = {
  id: 'default-openai',
  name: 'OpenAI GPT',
  type: 'openai',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  model: 'gpt-3.5-turbo'
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
  apiConfigs: [defaultApiConfig],
  prefixConfigs: [defaultPrefixConfig],
  defaultApiConfigId: 'default-openai'
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave
}) => {
  const [localSettings, setLocalSettings] = useState<SettingsConfig>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'api' | 'prefix'>('api');
  const [editingApiId, setEditingApiId] = useState<string | null>(null);
  const [editingPrefixId, setEditingPrefixId] = useState<string | null>(null);

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

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addApiConfig = () => {
    const newId = generateId();
    const newConfig: ApiConfig = {
      id: newId,
      name: '新API配置',
      type: 'openai',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: '',
      model: 'gpt-3.5-turbo'
    };
    setLocalSettings(prev => ({
      ...prev,
      apiConfigs: [...prev.apiConfigs, newConfig]
    }));
    setEditingApiId(newId);
  };

  const updateApiConfig = (id: string, updates: Partial<ApiConfig>) => {
    setLocalSettings(prev => ({
      ...prev,
      apiConfigs: prev.apiConfigs.map(config =>
        config.id === id ? { ...config, ...updates } : config
      )
    }));
  };

  const deleteApiConfig = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      apiConfigs: prev.apiConfigs.filter(config => config.id !== id),
      prefixConfigs: prev.prefixConfigs.map(prefix =>
        prefix.apiConfigId === id
          ? { ...prefix, apiConfigId: prev.apiConfigs[0]?.id || '' }
          : prefix
      ),
      defaultApiConfigId: prev.defaultApiConfigId === id
        ? prev.apiConfigs.find(c => c.id !== id)?.id
        : prev.defaultApiConfigId
    }));
  };

  const addPrefixConfig = () => {
    const newId = generateId();
    const newConfig: PrefixConfig = {
      id: newId,
      prefix: '#new:',
      name: '新前缀',
      prompt: '请翻译以下文本：',
      apiConfigId: localSettings.defaultApiConfigId || localSettings.apiConfigs[0]?.id || ''
    };
    setLocalSettings(prev => ({
      ...prev,
      prefixConfigs: [...prev.prefixConfigs, newConfig]
    }));
    setEditingPrefixId(newId);
  };

  const updatePrefixConfig = (id: string, updates: Partial<PrefixConfig>) => {
    setLocalSettings(prev => ({
      ...prev,
      prefixConfigs: prev.prefixConfigs.map(config =>
        config.id === id ? { ...config, ...updates } : config
      )
    }));
  };

  const deletePrefixConfig = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      prefixConfigs: prev.prefixConfigs.filter(config => config.id !== id)
    }));
  };

  const getApiEndpointPlaceholder = (type: ApiEndpointType) => {
    switch (type) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'ollama':
        return 'http://localhost:11434/api/chat';
      default:
        return '';
    }
  };

  const getModelPlaceholder = (type: ApiEndpointType) => {
    switch (type) {
      case 'openai':
        return 'gpt-3.5-turbo';
      case 'ollama':
        return 'llama3.2';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[700px] max-w-[90vw] max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">设置</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={localSettings.enabled}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">启用剪切板监听</span>
              </label>
            </div>

            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('api')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'api'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  API配置
                </button>
                <button
                  onClick={() => setActiveTab('prefix')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'prefix'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  前缀配置
                </button>
              </nav>
            </div>

            {activeTab === 'api' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">API端点配置</h3>
                  <button
                    onClick={addApiConfig}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    添加配置
                  </button>
                </div>

                {localSettings.apiConfigs.map(config => (
                  <div key={config.id} className="border rounded p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <input
                        type="text"
                        value={config.name}
                        onChange={(e) => updateApiConfig(config.id, { name: e.target.value })}
                        className="font-medium bg-transparent border-none outline-none text-gray-800"
                        placeholder="配置名称"
                      />
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            name="defaultApi"
                            checked={localSettings.defaultApiConfigId === config.id}
                            onChange={() => setLocalSettings(prev => ({ ...prev, defaultApiConfigId: config.id }))}
                          />
                          默认
                        </label>
                        {localSettings.apiConfigs.length > 1 && (
                          <button
                            onClick={() => deleteApiConfig(config.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API类型:
                        </label>
                        <select
                          value={config.type}
                          onChange={(e) => updateApiConfig(config.id, {
                            type: e.target.value as ApiEndpointType,
                            endpoint: getApiEndpointPlaceholder(e.target.value as ApiEndpointType),
                            model: getModelPlaceholder(e.target.value as ApiEndpointType)
                          })}
                          className="w-full p-2 border rounded text-sm"
                        >
                          <option value="openai">OpenAI</option>
                          <option value="ollama">Ollama</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          模型名称:
                        </label>
                        <input
                          type="text"
                          value={config.model}
                          onChange={(e) => updateApiConfig(config.id, { model: e.target.value })}
                          className="w-full p-2 border rounded text-sm"
                          placeholder={getModelPlaceholder(config.type)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API端点:
                      </label>
                      <input
                        type="text"
                        value={config.endpoint}
                        onChange={(e) => updateApiConfig(config.id, { endpoint: e.target.value })}
                        className="w-full p-2 border rounded text-sm"
                        placeholder={getApiEndpointPlaceholder(config.type)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API Key:
                        </label>
                        <input
                          type="password"
                          value={config.apiKey}
                          onChange={(e) => updateApiConfig(config.id, { apiKey: e.target.value })}
                          className="w-full p-2 border rounded text-sm"
                          placeholder={config.type === 'ollama' ? '可选' : '必填'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Temperature (可选):
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="2"
                          step="0.1"
                          value={config.temperature ?? ''}
                          onChange={(e) => updateApiConfig(config.id, {
                            temperature: e.target.value === '' ? undefined : parseFloat(e.target.value)
                          })}
                          className="w-full p-2 border rounded text-sm"
                          placeholder="留空使用默认值"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'prefix' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">前缀配置</h3>
                  <button
                    onClick={addPrefixConfig}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    添加前缀
                  </button>
                </div>

                {localSettings.prefixConfigs.map(config => (
                  <div key={config.id} className="border rounded p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <input
                        type="text"
                        value={config.name}
                        onChange={(e) => updatePrefixConfig(config.id, { name: e.target.value })}
                        className="font-medium bg-transparent border-none outline-none text-gray-800"
                        placeholder="配置名称"
                      />
                      {localSettings.prefixConfigs.length > 1 && (
                        <button
                          onClick={() => deletePrefixConfig(config.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          前缀:
                        </label>
                        <input
                          type="text"
                          value={config.prefix}
                          onChange={(e) => updatePrefixConfig(config.id, { prefix: e.target.value })}
                          className="w-full p-2 border rounded text-sm"
                          placeholder="#zh:"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          使用API配置:
                        </label>
                        <select
                          value={config.apiConfigId}
                          onChange={(e) => updatePrefixConfig(config.id, { apiConfigId: e.target.value })}
                          className="w-full p-2 border rounded text-sm"
                        >
                          {localSettings.apiConfigs.map(apiConfig => (
                            <option key={apiConfig.id} value={apiConfig.id}>
                              {apiConfig.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        翻译提示词:
                      </label>
                      <textarea
                        value={config.prompt}
                        onChange={(e) => updatePrefixConfig(config.id, { prompt: e.target.value })}
                        className="w-full p-2 border rounded text-sm resize-none"
                        rows={3}
                        placeholder="请将以下文本翻译成英文，保持原意和语调："
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t mt-4">
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
  );
};