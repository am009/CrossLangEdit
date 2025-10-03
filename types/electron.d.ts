declare global {
  interface Window {
    electronAPI: {
      clipboard: {
        startMonitoring: () => Promise<boolean>;
        stopMonitoring: () => Promise<boolean>;
        updatePrefixes: (prefixes: string[]) => Promise<boolean>;
        writeText: (text: string) => Promise<boolean>;
        onTextDetected: (callback: (data: {
          originalText: string,
          translatedText?: string,
          fullText: string,
          prefix?: string,
          hasOriginalText?: boolean,
          hasTranslatedText?: boolean
        }) => void) => () => void;
      };
      window: {
        hide: () => Promise<boolean>;
      };
      globalShortcut: {
        register: (shortcut: string) => Promise<boolean>;
        unregister: () => Promise<boolean>;
        checkRegistered: (shortcut: string) => Promise<boolean>;
        onTriggered: (callback: () => void) => () => void;
      };
    };
  }
}

export {};