const test = require('node:test');
const assert = require('node:assert/strict');
const { setTimeout: wait } = require('node:timers/promises');

function loadPlayPage(storage) {
  const pagePath = require.resolve('../pages/play/play');
  const originalPage = global.Page;
  const originalWx = global.wx;
  let definition;

  global.Page = (pageDefinition) => {
    definition = pageDefinition;
  };
  global.wx = {
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    showToast() {}
  };

  delete require.cache[pagePath];
  require('../pages/play/play');

  const page = {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(update) {
      Object.assign(this.data, update);
    }
  };

  return {
    page,
    restore() {
      delete require.cache[pagePath];
      global.Page = originalPage;
      global.wx = originalWx;
    }
  };
}

test('onShow migrates legacy location and renders the matching stable cat image', () => {
  const storage = {
    'cat-current-scene': 'living',
    'cat-previous-scene': 'window',
    'cat-scene-memories': []
  };
  const { page, restore } = loadPlayPage(storage);

  try {
    page.onShow();
    assert.deepEqual(storage['cat-play-state-v2'], {
      currentSceneId: 'living',
      previousSceneId: 'window',
      visibility: 'visible'
    });
    assert.equal(page.data.stableImageSrc, page.data.currentScene.found);
    assert.equal(page.data.transitionPhase, 'idle');
  } finally {
    restore();
  }
});

test('onShow recovers an obsolete stored scene ID to the first visible scene', () => {
  const storage = {
    'cat-play-state-v2': {
      currentSceneId: 'removed-scene',
      previousSceneId: 'window',
      visibility: 'hidden'
    },
    'cat-scene-memories': []
  };
  const { page, restore } = loadPlayPage(storage);

  try {
    page.onShow();
    assert.deepEqual(storage['cat-play-state-v2'], {
      currentSceneId: 'window',
      previousSceneId: 'window',
      visibility: 'visible'
    });
    assert.equal(page.data.catVisible, true);
  } finally {
    restore();
  }
});

test('finding a hidden cat persists visibility before its reveal animation finishes', async () => {
  const storage = {
    'cat-play-state-v2': {
      currentSceneId: 'window',
      previousSceneId: 'living',
      visibility: 'hidden'
    },
    'cat-scene-memories': []
  };
  const { page, restore } = loadPlayPage(storage);

  try {
    page.onShow();
    assert.equal(page.data.catVisible, false);
    page.findCat();
    assert.equal(storage['cat-play-state-v2'].visibility, 'visible');
    await wait(550);
    assert.equal(page.data.transitionPhase, 'idle');
    assert.equal(page.data.stableImageSrc, page.data.currentScene.found);
  } finally {
    page.onUnload();
    restore();
  }
});

test('a move settles at its target while a saved memory keeps the interaction scene', async () => {
  const storage = { 'cat-scene-memories': [] };
  const { page, restore } = loadPlayPage(storage);

  try {
    page.onShow();
    const sourceScene = page.data.currentScene;
    const finalState = { currentSceneId: 'living', previousSceneId: 'window', visibility: 'visible' };
    page.setData({
      catState: finalState,
      hasPlayed: true,
      lastInteractionSceneName: sourceScene.name,
      responseText: '它跑去客厅了。',
      responseMedia: { type: 'image', src: sourceScene.found }
    });
    page.startReaction({
      text: '它跑去客厅了。',
      media: { type: 'image', src: sourceScene.found }
    }, finalState, 'living');

    await wait(2500);
    assert.equal(page.data.currentScene.id, 'living');
    assert.equal(page.data.transitionPhase, 'idle');
    assert.equal(page.data.stableImageSrc, page.data.currentScene.found);

    page.saveMemory();
    assert.equal(storage['cat-scene-memories'][0].scene, sourceScene.name);
  } finally {
    page.onUnload();
    restore();
  }
});

