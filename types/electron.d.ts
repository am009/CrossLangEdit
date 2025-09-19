declare global {
  interface Window {
    electronAPI: {
      clipboard: {
        startMonitoring: () => Promise<boolean>;
        stopMonitoring: () => Promise<boolean>;
        writeText: (text: string) => Promise<boolean>;
        onTextDetected: (callback: (data: {originalText: string, fullText: string}) => void) => () => void;
      };
      window: {
        hide: () => Promise<boolean>;
      };
    };
  }
}

export {};