// pages/user/my-publish/my-publish.js — 我的发布
Page({
  data: {
    // 切换 tab
    activeTab: 0, // 0=二手, 1=失物
    tabs: ['我发布的二手', '我发布的失物'],
    // 列表数据
    list: [],
    loading: false,
    noMore: false,
    openidRetry: 0
  },

  onLoad() {
    this.loadData()
  },

  // 切换 tab
  onTabChange(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ activeTab: index, list: [], noMore: false, openidRetry: 0 })
    this.loadData()
  },

  // 加载数据
  loadData() {
    const app = getApp()
    if (!app.globalData.openid) {
      if (this.data.openidRetry >= 5) {
        wx.showToast({ title: '获取用户信息失败，请返回重试', icon: 'none' })
        return
      }
      this.setData({ openidRetry: this.data.openidRetry + 1 })
      setTimeout(() => this.loadData(), 500)
      return
    }

    this.setData({ loading: true })

    const db = wx.cloud.database()
    const collectionName = this.data.activeTab === 0 ? 'goods' : 'lost_found'

    db.collection(collectionName)
      .where({
        _openid: app.globalData.openid
      })
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        this.setData({ list: res.data, loading: false })
      })
      .catch(err => {
        console.error('加载发布记录失败：', err)
        this.setData({ loading: false, list: [] })
        wx.showToast({ title: '加载失败，请下拉刷新', icon: 'none' })
      })
  },

  // 点击列表项
  onItemTap(e) {
    const { item } = e.currentTarget.dataset
    const prefix = this.data.activeTab === 0 ? '/pages/secondhand/detail/detail' : '/pages/lostfound/detail/detail'
    wx.navigateTo({
      url: `${prefix}?id=${item._id}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ openidRetry: 0 })
    this.loadData()
    wx.stopPullDownRefresh()
  }
})
