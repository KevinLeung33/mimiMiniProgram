const RECORD_KEY = 'cat-records';
const CARE_KEY = 'cat-care-tasks';
const MEMORY_KEY = 'cat-scene-memories';
const FOOD_KEY = 'cat-food-library';

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateLabel(dateString) {
  if (!dateString) return '今天';
  const [, month, day] = dateString.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

function addDays(dateString, days) {
  const nextDate = new Date(`${dateString}T00:00:00`);
  nextDate.setDate(nextDate.getDate() + Number(days));
  return formatDate(nextDate);
}

function getDayDifference(targetDate) {
  const today = new Date(`${formatDate()}T00:00:00`).getTime();
  const target = new Date(`${targetDate}T00:00:00`).getTime();
  return Math.round((target - today) / 86400000);
}

function getDefaultCareTasks() {
  return [
    {
      id: 'teeth',
      icon: '🪥',
      name: '刷牙',
      intervalDays: 1,
      lastDone: '',
      nextDate: ''
    },
    {
      id: 'ears',
      icon: '👂',
      name: '掏耳朵',
      intervalDays: 7,
      lastDone: '',
      nextDate: ''
    },
    {
      id: 'deworming',
      icon: '🛡️',
      name: '驱虫',
      intervalDays: 30,
      lastDone: '',
      nextDate: ''
    }
  ];
}

function getDefaultFoods() {
  return [
    {
      id: 'example-chicken-mousse',
      brand: '示例品牌',
      flavor: '鸡肉主食罐',
      texture: '慕斯状',
      portion: '一罐',
      stockStatus: '正在吃'
    }
  ];
}

function normalizeLitter(value) {
  if (typeof value === 'number') {
    return { large: 0, medium: Math.max(0, value), small: 0 };
  }

  return {
    large: Math.max(0, Number(value && value.large) || 0),
    medium: Math.max(0, Number(value && value.medium) || 0),
    small: Math.max(0, Number(value && value.small) || 0)
  };
}

function formatLitterSummary(value) {
  const litter = normalizeLitter(value);
  return `大 ${litter.large} · 中 ${litter.medium} · 小 ${litter.small}`;
}

function getFoodDisplayName(food) {
  if (!food) return '未选择湿粮';
  return [food.brand, food.flavor].filter(Boolean).join(' · ') || '未命名湿粮';
}

function getFoodDetail(food) {
  if (!food) return '';
  return [food.texture, food.portion, food.stockStatus].filter(Boolean).join(' · ');
}

function normalizeRecord(record) {
  const food = record.food || {
    id: record.foodId || '',
    brand: record.foodBrand || '',
    flavor: record.foodFlavor || record.foodName || '',
    texture: record.foodTexture || '',
    portion: record.foodPortion || '',
    stockStatus: record.foodStockStatus || ''
  };

  return {
    ...record,
    urine: normalizeLitter(record.urine),
    stool: normalizeLitter(record.stool),
    food,
    appetite: record.appetite || record.foodEatStatus || '未记录'
  };
}

function ensureInitialData() {
  const records = wx.getStorageSync(RECORD_KEY);
  wx.setStorageSync(RECORD_KEY, Array.isArray(records) ? records.map(normalizeRecord) : []);

  if (!wx.getStorageSync(CARE_KEY)) {
    wx.setStorageSync(CARE_KEY, getDefaultCareTasks());
  }

  if (!wx.getStorageSync(MEMORY_KEY)) {
    wx.setStorageSync(MEMORY_KEY, []);
  }

  if (!wx.getStorageSync(FOOD_KEY)) {
    wx.setStorageSync(FOOD_KEY, getDefaultFoods());
  }
}

function getCareStatus(task) {
  if (!task.nextDate) {
    return '还未记录，按你的计划设置提醒';
  }

  const difference = getDayDifference(task.nextDate);
  if (difference < 0) return `已超期 ${Math.abs(difference)} 天`;
  if (difference === 0) return '今天提醒';
  if (difference === 1) return '明天提醒';
  return `${difference} 天后提醒`;
}

module.exports = {
  RECORD_KEY,
  CARE_KEY,
  MEMORY_KEY,
  FOOD_KEY,
  formatDate,
  formatDateLabel,
  addDays,
  getCareStatus,
  normalizeLitter,
  formatLitterSummary,
  getFoodDisplayName,
  getFoodDetail,
  normalizeRecord,
  ensureInitialData
};
