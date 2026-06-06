// pages/user/my-reservations/my-reservations.js — 我的预约（自习室）
Page({
  data: {
    list: [],
    loading: false
  },

  onShow: function () {
    this.loadReservations()
  },

  loadReservations: function () {
    var that = this
    var app = getApp()

    that.setData({ loading: true })

    app.ensureOpenid().then(function (openid) {
      var db = wx.cloud.database()

      return db.collection('reservations')
        .where({ _openid: openid })
        .orderBy('createTime', 'desc')
        .get()
        .then(function (res) {
          if (res.data.length === 0) {
            that.setData({ list: [], loading: false })
            return
          }

          // 收集所有 classroomId
          var classroomIds = {}
          res.data.forEach(function (r) {
            if (r.classroomId) classroomIds[r.classroomId] = true
          })
          var ids = Object.keys(classroomIds)

          if (ids.length === 0) {
            // 兜底：无 classroomId 时显示"未知教室"
            var list = res.data.map(function (item) {
              return Object.assign({}, item, { roomName: '未知教室' })
            })
            that.setData({ list: list, loading: false })
            return
          }

          // 批量查询教室信息
          return db.collection('classrooms')
            .where({ _id: db.command.in(ids) })
            .get()
            .then(function (roomRes) {
              // 构建 classroomId → 教室信息映射
              var roomMap = {}
              roomRes.data.forEach(function (room) {
                roomMap[room._id] = room
              })

              // 合并预约与教室信息
              var list = res.data.map(function (item) {
                var room = roomMap[item.classroomId]
                return Object.assign({}, item, {
                  roomName: room ? room.building + ' ' + room.roomNo : '未知教室'
                })
              })

              that.setData({ list: list, loading: false })
            })
        })
    }).catch(function (err) {
      console.error('加载预约记录失败：', err)
      that.setData({ list: [], loading: false })
      wx.showToast({ title: '加载失败，请下拉刷新', icon: 'none' })
    })
  },

  // 取消预约
  onCancel: function (e) {
    var id = e.currentTarget.dataset.id
    var that = this

    wx.showModal({
      title: '取消预约',
      content: '确定要取消该预约吗？',
      success: function (res) {
        if (!res.confirm) return

        var db = wx.cloud.database()
        db.collection('reservations')
          .doc(id)
          .update({ data: { status: 'cancelled' } })
          .then(function () {
            wx.showToast({ title: '已取消', icon: 'success' })
            that.loadReservations()
          })
          .catch(function (err) {
            console.error('取消预约失败：', err)
            wx.showToast({ title: '操作失败', icon: 'none' })
          })
      }
    })
  },

  onPullDownRefresh: function () {
    this.loadReservations()
    wx.stopPullDownRefresh()
  }
})
