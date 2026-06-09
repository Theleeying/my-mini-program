// pages/studyroom/reservations/reservations.js — 预约记录
Page({
  data: {
    loading: true,
    reservations: [],
    activeTab: 0, // 0=全部, 1=已预约, 2=已取消
    tabs: ['全部', '已预约', '已取消']
  },

  onLoad: function () {
    this.loadReservations()
  },

  onShow: function () {
    this.loadReservations()
  },

  onPullDownRefresh: function () {
    var that = this
    that.loadReservations()
      .then(function () { wx.stopPullDownRefresh() })
      .catch(function () { wx.stopPullDownRefresh() })
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

    return app.ensureOpenid().then(function (openid) {
      var db = wx.cloud.database()
      var condition = { _openid: openid }

      // 按状态筛选：0=全部, 1=已预约(active), 2=已取消(cancelled)
      if (that.data.activeTab === 1) {
        condition.status = 'active'
      } else if (that.data.activeTab === 2) {
        condition.status = 'cancelled'
      }

      return db.collection('reservations')
        .where(condition)
        .orderBy('createTime', 'desc')
        .get()
        .then(function (res) {
          var list = res.data

          if (list.length === 0) {
            that.setData({ reservations: [], loading: false })
            return
          }

          // 收集所有 classroomId 查询教室信息
          var classroomIds = {}
          list.forEach(function (r) {
            if (r.classroomId) classroomIds[r.classroomId] = true
          })
          var ids = Object.keys(classroomIds)

          if (ids.length === 0) {
            that.setData({ reservations: list, loading: false })
            return
          }

          return db.collection('classrooms')
            .where({ _id: db.command.in(ids) })
            .get()
            .then(function (roomRes) {
              var roomMap = {}
              roomRes.data.forEach(function (room) {
                roomMap[room._id] = room
              })

              var result = list.map(function (item) {
                var room = roomMap[item.classroomId]
                return Object.assign({}, item, {
                  roomName: room ? room.building + ' ' + room.roomNo : (item.building + ' ' + item.roomNo)
                })
              })

              that.setData({ reservations: result, loading: false })
            })
        })
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
              data: { status: 'cancelled' }
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

  // 完成自习（将状态改为 cancelled 表示该时段预约结束）
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
              data: { status: 'cancelled' }
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
