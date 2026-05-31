// pages/user/settings/settings.js — 设置
Page({
  data: {
    cacheSize: '计算中...',
    version: '1.0.0'
  },

  onLoad() {
    this.calcCacheSize()
  },

  // 计算缓存大小
  calcCacheSize() {
    // 微信小程序无法精确获取缓存大小，给出估算
    wx.getStorageInfo({
      success: (res) => {
        const sizeKB = res.currentSize || 0
        if (sizeKB < 1024) {
          this.setData({ cacheSize: `${sizeKB} KB` })
        } else {
          this.setData({ cacheSize: `${(sizeKB / 1024).toFixed(1)} MB` })
        }
      },
      fail: () => {
        this.setData({ cacheSize: '未知' })
      }
    })
  },

  // 清除缓存
  onClearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              wx.showToast({ title: '缓存已清除', icon: 'success' })
              this.setData({ cacheSize: '0 KB' })
            }
          })
        }
      }
    })
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.globalData.userInfo = null
          wx.removeStorageSync('userInfo')
          wx.reLaunch({
            url: '/pages/user/index/index'
          })
          wx.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }
})
