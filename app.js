// app.js
App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloudbase-d3glfg3zf894b18e9',
        traceUser: true
      })
      // 不自动调用 login 云函数，改为懒加载
      // 首次需要 openid 时（如登录/收藏）再调
    }
  },

  // 懒加载获取 openid，避免启动时因云函数未部署导致 timeout
  ensureOpenid() {
    var that = this
    if (this.globalData.openid) {
      return Promise.resolve(this.globalData.openid)
    }
    return wx.cloud.callFunction({ name: 'login' }).then(function (res) {
      that.globalData.openid = res.result.openid
      return res.result.openid
    }).catch(function (err) {
      console.warn('[app] 获取 openid 失败（云函数可能未部署或环境ID不正确）：', err.errMsg || err)
      return Promise.reject(err)
    })
  },

  globalData: {
    openid: null,
    userInfo: null,
    searchKeyword: ''
  }
})
