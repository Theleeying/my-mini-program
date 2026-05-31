// pages/user/my-favorites/my-favorites.js — 我的收藏
Page({
  data: {
    list: [],
    loading: false
  },

  onShow() {
    this.loadFavorites()
  },

  loadFavorites() {
    const app = getApp()
    const db = wx.cloud.database()

    this.setData({ loading: true })

    // 从 favorites 集合获取收藏的商品 id
    db.collection('favorites')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        if (res.data.length === 0) {
          this.setData({ list: [], loading: false })
          return
        }

        // 获取所有收藏的商品 id
        const goodsIds = res.data.map(item => item.goodsId)

        // 查询对应的商品信息
        db.collection('goods')
          .where({
            _id: db.command.in(goodsIds)
          })
          .get()
          .then(goodsRes => {
            this.setData({ list: goodsRes.data, loading: false })
          })
      })
      .catch(err => {
        console.error('加载收藏失败：', err)
        this.setData({ loading: false })
      })
  },

  // 取消收藏
  onUnfavorite(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '提示',
      content: '确定要取消收藏吗？',
      success: (res) => {
        if (res.confirm) {
          const db = wx.cloud.database()
          db.collection('favorites')
            .where({ goodsId: id })
            .remove()
            .then(() => {
              wx.showToast({ title: '已取消收藏', icon: 'success' })
              this.loadFavorites()
            })
        }
      }
    })
  },

  // 查看详情
  onItemTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/secondhand/detail/detail?id=${id}`
    })
  },

  onPullDownRefresh() {
    this.loadFavorites()
    wx.stopPullDownRefresh()
  }
})
