// 二手商品列表页
const cloud = require('../../../utils/cloud');

Page({
  data: {
    // 分类选项
    categories: [
      { key: '', name: '全部' },
      { key: '书籍', name: '书籍' },
      { key: '电子产品', name: '电子产品' },
      { key: '生活用品', name: '生活用品' },
      { key: '服饰', name: '服饰' },
      { key: '运动器材', name: '运动器材' },
      { key: '其他', name: '其他' }
    ],
    activeCategory: '',

    // 商品列表
    goodsList: [],
    leftList: [],   // 瀑布流左列
    rightList: [],  // 瀑布流右列

    // 搜索
    searchKeyword: '',
    showSearch: false,

    // 排序
    sortType: 'time',
    showSortMenu: false,

    // 分页
    pageNum: 1,
    pageSize: 20,
    hasMore: true,
    isLoading: false,
    isRefreshing: false
  },

  onLoad() {
    this.loadGoods();
  },

  onShow() {
    // 从发布页返回时刷新
    if (this.data.pageNum > 1 || this.data.goodsList.length > 0) {
      this.refreshGoods();
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshGoods();
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadMore();
    }
  },

  // ========== 分类筛选 ==========
  onTabChange(e) {
    const key = e.currentTarget.dataset.key;
    if (this.data.activeCategory === key) return;
    this.setData({ activeCategory: key });
    this.refreshGoods();
  },

  // ========== 排序 ==========
  onToggleSortMenu() {
    this.setData({ showSortMenu: !this.data.showSortMenu });
  },

  onSortChange(e) {
    const type = e.currentTarget.dataset.type;
    if (type === this.data.sortType) {
      this.setData({ showSortMenu: false });
      return;
    }
    this.setData({
      sortType: type,
      showSortMenu: false
    });
    this.refreshGoods();
  },

  // ========== 搜索 ==========
  onToggleSearch() {
    const show = !this.data.showSearch;
    this.setData({ showSearch: show });
    if (!show) {
      this.setData({ searchKeyword: '' });
      this.refreshGoods();
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearchConfirm() {
    this.refreshGoods();
  },

  // ========== 数据加载 ==========
  async loadGoods() {
    if (this.data.isLoading) return;
    this.setData({ isLoading: true });

    wx.showLoading({ title: '加载中...' });

    try {
      const res = await cloud.getGoodsList({
        pageNum: 1,
        pageSize: this.data.pageSize,
        category: this.data.activeCategory,
        keyword: this.data.searchKeyword,
        sortBy: this.data.sortType
      });

      const list = res.data;
      this.setData({
        goodsList: list,
        pageNum: 1,
        hasMore: list.length >= this.data.pageSize
      });
      this.splitWaterfall(list);
    } catch (err) {
      console.error('加载商品列表失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
      this.setData({ isLoading: false });
    }
  },

  async loadMore() {
    if (this.data.isLoading || !this.data.hasMore) return;
    this.setData({ isLoading: true });

    try {
      const res = await cloud.getGoodsList({
        pageNum: this.data.pageNum + 1,
        pageSize: this.data.pageSize,
        category: this.data.activeCategory,
        keyword: this.data.searchKeyword,
        sortBy: this.data.sortType
      });

      const newList = res.data;
      if (newList.length === 0) {
        this.setData({ hasMore: false });
        return;
      }

      const goodsList = [...this.data.goodsList, ...newList];
      this.setData({
        goodsList: goodsList,
        pageNum: this.data.pageNum + 1,
        hasMore: newList.length >= this.data.pageSize
      });
      this.splitWaterfall(goodsList);
    } catch (err) {
      console.error('加载更多失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async refreshGoods() {
    this.setData({
      pageNum: 1,
      hasMore: true,
      isRefreshing: true
    });
    await this.loadGoods();
    wx.stopPullDownRefresh();
    this.setData({ isRefreshing: false });
  },

  // ========== 瀑布流分列 ==========
  splitWaterfall(list) {
    const leftList = [];
    const rightList = [];
    // 用图片数量模拟高度计算，1张图 = 短，3张+ = 长
    list.forEach(item => {
      const imgCount = (item.images && item.images.length) || 0;
      const fakeHeight = 1 + (imgCount > 1 ? 0.5 : 0);
      const leftHeight = leftList.reduce((sum, i) => sum + (1 + ((i.images && i.images.length > 1) ? 0.5 : 0)), 0);
      const rightHeight = rightList.reduce((sum, i) => sum + (1 + ((i.images && i.images.length > 1) ? 0.5 : 0)), 0);

      if (leftHeight <= rightHeight) {
        leftList.push(item);
      } else {
        rightList.push(item);
      }
    });

    this.setData({ leftList, rightList });
  },

  // ========== 跳转详情 ==========
  onGoodsTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/secondhand/detail/detail?id=${id}`
    });
  },

  // ========== 跳转发布页 ==========
  onPublishTap() {
    wx.navigateTo({
      url: '/pages/secondhand/publish/publish'
    });
  }
});