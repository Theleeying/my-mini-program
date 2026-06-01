// pages/common/announcement-detail/announcement-detail.js — 公告详情
Page({
  data: {
    item: null,
    loading: true
  },

  onLoad: function (options) {
    var id = options.id
    if (!id) {
      wx.showToast({ title: '公告不存在', icon: 'none' })
      setTimeout(function () { wx.navigateBack() }, 1500)
      return
    }
    this.loadDetail(id)
  },

  loadDetail: function (id) {
    var db = wx.cloud.database()
    var that = this
    db.collection('announcements')
      .doc(id)
      .get()
      .then(function (res) {
        that.setData({ item: res.data, loading: false })
      })
      .catch(function (err) {
        console.error('加载公告详情失败：', err)
        that.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
  },

  onPreviewImage: function () {
    var item = this.data.item
    if (!item || !item.image) return
    wx.previewImage({
      urls: [item.image],
      current: item.image
    })
  }
})
