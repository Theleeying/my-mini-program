// pages/user/my-favorites/my-favorites.js — 我的收藏
Page({
  data: {
    activeTab: 0,
    tabs: ['收藏的二手', '收藏的失物'],
    list: [],
    loading: false
  },

  onShow: function () {
    this.loadFavorites()
  },

  onTabChange: function (e) {
    var idx = e.currentTarget.dataset.index
    this.setData({ activeTab: idx })
    this.loadFavorites()
  },

  loadFavorites: function () {
    var db = wx.cloud.database()
    var itemType = this.data.activeTab === 0 ? 'goods' : 'lost_found'
    var that = this
    var app = getApp()

    that.setData({ loading: true })

    // 先确保有 openid，再按 _openid 范围查询当前用户的收藏
    app.ensureOpenid().then(function (openid) {
      return db.collection('favorites')
        .where({ itemType: itemType, _openid: openid })
        .orderBy('createTime', 'desc')
        .get()
    }).then(function (res) {
      if (res.data.length === 0) {
        that.setData({ list: [], loading: false })
        return
      }

      var idMap = {}
      res.data.forEach(function (r) {
        idMap[r.itemId] = true
      })
      var ids = Object.keys(idMap)
      var collectionName = itemType === 'goods' ? 'goods' : 'lost_found'

      return db.collection(collectionName)
        .where({ _id: db.command.in(ids) })
        .get()
        .then(function (detailRes) {
          that.setData({ list: detailRes.data, loading: false })
        })
    }).catch(function (err) {
      console.error('加载收藏失败：', err)
      that.setData({ list: [], loading: false })
    })
  },

  onUnfavorite: function (e) {
    var id = e.currentTarget.dataset.id
    var itemType = this.data.activeTab === 0 ? 'goods' : 'lost_found'
    var that = this
    var app = getApp()

    wx.showModal({
      title: '提示',
      content: '确定要取消收藏吗？',
      success: function (res) {
        if (!res.confirm) return

        var db = wx.cloud.database()
        // 必须带上 _openid，避免误删其他用户的收藏记录
        app.ensureOpenid().then(function (openid) {
          return db.collection('favorites')
            .where({ itemId: id, itemType: itemType, _openid: openid })
            .remove()
        }).then(function () {
          wx.showToast({ title: '已取消收藏', icon: 'success' })
          that.loadFavorites()
        }).catch(function (err) {
          console.error('取消收藏失败：', err)
          wx.showToast({ title: '操作失败', icon: 'none' })
        })
      }
    })
  },

  onItemTap: function (e) {
    var id = e.currentTarget.dataset.id
    var prefix = this.data.activeTab === 0
      ? '/pages/secondhand/detail/detail'
      : '/pages/lostfound/detail/detail'
    wx.navigateTo({
      url: prefix + '?id=' + id
    })
  },

  onPullDownRefresh: function () {
    this.loadFavorites()
    wx.stopPullDownRefresh()
  }
})
