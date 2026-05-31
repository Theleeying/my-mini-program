// pages/user/index/index.js — 个人中心
Page({
  data: {
    userInfo: null,
    hasLogin: false,

    // 登录弹窗
    showModal: false,
    tempAvatarUrl: '',
    tempNickName: '',
    saving: false,

    // 菜单列表
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
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
  },

  // ========== 登录状态检查 ==========

  checkLoginStatus() {
    const app = getApp()
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({ userInfo, hasLogin: true })
      return
    }
    // 从本地缓存恢复
    const cached = wx.getStorageSync('userInfo')
    if (cached) {
      app.globalData.userInfo = cached
      this.setData({ userInfo: cached, hasLogin: true })
    }
  },

  // ========== 弹窗控制 ==========

  showLoginModal() {
    this.setData({ showModal: true, tempAvatarUrl: '', tempNickName: '' })
  },

  hideLoginModal() {
    this.setData({ showModal: false })
  },

  // ========== 微信一键授权登录 ==========

  onWechatAuth(e) {
    // 用户点击了微信原生授权弹窗
    if (e.detail.errMsg !== 'getUserInfo:ok') {
      // 用户拒绝授权
      return
    }

    const { nickName, avatarUrl } = e.detail.userInfo
    this.saveUserToDatabaseAndLogin(nickName, avatarUrl)
  },

  // ========== 手动方式（头像 + 昵称） ==========

  onChooseAvatar(e) {
    this.setData({ tempAvatarUrl: e.detail.avatarUrl })
  },

  onNicknameInput(e) {
    this.setData({ tempNickName: e.detail.value })
  },

  onManualLogin() {
    const nickName = this.data.tempNickName.trim()
    if (!nickName) {
      wx.showToast({ title: '请先输入昵称', icon: 'none' })
      return
    }
    this.saveUserToDatabaseAndLogin(nickName, this.data.tempAvatarUrl)
  },

  // ========== 通用：保存用户 + 登录 ==========

  saveUserToDatabaseAndLogin(nickName, avatarUrl) {
    this.setData({ saving: true })

    const app = getApp()

    // 确保有 openid
    const ensureOpenid = () => {
      if (app.globalData.openid) return Promise.resolve()
      return wx.cloud.callFunction({ name: 'login' }).then(res => {
        app.globalData.openid = res.result.openid
      })
    }

    ensureOpenid().then(() => {
      const db = wx.cloud.database()
      const data = {
        nickName: nickName || '微信用户',
        avatarUrl: avatarUrl || '',
        createTime: db.serverDate()
      }

      // upsert
      return db.collection('users').where({ _openid: app.globalData.openid }).get().then(rs => {
        if (rs.data.length === 0) {
          return db.collection('users').add({ data })
        } else {
          return db.collection('users').doc(rs.data[0]._id).update({
            data: { nickName: data.nickName, avatarUrl: data.avatarUrl }
          })
        }
      })
    }).then(() => {
      const userInfo = {
        nickName: nickName || '微信用户',
        avatarUrl: avatarUrl || '/images/default-avatar.png'
      }

      // 写入全局 + 本地持久化
      app.globalData.userInfo = userInfo
      wx.setStorageSync('userInfo', userInfo)

      this.setData({
        userInfo,
        hasLogin: true,
        showModal: false,
        saving: false,
        tempAvatarUrl: '',
        tempNickName: ''
      })

      wx.showToast({ title: '登录成功', icon: 'success' })
    }).catch(err => {
      console.error('登录失败：', err)
      wx.showToast({ title: '网络异常，请重试', icon: 'none' })
      this.setData({ saving: false })
    })
  },

  // ========== 菜单跳转 ==========

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
