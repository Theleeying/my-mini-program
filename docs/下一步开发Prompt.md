# 校易通 — 下一步开发 Prompt

> 复制以下全部内容，粘贴给下一个 AI 即可

---

## Prompt 开始 ↓

你是一个微信小程序开发专家。现在需要你继续开发「校易通」校园综合服务平台微信小程序。

### 一、项目概况

- **项目名称**：校易通 — 校园综合服务平台
- **开发平台**：微信小程序（原生框架 WXML + WXSS + JS）
- **后端**：微信云开发（CloudBase），云数据库（NoSQL）+ 云函数 + 云存储
- **云开发环境ID**：`cloudbase-d3glfg3zf894b18e`
- **AppID**：`wx4f16bf796bedaee0`
- **团队**：3人（成员A=首页+个人中心，成员B=二手交易，成员C=失物招领+自习助手）
- **UI要求**：纯原生 WXSS，不引入第三方组件库。主题色 `#4CAF50`（绿色）

### 二、已完成的工作

1. **App 骨架**：`app.json`（14个页面路由 + 5个TabBar）、`app.js`（云开发初始化）、`app.wxss`（全局主题样式、通用class）
2. **云函数**：`cloudfunctions/login/`（获取用户 openid）
3. **数据库**：云开发控制台已创建 7 个集合：`users`、`announcements`、`favorites`、`goods`、`lost_found`、`classrooms`、`reservations`。字段设计详见项目内 `docs/数据库设计文档.md`
4. **首页** `pages/index/`：搜索栏 + 轮播图 + 4个快捷入口 + 热门推荐列表（聚合 goods 和 lost_found）
5. **个人中心** `pages/user/`：登录页、我的发布、我的收藏、设置页，共4个子页面
6. **关于我们** `pages/common/about/`
7. **占位页**：成员B的 `pages/secondhand/`（3个页面）和成员C的 `pages/lostfound/`（3个页面）+ `pages/studyroom/`（2个页面）已创建占位文件
8. **文档**：`README.md`（开发指南）、`docs/数据库设计文档.md`、`docs/成员A-任务分析文档.md`

### 三、现在需要你完成的任务

请按以下顺序完成：

#### 任务1：部署云函数指引

项目里有 `cloudfunctions/login/index.js`，但它还没有被部署。请告诉我如何在微信开发者工具中部署这个云函数，以及部署后如何验证是否成功。

#### 任务2：插入测试数据

数据库集合都是空的，页面打开什么都看不到。请在云开发控制台的数据库中为以下集合插入测试数据（直接给出可在控制台粘贴的 JSON 数据）：

- `announcements`：插入 3 条公告/轮播图数据
- `goods`：插入 5 条二手商品数据（不同分类）
- `lost_found`：插入 4 条数据（2条失物 + 2条招领）
- `users`：插入 1 条测试用户数据
- `classrooms`：插入 6 条教室数据（2栋楼，每栋3间）

数据要符合 `docs/数据库设计文档.md` 中定义的字段格式。图片字段可以留空字符串 `""`，时间字段用当前日期。

#### 任务3：下载并添加 TabBar 图标

当前 `app.json` 的 TabBar 没有配置图标（因为 `images/tab/` 目录为空）。请：

1. 从 iconfont.cn 或其他免费图标网站推荐 10 个合适的图标（5个tab × 2种状态）
2. 说明如何配置 `app.json` 的 `iconPath` 和 `selectedIconPath`
3. 图标规格要求：81px × 81px，PNG 格式，默认态灰色(#999)，选中态绿色(#4CAF50)

#### 任务4：检查并修复现有代码

通读项目所有 `.js`、`.wxml`、`.wxss`、`.json` 文件，检查以下问题：

1. 页面路由是否和 `app.json` 中的注册一致
2. 数据库查询的集合名是否和实际集合名一致
3. 首页 `index.js` 中是否有搜索输入绑定的处理函数（`onSearchInput`）缺失
4. TabBar 页面跳转（`wx.switchTab` vs `wx.navigateTo`）是否正确
5. 云数据库 API 调用是否正确（如 `db.command.in()` 的使用）
6. 样式中的 CSS 变量是否在小程序中兼容

如有问题请直接修复，并说明改了什么。

#### 任务5：完善首页交互

1. 修复搜索输入框的 `bindinput` 事件处理（当前 `onSearchInput` 函数缺失）
2. 轮播图在无数据时显示默认占位
3. 热门推荐列表为空时显示友好的空状态提示
4. 下拉刷新功能验证

#### 任务6：验证整体流程

确认以下用户流程可以走通：
1. 首页 → 看到轮播图、快捷入口、热门推荐
2. 点击快捷入口 → 跳转到对应 TabBar 页面
3. 点击热门推荐 → 跳转到商品详情或失物详情
4. TabBar 切换 → 5个页面都能正常切换
5. 个人中心 → 点击登录按钮
6. 个人中心菜单 → 各子页面都能正常跳转

### 四、项目文件结构

```
mini-program/
├── app.js / app.json / app.wxss
├── cloudfunctions/login/
├── docs/
│   ├── 数据库设计文档.md
│   ├── 成员A-任务分析文档.md
│   └── README.md（在根目录）
├── images/tab/
├── pages/
│   ├── index/              ← 首页（成员A）
│   ├── user/               ← 个人中心（成员A）
│   │   ├── index/
│   │   ├── my-publish/
│   │   ├── my-favorites/
│   │   └── settings/
│   ├── common/about/
│   ├── secondhand/         ← 成员B 占位
│   ├── lostfound/          ← 成员C 占位
│   └── studyroom/          ← 成员C 占位
├── project.config.json
├── sitemap.json
└── utils/util.js
```

### 五、注意事项

- 不要修改成员B和成员C负责的占位页面的核心逻辑，只做必要的 bug 修复
- 所有改动要符合现有代码风格和命名规范
- 数据库字段严格按照 `docs/数据库设计文档.md` 中的定义
- 全局样式已定义在 `app.wxss` 中，优先使用已有的通用 class（如 `.card`、`.list-item`、`.empty-state` 等）
- 本项目使用 `glass-easel` 组件框架

## Prompt 结束 ↑
