// pages/user/index/index.js — 个人中心
Page({
  data: {
    userInfo: null,
    hasLogin: false,
    stats: {
      publishCount: 0,
      favoriteCount: 0
    },
    menuList: [
      { icon: '📋', title: '我的发布', desc: '查看我发布的二手和失物信息', url: '/pages/user/my-publish/my-publish' },
      { icon: '⭐', title: '我的收藏', desc: '收藏的商品和失物信息', url: '/pages/user/my-favorites/my-favorites' },
      { icon: '📅', title: '我的预约', desc: '自习室预约记录', url: '/pages/user/my-reservations/my-reservations' },
      { icon: '💬', title: '联系客服', desc: '反馈问题或建议', url: '' },
      { icon: 'ℹ️', title: '关于我们', desc: '了解校易通', url: '/pages/common/about/about' },
      { icon: '⚙️', title: '设置', desc: '个人偏好设置', url: '/pages/user/settings/settings' }
    ]
  },

  onLoad: function () {
    this.checkLogin()
  },

  onShow: function () {
    this.checkLogin()
  },

  checkLogin: function () {
    var app = getApp()
    var userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (userInfo) {
      app.globalData.userInfo = userInfo
      this.setData({ userInfo: userInfo, hasLogin: true })
      this.loadStats()
    }
  },

  // 加载统计计数（发布数 + 收藏数）
  loadStats: function () {
    var app = getApp()
    var that = this
    var db = wx.cloud.database()

    app.ensureOpenid().then(function (openid) {
      var publishGoods = db.collection('goods')
        .where({ _openid: openid })
        .count()

      var publishLost = db.collection('lost_found')
        .where({ _openid: openid })
        .count()

      var favCount = db.collection('favorites')
        .where({ _openid: openid })
        .count()

      return Promise.all([publishGoods, publishLost, favCount])
    }).then(function (results) {
      that.setData({
        stats: {
          publishCount: results[0].total + results[1].total,
          favoriteCount: results[2].total
        }
      })
    }).catch(function () {
      // 统计加载失败不阻塞，保持默认值
    })
  },

  // 微信一键授权登录
  onWechatAuth: function (e) {
    if (e.detail.errMsg !== 'getUserInfo:ok') {
      wx.showToast({ title: '已取消授权', icon: 'none' })
      return
    }

    var nickName = e.detail.userInfo.nickName
    var avatarUrl = e.detail.userInfo.avatarUrl
    var app = getApp()
    var that = this

    app.ensureOpenid().then(function () {
      var db = wx.cloud.database()

      db.collection('users').where({ _openid: app.globalData.openid }).get().then(function (rs) {
        if (rs.data.length === 0) {
          return db.collection('users').add({
            data: {
              nickName: nickName,
              avatarUrl: avatarUrl,
              createTime: db.serverDate()
            }
          })
        } else {
          return db.collection('users').doc(rs.data[0]._id).update({
            data: { nickName: nickName, avatarUrl: avatarUrl }
          })
        }
      }).then(function () {
        var userInfo = { nickName: nickName, avatarUrl: avatarUrl }
        app.globalData.userInfo = userInfo
        wx.setStorageSync('userInfo', userInfo)
        that.setData({ userInfo: userInfo, hasLogin: true })
        that.loadStats()
        wx.showToast({ title: '登录成功', icon: 'success' })
      })
    }).catch(function (err) {
      console.error('登录失败：', err)
      wx.showToast({ title: '网络异常，请重试', icon: 'none' })
    })
  },

  // 菜单跳转
  onMenuTap: function (e) {
    var url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({
        url: url,
        fail: function () { wx.switchTab({ url: url }) }
      })
    } else {
      wx.showModal({
        title: '联系客服',
        content: '请通过微信搜索添加客服，或发送邮件至 support@xiaoyitong.com',
        showCancel: false
      })
    }
  }
})
