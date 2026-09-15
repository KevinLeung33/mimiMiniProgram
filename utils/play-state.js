const PLAY_STATE_KEY = 'cat-play-state-v2';

function createPlayState(currentSceneId = 'window', previousSceneId = '', visibility = 'visible') {
  return {
    currentSceneId,
    previousSceneId,
    visibility: visibility === 'hidden' ? 'hidden' : 'visible'
  };
}

function normalizePlayState(stored, legacySceneId = 'window', legacyPreviousSceneId = '') {
  if (!stored || !stored.currentSceneId || !['visible', 'hidden'].includes(stored.visibility)) {
    return createPlayState(legacySceneId || 'window', legacyPreviousSceneId || '', 'visible');
  }

  return createPlayState(stored.currentSceneId, stored.previousSceneId || '', stored.visibility);
}

function applyPlayResult(state, resultState, targetSceneId) {
  if (targetSceneId) {
    return createPlayState(targetSceneId, state.currentSceneId, 'visible');
  }

  return createPlayState(
    state.currentSceneId,
    state.previousSceneId,
    resultState === 'hidden' ? 'hidden' : 'visible'
  );
}

module.exports = {
  PLAY_STATE_KEY,
  createPlayState,
  normalizePlayState,
  applyPlayResult
};
