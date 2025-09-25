import React, { useState, useEffect, useCallback } from 'react';

interface TranslationModalProps {
  isOpen: boolean;
  originalText: string;
  translatedText?: string;
  copyTranslationOnly?: boolean;
  closeOnBlur?: boolean;
  onClose: () => void;
  onTranslate: (text: string, onChunk?: (chunk: string) => void) => Promise<string>;
  onCopyResult: (originalText: string, translatedText: string, copyTranslationOnly: boolean) => void;
  onOpenSettings: () => void;
  onCopyTranslationOnlyChange?: (value: boolean) => void;
}

export const TranslationModal: React.FC<TranslationModalProps> = ({
  isOpen,
  originalText,
  translatedText: initialTranslatedText,
  copyTranslationOnly = false,
  closeOnBlur = false,
  onClose,
  onTranslate,
  onCopyResult,
  onOpenSettings,
  onCopyTranslationOnlyChange
}) => {
  const [editableOriginalText, setEditableOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [localCopyTranslationOnly, setLocalCopyTranslationOnly] = useState(copyTranslationOnly);

  useEffect(() => {
    if (isOpen) {
      setEditableOriginalText(originalText);
      // Only reset translatedText if it's different from what we already have
      if (!translatedText && initialTranslatedText) {
        setTranslatedText(initialTranslatedText);
      }
      setError('');
      setLocalCopyTranslationOnly(copyTranslationOnly);
    }
  }, [isOpen, originalText, initialTranslatedText, copyTranslationOnly]);

  const handleClose = useCallback(async () => {
    if (translatedText) {
      onCopyResult(editableOriginalText, translatedText, localCopyTranslationOnly);
    }
    onClose();

    // 隐藏窗口
    if (window.electronAPI?.window?.hide) {
      await window.electronAPI.window.hide();
    }
  }, [translatedText, editableOriginalText, localCopyTranslationOnly, onCopyResult, onClose]);

  useEffect(() => {
    // console.log('TranslationModal isOpen changed:', isOpen);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleWindowBlur = () => {
      if (closeOnBlur) {
        handleClose();
      }
    };

    if (isOpen) {
      // console.log('Adding event listeners for translation modal');
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('blur', handleWindowBlur);
      return () => {
        // console.log('Removing event listeners for translation modal');
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('blur', handleWindowBlur);
      };
    }
  }, [isOpen, handleClose, closeOnBlur]);

  const handleTranslate = async () => {
    if (!editableOriginalText.trim()) return;

    setIsTranslating(true);
    setError('');
    setTranslatedText(''); // Clear previous translation

    try {
      let fullTranslation = '';
      const result = await onTranslate(editableOriginalText, (chunk) => {
        fullTranslation += chunk;
        setTranslatedText(fullTranslation);
      });
      // If onTranslate returns non-empty result, use it (for backward compatibility)
      if (result) {
        setTranslatedText(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '翻译失败');
    } finally {
      setIsTranslating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <h1 className="text-xl font-semibold">翻译工具</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="设置"
          >
            ⚙️ 设置
          </button>
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            title="关闭 (Esc)"
          >
            ✕ 关闭
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
        <div className="flex-1 flex gap-6">
          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              原文:
            </label>
            <textarea
              value={editableOriginalText}
              onChange={(e) => setEditableOriginalText(e.target.value)}
              className="flex-1 w-full p-4 border border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
              placeholder="在这里输入或粘贴需要翻译的文本..."
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              译文:
            </label>
            <textarea
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              placeholder={isTranslating ? "翻译中..." : "点击翻译按钮获取译文"}
              className="flex-1 w-full p-4 border border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localCopyTranslationOnly}
              onChange={(e) => {
                const newValue = e.target.checked;
                setLocalCopyTranslationOnly(newValue);
                onCopyTranslationOnlyChange?.(newValue);
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">仅复制译文</span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !editableOriginalText.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isTranslating ? '翻译中...' : '翻译'}
            </button>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              完成 (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};