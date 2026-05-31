// pages/index/index.js — 首页
Page({
  data: {
    loading: true,
    banners: [],
    quickEntries: [
      { name: '二手交易', icon: '📦', url: '/pages/secondhand/list/list' },
      { name: '失物招领', icon: '🎯', url: '/pages/lostfound/list/list' },
      { name: '自习助手', icon: '📚', url: '/pages/studyroom/index/index' },
      { name: '更多服务', icon: '🔍', url: '/pages/user/index/index' }
    ],
    hotList: [],
    searchKeyword: ''
  },

  onLoad: function () {
    this.loadBanners()
    this.loadHotList()
  },

  onShow: function () {
    this.loadHotList()
  },

  onPullDownRefresh: function () {
    var that = this
    Promise.all([that.loadBanners(), that.loadHotList()])
      .then(function () { wx.stopPullDownRefresh() })
      .catch(function () { wx.stopPullDownRefresh() })
  },

  // 加载轮播图
  loadBanners: function () {
    var db = wx.cloud.database()
    var that = this
    return db.collection('announcements')
      .orderBy('createTime', 'desc')
      .limit(5)
      .get()
      .then(function (res) { that.setData({ banners: res.data }) })
      .catch(function () { that.setData({ banners: [] }) })
  },

  // 加载热门推荐 + 收藏状态
  loadHotList: function () {
    var db = wx.cloud.database()
    var that = this

    var goodsPromise = db.collection('goods')
      .where({ status: 'active' })
      .orderBy('createTime', 'desc')
      .limit(10)
      .get()

    var lostPromise = db.collection('lost_found')
      .where({ status: 'active' })
      .orderBy('createTime', 'desc')
      .limit(10)
      .get()

    var favPromise = db.collection('favorites')
      .field({ itemId: true, itemType: true })
      .get()

    return Promise.all([goodsPromise, lostPromise, favPromise])
      .then(function (results) {
        var goodsRes = results[0]
        var lostRes = results[1]
        var favRes = results[2]

        var favSet = {}
        ;(favRes.data || []).forEach(function (r) {
          favSet[r.itemType + '_' + r.itemId] = true
        })

        var goods = goodsRes.data.map(function (item) {
          return Object.assign({}, item, {
            __type: 'goods',
            isFavorited: !!favSet['goods_' + item._id]
          })
        })

        var lost = lostRes.data.map(function (item) {
          return Object.assign({}, item, {
            __type: 'lost_found',
            isFavorited: !!favSet['lost_found_' + item._id]
          })
        })

        var merged = goods.concat(lost)
          .sort(function (a, b) { return new Date(b.createTime) - new Date(a.createTime) })
          .slice(0, 10)

        that.setData({ hotList: merged, loading: false })
      })
      .catch(function (err) {
        console.warn('加载热门推荐失败：', err)
        that.setData({ hotList: [], loading: false })
      })
  },

  // 收藏 / 取消收藏
  onToggleFavorite: function (e) {
    var id = e.currentTarget.dataset.id
    var type = e.currentTarget.dataset.type
    var app = getApp()

    if (!wx.getStorageSync('userInfo')) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    var db = wx.cloud.database()
    var list = this.data.hotList
    var idx = -1
    for (var i = 0; i < list.length; i++) {
      if (list[i]._id === id) { idx = i; break }
    }
    if (idx === -1) return

    var item = list[idx]
    var itemType = item.__type
    var that = this

    if (item.isFavorited) {
      db.collection('favorites')
        .where({ itemId: id, itemType: itemType })
        .remove()
        .then(function () {
          list[idx].isFavorited = false
          that.setData({ hotList: list })
          wx.showToast({ title: '已取消收藏', icon: 'none' })
        })
        .catch(function () { wx.showToast({ title: '操作失败', icon: 'none' }) })
    } else {
      db.collection('favorites').add({
        data: {
          itemId: id,
          itemType: itemType,
          createTime: db.serverDate()
        }
      }).then(function () {
        list[idx].isFavorited = true
        that.setData({ hotList: list })
        wx.showToast({ title: '已收藏', icon: 'success' })
      }).catch(function () { wx.showToast({ title: '操作失败', icon: 'none' }) })
    }
  },

  // 搜索
  onSearchInput: function (e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onSearch: function () {
    var keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/common/search-results/search-results?keyword=' + encodeURIComponent(keyword)
    })
    this.setData({ searchKeyword: '' })
  },

  // 快捷入口
  onQuickEntry: function (e) {
    var url = e.currentTarget.dataset.url
    if (url) {
      wx.switchTab({
        url: url,
        fail: function () { wx.navigateTo({ url: url }) }
      })
    }
  },

  // 轮播图点击
  onBannerTap: function (e) {
    var id = e.currentTarget.dataset.id
    if (id) {
      wx.navigateTo({
        url: '/pages/common/announcement-detail/announcement-detail?id=' + id
      })
    }
  },

  // 热门推荐点击
  onTapRecommend: function (e) {
    var item = e.currentTarget.dataset.item
    if (item.__type === 'goods') {
      wx.navigateTo({ url: '/pages/secondhand/detail/detail?id=' + item._id })
    } else if (item.__type === 'lost_found') {
      wx.navigateTo({ url: '/pages/lostfound/detail/detail?id=' + item._id })
    }
  }
})
