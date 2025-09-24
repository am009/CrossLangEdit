import type {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import {BrowserWindow} from 'electron';
import type {AppInitConfig} from '../AppInitConfig.js';
import {app} from 'electron';
import {join} from 'path';
import {readFileSync, writeFileSync, existsSync} from 'fs';

class WindowManager implements AppModule {
  readonly #preload: {path: string};
  readonly #renderer: {path: string} | URL;
  readonly #openDevTools;
  readonly #boundsFilePath: string;

  constructor({initConfig, openDevTools = false}: {initConfig: AppInitConfig, openDevTools?: boolean}) {
    this.#preload = initConfig.preload;
    this.#renderer = initConfig.renderer;
    this.#openDevTools = openDevTools;
    this.#boundsFilePath = join(app.getPath('userData'), 'window-bounds.json');
  }

  private loadWindowBounds(): {x?: number, y?: number, width?: number, height?: number} | null {
    try {
      if (existsSync(this.#boundsFilePath)) {
        const data = readFileSync(this.#boundsFilePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load window bounds:', error);
    }
    return null;
  }

  private saveWindowBounds(window: BrowserWindow): void {
    try {
      const bounds = window.getBounds();
      writeFileSync(this.#boundsFilePath, JSON.stringify(bounds, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save window bounds:', error);
    }
  }

  async enable({app}: ModuleContext): Promise<void> {
    await app.whenReady();
    await this.restoreOrCreateWindow(true); // 启动时显示窗口
    app.on('second-instance', () => this.restoreOrCreateWindow(true));
    app.on('activate', () => this.restoreOrCreateWindow(true));
  }

  async createWindow(): Promise<BrowserWindow> {
    const savedBounds = this.loadWindowBounds();

    const browserWindow = new BrowserWindow({
      show: false, // Use the 'ready-to-show' event to show the instantiated BrowserWindow.
      // alwaysOnTop: true, // 保持窗口始终在最前面
      x: savedBounds?.x,
      y: savedBounds?.y,
      width: savedBounds?.width || 800,
      height: savedBounds?.height || 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // Sandbox disabled because the demo of preload script depend on the Node.js api
        webviewTag: false, // The webview tag is not recommended. Consider alternatives like an iframe or Electron's BrowserView. @see https://www.electronjs.org/docs/latest/api/webview-tag#warning
        preload: this.#preload.path,
      },
    });

    // 监听窗口移动和大小变化事件，保存位置和大小
    let saveTimer: NodeJS.Timeout | null = null;
    const scheduleSave = () => {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      saveTimer = setTimeout(() => {
        this.saveWindowBounds(browserWindow);
      }, 500); // 延迟500ms保存，避免频繁写入
    };

    browserWindow.on('moved', scheduleSave);
    browserWindow.on('resized', scheduleSave);

    // 阻止窗口关闭，改为隐藏
    browserWindow.on('close', (event) => {
      event.preventDefault();
      this.saveWindowBounds(browserWindow); // 关闭前保存一次
      browserWindow.hide();
    });

    if (this.#renderer instanceof URL) {
      await browserWindow.loadURL(this.#renderer.href);
    } else {
      await browserWindow.loadFile(this.#renderer.path);
    }

    return browserWindow;
  }

  async restoreOrCreateWindow(show = false) {
    let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

    if (window === undefined) {
      window = await this.createWindow();
    }

    if (!show) {
      return window;
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window?.show();

    if (this.#openDevTools) {
      window?.webContents.openDevTools();
    }

    window.focus();

    return window;
  }

}

export function createWindowManagerModule(...args: ConstructorParameters<typeof WindowManager>) {
  return new WindowManager(...args);
}
