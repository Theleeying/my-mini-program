// pages/user/index/index.js — 个人中心
Page({
  data: {
    userInfo: null,
    hasLogin: false,
    menuList: [
      { icon: '📋', title: '我的发布', desc: '查看我发布的二手和失物信息', url: '/pages/user/my-publish/my-publish' },
      { icon: '⭐', title: '我的收藏', desc: '收藏的二手商品', url: '/pages/user/my-favorites/my-favorites' },
      { icon: '📅', title: '我的预约', desc: '自习室预约记录', url: '/pages/studyroom/reservations/reservations' },
      { icon: '💬', title: '联系客服', desc: '反馈问题或建议', url: '' },
      { icon: 'ℹ️', title: '关于我们', desc: '了解校易通', url: '/pages/common/about/about' },
      { icon: '⚙️', title: '设置', desc: '个人偏好设置', url: '/pages/user/settings/settings' }
    ]
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    this.checkLogin()
  },

  checkLogin() {
    const app = getApp()
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (userInfo) {
      app.globalData.userInfo = userInfo
      this.setData({ userInfo, hasLogin: true })
    }
  },

  // 微信一键授权登录
  onWechatAuth(e) {
    if (e.detail.errMsg !== 'getUserInfo:ok') {
      wx.showToast({ title: '已取消授权', icon: 'none' })
      return
    }

    const { nickName, avatarUrl } = e.detail.userInfo
    const app = getApp()

    // 确保有 openid
    const ensureOpenid = () =>
      app.globalData.openid
        ? Promise.resolve()
        : wx.cloud.callFunction({ name: 'login' }).then(res => {
            app.globalData.openid = res.result.openid
          })

    ensureOpenid().then(() => {
      const db = wx.cloud.database()

      return db.collection('users').where({ _openid: app.globalData.openid }).get().then(rs => {
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
      })
    }).then(() => {
      const userInfo = { nickName, avatarUrl }
      app.globalData.userInfo = userInfo
      wx.setStorageSync('userInfo', userInfo)
      this.setData({ userInfo, hasLogin: true })
      wx.showToast({ title: '登录成功', icon: 'success' })
    }).catch(err => {
      console.error('登录失败：', err)
      wx.showToast({ title: '网络异常，请重试', icon: 'none' })
    })
  },

  // 菜单跳转
  onMenuTap(e) {
    const { url } = e.currentTarget.dataset
    if (url) {
      wx.navigateTo({
        url,
        fail: () => wx.switchTab({ url })
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
