// pages/studyroom/reservations/reservations.js — 预约记录
Page({
  data: {
    loading: true,
    reservations: [],
    activeTab: 0, // 0=全部, 1=已预约, 2=已完成, 3=已取消
    tabs: ['全部', '已预约', '已完成', '已取消']
  },

  onLoad: function () {
    this.loadReservations()
  },

  onShow: function () {
    this.loadReservations()
  },

  // 切换标签
  onTabChange: function (e) {
    var index = parseInt(e.currentTarget.dataset.index)
    this.setData({ activeTab: index, loading: true }, function () {
      this.loadReservations()
    })
  },

  // 加载预约记录
  loadReservations: function () {
    var that = this
    var app = getApp()

    app.ensureOpenid().then(function (openid) {
      var db = wx.cloud.database()
      var condition = { userId: openid }

      // 按状态筛选
      if (that.data.activeTab === 1) {
        condition.status = '已预约'
      } else if (that.data.activeTab === 2) {
        condition.status = '已完成'
      } else if (that.data.activeTab === 3) {
        condition.status = '已取消'
      }

      return db.collection('reservations')
        .where(condition)
        .orderBy('createTime', 'desc')
        .get()
    }).then(function (res) {
      that.setData({ reservations: res.data, loading: false })
    }).catch(function (err) {
      console.warn('加载预约记录失败：', err)
      that.setData({ reservations: [], loading: false })
    })
  },

  // 取消预约
  cancelReservation: function (e) {
    var id = e.currentTarget.dataset.id
    var that = this

    wx.showModal({
      title: '取消预约',
      content: '确定取消该预约吗？',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' })
          var db = wx.cloud.database()
          db.collection('reservations').doc(id)
            .update({
              data: { status: '已取消' }
            })
            .then(function () {
              wx.hideLoading()
              wx.showToast({ title: '已取消' })
              that.loadReservations()
            })
            .catch(function (err) {
              wx.hideLoading()
              wx.showToast({ title: '操作失败', icon: 'none' })
            })
        }
      }
    })
  },

  // 完成预约
  completeReservation: function (e) {
    var id = e.currentTarget.dataset.id
    var that = this

    wx.showModal({
      title: '确认完成',
      content: '确认已完成自习？',
      success: function (res) {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          var db = wx.cloud.database()
          db.collection('reservations').doc(id)
            .update({
              data: { status: '已完成' }
            })
            .then(function () {
              wx.hideLoading()
              wx.showToast({ title: '已完成' })
              that.loadReservations()
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
