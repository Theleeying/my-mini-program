// pages/user/index/index.js — 个人中心
Page({
  data: {
    userInfo: null,
    hasLogin: false,
    avatarUrl: '',
    nickName: '',
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

  // 检查登录状态：从 globalData 和本地缓存恢复
  checkLoginStatus() {
    const app = getApp()
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({ userInfo, hasLogin: true })
    } else {
      // 尝试从本地缓存恢复
      const cached = wx.getStorageSync('userInfo')
      if (cached) {
        app.globalData.userInfo = cached
        this.setData({ userInfo: cached, hasLogin: true })
      }
    }
  },

  // 选择头像（新版微信 API）
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({ avatarUrl })
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({ nickName: e.detail.value })
  },

  // 保存个人资料并登录
  onSaveProfile() {
    const { avatarUrl, nickName } = this.data

    if (!nickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    const app = getApp()
    const db = wx.cloud.database()

    // 确保已获取 openid
    const ensureOpenid = () => {
      if (app.globalData.openid) {
        return Promise.resolve(app.globalData.openid)
      }
      return wx.cloud.callFunction({
        name: 'login'
      }).then(res => {
        app.globalData.openid = res.result.openid
        return res.result.openid
      })
    }

    ensureOpenid().then(openid => {
      // 查询用户是否已存在
      return db.collection('users').where({ _openid: openid }).get().then(rs => {
        if (rs.data.length === 0) {
          // 新用户，创建记录
          return db.collection('users').add({
            data: {
              nickName: nickName.trim(),
              avatarUrl: avatarUrl || '/images/default-avatar.png',
              createTime: db.serverDate()
            }
          })
        } else {
          // 老用户，更新信息
          return db.collection('users').doc(rs.data[0]._id).update({
            data: {
              nickName: nickName.trim(),
              avatarUrl: avatarUrl || rs.data[0].avatarUrl
            }
          })
        }
      })
    }).then(() => {
      const userInfo = {
        nickName: nickName.trim(),
        avatarUrl: avatarUrl || '/images/default-avatar.png'
      }
      // 写入全局状态 + 本地缓存
      app.globalData.userInfo = userInfo
      wx.setStorageSync('userInfo', userInfo)
      this.setData({ userInfo, hasLogin: true, saving: false })
      wx.showToast({ title: '登录成功', icon: 'success' })
    }).catch(err => {
      console.error('保存用户信息失败：', err)
      wx.showToast({ title: '网络异常，请重试', icon: 'none' })
      this.setData({ saving: false })
    })
  },

  // 菜单点击
  onMenuTap(e) {
    const { url } = e.currentTarget.dataset
    if (url) {
      wx.navigateTo({
        url,
        fail: () => {
          wx.switchTab({ url })
        }
      })
    } else {
      // 联系客服
      wx.showModal({
        title: '联系客服',
        content: '请通过微信搜索添加客服，或发送邮件至 support@xiaoyitong.com',
        showCancel: false
      })
    }
  }
})
