import {Tray, Menu, nativeImage, BrowserWindow, app} from 'electron';
import {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TrayManager implements AppModule {
  #tray: Tray | null = null;

  async enable({app}: ModuleContext): Promise<void> {
    await app.whenReady();
    this.createTray();
  }

  private createTray() {
    // 使用本地图标文件
    const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
    this.#tray = new Tray(iconPath);

    // 设置提示文本
    this.#tray.setToolTip('CrossLangEdit - 跨语言编辑工具');

    // 创建右键菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        click: () => {
          this.showWindow();
        }
      },
      {
        label: '退出',
        click: () => {
          app.quit();
        }
      }
    ]);

    this.#tray.setContextMenu(contextMenu);

    // 双击托盘图标显示窗口
    this.#tray.on('double-click', () => {
      this.showWindow();
    });
  }

  private showWindow() {
    const mainWindow = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    }
  }
}

export function createTrayManagerModule(...args: ConstructorParameters<typeof TrayManager>) {
  return new TrayManager(...args);
}