test('returning after an interrupted move renders the persisted destination without replaying timers', async () => {
  const storage = { 'cat-scene-memories': [] };
  const { page, restore } = loadPlayPage(storage);

  try {
    page.onShow();
    const sourceScene = page.data.currentScene;
    const finalState = { currentSceneId: 'living', previousSceneId: 'window', visibility: 'visible' };
    page.saveCatState(finalState);
    page.startReaction({
      text: '它跑去客厅了。',
      media: { type: 'image', src: sourceScene.found }
    }, finalState, 'living');

    await wait(100);
    page.onHide();
    await wait(1150);
    page.onShow();

    assert.equal(page.data.currentScene.id, 'living');
    assert.equal(page.data.catVisible, true);
    assert.equal(page.data.transitionPhase, 'idle');
    assert.equal(page.data.isAnimating, false);
  } finally {
    page.onUnload();
    restore();
  }
});

test('returning after an interrupted hide keeps the cat hidden until the user searches', async () => {
  const storage = { 'cat-scene-memories': [] };
  const { page, restore } = loadPlayPage(storage);

  try {
    page.onShow();
    const scene = page.data.currentScene;
    const finalState = { currentSceneId: scene.id, previousSceneId: '', visibility: 'hidden' };
    page.saveCatState(finalState);
    page.startReaction({
      text: '它躲到角落去了。',
      media: { type: 'image', src: scene.found }
    }, finalState, '');

    await wait(100);
    page.onHide();
    await wait(900);
    page.onShow();

    assert.equal(page.data.currentScene.id, scene.id);
    assert.equal(page.data.catVisible, false);
    assert.equal(page.data.stableImageSrc, scene.background);
    assert.equal(page.data.transitionPhase, 'idle');
  } finally {
    page.onUnload();
    restore();
  }
});

test('a stay reaction remains visible during the automatic reading hold', async () => {
  const storage = { 'cat-scene-memories': [] };
  const { page, restore } = loadPlayPage(storage);

  try {
    page.onShow();
    const scene = page.data.currentScene;
    const result = {
      text: '它舒服地眯起了眼睛。',
      media: { type: 'image', src: scene.actions[0].outcomes[0].value.media.src }
    };
    page.startReaction(result, page.data.catState, '');

    await wait(550);
    assert.equal(page.data.stableImageSrc, result.media.src);
    assert.equal(page.data.transitionPhase, 'reaction-hold');
    assert.equal(page.data.isAnimating, true);
  } finally {
    page.onUnload();
    restore();
  }
});

test('a move reaction also remains visible before the cat changes scenes', async () => {
  const storage = { 'cat-scene-memories': [] };
  const { page, restore } = loadPlayPage(storage);

  try {
    page.onShow();
    const sourceScene = page.data.currentScene;
    const finalState = { currentSceneId: 'living', previousSceneId: sourceScene.id, visibility: 'visible' };
    const result = {
      text: '它跑去客厅了。',
      media: { type: 'image', src: sourceScene.found }
    };
    page.startReaction(result, finalState, 'living');

    await wait(550);
    assert.equal(page.data.currentScene.id, sourceScene.id);
    assert.equal(page.data.stableImageSrc, result.media.src);
    assert.equal(page.data.transitionPhase, 'reaction-hold');
  } finally {
    page.onUnload();
    restore();
  }
});

test('saving a memory is unavailable until an interaction sequence has settled', () => {
  const storage = { 'cat-scene-memories': [] };
  const { page, restore } = loadPlayPage(storage);

  try {
    page.onShow();
    const scene = page.data.currentScene;
    page.setData({
      hasPlayed: true,
      responseText: '它舒服地眯起了眼睛。',
      responseMedia: { type: 'image', src: scene.found },
      lastInteractionSceneName: scene.name
    });
    page.startReaction({
      text: '它舒服地眯起了眼睛。',
      media: { type: 'image', src: scene.found }
    }, page.data.catState, '');

    page.saveMemory();
    assert.equal(storage['cat-scene-memories'].length, 0);
  } finally {
    page.onUnload();
    restore();
  }
});
