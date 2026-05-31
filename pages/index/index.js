// pages/index/index.js — 首页
Page({
  data: {
    loading: true,       // 首次加载骨架屏
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

  onLoad() {
    this.loadBanners()
    this.loadHotList()
  },

  onShow() {
    this.loadHotList()
  },

  onPullDownRefresh() {
    Promise.all([this.loadBanners(), this.loadHotList()])
      .finally(() => wx.stopPullDownRefresh())
  },

  // ====== 加载轮播图 ======
  loadBanners() {
    const db = wx.cloud.database()
    return db.collection('announcements')
      .orderBy('createTime', 'desc')
      .limit(5)
      .get()
      .then(res => this.setData({ banners: res.data }))
      .catch(() => this.setData({ banners: [] }))
  },

  // ====== 加载热门推荐 + 收藏状态 ======
  loadHotList() {
    const db = wx.cloud.database()

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

    const favPromise = db.collection('favorites')
      .field({ itemId: true, itemType: true })
      .get()
      .catch(() => ({ data: [] }))

    return Promise.all([goodsPromise, lostPromise, favPromise])
      .then(([goodsRes, lostRes, favRes]) => {
        const favSet = new Set(
          favRes.data.map(r => `${r.itemType}_${r.itemId}`)
        )

        const goods = goodsRes.data.map(item => ({
          ...item,
          __type: 'goods',
          isFavorited: favSet.has(`goods_${item._id}`)
        }))
        const lost = lostRes.data.map(item => ({
          ...item,
          __type: 'lost_found',
          isFavorited: favSet.has(`lost_found_${item._id}`)
        }))

        const merged = [...goods, ...lost]
          .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
          .slice(0, 10)

        this.setData({ hotList: merged, loading: false })
      })
      .catch(err => {
        console.warn('加载热门推荐失败：', err)
        this.setData({ hotList: [], loading: false })
      })
  },

  // ====== 收藏 / 取消收藏 ======
  onToggleFavorite(e) {
    const { id, type } = e.currentTarget.dataset
    const app = getApp()

    // 检查登录
    if (!app.globalData.openid && !wx.getStorageSync('userInfo')) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const db = wx.cloud.database()
    const list = this.data.hotList
    const idx = list.findIndex(item => item._id === id)
    if (idx === -1) return

    const item = list[idx]
    const itemType = item.__type // 'goods' or 'lost_found'

    if (item.isFavorited) {
      // 取消收藏
      db.collection('favorites')
        .where({ itemId: id, itemType })
        .remove()
        .then(() => {
          list[idx].isFavorited = false
          this.setData({ hotList: list })
          wx.showToast({ title: '已取消收藏', icon: 'none' })
        })
        .catch(() => wx.showToast({ title: '操作失败', icon: 'none' }))
    } else {
      // 添加收藏
      db.collection('favorites').add({
        data: {
          itemId: id,
          itemType,
          createTime: db.serverDate()
        }
      }).then(() => {
        list[idx].isFavorited = true
        this.setData({ hotList: list })
        wx.showToast({ title: '已收藏', icon: 'success' })
      }).catch(() => wx.showToast({ title: '操作失败', icon: 'none' }))
    }
  },

  // ====== 搜索 ======
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onSearch() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/pages/common/search-results/search-results?keyword=${encodeURIComponent(keyword)}`
    })
    this.setData({ searchKeyword: '' })
  },

  // ====== 快捷入口 ======
  onQuickEntry(e) {
    const { url } = e.currentTarget.dataset
    if (url) {
      wx.switchTab({
        url,
        fail: () => wx.navigateTo({ url })
      })
    }
  },

  // ====== 轮播图点击 → 公告详情 ======
  onBannerTap(e) {
    const { id } = e.currentTarget.dataset
    if (id) {
      wx.navigateTo({
        url: `/pages/common/announcement-detail/announcement-detail?id=${id}`
      })
    }
  },

  // ====== 热门推荐点击 → 跳转详情 ======
  onTapRecommend(e) {
    const { item } = e.currentTarget.dataset
    if (item.__type === 'goods') {
      wx.navigateTo({ url: `/pages/secondhand/detail/detail?id=${item._id}` })
    } else if (item.__type === 'lost_found') {
      wx.navigateTo({ url: `/pages/lostfound/detail/detail?id=${item._id}` })
    }
  }
})
