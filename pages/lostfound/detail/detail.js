// pages/lostfound/detail/detail.js — 失物招领详情
Page({
  data: {
    loading: true,
    detail: {},
    showContact: false,
    id: ''
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ id: options.id })
      this.loadDetail(options.id)
    }
  },

  // 加载详情
  loadDetail: function (id) {
    var that = this
    var db = wx.cloud.database()

    db.collection('lost_found').doc(id).get()
      .then(function (res) {
        that.setData({ detail: res.data, loading: false })
      })
      .catch(function (err) {
        console.warn('加载详情失败：', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
        that.setData({ loading: false })
      })
  },

  // 展开/收起联系方式
  toggleContact: function () {
    this.setData({ showContact: !this.data.showContact })
  },

  // 拨打电话
  callPhone: function () {
    var phone = this.data.detail.contactPhone
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone })
    } else {
      wx.showToast({ title: '暂无联系电话', icon: 'none' })
    }
  },

  // 标记为已找到/已认领
  markResolved: function () {
    var that = this
    var type = this.data.detail.type
    var statusText = type === '失物' ? '已找到' : '已认领'

    wx.showModal({
      title: '确认操作',
      content: '确定标记为"' + statusText + '"吗？',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          var db = wx.cloud.database()
          db.collection('lost_found').doc(that.data.id)
            .update({
              data: { status: statusText }
            })
            .then(function () {
              wx.hideLoading()
              wx.showToast({ title: '操作成功' })
              that.setData({
                'detail.status': statusText
              })
            })
            .catch(function (err) {
              wx.hideLoading()
              wx.showToast({ title: '操作失败', icon: 'none' })
            })
        }
      }
    })
  }
})
