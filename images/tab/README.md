# TabBar 图标

此目录存放 TabBar 底部导航栏的图标文件（81×81px PNG）。

## 图标清单

| 文件名 | Tab | 状态 |
|--------|-----|------|
| `home.png` / `home-active.png` | 首页 | 默认灰 / 选中绿 |
| `shop.png` / `shop-active.png` | 二手 | 默认灰 / 选中绿 |
| `find.png` / `find-active.png` | 失物 | 默认灰 / 选中绿 |
| `study.png` / `study-active.png` | 自习 | 默认灰 / 选中绿 |
| `user.png` / `user-active.png` | 我的 | 默认灰 / 选中绿 |

## 图标规格

- 尺寸：81px × 81px
- 格式：PNG
- 默认态：灰色 `#999999`
- 选中态：绿色 `#4CAF50`

## 生成方式

当前图标由 `scripts/gen-tab-icons.js` 脚本生成（纯代码绘制，无外部依赖）。如需更换为自定义图标，可将从 iconfont.cn 等网站下载的图标替换此目录中的文件。
