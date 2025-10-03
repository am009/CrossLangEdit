import {sha256sum} from './nodeCrypto.js';
import {versions} from './versions.js';
import {ipcRenderer, contextBridge} from 'electron';

function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

const clipboard = {
  startMonitoring: () => ipcRenderer.invoke('clipboard-start-monitoring'),
  stopMonitoring: () => ipcRenderer.invoke('clipboard-stop-monitoring'),
  updatePrefixes: (prefixes: string[]) => ipcRenderer.invoke('clipboard-update-prefixes', prefixes),
  writeText: (text: string) => ipcRenderer.invoke('clipboard-write-text', text),
  onTextDetected: (callback: (data: {originalText: string, fullText: string, prefix?: string}) => void) => {
    const handler = (_: any, data: {originalText: string, fullText: string, prefix?: string}) => callback(data);
    ipcRenderer.on('clipboard-text-detected', handler);
    return () => ipcRenderer.off('clipboard-text-detected', handler);
  }
};

const window = {
  hide: () => ipcRenderer.invoke('window-hide')
};

const globalShortcut = {
  register: (shortcut: string) => ipcRenderer.invoke('register-global-shortcut', shortcut),
  unregister: () => ipcRenderer.invoke('unregister-global-shortcut'),
  checkRegistered: (shortcut: string) => ipcRenderer.invoke('check-shortcut-registered', shortcut),
  onTriggered: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('global-shortcut-triggered', handler);
    return () => ipcRenderer.off('global-shortcut-triggered', handler);
  }
};

// 使用 contextBridge 安全地暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  clipboard,
  window,
  globalShortcut
});

export {sha256sum, versions, send, clipboard};
