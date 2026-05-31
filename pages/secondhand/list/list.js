// pages/secondhand/list/list.js — 二手交易列表（占位 — 成员B 负责）
Page({
  data: {
    list: [],
    keyword: ''
  },
  onLoad(options) {
    if (options.keyword) {
      this.setData({ keyword: options.keyword })
    }
    this.loadData()
  },
  loadData() {
    // TODO: 成员B 实现商品列表加载逻辑
  },
  onSearch() {
    // TODO: 成员B 实现搜索逻辑
  },
  onPublish() {
    wx.navigateTo({ url: '/pages/secondhand/publish/publish' })
  },
  onItemTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/secondhand/detail/detail?id=${id}` })
  }
})
