// pages/lostfound/list/list.js — 失物招领列表（占位 — 成员C 负责）
Page({
  data: {
    activeTab: 0, // 0=失物, 1=招领
    list: []
  },
  onLoad() { /* TODO: 成员C */ },
  onTabChange(e) { /* TODO: 成员C */ },
  onPublish() {
    wx.navigateTo({ url: '/pages/lostfound/publish/publish' })
  },
  onItemTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/lostfound/detail/detail?id=${id}` })
  }
})
