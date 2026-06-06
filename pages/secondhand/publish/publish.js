// 发布商品页
const cloud = require('../../../utils/cloud');

Page({
  data: {
    // 图片
    images: [],       // 本地临时路径
    maxImages: 9,

    // 表单数据
    title: '',
    category: '',
    categoryIndex: -1,
    categories: ['教材书籍', '数码产品', '生活用品', '运动器材', '其他'],
    categoryKeys: ['book', 'digital', 'life', 'sports', 'other'],

    price: '',
    condition: '',
    conditionIndex: -1,
    conditions: ['全新', '几乎全新', '正常使用', '有瑕疵'],
    conditionKeys: ['brand_new', 'like_new', 'used', 'worn'],

    description: '',
    contact: '',
    location: '',

    // 提交状态
    isSubmitting: false
  },

  // ========== 选择图片 ==========
  onChooseImage() {
    const remain = this.data.maxImages - this.data.images.length;
    if (remain <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }
    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          images: [...this.data.images, ...res.tempFilePaths]
        });
      }
    });
  },

  // 删除图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images;
    images.splice(index, 1);
    this.setData({ images });
  },

  // 预览图片
  onPreviewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    });
  },

  // ========== 表单输入 ==========
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onPriceInput(e) {
    this.setData({ price: e.detail.value });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value });
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value });
  },

  // ========== 分类选择 ==========
  onCategoryChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      categoryIndex: index,
      category: this.data.categoryKeys[index]
    });
  },

  // ========== 成色选择 ==========
  onConditionChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      conditionIndex: index,
      condition: this.data.conditionKeys[index]
    });
  },

  // ========== 表单验证 ==========
  validateForm() {
    const { images, title, category, price, condition, description, contact } = this.data;

    if (images.length === 0) {
      wx.showToast({ title: '请上传商品图片', icon: 'none' });
      return false;
    }
    if (!title.trim()) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' });
      return false;
    }
    if (!category) {
      wx.showToast({ title: '请选择商品分类', icon: 'none' });
      return false;
    }
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      wx.showToast({ title: '请输入有效的价格', icon: 'none' });
      return false;
    }
    if (!condition) {
      wx.showToast({ title: '请选择商品成色', icon: 'none' });
      return false;
    }
    if (!description.trim()) {
      wx.showToast({ title: '请输入商品描述', icon: 'none' });
      return false;
    }
    if (!contact.trim()) {
      wx.showToast({ title: '请填写联系方式', icon: 'none' });
      return false;
    }
    return true;
  },

  // ========== 提交发布 ==========
  async onSubmit() {
    if (!this.validateForm()) return;
    if (this.data.isSubmitting) return;

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '发布中...', mask: true });

    try {
      // 1. 上传图片到云存储
      let imageUrls = [];
      if (this.data.images.length > 0) {
        imageUrls = await cloud.uploadImages(this.data.images);
      }

      // 2. 构建商品数据
      const goodsData = {
        title: this.data.title.trim(),
        category: this.data.category,
        price: parseFloat(this.data.price).toFixed(2),
        condition: this.data.condition,
        description: this.data.description.trim(),
        contact: this.data.contact.trim(),
        location: this.data.location.trim(),
        images: imageUrls,
        status: 'selling',
        viewCount: 0,
        createTime: new Date(),
        createTimeText: this.formatTime(new Date()),
        sellerName: '我',  // 后续接入用户系统后可替换
        sellerAvatar: ''
      };

      // 3. 写入数据库
      await cloud.addGoods(goodsData);

      wx.hideLoading();
      wx.showToast({
        title: '发布成功',
        icon: 'success',
        duration: 2000
      });

      // 延迟返回列表页
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    } catch (err) {
      console.error('发布失败:', err);
      wx.hideLoading();
      wx.showToast({ title: '发布失败，请重试', icon: 'none' });
      this.setData({ isSubmitting: false });
    }
  },

  // ========== 工具函数 ==========
  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 2592000000) return Math.floor(diff / 86400000) + '天前';

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
});