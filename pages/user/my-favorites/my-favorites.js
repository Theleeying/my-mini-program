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
    var _ = db.command
    var activeTab = this.data.activeTab
    var that = this
    var app = getApp()

    that.setData({ loading: true })

    app.ensureOpenid().then(function (openid) {
      return db.collection('favorites')
        .where({ _openid: openid })
        .orderBy('createTime', 'desc')
        .get()
    }).then(function (res) {
      if (res.data.length === 0) {
        that.setData({ list: [], loading: false })
        return
      }

      // 兼容旧数据：统一映射为 itemId + itemType
      // 旧格式 { goodsId } → 视为 goods 类型
      // 新格式 { itemId, itemType } → 直接使用
      var itemType = activeTab === 0 ? 'goods' : 'lost_found'
      var ids = []
      res.data.forEach(function (r) {
        var type = r.itemType || (r.goodsId ? 'goods' : '')
        var id = r.itemId || r.goodsId
        if (type === itemType && id) {
          ids.push(id)
        }
      })

      if (ids.length === 0) {
        that.setData({ list: [], loading: false })
        return
      }

      var collectionName = itemType === 'goods' ? 'goods' : 'lost_found'
      return db.collection(collectionName)
        .where({ _id: _.in(ids) })
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
        var _ = db.command
        // 必须带上 _openid，避免误删其他用户的收藏记录
        // 兼容旧数据：同时匹配 itemId 和 goodsId 字段
        app.ensureOpenid().then(function (openid) {
          return db.collection('favorites')
            .where(_.or([
              { itemId: id, itemType: itemType, _openid: openid },
              { goodsId: id, _openid: openid }
            ]))
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
