# 校易通 — 开发指南

> 📅 更新日期：2026年5月31日
> 👤 维护人：成员A

---

## 一、项目简介

「校易通」是一个校园综合服务微信小程序，包含5个核心模块：

| 模块 | 负责人 | 页面目录 |
|------|--------|---------|
| 首页/资讯 | 成员A | `pages/index/` |
| 个人中心 | 成员A | `pages/user/` |
| 二手交易 | 成员B | `pages/secondhand/` |
| 失物招领 | 成员C | `pages/lostfound/` |
| 自习助手 | 成员C | `pages/studyroom/` |

---

## 二、环境搭建（新人必看）

### 2.1 安装微信开发者工具

下载地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 2.2 导入项目

1. 打开微信开发者工具 → 选择「导入项目」
2. 目录选择本项目根目录
3. AppID 填：`wx4f16bf796bedaee0`
4. 点击确定，等待编译完成

### 2.3 打开云开发控制台

有两种方式：

**方式一：开发者工具内**
- 左侧文件树 → 右键 `cloudfunctions` 文件夹 → 选择「当前环境」确认已连接

**方式二：浏览器直接打开**
- 打开 https://mp.weixin.qq.com → 微信扫码登录
- 左侧菜单 → 云服务 → 云开发 → 进入控制台
- 或直接访问：https://tcb.cloud.tencent.com/env/overview?envId=cloudbase-d3glfg3zf894b18e9

---

## 三、数据库说明

### 3.1 数据库类型

本项目使用微信云开发的 **NoSQL 文档型数据库**（类似 MongoDB）。

**重要概念：NoSQL 没有"先定义字段再插数据"这回事。** 字段结构完全由代码控制，你写代码时 `add()` 里传什么字段，数据库就存什么字段。

### 3.2 已创建的集合

以下7个集合已在云开发控制台创建完成，直接使用即可：

```
users          用户信息
announcements  公告/轮播图
favorites      收藏记录
goods          二手商品
lost_found     失物招领
classrooms     教室信息
reservations   自习预约
```

### 3.3 各集合字段定义

**详见 [docs/数据库设计文档.md](docs/数据库设计文档.md)**

请严格按照文档中的字段名和类型来写代码，保证全员数据格式一致。

---

## 四、数据库怎么用（代码示例）

### 4.1 查询数据

```js
const db = wx.cloud.database()

// 查询全部
db.collection('goods').get().then(res => {
  console.log(res.data) // 数组，每条记录是一个对象
})

// 条件查询
db.collection('goods').where({
  category: '书籍',
  status: 'active'
}).get().then(res => {
  console.log(res.data)
})

// 查询单条
db.collection('goods').doc('记录ID').get().then(res => {
  console.log(res.data) // 单个对象
})
```

### 4.2 新增数据

```js
const db = wx.cloud.database()

db.collection('goods').add({
  data: {
    title: '二手教材',
    description: '九成新',
    price: 15,
    category: '书籍',
    status: 'active',
    images: [],
    createTime: db.serverDate()  // 服务器当前时间
  }
}).then(res => {
  console.log('添加成功，记录ID：', res._id)
})
```

### 4.3 修改数据

```js
const db = wx.cloud.database()

// 修改自己的记录
db.collection('goods').doc('记录ID').update({
  data: {
    status: 'sold',  // 改为已售出
    price: 10
  }
}).then(() => {
  console.log('修改成功')
})
```

### 4.4 删除数据

```js
const db = wx.cloud.database()

db.collection('goods').doc('记录ID').remove().then(() => {
  console.log('删除成功')
})
```

---

## 五、如果我需要新增字段怎么办？

### 场景举例

> 成员B 发现商品需要加一个「新旧程度」字段

### 步骤

**不需要改数据库！直接在代码里加就行：**

```js
// 发布时直接加上新字段
db.collection('goods').add({
  data: {
    title: '二手教材',
    condition: '九成新',    // ← 新字段，直接写就行
    price: 15,
    // ... 其他字段
  }
})
```

**但是！** 新增字段前必须在群里通知所有成员，原因：

| 为什么 | 说明 |
|--------|------|
| 首页热门推荐 | 成员A 的首页要展示商品信息，需要知道有哪些字段可以显示 |
| 数据一致性 | 老数据没有这个字段，查询时要做兼容处理 |
| 文档同步 | 需要更新数据库设计文档 |

