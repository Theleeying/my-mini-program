// pages/studyroom/index/index.js — 自习助手首页（教室查询）
Page({
  data: {
    buildings: ['A栋', 'B栋', 'C栋', 'D栋', '图书馆'],
    activeBuilding: 'A栋',
    timeSlots: ['08:00-12:00', '14:00-18:00', '19:00-22:00'],
    activeTimeSlot: '08:00-12:00',
    classrooms: [],
    loading: false,
    date: '',
    dateStr: ''
  },

  onLoad: function () {
    var now = new Date()
    var dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
    this.setData({
      date: dateStr,
      dateStr: this.formatDate(now)
    }, function () {
      this.loadClassrooms()
    })
  },

  onShow: function () {
    this.loadClassrooms()
  },

  onPullDownRefresh: function () {
    var that = this
    that.loadClassrooms()
      .then(function () { wx.stopPullDownRefresh() })
      .catch(function () { wx.stopPullDownRefresh() })
  },

  // 格式化日期显示
  formatDate: function (date) {
    var weekDays = ['日', '一', '二', '三', '四', '五', '六']
    var month = date.getMonth() + 1
    var day = date.getDate()
    var weekDay = weekDays[date.getDay()]
    return month + '月' + day + '日 周' + weekDay
  },

  // 选择教学楼
  selectBuilding: function (e) {
    var building = e.currentTarget.dataset.building
    this.setData({ activeBuilding: building }, function () {
      this.loadClassrooms()
    })
  },

  // 选择时间段
  selectTimeSlot: function (e) {
    var slot = e.currentTarget.dataset.slot
    this.setData({ activeTimeSlot: slot }, function () {
      this.loadClassrooms()
    })
  },

  // 选择日期
  onDateChange: function (e) {
    var date = e.detail.value
    var dateObj = new Date(date)
    this.setData({
      date: date,
      dateStr: this.formatDate(dateObj)
    }, function () {
      this.loadClassrooms()
    })
  },

  // 加载教室列表（显示所有教室，标记空闲/占用状态）
  loadClassrooms: function () {
    var that = this
    that.setData({ classrooms: [], loading: true })

    var db = wx.cloud.database()
    var _ = db.command

    return db.collection('classrooms')
      .where({ building: that.data.activeBuilding })
      .get()
      .then(function (res) {
        var classrooms = res.data
        if (classrooms.length === 0) {
          that.setData({ classrooms: [], loading: false })
          return
        }

        // 收集所有教室ID
        var roomIds = classrooms.map(function (room) { return room._id })

        // 查询当前日期时间段内有效的预约记录
        return db.collection('reservations')
          .where({
            classroomId: _.in(roomIds),
            date: that.data.date,
            timeSlot: that.data.activeTimeSlot,
            status: 'active'
          })
          .get()
          .then(function (reserveRes) {
            // 统计每个教室该时段的真实用户预约数（过滤假数据）
            var reserveCount = {}
            reserveRes.data.forEach(function (r) {
              if (r._openid && r._openid.indexOf('__system__') === 0) return
              reserveCount[r.classroomId] = (reserveCount[r.classroomId] || 0) + 1
            })

            // 计算剩余座位 = 总容量 - 教室基础预约数 - 用户实际预约数
            var result = classrooms.map(function (room) {
              var capacity = room.capacity || 40
              var baseReserved = room.reserved || 0
              var userReserved = reserveCount[room._id] || 0
              var remaining = capacity - baseReserved - userReserved
              return Object.assign({}, room, {
                capacity: capacity,
                remaining: remaining,
                status: remaining > 0 ? 'free' : 'full'
              })
            })

            that.setData({ classrooms: result, loading: false })
          })
      })
      .catch(function (err) {
        console.warn('加载教室失败：', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
        that.setData({ loading: false })
      })
  },

  // 预约教室
  reserveClassroom: function (e) {
    var room = e.currentTarget.dataset.room
    if (room.remaining <= 0) {
      wx.showToast({ title: '该教室该时段已满', icon: 'none' })
      return
    }

    var that = this
    wx.showModal({
      title: '确认预约',
      content: '确认预约 ' + room.building + ' ' + room.roomNo + ' (' + that.data.activeTimeSlot + ')？',
      success: function (res) {
        if (res.confirm) {
          that.doReserve(room)
        }
      }
    })
  },

  // 执行预约
  doReserve: function (room) {
    var that = this
    var app = getApp()
    wx.showLoading({ title: '预约中...' })

    app.ensureOpenid().then(function (openid) {
      var db = wx.cloud.database()

      // 先检查是否已预约过该教室该时段
      return db.collection('reservations')
        .where({
          classroomId: room._id,
          date: that.data.date,
          timeSlot: that.data.activeTimeSlot,
          status: 'active',
          _openid: openid
        })
        .count()
        .then(function (countRes) {
          if (countRes.total > 0) {
            wx.hideLoading()
            wx.showToast({ title: '你已经预约过该时段', icon: 'none' })
            return
          }

          // 未重复，执行预约
          return db.collection('reservations').add({
            data: {
              classroomId: room._id,
              building: room.building,
              roomNo: room.roomNo,
              date: that.data.date,
              timeSlot: that.data.activeTimeSlot,
              status: 'active',
              createTime: db.serverDate()
            }
          }).then(function () {
            wx.hideLoading()
            wx.showToast({ title: '预约成功' })
            that.loadClassrooms()
          })
        })
    }).catch(function (err) {
      wx.hideLoading()
      console.error('预约失败：', err)
      wx.showToast({ title: '预约失败', icon: 'none' })
    })
  },

  // 跳转预约记录
  goReservations: function () {
    wx.navigateTo({
      url: '/pages/studyroom/reservations/reservations'
    })
  }
})
