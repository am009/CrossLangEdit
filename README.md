# CrossLangEdit

简单的跨语言编辑小程序，监听剪切板。如果文字是以`#zh:`开头，那么就弹出翻译界面。
- 原文是剪切板里面去除了这个前缀的文字，
- 用户可以点击翻译按钮，使用大模型API翻译。
- Esc退出后，自动复制加上前缀的原文和翻译后文本。

然后有设置按钮，可以自定义设置API端点，prompt等。

方便Overleaf中用中文写paper：

TODO-视频/GIF展示

### Dev

因为使用了forcefocus包辅助聚焦窗口，所以需要为electron执行electron-rebuild。

```
.\node_modules\.bin\electron-rebuild.cmd
```
