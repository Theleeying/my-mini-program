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
      condition.type = '失物'
    } else {
      condition.type = '招领'
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
        that.setData({ list: res.data, loading: false })
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
  }
})
