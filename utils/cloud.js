// 云开发工具函数
const db = wx.cloud.database();
const _ = db.command;

// ========== 数据库集合名称 ==========
const COLLECTIONS = {
  GOODS: 'goods',           // 二手商品
  LOST_FOUND: 'lost_found', // 失物招领
  CLASSROOMS: 'classrooms', // 自习教室
  RESERVATIONS: 'reservations', // 预约记录
  USERS: 'users',           // 用户信息
  FAVORITES: 'favorites',   // 收藏记录
  COMMENTS: 'comments'      // 评论
};

// ========== 商品相关 ==========

/**
 * 获取商品列表（支持分页、分类、搜索）
 * @param {Object} params
 * @param {number} params.pageNum - 页码，从1开始
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.category - 分类筛选（空字符串表示全部）
 * @param {string} params.keyword - 搜索关键词
 * @param {string} params.sortBy - 排序方式：'time' | 'price_asc' | 'price_desc'
 */
function getGoodsList(params) {
  const { pageNum = 1, pageSize = 20, category = '', keyword = '', sortBy = 'time' } = params;

  return new Promise((resolve, reject) => {
    // 一次性构建所有查询条件（避免多次 .where() 互相覆盖）
    const conditions = {
      status: _.neq('sold')
    };

    if (category) {
      conditions.category = category;
    }

    if (keyword) {
      conditions.title = db.RegExp({
        regexp: keyword,
        options: 'i'
      });
    }

    let query = db.collection(COLLECTIONS.GOODS).where(conditions);

    // 排序
    switch (sortBy) {
      case 'price_asc':
        query = query.orderBy('price', 'asc');
        break;
      case 'price_desc':
        query = query.orderBy('price', 'desc');
        break;
      case 'time':
      default:
        query = query.orderBy('createTime', 'desc');
        break;
    }

    // 分页
    query
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .get()
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
}

/**
 * 获取商品详情
 * @param {string} goodsId - 商品ID
 */
function getGoodsDetail(goodsId) {
  return db.collection(COLLECTIONS.GOODS).doc(goodsId).get();
}

/**
 * 发布商品
 * @param {Object} goodsData - 商品数据
 */
function addGoods(goodsData) {
  return db.collection(COLLECTIONS.GOODS).add({
    data: goodsData
  });
}

/**
 * 更新商品信息
 * @param {string} goodsId
 * @param {Object} data
 */
function updateGoods(goodsId, data) {
  return db.collection(COLLECTIONS.GOODS).doc(goodsId).update({
    data: data
  });
}

// ========== 收藏相关 ==========

/**
 * 添加收藏
 * @param {string} itemId - 物品ID
 * @param {string} itemType - 物品类型 'goods' | 'lost_found'
 */
function addFavorite(itemId, itemType) {
  return db.collection(COLLECTIONS.FAVORITES).add({
    data: {
      itemId: itemId,
      itemType: itemType,
      createTime: db.serverDate()
    }
  });
}

/**
 * 取消收藏
 */
function removeFavorite(favoriteId) {
  return db.collection(COLLECTIONS.FAVORITES).doc(favoriteId).remove();
}

/**
 * 检查是否已收藏
 * @param {string} itemId - 物品ID
 * @param {string} itemType - 物品类型 'goods' | 'lost_found'
 */
function checkFavorite(itemId, itemType) {
  return db.collection(COLLECTIONS.FAVORITES).where({
    itemId: itemId,
    itemType: itemType,
    _openid: '{openid}'
  }).get();
}

/**
 * 获取我的收藏列表
 */
function getMyFavorites() {
  return db.collection(COLLECTIONS.FAVORITES)
    .orderBy('createTime', 'desc')
    .get();
}

// ========== 图片相关 ==========

/**
 * 上传图片到云存储
 * @param {string} filePath - 本地文件路径
 * @returns {Promise<string>} 云存储 fileID
 */
function uploadImage(filePath) {
  const cloudPath = `goods/${Date.now()}-${Math.random().toString(36).substr(2, 6)}.jpg`;
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: res => resolve(res.fileID),
      fail: err => reject(err)
    });
  });
}

/**
 * 批量上传图片
 * @param {string[]} filePaths
 * @returns {Promise<string[]>}
 */
function uploadImages(filePaths) {
  const promises = filePaths.map(path => uploadImage(path));
  return Promise.all(promises);
}

// ========== 用户相关 ==========

function getUserInfo() {
  const app = getApp();
  return app.globalData.userInfo;
}

module.exports = {
  COLLECTIONS,
  getGoodsList,
  getGoodsDetail,
  addGoods,
  updateGoods,
  addFavorite,
  removeFavorite,
  checkFavorite,
  getMyFavorites,
  uploadImage,
  uploadImages,
  getUserInfo
};