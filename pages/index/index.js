// pages/index/index.js — 首页
Page({
  data: {
    // 轮播图
    banners: [],
    // 快捷入口
    quickEntries: [
      { name: '二手交易', icon: '📦', url: '/pages/secondhand/list/list' },
      { name: '失物招领', icon: '🎯', url: '/pages/lostfound/list/list' },
      { name: '自习助手', icon: '📚', url: '/pages/studyroom/index/index' },
      { name: '更多服务', icon: '🔍', url: '/pages/user/index/index' }
    ],
    // 热门推荐（二手 + 失物）
    hotList: [],
    // 搜索关键词
    searchKeyword: ''
  },

  onLoad() {
    this.loadBanners()
    this.loadHotList()
  },

  onShow() {
    // 每次返回首页时刷新热门推荐
    this.loadHotList()
  },

  onPullDownRefresh() {
    Promise.all([this.loadBanners(), this.loadHotList()]).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载轮播图
  loadBanners() {
    const db = wx.cloud.database()
    db.collection('announcements')
      .orderBy('createTime', 'desc')
      .limit(5)
      .get()
      .then(res => {
        this.setData({ banners: res.data })
      })
      .catch(() => {
        // 无数据时使用默认轮播
        this.setData({
          banners: [
            { image: '', title: '欢迎使用校易通' }
          ]
        })
      })
  },

  // 加载热门推荐
  loadHotList() {
    const db = wx.cloud.database()
    const _ = db.command

    // 并行加载最新二手和失物信息
    const goodsPromise = db.collection('goods')
      .where({ status: 'active' })
      .orderBy('createTime', 'desc')
      .limit(10)
      .get()

    const lostPromise = db.collection('lost_found')
      .where({ status: 'active' })
      .orderBy('createTime', 'desc')
      .limit(10)
      .get()

    Promise.all([goodsPromise, lostPromise])
      .then(([goodsRes, lostRes]) => {
        // 合并、按时间排序，取前10条
        const goods = goodsRes.data.map(item => ({ ...item, __type: 'goods' }))
        const lost = lostRes.data.map(item => ({ ...item, __type: 'lost_found' }))
        const merged = [...goods, ...lost]
          .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
          .slice(0, 10)
        this.setData({ hotList: merged })
      })
      .catch(() => {
        console.warn('加载热门推荐失败，可能数据库集合尚未创建')
      })
  },

  // 搜索
  onSearch() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' })
      return
    }
    // 跳转到二手交易列表页带搜索参数
    wx.navigateTo({
      url: `/pages/secondhand/list/list?keyword=${encodeURIComponent(keyword)}`
    })
  },

  // 快捷入口跳转
  onQuickEntry(e) {
    const { url } = e.currentTarget.dataset
    if (url) {
      wx.switchTab({ url }).catch(() => {
        wx.navigateTo({ url })
      })
    }
  },

  // 点击热门推荐
  onTapRecommend(e) {
    const { item } = e.currentTarget.dataset
    if (item.__type === 'goods') {
      wx.navigateTo({
        url: `/pages/secondhand/detail/detail?id=${item._id}`
      })
    } else if (item.__type === 'lost_found') {
      wx.navigateTo({
        url: `/pages/lostfound/detail/detail?id=${item._id}`
      })
    }
  }
})
