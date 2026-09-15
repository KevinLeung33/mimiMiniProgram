const { CARE_KEY, formatDate, addDays, getCareStatus } = require('../../utils/data');

Page({
  data: {
    tasks: []
  },

  onShow() {
    this.loadTasks();
  },

  loadTasks() {
    const tasks = (wx.getStorageSync(CARE_KEY) || []).map((task) => ({
      ...task,
      status: getCareStatus(task)
    }));
    this.setData({ tasks });
  },

  changeInterval(event) {
    const { id, delta } = event.currentTarget.dataset;
    const tasks = wx.getStorageSync(CARE_KEY) || [];
    const target = tasks.find((task) => task.id === id);
    if (!target) return;

    target.intervalDays = Math.max(1, Number(target.intervalDays) + Number(delta));
    if (target.lastDone) {
      target.nextDate = addDays(target.lastDone, target.intervalDays);
    }

    wx.setStorageSync(CARE_KEY, tasks);
    this.loadTasks();
  },

  completeTask(event) {
    const id = event.currentTarget.dataset.id;
    const tasks = wx.getStorageSync(CARE_KEY) || [];
    const target = tasks.find((task) => task.id === id);
    if (!target) return;

    const today = formatDate();
    target.lastDone = today;
    target.nextDate = addDays(today, target.intervalDays);
    wx.setStorageSync(CARE_KEY, tasks);
    wx.showToast({ title: '护理已记录', icon: 'success' });
    this.loadTasks();
  }
});
