// pages/lostfound/list/list.js — 失物招领列表
Page({
  data: {
    loading: true,
    activeTab: 0, // 0=失物, 1=招领
    list: [],
    keyword: '',
    categories: ['全部', '证件', '电子产品', '生活用品', '其他'],
    activeCategory: '全部'
  },

  onLoad: function () {
    this.loadData()
  },

  onShow: function () {
    // 接收从首页搜索栏传来的关键词
    var app = getApp()
    var keyword = app.globalData.searchKeyword
    if (keyword) {
      this.setData({ keyword: keyword })
      app.globalData.searchKeyword = ''
      this.loadData()
    }
  },

  onPullDownRefresh: function () {
    var that = this
    that.loadData()
      .then(function () { wx.stopPullDownRefresh() })
      .catch(function () { wx.stopPullDownRefresh() })
  },

  // 加载数据
  loadData: function () {
    var that = this
    var db = wx.cloud.database()
    var _ = db.command
    var condition = { status: 'active' }

    // 按类型筛选
    if (that.data.activeTab === 0) {
      condition.type = 'lost'
    } else {
      condition.type = 'found'
    }

    // 按分类筛选
    if (that.data.activeCategory !== '全部') {
      condition.category = that.data.activeCategory
    }

    // 按关键词搜索
    if (that.data.keyword) {
      condition.title = db.RegExp({
        regexp: that.data.keyword,
        options: 'i'
      })
    }

    return db.collection('lost_found')
      .where(condition)
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
        console.warn('加载失物招领列表失败：', err)
        that.setData({ list: [], loading: false })
      })
  },

  // 切换失物/招领
  onTabChange: function (e) {
    var index = parseInt(e.currentTarget.dataset.index)
    this.setData({ activeTab: index, loading: true }, function () {
      this.loadData()
    })
  },

  // 选择分类
  onCategoryChange: function (e) {
    var cat = e.currentTarget.dataset.category
    this.setData({ activeCategory: cat, loading: true }, function () {
      this.loadData()
    })
  },

  // 搜索输入
  onSearchInput: function (e) {
    this.setData({ keyword: e.detail.value })
  },

  // 执行搜索
  onSearch: function () {
    this.setData({ loading: true })
    this.loadData()
  },

  // 跳转发布页
  onPublish: function () {
    wx.navigateTo({ url: '/pages/lostfound/publish/publish' })
  },

  // 跳转详情页
  onItemTap: function (e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/lostfound/detail/detail?id=' + id })
  },

  formatTime: function (date) {
    if (!date) return ''
    if (typeof date === 'string') return date.slice(0, 10)
    // 云数据库返回的 Date 对象
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
