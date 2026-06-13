// pages/user/my-publish/my-publish.js — 我的发布
Page({
  data: {
    activeTab: 0,
    tabs: ['我发布的二手', '我发布的失物'],
    list: [],
    loading: false
  },

  onLoad: function () {
    this.loadData()
  },

  onTabChange: function (e) {
    var index = e.currentTarget.dataset.index
    this.setData({ activeTab: index, list: [] })
    this.loadData()
  },

  loadData: function () {
    var app = getApp()
    var that = this

    that.setData({ loading: true })

    app.ensureOpenid().then(function (openid) {
      var db = wx.cloud.database()
      var collectionName = that.data.activeTab === 0 ? 'goods' : 'lost_found'

      db.collection(collectionName)
        .where({ _openid: openid })
        .orderBy('createTime', 'desc')
        .get()
        .then(function (res) {
          var list = res.data.map(function (item) {
            item.createTimeText = that.formatTime(item.createTime)
            return item
          })
          that.setData({ list: list, loading: false })
        })
        .catch(function (err) {
          console.error('加载发布记录失败：', err)
          that.setData({ loading: false, list: [] })
        })
    }).catch(function () {
      that.setData({ loading: false, list: [] })
      wx.showToast({ title: '获取用户信息失败，请返回重试', icon: 'none' })
    })
  },

  onItemTap: function (e) {
    var item = e.currentTarget.dataset.item
    var prefix = this.data.activeTab === 0
      ? '/pages/secondhand/detail/detail'
      : '/pages/lostfound/detail/detail'
    wx.navigateTo({
      url: prefix + '?id=' + item._id
    })
  },

  onPullDownRefresh: function () {
    this.loadData()
    wx.stopPullDownRefresh()
  },

  formatTime: function (date) {
    if (!date) return ''
    if (typeof date === 'string') return date.slice(0, 10)
    var d = new Date(date)
    if (isNaN(d.getTime())) return ''
    var now = new Date()
    var diff = now - d
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    if (diff < 2592000000) return Math.floor(diff / 86400000) + '天前'
    var y = d.getFullYear()
    var m = ('0' + (d.getMonth() + 1)).slice(-2)
    var day = ('0' + d.getDate()).slice(-2)
    return y + '-' + m + '-' + day
  }
})
