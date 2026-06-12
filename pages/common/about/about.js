// pages/common/about/about.js — 关于我们
Page({
  data: {
    appName: '校易通',
    version: '1.0.0',
    description: '校易通是一款专为在校大学生打造的校园综合服务平台，整合了二手交易、失物招领、自习助手等常用功能，旨在为学生提供便捷的一站式校园服务体验。',
    team: [
      { name: '黄宇超', role: '首页/个人中心', xh: '待填入' },
      { name: '李钊', role: '二手交易模块', xh: '待填入' },
      { name: '潘晨曦', role: '失物招领/自习助手', xh: '待填入' }
    ]
  },

  onLoad() {
    // 预留，后续可以从云数据库加载成员信息
  }
})
