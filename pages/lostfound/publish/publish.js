// pages/lostfound/publish/publish.js — 发布失物/招领信息
Page({
  data: {
    type: '失物',
    title: '',
    category: '证件',
    description: '',
    contactName: '',
    contactPhone: '',
    location: '',
    images: [],
    uploadCount: 0,
    maxUploadCount: 6,
    categories: ['证件', '电子产品', '生活用品', '其他'],
    submitting: false
  },

  // 切换类型
  switchType: function (e) {
    var type = e.currentTarget.dataset.type
    this.setData({ type: type })
  },

  // 选择分类
  selectCategory: function (e) {
    var category = e.currentTarget.dataset.category
    this.setData({ category: category })
  },

  // 输入标题
  onTitleInput: function (e) {
    this.setData({ title: e.detail.value })
  },

  // 输入描述
  onDescInput: function (e) {
    this.setData({ description: e.detail.value })
  },

  // 输入联系人
  onContactNameInput: function (e) {
    this.setData({ contactName: e.detail.value })
  },

  // 输入电话
  onContactPhoneInput: function (e) {
    this.setData({ contactPhone: e.detail.value })
  },

  // 输入地点
  onLocationInput: function (e) {
    this.setData({ location: e.detail.value })
  },

  // 选择图片
  chooseImage: function () {
    var that = this
    var remain = that.data.maxUploadCount - that.data.images.length
    if (remain <= 0) {
      wx.showToast({ title: '最多上传6张图片', icon: 'none' })
      return
    }

    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var newImages = that.data.images.concat(res.tempFilePaths)
        that.setData({
          images: newImages,
          uploadCount: newImages.length
        })
      }
    })
  },

  // 删除图片
  deleteImage: function (e) {
    var index = e.currentTarget.dataset.index
    var newImages = this.data.images.slice()
    newImages.splice(index, 1)
    this.setData({
      images: newImages,
      uploadCount: newImages.length
    })
  },

  // 预览图片
  previewImage: function (e) {
    var index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    })
  },

  // 上传图片到云存储
  uploadImages: function () {
    var that = this
    var promises = that.data.images.map(function (filePath, index) {
      var ext = filePath.match(/\.(\w+)$/)
      var cloudPath = 'lostfound/' + Date.now() + '_' + index + '.' + (ext ? ext[1] : 'jpg')
      return wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      }).then(function (res) {
        return res.fileID
      })
    })
    return Promise.all(promises)
  },

  // 提交表单
  submitForm: function () {
    var that = this

    // 表单验证
    if (!that.data.title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    if (!that.data.description.trim()) {
      wx.showToast({ title: '请输入详细描述', icon: 'none' })
      return
    }
    if (!that.data.contactPhone.trim()) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' })
      return
    }

    that.setData({ submitting: true })
    wx.showLoading({ title: '发布中...' })

    // 先上传图片
    var uploadTask
    if (that.data.images.length > 0) {
      uploadTask = that.uploadImages()
    } else {
      uploadTask = Promise.resolve([])
    }

    uploadTask
      .then(function (fileIDs) {
        var db = wx.cloud.database()
        return db.collection('lost_found').add({
          data: {
            type: that.data.type,
            title: that.data.title.trim(),
            category: that.data.category,
            description: that.data.description.trim(),
            images: fileIDs,
            contactName: that.data.contactName.trim(),
            contactPhone: that.data.contactPhone.trim(),
            location: that.data.location.trim(),
            status: 'active',
            createTime: db.serverDate()
          }
        })
      })
      .then(function () {
        wx.hideLoading()
        wx.showToast({ title: '发布成功' })
        setTimeout(function () {
          wx.navigateBack()
        }, 1500)
      })
      .catch(function (err) {
        console.error('发布失败：', err)
        wx.hideLoading()
        wx.showToast({ title: '发布失败，请重试', icon: 'none' })
        that.setData({ submitting: false })
      })
  }
})
