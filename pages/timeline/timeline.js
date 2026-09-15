const {
  RECORD_KEY,
  MEMORY_KEY,
  formatDateLabel,
  normalizeRecord,
  formatLitterSummary,
  getFoodDisplayName,
  getFoodDetail
} = require('../../utils/data');

Page({
  data: {
    records: [],
    memories: []
  },

  onShow() {
    const records = (wx.getStorageSync(RECORD_KEY) || [])
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((storedRecord) => {
        const record = normalizeRecord(storedRecord);
        return {
          ...record,
          dateLabel: formatDateLabel(record.date),
          urineText: formatLitterSummary(record.urine),
          stoolText: formatLitterSummary(record.stool),
          foodText: `${getFoodDisplayName(record.food)} · ${record.appetite}`,
          foodDetail: getFoodDetail(record.food)
        };
      });
    const memories = (wx.getStorageSync(MEMORY_KEY) || []).slice(0, 3);
    this.setData({ records, memories });
  }
});
