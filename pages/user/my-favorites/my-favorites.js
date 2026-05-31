// pages/user/my-favorites/my-favorites.js — 我的收藏（商品 + 失物）
Page({
  data: {
    activeTab: 0,          // 0=商品, 1=失物
    tabs: ['收藏的二手', '收藏的失物'],
    list: [],              // 当前显示的列表
    loading: false
  },

  onShow() {
    this.loadFavorites()
  },

  onTabChange(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ activeTab: idx })
    this.loadFavorites()
  },

  loadFavorites() {
    const db = wx.cloud.database()
    const itemType = this.data.activeTab === 0 ? 'goods' : 'lost_found'

    this.setData({ loading: true })

    db.collection('favorites')
      .where({ itemType })
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        if (res.data.length === 0) {
          this.setData({ list: [], loading: false })
          return
        }

        const ids = [...new Set(res.data.map(r => r.itemId))]
        const collectionName = itemType === 'goods' ? 'goods' : 'lost_found'

        db.collection(collectionName)
          .where({ _id: db.command.in(ids) })
          .get()
          .then(detailRes => {
            this.setData({ list: detailRes.data, loading: false })
          })
          .catch(err => {
            console.error('查询收藏详情失败：', err)
            this.setData({ list: [], loading: false })
          })
      })
      .catch(err => {
        console.error('加载收藏失败：', err)
        this.setData({ list: [], loading: false })
      })
  },

  // 取消收藏
  onUnfavorite(e) {
    const { id } = e.currentTarget.dataset
    const itemType = this.data.activeTab === 0 ? 'goods' : 'lost_found'

    wx.showModal({
      title: '提示',
      content: '确定要取消收藏吗？',
      success: (res) => {
        if (!res.confirm) return

        const db = wx.cloud.database()
        db.collection('favorites')
          .where({ itemId: id, itemType })
          .remove()
          .then(() => {
            wx.showToast({ title: '已取消收藏', icon: 'success' })
            this.loadFavorites()
          })
          .catch(err => {
            console.error('取消收藏失败：', err)
            wx.showToast({ title: '操作失败', icon: 'none' })
          })
      }
    })
  },

  // 查看详情 — 根据类型跳转不同页面
  onItemTap(e) {
    const { id } = e.currentTarget.dataset
    const prefix = this.data.activeTab === 0
      ? '/pages/secondhand/detail/detail'
      : '/pages/lostfound/detail/detail'
    wx.navigateTo({
      url: `${prefix}?id=${id}`
    })
  },

  onPullDownRefresh() {
    this.loadFavorites()
    wx.stopPullDownRefresh()
  }
})
