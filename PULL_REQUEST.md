# Pull Request: 修复教室预约模块数据不同步问题

## 修改内容

### 1. `pages/studyroom/index/index.js` — 教室预约首页

**问题：**
- 教学楼名称使用 `教学楼A/B/C/D`，与数据库设计文档中的 `A栋/B栋/C栋/D栋` 不匹配，导致查不到数据
- 教室状态使用 `getRandomStatus()` 随机生成，未从数据库真实预约记录查询
- 没有 `onShow` 生命周期，切换页面返回时不会刷新数据
- 没有下拉刷新支持
- 预约时手动传入 `_openid` 字段，与云开发自动添加的 `_openid` 冲突，导致预约失败

**修复：**
- 教学楼名称改为 `A栋/B栋/C栋/D栋/图书馆`（与数据库设计一致）
- 删除 `getRandomStatus()`，改为从 `reservations` 集合查询当前日期、时间段、状态为 `active` 的真实预约记录来判断占用状态
- 新增 `onShow` 生命周期，每次进入页面自动刷新
- 新增 `onPullDownRefresh` 下拉刷新
- 去掉手动传入的 `_openid`，让云开发自动处理

### 2. `pages/studyroom/reservations/reservations.js` — 预约记录页

**问题：**
- 查询预约记录时没有按 `_openid` 过滤，会查到所有用户的记录
- 没有关联查询教室名称，显示信息不完整
- 使用了 `completed` 状态值，但数据库设计文档中只有 `active`/`cancelled`
- 没有下拉刷新支持

**修复：**
- 查询条件增加 `_openid` 过滤，只显示当前用户预约记录
- 通过 `classroomId` 批量查询 `classrooms` 集合，关联显示教室完整名称
- 状态值统一为 `active`/`cancelled`，去掉不存在的 `completed` 状态
- Tab 从 `['全部', '已预约', '已完成', '已取消']` 改为 `['全部', '已预约', '已取消']`
- 新增 `onPullDownRefresh` 下拉刷新

### 3. `pages/studyroom/reservations/reservations.wxml` — 预约记录模板

**修复：**
- 状态显示与数据库设计一致（`active` → 已预约，其他 → 已取消）
- 教室名称优先显示关联查询后的 `roomName` 字段

## 参考依据

- 数据库设计文档：`docs/数据库设计文档.md`
- 其他成员代码风格：`pages/lostfound/list/list.js`（失物招领列表）、`pages/user/my-reservations/my-reservations.js`（我的预约）
