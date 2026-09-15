const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createPlayState,
  normalizePlayState,
  applyPlayResult
} = require('../utils/play-state');

test('migrates legacy scene storage into a visible v2 state', () => {
  assert.deepEqual(
    normalizePlayState(null, 'living', 'window'),
    { currentSceneId: 'living', previousSceneId: 'window', visibility: 'visible' }
  );
});

test('normalizes invalid stored state to the legacy fallback', () => {
  assert.deepEqual(
    normalizePlayState({ currentSceneId: '', visibility: 'missing' }, 'balcony', ''),
    { currentSceneId: 'balcony', previousSceneId: '', visibility: 'visible' }
  );
});

test('settles stay, hidden and move results into stable cat states', () => {
  const initial = createPlayState('window', 'living', 'visible');
  assert.deepEqual(applyPlayResult(initial, 'visible', ''), initial);
  assert.deepEqual(applyPlayResult(initial, 'hidden', ''), {
    currentSceneId: 'window', previousSceneId: 'living', visibility: 'hidden'
  });
  assert.deepEqual(applyPlayResult(initial, 'visible', 'underbed'), {
    currentSceneId: 'underbed', previousSceneId: 'window', visibility: 'visible'
  });
});
