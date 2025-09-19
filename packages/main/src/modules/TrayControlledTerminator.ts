import {AppModule} from '../AppModule.js';
import {ModuleContext} from '../ModuleContext.js';
import {Event} from 'electron';

class TrayControlledTerminator implements AppModule {
  enable({app}: ModuleContext): Promise<void> | void {
    // 阻止默认的窗口关闭行为导致应用退出
    app.on('window-all-closed', () => {
      // 在 macOS 上，除非用户用 Cmd + Q 退出，否则应用和菜单栏会保持活跃状态
      if (process.platform !== 'darwin') {
        // 在其他平台上，不自动退出，让托盘控制退出
        // 阻止应用退出
      }
    });

    // 在 macOS 上，点击 dock 图标时重新创建窗口
    app.on('activate', () => {
      // 这个事件已经在 WindowManager 中处理了，这里只是为了完整性
    });
  }
}

export function createTrayControlledTerminator(...args: ConstructorParameters<typeof TrayControlledTerminator>) {
  return new TrayControlledTerminator(...args);
}