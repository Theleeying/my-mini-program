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
    searchKeyword: '',
    categories: [
      { name: '书籍', icon: '📚' },
      { name: '电子产品', icon: '💻' },
      { name: '生活用品', icon: '🏠' },
      { name: '服饰', icon: '👗' },
      { name: '其他', icon: '📌' }
    ]
  },

  onLoad: function () {
    var that = this
    this.loadBanners()
    this.loadHotList()

    // 绝对兜底：8秒后无论如何释放 loading
    setTimeout(function () {
      if (that.data.loading) {
        that.setData({ loading: false })
      }
    }, 8000)
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
    var that = this

    // 防御1：cloud 未初始化
    if (!wx.cloud || typeof wx.cloud.database !== 'function') {
      that.setData({ banners: that.getLocalBanners() })
      return Promise.resolve()
    }

    // 防御2：同步异常
    var db
    try {
      db = wx.cloud.database()
    } catch (e) {
      that.setData({ banners: that.getLocalBanners() })
      return Promise.resolve()
    }

    // 防御3：3秒超时保底
    var timeout = new Promise(function (resolve) {
      setTimeout(function () { resolve('timeout') }, 3000)
    })

    var query = db.collection('announcements')
      .orderBy('createTime', 'desc')
      .limit(5)
      .get()

    return Promise.race([query, timeout])
      .then(function (res) {
        if (res === 'timeout' || !res.data || res.data.length === 0) {
          that.setData({ banners: that.getLocalBanners() })
        } else {
          that.setData({ banners: res.data })
        }
      })
      .catch(function () {
        that.setData({ banners: that.getLocalBanners() })
      })
  },

  getLocalBanners: function () {
    return [
      { _id: 'banner1', image: '/images/banner/banner1.jpg', title: '欢迎使用校易通' },
      { _id: 'banner2', image: '/images/banner/banner2.jpg', title: '二手交易，物尽其用' },
      { _id: 'banner3', image: '/images/banner/banner3.jpg', title: '失物招领，互帮互助' }
    ]
  },

  // 加载热门推荐 + 收藏状态
  loadHotList: function () {
    var that = this
    var app = getApp()

    // 防御1：cloud 未初始化 / 同步异常
    var db
    if (!wx.cloud || typeof wx.cloud.database !== 'function') {
      that.setData({ hotList: [], loading: false })
      return Promise.resolve()
    }
    try {
      db = wx.cloud.database()
    } catch (e) {
      that.setData({ hotList: [], loading: false })
      return Promise.resolve()
    }

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

    // 有 openid 时才查当前用户收藏状态（未登录时回退为空，不影响浏览）
    var favPromise = app.ensureOpenid().then(function (openid) {
      return db.collection('favorites')
        .where({ _openid: openid })
        .field({ itemId: true, itemType: true })
        .get()
    }).catch(function () {
      return { data: [] }
    })

    // 防御2：5秒超时保底
    var timeout = new Promise(function (resolve) {
      setTimeout(function () { resolve('__hot_timeout') }, 5000)
    })

    var query = Promise.all([goodsPromise, lostPromise, favPromise])

    return Promise.race([query, timeout])
      .then(function (results) {
        if (results === '__hot_timeout') {
          that.setData({ hotList: [], loading: false })
          return
        }

        var goodsRes = results[0]
        var lostRes = results[1]
        var favRes = results[2]

        var favSet = {}
        ;(favRes.data || []).forEach(function (r) {
          favSet[r.itemType + '_' + r.itemId] = true
        })

        var goods = (goodsRes.data || []).map(function (item) {
          return Object.assign({}, item, {
            __type: 'goods',
            isFavorited: !!favSet['goods_' + item._id]
          })
        })

        var lost = (lostRes.data || []).map(function (item) {
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
      // 必须带上 _openid，避免误删其他用户的收藏记录
      app.ensureOpenid().then(function (openid) {
        return db.collection('favorites')
          .where({ itemId: id, itemType: itemType, _openid: openid })
          .remove()
      }).then(function () {
        list[idx].isFavorited = false
        that.setData({ hotList: list })
        wx.showToast({ title: '已取消收藏', icon: 'none' })
      }).catch(function () { wx.showToast({ title: '操作失败', icon: 'none' }) })
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

  // 分类标签点击 → 跳转搜索结果（分类浏览）
  onCategoryTap: function (e) {
    var category = e.currentTarget.dataset.category
    if (category) {
      wx.navigateTo({
        url: '/pages/common/search-results/search-results?category=' + encodeURIComponent(category)
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