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

// 使用 contextBridge 安全地暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  clipboard,
  window
});

export {sha256sum, versions, send, clipboard};
