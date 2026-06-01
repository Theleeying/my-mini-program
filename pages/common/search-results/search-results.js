// pages/common/search-results/search-results.js — 全局搜索结果
Page({
  data: {
    keyword: '',
    activeTab: 0,
    tabs: ['全部', '二手交易', '失物招领'],
    allList: [],
    goodsList: [],
    lostList: [],
    displayList: [],
    loading: true,
    noResult: false
  },

  onLoad: function (options) {
    var keyword = decodeURIComponent(options.keyword || '')
    if (!keyword) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' })
      setTimeout(function () { wx.navigateBack() }, 1500)
      return
    }
    this.setData({ keyword: keyword })
    this.doSearch(keyword)
  },

  // 注意：微信云数据库不支持服务端全文检索，目前采用「拉取最新 N 条 → 客户端过滤」方案。
  // 受 limit 限制，可能遗漏旧数据中匹配的关键词。数据量增大后可考虑：
  //   1. 使用 db.RegExp 做服务端正则匹配（需建索引）
  //   2. 接入 ElasticSearch 或自建搜索云函数
  doSearch: function (keyword) {
    var db = wx.cloud.database()
    var kw = keyword.toLowerCase()
    var that = this

    // 仅拉取最新活跃记录，服务端做初筛
    var goodsPromise = db.collection('goods')
      .where({ status: 'active' })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()

    var lostPromise = db.collection('lost_found')
      .where({ status: 'active' })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()

    Promise.all([goodsPromise, lostPromise]).then(function (results) {
      var goodsRes = results[0]
      var lostRes = results[1]

      function match(text) {
        return String(text || '').toLowerCase().indexOf(kw) !== -1
      }

      var goods = []
      goodsRes.data.forEach(function (item) {
        if (match(item.title) || match(item.description) || match(item.category)) {
          var copy = {}
          var keys = Object.keys(item)
          for (var k = 0; k < keys.length; k++) { copy[keys[k]] = item[keys[k]] }
          copy.__type = 'goods'
          goods.push(copy)
        }
      })

      var lost = []
      lostRes.data.forEach(function (item) {
        if (match(item.title) || match(item.description) || match(item.category)) {
          var copy = {}
          var keys = Object.keys(item)
          for (var k2 = 0; k2 < keys.length; k2++) { copy[keys[k2]] = item[keys[k2]] }
          copy.__type = 'lost_found'
          lost.push(copy)
        }
      })

      var all = goods.concat(lost)
        .sort(function (a, b) { return new Date(b.createTime) - new Date(a.createTime) })

      that.setData({
        allList: all,
        goodsList: goods,
        lostList: lost,
        displayList: all,
        loading: false,
        noResult: all.length === 0
      })
    }).catch(function (err) {
      console.error('搜索失败：', err)
      that.setData({ loading: false, noResult: true })
    })
  },

  onTabChange: function (e) {
    var idx = parseInt(e.currentTarget.dataset.index)
    var displayList
    if (idx === 0) displayList = this.data.allList
    else if (idx === 1) displayList = this.data.goodsList
    else displayList = this.data.lostList

    this.setData({ activeTab: idx, displayList: displayList })
  },

  onSearchConfirm: function (e) {
    var kw = (e.detail.value || '').trim()
    if (!kw) return
    this.setData({ keyword: kw, loading: true, activeTab: 0 })
    this.doSearch(kw)
  },

  onItemTap: function (e) {
    var item = e.currentTarget.dataset.item
    var url = item.__type === 'goods'
      ? '/pages/secondhand/detail/detail?id=' + item._id
      : '/pages/lostfound/detail/detail?id=' + item._id
    wx.navigateTo({ url: url })
  }
})
