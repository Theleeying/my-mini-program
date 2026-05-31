// pages/common/announcement-detail/announcement-detail.js — 公告详情
Page({
  data: {
    item: null,
    loading: true
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({ title: '公告不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.loadDetail(id)
  },

  loadDetail(id) {
    const db = wx.cloud.database()
    db.collection('announcements')
      .doc(id)
      .get()
      .then(res => {
        this.setData({ item: res.data, loading: false })
      })
      .catch(err => {
        console.error('加载公告详情失败：', err)
        this.setData({ loading: false })
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
  },

  // 预览大图
  onPreviewImage() {
    const { item } = this.data
    if (!item || !item.image) return
    wx.previewImage({
      urls: [item.image],
      current: item.image
    })
  }
})
