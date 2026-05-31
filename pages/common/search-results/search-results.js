// pages/common/search-results/search-results.js — 全局搜索结果
Page({
  data: {
    keyword: '',
    activeTab: 0,
    tabs: ['全部', '二手交易', '失物招领'],
    allList: [],     // 全部结果
    goodsList: [],    // 仅二手
    lostList: [],     // 仅失物
    displayList: [],  // 当前展示的列表
    loading: true,
    noResult: false
  },

  onLoad(options) {
    const keyword = decodeURIComponent(options.keyword || '')
    if (!keyword) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ keyword })
    this.doSearch(keyword)
  },

  doSearch(keyword) {
    const db = wx.cloud.database()
    const kw = keyword.toLowerCase()

    const goodsPromise = db.collection('goods')
      .where({ status: 'active' })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()
      .catch(() => ({ data: [] }))

    const lostPromise = db.collection('lost_found')
      .where({ status: 'active' })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()
      .catch(() => ({ data: [] }))

    Promise.all([goodsPromise, lostPromise]).then(([goodsRes, lostRes]) => {
      // 客户端关键词过滤
      const match = (text) => String(text || '').toLowerCase().includes(kw)

      const goods = goodsRes.data
        .filter(item => match(item.title) || match(item.description) || match(item.category))
        .map(item => ({ ...item, __type: 'goods' }))

      const lost = lostRes.data
        .filter(item => match(item.title) || match(item.description) || match(item.category))
        .map(item => ({ ...item, __type: 'lost_found' }))

      const all = [...goods, ...lost]
        .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))

      this.setData({
        allList: all,
        goodsList: goods,
        lostList: lost,
        displayList: all,
        loading: false,
        noResult: all.length === 0
      })
    }).catch(err => {
      console.error('搜索失败：', err)
      this.setData({ loading: false, noResult: true })
    })
  },

  // Tab 切换
  onTabChange(e) {
    const idx = parseInt(e.currentTarget.dataset.index)
    let displayList
    if (idx === 0) displayList = this.data.allList
    else if (idx === 1) displayList = this.data.goodsList
    else displayList = this.data.lostList

    this.setData({ activeTab: idx, displayList })
  },

  // 搜索框回车
  onSearchConfirm(e) {
    const kw = (e.detail.value || '').trim()
    if (!kw) return
    this.setData({ keyword: kw, loading: true, activeTab: 0 })
    this.doSearch(kw)
  },

  // 点击结果
  onItemTap(e) {
    const { item } = e.currentTarget.dataset
    const url = item.__type === 'goods'
      ? `/pages/secondhand/detail/detail?id=${item._id}`
      : `/pages/lostfound/detail/detail?id=${item._id}`
    wx.navigateTo({ url })
  },

  // 返回
  onBack() {
    wx.navigateBack()
  }
})