### 正确流程

```
1. 群里说一声："我打算给 goods 加个 condition 字段"
2. 确认无异议
3. 代码里直接用
4. 更新 docs/数据库设计文档.md
```

---

## 六、如果我需要新增集合怎么办？

### 场景举例

> 成员C 觉得需要加一个「教学楼」集合来单独管理楼栋信息

### 步骤

1. 打开云开发控制台 → 数据库
2. 点「添加集合」→ 输入集合名（如 `buildings`）
3. 选择权限（参考下表）
4. 在群里通知所有成员
5. 更新 `docs/数据库设计文档.md`

### 权限选择指南

| 权限选项 | 适用场景 | 本项目中的集合 |
|---------|---------|--------------|
| 读取全部数据，修改本人数据 | 大家都能看，只有创建者能改 | `users`、`goods`、`lost_found` |
| 读取和修改本人数据 | 只能看和改自己的 | `favorites`、`reservations` |
| 读取全部数据，不可修改数据 | 大家只能看，后台维护 | `announcements`、`classrooms` |
| 无权限 | 后台专用 | 暂无 |

---

## 七、图片上传（云存储）

商品图片、失物图片等需要上传到云存储：

```js
// 1. 选择图片
wx.chooseMedia({
  count: 9,
  mediaType: ['image']
}).then(res => {
  const tempFiles = res.tempFiles

  // 2. 上传到云存储
  const uploadTasks = tempFiles.map((file, index) => {
    const cloudPath = `goods/${Date.now()}_${index}.jpg`  // 云端路径
    return wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: file.tempFilePath
    })
  })

  // 3. 等待全部上传完成，获取文件ID
  Promise.all(uploadTasks).then(results => {
    const imageIds = results.map(r => r.fileID)
    console.log('图片上传成功：', imageIds)
    // 4. 把 imageIds 存到数据库的 images 字段
  })
})
```

图片在页面中直接用 `<image src="{{fileID}}" />` 就能显示。

---

## 八、目录结构

```
mini-program/
├── app.js              全局逻辑（云开发初始化）
├── app.json            全局配置（路由、TabBar）
├── app.wxss            全局样式
├── cloudfunctions/     云函数
│   └── login/          获取用户openid
├── docs/               文档
│   ├── 成员A-任务分析文档.md
│   └── 数据库设计文档.md
├── images/             静态图片资源
│   └── tab/            TabBar图标（待添加）
├── pages/
│   ├── index/          首页（成员A）
│   ├── user/           个人中心（成员A）
│   │   ├── index/        个人主页
│   │   ├── my-publish/   我的发布
│   │   ├── my-favorites/ 我的收藏
│   │   └── settings/     设置
│   ├── common/
│   │   └── about/        关于我们
│   ├── secondhand/     二手交易（成员B）
│   │   ├── list/         商品列表
│   │   ├── detail/       商品详情
│   │   └── publish/      发布商品
│   ├── lostfound/      失物招领（成员C）
│   │   ├── list/         信息列表
│   │   ├── detail/       信息详情
│   │   └── publish/      发布信息
│   └── studyroom/      自习助手（成员C）
│       ├── index/        教室查询
│       └── reservations/ 预约记录
├── utils/              工具函数
└── typings/            类型定义
```

---

## 九、开发规范

### 9.1 命名规范

- 页面目录名：小写+连字符，如 `my-publish`
- 文件名：与目录名一致，如 `my-publish.js`、`my-publish.wxml`
- 数据库字段：小驼峰，如 `createTime`、`contactInfo`
- 数据库集合名：小写+下划线，如 `lost_found`

### 9.2 Git 协作

- 每人开发自己的模块，不要改别人的文件
- 提交前先 `git pull` 拉最新代码
- 提交信息写清楚改了什么，如：`feat: 完成二手交易列表页`
- 有冲突及时在群里沟通

### 9.3 通用样式

`app.wxss` 中已定义全局样式，直接用 class 名即可：

```html
<view class="card">卡片容器</view>
<view class="list-item">列表项</view>
<view class="btn-primary">主按钮</view>
<view class="empty-state">空状态</view>
<view class="section-title">区块标题</view>
<view class="flex-row">横向排列</view>
<view class="flex-between">两端对齐</view>
```

---

> 📝 **有问题随时在群里问！**
