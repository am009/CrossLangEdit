import {globalShortcut, BrowserWindow, ipcMain, app} from 'electron';
import {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import forceFocus from 'forcefocus';

export interface GlobalShortcutConfig {
  shortcut?: string;
}

export class GlobalShortcutManager implements AppModule {
  readonly #config: GlobalShortcutConfig;
  #currentShortcut: string | null = null;

  constructor(config: GlobalShortcutConfig) {
    this.#config = config;
  }

  enable({}: ModuleContext): Promise<void> | void {
    this.#setupIpcHandlers();

    // 在 app ready 后注册快捷键
    if (app.isReady()) {
      if (this.#config.shortcut) {
        this.#registerShortcut(this.#config.shortcut);
      }
    } else {
      app.whenReady().then(() => {
        if (this.#config.shortcut) {
          this.#registerShortcut(this.#config.shortcut);
        }
      });
    }
  }

  #setupIpcHandlers() {
    ipcMain.handle('register-global-shortcut', (_, shortcut: string) => {
      return this.#registerShortcut(shortcut);
    });

    ipcMain.handle('unregister-global-shortcut', () => {
      this.#unregisterShortcut();
      return true;
    });

    ipcMain.handle('check-shortcut-registered', (_, shortcut: string) => {
      return globalShortcut.isRegistered(shortcut);
    });
  }

  #registerShortcut(shortcut: string): boolean {
    // 先注销当前快捷键
    if (this.#currentShortcut) {
      globalShortcut.unregister(this.#currentShortcut);
    }

    if (!shortcut) {
      return true;
    }

    const success = globalShortcut.register(shortcut, () => {
      const mainWindow = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        if (!mainWindow.isVisible()) {
          mainWindow.setAlwaysOnTop(true);
          mainWindow.show();
          mainWindow.setAlwaysOnTop(false);
          forceFocus.focusWindow(mainWindow);
        } else {
          forceFocus.focusWindow(mainWindow);
        }
        mainWindow.webContents.send('global-shortcut-triggered');
      }
    });

    if (success) {
      this.#currentShortcut = shortcut;
      console.log('Global shortcut registered:', shortcut);
      return true;
    } else {
      console.error('Failed to register global shortcut:', shortcut);
      return false;
    }
  }

  #unregisterShortcut() {
    if (this.#currentShortcut) {
      globalShortcut.unregister(this.#currentShortcut);
      this.#currentShortcut = null;
    }
  }

  disable(): Promise<void> | void {
    this.#unregisterShortcut();
  }
}

export function createGlobalShortcutModule(...args: ConstructorParameters<typeof GlobalShortcutManager>) {
  return new GlobalShortcutManager(...args);
}