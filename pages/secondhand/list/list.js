// pages/secondhand/list/list.js — 二手交易列表（占位 — 成员B 负责）
Page({
  data: {
    list: [],
    keyword: ''
  },
  onLoad() {
    this.loadData()
  },
  onShow() {
    // 接收从首页搜索栏传来的关键词
    const app = getApp()
    const keyword = app.globalData.searchKeyword
    if (keyword) {
      this.setData({ keyword })
      // 清除全局关键词，避免下次进来还在搜
      app.globalData.searchKeyword = ''
      this.loadData()
    }
  },
  loadData() {
    // TODO: 成员B 实现商品列表加载逻辑（此页面为占位页）
    // 提示：可用 this.data.keyword 过滤搜索结果
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
