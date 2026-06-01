// pages/common/search-results/search-results.js — 全局搜索结果（关键词 + 分类浏览）
Page({
  data: {
    keyword: '',
    category: '',
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
    var category = decodeURIComponent(options.category || '')

    if (!keyword && !category) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' })
      setTimeout(function () { wx.navigateBack() }, 1500)
      return
    }

    this.setData({ keyword: keyword, category: category })
    this.doSearch(keyword, category)
  },

  // 注意：微信云数据库不支持服务端全文检索，目前采用「拉取最新 N 条 → 客户端过滤」方案。
  // 受 limit 限制，可能遗漏旧数据中匹配的关键词。数据量增大后可考虑：
  //   1. 使用 db.RegExp 做服务端正则匹配（需建索引）
  //   2. 接入 ElasticSearch 或自建搜索云函数
  doSearch: function (keyword, category) {
    var db = wx.cloud.database()
    var kw = keyword.toLowerCase()
    var that = this

    // 按分类过滤时拼到 where 条件中
    function buildWhere(base) {
      var cond = Object.assign({}, base)
      if (category) cond.category = category
      return cond
    }

    // 仅拉取最新活跃记录，服务端做初筛
    var goodsPromise = db.collection('goods')
      .where(buildWhere({ status: 'active' }))
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()

    var lostPromise = db.collection('lost_found')
      .where(buildWhere({ status: 'active' }))
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()

    Promise.all([goodsPromise, lostPromise]).then(function (results) {
      var goodsRes = results[0]
      var lostRes = results[1]

      function match(text) {
        return String(text || '').toLowerCase().indexOf(kw) !== -1
      }

      // 仅关键词搜索时做客户端过滤；分类浏览时不需 keyword 匹配
      function shouldInclude(item) {
        if (!kw) return true
        return match(item.title) || match(item.description) || match(item.category)
      }

      var goods = []
      goodsRes.data.forEach(function (item) {
        if (shouldInclude(item)) {
          goods.push(Object.assign({}, item, { __type: 'goods' }))
        }
      })

      var lost = []
      lostRes.data.forEach(function (item) {
        if (shouldInclude(item)) {
          lost.push(Object.assign({}, item, { __type: 'lost_found' }))
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
    if (!kw) {
      // 清空关键词后，回到纯分类浏览
      if (this.data.category) {
        this.setData({ keyword: '', loading: true, activeTab: 0 })
        this.doSearch('', this.data.category)
      }
      return
    }
    this.setData({ keyword: kw, loading: true, activeTab: 0 })
    this.doSearch(kw, this.data.category)
  },

  onItemTap: function (e) {
    var item = e.currentTarget.dataset.item
    var url = item.__type === 'goods'
      ? '/pages/secondhand/detail/detail?id=' + item._id
      : '/pages/lostfound/detail/detail?id=' + item._id
    wx.navigateTo({ url: url })
  }
})
