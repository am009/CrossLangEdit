import React, { useState, useEffect } from 'react';

interface TranslationModalProps {
  isOpen: boolean;
  originalText: string;
  onClose: () => void;
  onTranslate: (text: string) => Promise<string>;
  onCopyResult: (originalText: string, translatedText: string) => void;
}

export const TranslationModal: React.FC<TranslationModalProps> = ({
  isOpen,
  originalText,
  onClose,
  onTranslate,
  onCopyResult
}) => {
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTranslatedText('');
      setError('');
    }
  }, [isOpen, originalText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleTranslate = async () => {
    if (!originalText.trim()) return;

    setIsTranslating(true);
    setError('');

    try {
      const result = await onTranslate(originalText);
      setTranslatedText(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '翻译失败');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleClose = async () => {
    if (translatedText) {
      onCopyResult(originalText, translatedText);
    }
    onClose();

    // 最小化窗口
    if (window.electronAPI?.window?.minimize) {
      await window.electronAPI.window.minimize();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw] shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">翻译</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              原文:
            </label>
            <textarea
              value={originalText}
              readOnly
              className="w-full p-3 border rounded-md bg-gray-50 resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              译文:
            </label>
            <textarea
              value={translatedText}
              placeholder={isTranslating ? "翻译中..." : "点击翻译按钮获取译文"}
              readOnly
              className="w-full p-3 border rounded-md bg-gray-50 resize-none"
              rows={3}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleTranslate}
              disabled={isTranslating || !originalText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isTranslating ? '翻译中...' : '翻译'}
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              完成 (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};