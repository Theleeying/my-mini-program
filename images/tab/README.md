# TabBar 图标

此目录存放 TabBar 底部导航栏的图标文件。

## 需要的图标（10个PNG文件）

每个 tab 需要两个图标：默认态（灰色 #999）和选中态（绿色 #4CAF50）

| 文件名 | 说明 |
|--------|------|
| `home.png` | 首页 — 默认 |
| `home-active.png` | 首页 — 选中 |
| `secondhand.png` | 二手 — 默认 |
| `secondhand-active.png` | 二手 — 选中 |
| `lostfound.png` | 失物 — 默认 |
| `lostfound-active.png` | 失物 — 选中 |
| `studyroom.png` | 自习 — 默认 |
| `studyroom-active.png` | 自习 — 选中 |
| `user.png` | 我的 — 默认 |
| `user-active.png` | 我的 — 选中 |

## 图标来源推荐

- **iconfont.cn** (阿里巴巴图标库) — 搜索"首页、交易、失物、自习、用户"等关键词
- 建议下载 81px × 81px 的 PNG 格式
- 选中态图标用绿色 #4CAF50 版本，默认态用灰色 #999999

## 使用步骤

1. 从 iconfont.cn 下载图标
2. 重命名为上述文件名
3. 放入此目录
4. 取消 `app.json` 中每项 tab 的 `iconPath` 和 `selectedIconPath` 的注释
