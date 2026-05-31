// pages/user/index/index.js — 个人中心
Page({
  data: {
    userInfo: null,
    hasLogin: false,
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

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp()
    const userInfo = app.globalData.userInfo
    this.setData({
      userInfo: userInfo,
      hasLogin: !!userInfo
    })
  },

  // 微信授权登录
  onLogin() {
    const app = getApp()

    // 确保 openid 已获取
    const doLogin = () => {
      wx.getUserProfile({
        desc: '用于完善个人资料',
        success: (res) => {
          const userInfo = res.userInfo
          // 保存到全局
          app.globalData.userInfo = userInfo
          this.setData({ userInfo, hasLogin: true })

          // 写入云数据库
          const db = wx.cloud.database()
          const openid = app.globalData.openid
          if (!openid) {
            console.warn('openid 未就绪，跳过写库')
            return
          }

          db.collection('users').where({
            _openid: openid
          }).get().then(rs => {
            if (rs.data.length === 0) {
              // 新用户，创建记录
              db.collection('users').add({
                data: {
                  nickName: userInfo.nickName,
                  avatarUrl: userInfo.avatarUrl,
                  createTime: db.serverDate()
                }
              })
            } else {
              // 老用户，更新信息
              db.collection('users').doc(rs.data[0]._id).update({
                data: {
                  nickName: userInfo.nickName,
                  avatarUrl: userInfo.avatarUrl
                }
              })
            }
          })

          wx.showToast({ title: '登录成功', icon: 'success' })
        },
        fail: () => {
          wx.showToast({ title: '登录已取消', icon: 'none' })
        }
      })
    }

    // 如果 openid 未就绪，先主动获取
    if (!app.globalData.openid) {
      wx.cloud.callFunction({
        name: 'login',
        success: (res) => {
          app.globalData.openid = res.result.openid
          doLogin()
        },
        fail: () => {
          wx.showToast({ title: '网络异常，请重试', icon: 'none' })
        }
      })
    } else {
      doLogin()
    }
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
