const {
  RECORD_KEY,
  CARE_KEY,
  formatDate,
  formatDateLabel,
  addDays,
  getCareStatus,
  normalizeRecord,
  formatLitterSummary,
  getFoodDisplayName,
  getFoodDetail
} = require('../../utils/data');

Page({
  data: {
    todayLabel: '',
    record: {
      urineText: '大 0 · 中 0 · 小 0',
      stoolText: '大 0 · 中 0 · 小 0',
      foodText: '还没有湿粮记录',
      foodDetail: '',
      note: ''
    },
    careTasks: []
  },

  onShow() {
    this.loadDashboard();
  },

  loadDashboard() {
    const today = formatDate();
    const records = wx.getStorageSync(RECORD_KEY) || [];
    const storedRecord = records.find((item) => item.date === today);
    const todayRecord = storedRecord ? normalizeRecord(storedRecord) : null;
    const careTasks = (wx.getStorageSync(CARE_KEY) || []).map((task) => ({
      ...task,
      status: getCareStatus(task),
      isDoneToday: task.lastDone === today
    }));

    this.setData({
      todayLabel: formatDateLabel(today),
      record: todayRecord
        ? {
            ...todayRecord,
            urineText: formatLitterSummary(todayRecord.urine),
            stoolText: formatLitterSummary(todayRecord.stool),
            foodText: `${getFoodDisplayName(todayRecord.food)} · ${todayRecord.appetite}`,
            foodDetail: getFoodDetail(todayRecord.food)
          }
        : {
            urineText: '大 0 · 中 0 · 小 0',
            stoolText: '大 0 · 中 0 · 小 0',
            foodText: '还没有湿粮记录',
            foodDetail: '',
            note: ''
          },
      careTasks
    });
  },

  goToCare() {
    wx.navigateTo({ url: '/pages/care/care' });
  },

  markCareDone(event) {
    const id = event.currentTarget.dataset.id;
    const today = formatDate();
    const tasks = wx.getStorageSync(CARE_KEY) || [];
    const target = tasks.find((task) => task.id === id);

    if (!target) return;

    target.lastDone = today;
    target.nextDate = addDays(today, target.intervalDays);
    wx.setStorageSync(CARE_KEY, tasks);
    wx.showToast({ title: '已记录完成', icon: 'success' });
    this.loadDashboard();
  }
});
