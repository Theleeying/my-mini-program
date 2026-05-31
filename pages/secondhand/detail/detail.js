// 商品详情页
const cloud = require('../../../utils/cloud');

Page({
  data: {
    goodsId: '',
    goods: null,

    // 图片
    currentImageIndex: 0,

    // 收藏状态
    isFavorite: false,
    favoriteId: '',

    // 卖家中转
    sellerInfo: {},

    // 加载状态
    isLoading: true
  },

  onLoad(options) {
    const id = options.id;
    if (!id) {
      wx.showToast({ title: '商品不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ goodsId: id });
    this.loadDetail();
  },

  // 加载商品详情
  async loadDetail() {
    wx.showLoading({ title: '加载中...' });
    this.setData({ isLoading: true });

    try {
      const res = await cloud.getGoodsDetail(this.data.goodsId);
      const goods = res.data;

      if (!goods) {
        wx.showToast({ title: '商品不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }

      this.setData({ goods });

      // 检查收藏状态
      this.checkFavorite();

      // 增加浏览次数（异步，不需要等待）
      cloud.updateGoods(this.data.goodsId, {
        viewCount: (goods.viewCount || 0) + 1
      }).catch(() => {});
    } catch (err) {
      console.error('加载详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ isLoading: false });
    }
  },

  // 检查是否已收藏
  async checkFavorite() {
    try {
      const res = await cloud.checkFavorite(this.data.goodsId);
      if (res.data.length > 0) {
        this.setData({
          isFavorite: true,
          favoriteId: res.data[0]._id
        });
      }
    } catch (err) {
      console.error('检查收藏失败:', err);
    }
  },

  // 图片切换
  onSwiperChange(e) {
    this.setData({ currentImageIndex: e.detail.current });
  },

  onImagePreview(e) {
    const index = e.currentTarget.dataset.index;
    const urls = this.data.goods.images;
    wx.previewImage({
      current: urls[index],
      urls: urls
    });
  },

  // 收藏/取消收藏
  async onToggleFavorite() {
    if (this.data.isFavorite) {
      // 取消收藏
      try {
        await cloud.removeFavorite(this.data.favoriteId);
        this.setData({ isFavorite: false, favoriteId: '' });
        wx.showToast({ title: '已取消收藏', icon: 'none' });
      } catch (err) {
        console.error('取消收藏失败:', err);
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    } else {
      // 添加收藏
      try {
        const res = await cloud.addFavorite(this.data.goodsId);
        this.setData({
          isFavorite: true,
          favoriteId: res._id
        });
        wx.showToast({ title: '收藏成功', icon: 'success' });
      } catch (err) {
        console.error('收藏失败:', err);
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    }
  },

  // 联系卖家
  onContactSeller() {
    const goods = this.data.goods;
    if (!goods) return;

    const contact = goods.contact || '';
    if (!contact) {
      wx.showToast({ title: '卖家未留联系方式', icon: 'none' });
      return;
    }

    // 判断是手机号还是微信号
    if (/^1\d{10}$/.test(contact)) {
      // 手机号 - 复制并提示
      wx.setClipboardData({
        data: contact,
        success: () => {
          wx.showModal({
            title: '联系电话已复制',
            content: contact,
            confirmText: '拨打',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.makePhoneCall({ phoneNumber: contact });
              }
            }
          });
        }
      });
    } else {
      // 微信号 - 复制
      wx.setClipboardData({
        data: contact,
        success: () => {
          wx.showToast({ title: '微信号已复制，请前往微信添加好友', icon: 'none' });
        }
      });
    }
  },

  // 分享
  onShareAppMessage() {
    const goods = this.data.goods;
    return {
      title: goods ? goods.title : '校易通二手交易',
      path: `/pages/secondhand/detail/detail?id=${this.data.goodsId}`
    };
  }
});