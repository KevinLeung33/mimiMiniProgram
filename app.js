const { ensureInitialData } = require('./utils/data');

App({
  onLaunch() {
    ensureInitialData();
  }
});
