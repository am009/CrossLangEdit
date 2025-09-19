import {clipboard, BrowserWindow, ipcMain} from 'electron';
import {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import forceFocus from 'forcefocus';

export interface ClipboardMonitorConfig {
  enabled: boolean;
  prefix: string;
}

export class ClipboardMonitor implements AppModule {
  readonly #config: ClipboardMonitorConfig;
  #intervalId: NodeJS.Timeout | null = null;
  #lastClipboardText = '';

  constructor(config: ClipboardMonitorConfig) {
    this.#config = config;
  }

  enable({}: ModuleContext): Promise<void> | void {
    this.#setupIpcHandlers();
    if (this.#config.enabled) {
      this.#startMonitoring();
    }
  }

  #setupIpcHandlers() {
    ipcMain.handle('clipboard-start-monitoring', () => {
      this.#startMonitoring();
      return true;
    });

    ipcMain.handle('clipboard-stop-monitoring', () => {
      this.#stopMonitoring();
      return true;
    });

    ipcMain.handle('clipboard-write-text', (_, text: string) => {
      clipboard.writeText(text);
      this.#lastClipboardText = text;
      return true;
    });

    ipcMain.handle('window-hide', () => {
      const mainWindow = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
      if (mainWindow) {
        mainWindow.hide();
        return true;
      }
      return false;
    });
  }

  #startMonitoring() {
    if (!this.#config.enabled || this.#intervalId) return;

    this.#intervalId = setInterval(() => {
      const currentText = clipboard.readText().trim();

      if (currentText !== this.#lastClipboardText && currentText.startsWith(this.#config.prefix)) {
        this.#lastClipboardText = currentText;
        const textWithoutPrefix = currentText.slice(this.#config.prefix.length);

        const mainWindow = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore();
          }
          if (!mainWindow.isVisible()) {
            mainWindow.setAlwaysOnTop(true);
            mainWindow.show();
            mainWindow.setAlwaysOnTop(false);
            // 使用 forcefocus 强制获得焦点
            forceFocus.focusWindow(mainWindow);
          } else {
            forceFocus.focusWindow(mainWindow);
          }
          mainWindow.webContents.send('clipboard-text-detected', {
            originalText: textWithoutPrefix,
            fullText: currentText
          });
        }
      } else if (currentText !== this.#lastClipboardText) {
        this.#lastClipboardText = currentText;
      }
    }, 1000);
  }

  #stopMonitoring() {
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    }
  }
}

export function createClipboardMonitorModule(...args: ConstructorParameters<typeof ClipboardMonitor>) {
  return new ClipboardMonitor(...args);
}