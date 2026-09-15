const { FOOD_KEY, getFoodDisplayName, getFoodDetail } = require('../../utils/data');

Page({
  data: {
    brand: '',
    flavor: '',
    foodTypes: ['慕斯状', '肉丝状', '肉泥状', '汤包', '肉块状', '其他'],
    typeIndex: 0,
    selectedType: '慕斯状',
    portions: ['一罐', '一包', '一个小勺', '半罐', '半包', '其他'],
    portionIndex: 0,
    selectedPortion: '一罐',
    stockStatuses: ['正在吃', '待尝试', '喜欢', '一般', '不吃', '已吃完'],
    stockStatusIndex: 0,
    selectedStockStatus: '正在吃',
    foodLibrary: []
  },

  onShow() {
    this.loadFoods();
  },

  loadFoods() {
    const foodLibrary = (wx.getStorageSync(FOOD_KEY) || []).map((food) => ({
      ...food,
      displayName: getFoodDisplayName(food),
      detail: getFoodDetail(food)
    }));
    this.setData({ foodLibrary });
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [field]: event.detail.value });
  },

  onTypeChange(event) {
    const typeIndex = Number(event.detail.value);
    this.setData({ typeIndex, selectedType: this.data.foodTypes[typeIndex] });
  },

  onPortionChange(event) {
    const portionIndex = Number(event.detail.value);
    this.setData({ portionIndex, selectedPortion: this.data.portions[portionIndex] });
  },

  onStatusChange(event) {
    const stockStatusIndex = Number(event.detail.value);
    this.setData({
      stockStatusIndex,
      selectedStockStatus: this.data.stockStatuses[stockStatusIndex]
    });
  },

  addFood() {
    const brand = this.data.brand.trim();
    const flavor = this.data.flavor.trim();
    if (!brand || !flavor) {
      wx.showToast({ title: '请填写品牌和口味', icon: 'none' });
      return;
    }

    const foodLibrary = wx.getStorageSync(FOOD_KEY) || [];
    foodLibrary.unshift({
      id: `food-${Date.now()}`,
      brand,
      flavor,
      texture: this.data.selectedType,
      portion: this.data.selectedPortion,
      stockStatus: this.data.selectedStockStatus
    });
    wx.setStorageSync(FOOD_KEY, foodLibrary);
    this.setData({ brand: '', flavor: '' });
    this.loadFoods();
    wx.showToast({ title: '已加入湿粮库', icon: 'success' });
  }
});
