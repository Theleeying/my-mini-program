// pages/studyroom/index/index.js — 自习助手首页（教室查询）
Page({
  data: {
    buildings: ['教学楼A', '教学楼B', '教学楼C', '教学楼D', '图书馆'],
    activeBuilding: '教学楼A',
    timeSlots: ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '19:00-21:00'],
    activeTimeSlot: '08:00-10:00',
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

  // 加载教室列表
  loadClassrooms: function () {
    var that = this
    that.setData({ loading: true })

    var db = wx.cloud.database()

    db.collection('classrooms')
      .where({ building: that.data.activeBuilding })
      .get()
      .then(function (res) {
        var classrooms = res.data.map(function (room) {
          return Object.assign({}, room, {
            status: that.getRandomStatus()
          })
        })
        that.setData({ classrooms: classrooms, loading: false })
      })
      .catch(function (err) {
        console.warn('加载教室失败：', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
        that.setData({ loading: false })
      })
  },

  // 模拟教室状态（实际应从预约记录中查询）
  getRandomStatus: function () {
    var statuses = ['空闲', '空闲', '空闲', '占用', '占用']
    return statuses[Math.floor(Math.random() * statuses.length)]
  },

  // 预约教室
  reserveClassroom: function (e) {
    var room = e.currentTarget.dataset.room
    if (room.status === '占用') {
      wx.showToast({ title: '该教室已被占用', icon: 'none' })
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
    wx.showLoading({ title: '预约中...' })

    var app = getApp()
    app.ensureOpenid().then(function (openid) {
      var db = wx.cloud.database()
      return db.collection('reservations').add({
        data: {
          userId: openid,
          classroomId: room._id,
          building: room.building,
          roomNo: room.roomNo,
          date: that.data.date,
          timeSlot: that.data.activeTimeSlot,
          status: '已预约',
          createTime: db.serverDate()
        }
      })
    }).then(function () {
      wx.hideLoading()
      wx.showToast({ title: '预约成功' })
      that.loadClassrooms()
    }).catch(function (err) {
      console.error('预约失败：', err)
      wx.hideLoading()
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
