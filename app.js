// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloudbase-d3glfg3zf894b18e9',
        traceUser: true
      })
      // 获取用户 openid
      this.getUserOpenId()
    }
  },

  getUserOpenId() {
    // 云开发免鉴权登录，获取 openid
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        this.globalData.openid = res.result.openid
      },
      fail: err => {
        console.warn('[app] 获取 openid 失败（云函数可能未部署）：', err.errMsg || err)
      }
    })
  },

  globalData: {
    openid: null,
    userInfo: null,
    searchKeyword: ''
  }
})
