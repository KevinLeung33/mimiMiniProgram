const {
  RECORD_KEY,
  FOOD_KEY,
  formatDate,
  formatDateLabel,
  normalizeLitter,
  normalizeRecord,
  getFoodDisplayName,
  getFoodDetail
} = require('../../utils/data');

Page({
  data: {
    initialized: false,
    todayLabel: '',
    urine: { large: 0, medium: 0, small: 0 },
    stool: { large: 0, medium: 0, small: 0 },
    foodLibrary: [],
    foodLabels: [],
    foodIndex: 0,
    selectedFoodId: '',
    selectedFoodName: '',
    selectedFoodDetail: '',
    appetites: ['吃完', '吃一部分', '闻了闻就走', '明确不吃'],
    appetiteIndex: 0,
    selectedAppetite: '吃完',
    note: ''
  },

  onLoad() {
    this.loadRecord();
    this.setData({ initialized: true });
  },

  onShow() {
    if (this.data.initialized) {
      this.refreshFoods(this.data.selectedFoodId);
    }
  },

  loadRecord() {
    const today = formatDate();
    const records = wx.getStorageSync(RECORD_KEY) || [];
    const storedRecord = records.find((item) => item.date === today);
    const record = storedRecord ? normalizeRecord(storedRecord) : null;

    this.setData({
      todayLabel: formatDateLabel(today),
      urine: record ? record.urine : { large: 0, medium: 0, small: 0 },
      stool: record ? record.stool : { large: 0, medium: 0, small: 0 },
      selectedFoodId: record && record.food ? record.food.id : '',
      selectedAppetite: record ? record.appetite : '吃完',
      appetiteIndex: Math.max(0, this.data.appetites.indexOf(record ? record.appetite : '吃完')),
      note: record ? record.note : ''
    });
    this.refreshFoods(record && record.food ? record.food.id : '');
  },

  refreshFoods(preferredId) {
    const foodLibrary = wx.getStorageSync(FOOD_KEY) || [];
    const targetId = preferredId || this.data.selectedFoodId;
    let foodIndex = foodLibrary.findIndex((food) => food.id === targetId);
    if (foodIndex < 0) foodIndex = 0;

    const selectedFood = foodLibrary[foodIndex] || null;
    this.setData({
      foodLibrary,
      foodLabels: foodLibrary.map((food) => getFoodDisplayName(food)),
      foodIndex,
      selectedFoodId: selectedFood ? selectedFood.id : '',
      selectedFoodName: selectedFood ? getFoodDisplayName(selectedFood) : '先去新增一种湿粮',
      selectedFoodDetail: selectedFood ? getFoodDetail(selectedFood) : ''
    });
  },

  changeLitter(event) {
    const { group, size, delta } = event.currentTarget.dataset;
    const litter = normalizeLitter(this.data[group]);
    litter[size] = Math.max(0, litter[size] + Number(delta));
    this.setData({ [group]: litter });
  },

  onFoodChange(event) {
    const index = Number(event.detail.value);
    const food = this.data.foodLibrary[index];
    if (!food) return;

    this.setData({
      foodIndex: index,
      selectedFoodId: food.id,
      selectedFoodName: getFoodDisplayName(food),
      selectedFoodDetail: getFoodDetail(food)
    });
  },

  onAppetiteChange(event) {
    const index = Number(event.detail.value);
    this.setData({
      appetiteIndex: index,
      selectedAppetite: this.data.appetites[index]
    });
  },

  onNoteInput(event) {
    this.setData({ note: event.detail.value });
  },

  goToFoodLibrary() {
    wx.navigateTo({ url: '/pages/food/food' });
  },

  saveRecord() {
    const today = formatDate();
    const records = wx.getStorageSync(RECORD_KEY) || [];
    const food = this.data.foodLibrary[this.data.foodIndex] || null;
    const record = {
      id: today,
      date: today,
      urine: normalizeLitter(this.data.urine),
      stool: normalizeLitter(this.data.stool),
      food: food ? { ...food } : null,
      appetite: this.data.selectedAppetite,
      note: this.data.note.trim()
    };
    const index = records.findIndex((item) => item.date === today);

    if (index >= 0) {
      records[index] = record;
    } else {
      records.unshift(record);
    }

    wx.setStorageSync(RECORD_KEY, records);
    wx.showToast({ title: '今天已保存', icon: 'success' });
    setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 700);
  }
});
