# Bug 修复清单 - 成员C

## 已发现的 Bug

### 失物招领模块 (lostfound)
- [ ] Bug 1: `type` 字段值使用中文"失物"/"招领"，但数据库设计应为 `lost`/`found`
- [ ] Bug 2: `status` 字段值使用"已找到"/"已认领"，但数据库设计应为 `resolved`
- [ ] Bug 3: `contactName`/`contactPhone` 字段名与数据库设计文档的 `contactInfo` 不匹配

### 自习助手模块 (studyroom)
- [ ] Bug 4: `reservations` 的 `status` 字段值使用中文，与数据库设计文档不匹配
- [ ] Bug 5: `classrooms` 的 `status` 字段值使用中文"空闲"/"占用"，应为 `free`/`occupied`
- [ ] Bug 6: `timeSlot` 时间段值与数据库设计文档不一致
- [ ] Bug 7: `reservations` 查询使用 `userId` 字段，但微信云开发应使用 `_openid`
