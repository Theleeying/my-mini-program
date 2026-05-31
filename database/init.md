# 校易通 - 云数据库配置

## 1. 创建数据库集合

在微信开发者工具 → 云开发 → 数据库 中创建以下集合：

| 集合名称 | 用途 | 权限模式 |
|---------|------|---------|
| `goods` | 二手商品 | 自定义规则 |
| `lost_found` | 失物招领 | 自定义规则 |
| `classrooms` | 自习教室 | 仅创建者可读写 |
| `reservations` | 预约记录 | 仅创建者可读写 |
| `users` | 用户信息 | 仅创建者可读写 |
| `favorites` | 收藏记录 | 仅创建者可读写 |
| `comments` | 评论 | 仅创建者可读写 |

---

## 2. goods 集合权限规则

**需求**：所有用户可读，所有用户可写入，仅创建者可修改/删除自己的记录。

```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

> 说明：`write` 权限设为仅创建者可写，意味着更新和删除操作也只能由发布者执行。
> "所有人可新增" 实际上是所有人都能 `add`，云开发数据库的 `write` 同时控制新增、更新、删除。
> **若需要"所有人可新增、但仅创建者可修改"，请使用以下方案**：

```json
{
  "read": true,
  "create": true,
  "update": "doc._openid == auth.openid",
  "delete": "doc._openid == auth.openid"
}
```

> 注意：微信云开发的自定义安全规则需在 云开发控制台 → 数据库 → 集合 → 权限设置 → 自定义安全规则 中配置。
> 如果当前控制台仅支持 `{read, write}` 模式，则使用：
```json
{
  "read": true,
  "write": true
}
```
> 并且在云函数中通过代码逻辑做 `_openid` 校验（后续接入云函数时实现）。

---

## 3. favorites 集合权限规则

```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

> 收藏记录属于私有数据，只有用户自己能读写。

---

## 4. 其他集合（通用建议）

| 集合 | read | write |
|------|------|-------|
| `lost_found` | `true` | `doc._openid == auth.openid` |
| `classrooms` | `true` | 管理员（暂用 `true`） |
| `reservations` | `doc._openid == auth.openid` | `doc._openid == auth.openid` |
| `users` | `doc._openid == auth.openid` | `doc._openid == auth.openid` |
| `comments` | `true` | `doc._openid == auth.openid` |

---

## 5. goods 集合索引建议

| 索引字段 | 类型 | 说明 |
|---------|------|------|
| `category` | 普通索引 | 按分类筛选 |
| `status` | 普通索引 | 筛选在售商品 |
| `createTime` | 时间降序 | 按时间排序 |
| `price` | 普通索引 | 按价格排序 |
| `title` | 文本搜索索引 | 关键词搜索 |

> 在云开发控制台 → 数据库 → goods 集合 → 索引管理中添加。

---

## 6. 云存储配置

在云开发控制台 → 存储 → 权限设置：

- 云存储读权限：`所有用户可读`
- 云存储写权限：`仅创建者可写` 或 `所有用户可写`（推荐前者，配合小程序端 `wx.cloud.uploadFile` 使用）

---

## 7. 环境初始化（在 app.js 中）

```javascript
// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: 'your-env-id', // 替换为你的云环境 ID
      traceUser: true
    });
  }
});
```

> 请将 `'your-env-id'` 替换为你实际的云环境 ID（在微信开发者工具 → 云开发 → 设置 中查看）。