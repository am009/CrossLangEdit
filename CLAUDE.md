# CrossLangEdit - 跨语言编辑工具

## 项目介绍

CrossLangEdit 是一个基于 Electron + Vite + React Router 的跨语言编辑小程序。该应用监听系统剪切板，当检测到以 `#zh:` 开头的文本时，会自动弹出翻译界面，支持使用大模型 API 进行翻译。

### 主要功能

- **剪切板监听**：自动监听系统剪切板内容
- **智能触发**：检测到 `#zh:` 前缀时自动弹出翻译界面
- **AI 翻译**：集成大模型 API（如 OpenAI GPT）进行智能翻译
- **便捷操作**：支持 ESC 快捷键退出，自动复制翻译结果
- **灵活配置**：可自定义 API 端点、密钥和翻译提示词
- **托盘图标**：应用启动后在系统托盘显示图标，支持后台运行
- **窗口管理**：默认隐藏窗口，需要时弹出，关闭时隐藏而不退出

### 使用流程

1. 启动应用，自动隐藏到系统托盘并开始监听剪切板
2. 复制以 `#zh:` 开头的文本（如：`#zh:Hello World`）
3. 应用自动弹出翻译界面，显示去除前缀后的原文（`Hello World`）
4. 点击翻译按钮，使用配置的 API 进行翻译
5. 按 ESC 或点击完成按钮，自动将 `#zh:原文` 和翻译结果复制到剪切板，窗口隐藏
6. 通过托盘图标右键菜单可以显示窗口或退出应用

## 技术栈

- **前端框架**：React 18 + React Router v7
- **桌面应用**：Electron 38
- **构建工具**：Vite 7
- **开发语言**：TypeScript
- **样式方案**：Tailwind CSS

## 项目结构

```
packages/
├── main/                 # Electron 主进程
│   └── src/
│       ├── index.ts      # 主入口文件
│       └── modules/
│           ├── ClipboardMonitor.ts     # 剪切板监听模块
│           ├── TrayManager.ts          # 托盘图标管理模块
│           └── TrayControlledTerminator.ts  # 托盘控制的应用退出模块
├── preload/              # Electron 预加载脚本
│   └── src/
│       └── index.ts      # 预加载脚本，暴露安全的 API
└── renderer/             # React 渲染进程
    └── app/
        ├── routes/
        │   └── home.tsx  # 主页路由
        ├── welcome/
        │   └── CrossLangEdit.tsx  # 主应用组件
        ├── components/
        │   ├── TranslationModal.tsx   # 翻译界面组件
        │   └── SettingsModal.tsx      # 设置界面组件
        └── services/
            ├── TranslationService.ts   # 翻译服务
            └── StorageService.ts       # 本地存储服务
```

## 核心文件说明

### 主进程相关

#### packages/main/src/index.ts
主进程入口文件，初始化所有应用模块，包括剪切板监听模块、托盘管理器和应用退出控制。

#### packages/main/src/modules/ClipboardMonitor.ts
剪切板监听模块，负责：
- 定时检查剪切板内容变化
- 检测指定前缀（`#zh:`）的文本
- 通过 IPC 通信将检测结果发送给渲染进程
- 提供启动/停止监听和写入剪切板的 API
- 提供窗口隐藏功能

#### packages/main/src/modules/TrayManager.ts
托盘图标管理模块，负责：
- 在系统托盘创建应用图标
- 提供右键菜单（显示窗口、退出应用）
- 支持双击托盘图标显示窗口
- 管理托盘图标的生命周期

#### packages/main/src/modules/TrayControlledTerminator.ts
托盘控制的应用退出模块，负责：
- 阻止窗口关闭时自动退出应用
- 只允许通过托盘菜单退出应用
- 处理不同平台的窗口关闭行为

### 预加载脚本

#### packages/preload/src/index.ts
安全地暴露主进程 API 给渲染进程，包括：
- 剪切板监听控制
- 剪切板写入功能
- 文本检测事件监听
- 窗口隐藏功能

### 渲染进程相关

#### packages/renderer/app/welcome/CrossLangEdit.tsx
主应用组件，包含：
- 剪切板监听状态管理
- 翻译和设置模态框控制
- 客户端渲染安全检查
- 用户界面和交互逻辑

#### packages/renderer/app/components/TranslationModal.tsx
翻译界面模态框，功能包括：
- 显示原文和译文
- 翻译按钮和进度状态
- ESC 快捷键支持
- 自动复制翻译结果
- 翻译完成后隐藏窗口

#### packages/renderer/app/components/SettingsModal.tsx
设置界面模态框，可配置：
- API 端点 URL
- API 密钥
- 翻译提示词
- 监听开关状态

#### packages/renderer/app/services/TranslationService.ts
翻译服务，负责：
- 调用配置的大模型 API
- 处理翻译请求和响应
- 错误处理和状态管理

#### packages/renderer/app/services/StorageService.ts
本地存储服务，功能包括：
- 设置的持久化存储
- localStorage 可用性检查
- 默认配置管理

### 类型定义

#### types/electron.d.ts
全局类型定义，声明了 Electron API 在 window 对象上的接口。

## 配置说明

应用设置包括：
- **API 端点**：大模型 API 的完整 URL
- **API 密钥**：用于身份验证的密钥
- **翻译提示词**：发送给 AI 的提示模板
- **监听状态**：是否启用剪切板监听

所有设置都会自动保存到 localStorage 中，下次启动时自动恢复。
