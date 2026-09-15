const { MEMORY_KEY, formatDate } = require('../../utils/data');
const { SCENES } = require('../../utils/scenes');
const {
  PLAY_STATE_KEY,
  createPlayState,
  normalizePlayState,
  applyPlayResult
} = require('../../utils/play-state');

const LEGACY_SCENE_KEY = 'cat-current-scene';
const LEGACY_PREVIOUS_KEY = 'cat-previous-scene';
const REACTION_IN_MS = 300;
const REACTION_HOLD_MS = 1200;
const SETTLE_MS = 260;
const INITIAL_RESPONSE = {
  text: '先找到猫咪，再选择一种互动方式。',
  media: { type: 'placeholder', emoji: '🔎' }
};

function choose(outcomes) {
  const total = outcomes.reduce((sum, item) => sum + item.weight, 0);
  const roll = Math.random() * total;
  let cursor = 0;
  return outcomes.find((item) => (cursor += item.weight) > roll).value;
}

function sceneById(id) {
  return SCENES.find((scene) => scene.id === id) || SCENES[0];
}

function cueForAction(actionLabel) {
  const cues = {
    '摸摸': '你轻轻摸了摸它……',
    '拍屁股': '你轻轻拍了拍它……',
    '逗猫棒': '你晃了晃逗猫棒……'
  };
  return cues[actionLabel] || '你试着和它互动……';
}

Page({
  data: {
    scenes: SCENES,
    currentScene: SCENES[0],
    currentSceneIndex: 0,
    currentActionIndex: 0,
    catState: { currentSceneId: 'window', previousSceneId: '', visibility: 'visible' },
    catVisible: true,
    stableImageSrc: SCENES[0].found,
    outgoingImageSrc: '',
    transitionPhase: 'idle',
    isAnimating: false,
    sceneFeedback: '猫咪就在这里。',
    responseText: INITIAL_RESPONSE.text,
    responseMedia: INITIAL_RESPONSE.media,
    hasPlayed: false,
    lastInteractionSceneName: '',
    memoryCount: 0
  },

  onShow() {
    this.clearTransitions();
    const catState = this.readCatState();
    const memories = wx.getStorageSync(MEMORY_KEY) || [];

    this.setData({
      memoryCount: memories.length,
      hasPlayed: false,
      lastInteractionSceneName: '',
      responseText: INITIAL_RESPONSE.text,
      responseMedia: INITIAL_RESPONSE.media
    });
    this.renderStableScene(catState.currentSceneId, catState);
  },

  onHide() {
    this.clearTransitions();
  },

  onUnload() {
    this.clearTransitions();
  },

  readCatState() {
    const stored = wx.getStorageSync(PLAY_STATE_KEY);
    const legacySceneId = wx.getStorageSync(LEGACY_SCENE_KEY);
    const legacyPreviousSceneId = wx.getStorageSync(LEGACY_PREVIOUS_KEY);
    let catState = normalizePlayState(stored, legacySceneId, legacyPreviousSceneId);
    if (!SCENES.some((scene) => scene.id === catState.currentSceneId)) {
      catState = createPlayState(SCENES[0].id, catState.previousSceneId, 'visible');
    }
    wx.setStorageSync(PLAY_STATE_KEY, catState);
    return catState;
  },

  saveCatState(catState) {
    wx.setStorageSync(PLAY_STATE_KEY, catState);
  },

  clearTransitions() {
    (this.transitionTimers || []).forEach((timer) => clearTimeout(timer));
    this.transitionTimers = [];
    this.transitionVersion = (this.transitionVersion || 0) + 1;
  },

  scheduleTransition(delay, callback) {
    const version = this.transitionVersion;
    const timer = setTimeout(() => {
      this.transitionTimers = (this.transitionTimers || []).filter((item) => item !== timer);
      if (version !== this.transitionVersion) return;
      callback();
    }, delay);
    this.transitionTimers = [...(this.transitionTimers || []), timer];
  },

  stableImageFor(scene, catState) {
    const catIsHere = scene.id === catState.currentSceneId;
    return catIsHere && catState.visibility === 'visible' ? scene.found : scene.background;
  },

  feedbackFor(scene, catState) {
    if (scene.id !== catState.currentSceneId) return '这里没有发现猫咪。';
    if (catState.visibility === 'hidden') return '它躲起来了，试着找找它。';
    return '猫咪就在这里。';
  },

  renderStableScene(sceneId, catState, feedback) {
    const scene = sceneById(sceneId);
    const catVisible = scene.id === catState.currentSceneId && catState.visibility === 'visible';
    this.setData({
      currentScene: scene,
      currentSceneIndex: SCENES.indexOf(scene),
      currentActionIndex: 0,
      catState,
      catVisible,
      stableImageSrc: this.stableImageFor(scene, catState),
      outgoingImageSrc: '',
      transitionPhase: 'idle',
      isAnimating: false,
      sceneFeedback: feedback || this.feedbackFor(scene, catState)
    });
  },

  selectScene(event) {
    if (this.data.isAnimating) return;

    const scene = SCENES[Number(event.currentTarget.dataset.index)];
    if (!scene || scene.id === this.data.currentScene.id) return;

    const catState = this.data.catState;
    this.clearTransitions();
    this.setData({
      isAnimating: true,
      outgoingImageSrc: this.data.stableImageSrc,
      stableImageSrc: this.stableImageFor(scene, catState),
      transitionPhase: 'scene-switch',
      sceneFeedback: '换个地方找找它。',
      hasPlayed: false,
      responseText: INITIAL_RESPONSE.text,
      responseMedia: INITIAL_RESPONSE.media
    });
    this.scheduleTransition(180, () => this.renderStableScene(scene.id, catState));
  },

  selectAction(event) {
    if (this.data.isAnimating) return;

    this.setData({
      currentActionIndex: Number(event.currentTarget.dataset.index),
      sceneFeedback: '准备好了就点击“互动”。',
      responseText: INITIAL_RESPONSE.text,
      responseMedia: INITIAL_RESPONSE.media,
      hasPlayed: false
    });
  },

  resolveTargetSceneId(nextSceneId) {
    if (nextSceneId === 'random-room') {
      const choices = SCENES.filter((scene) => (
        ['window', 'living', 'balcony'].includes(scene.id)
        && scene.id !== this.data.currentScene.id
      ));
      return choices[Math.floor(Math.random() * choices.length)].id;
    }

    if (nextSceneId === 'previous-room') {
      return this.data.catState.previousSceneId || 'window';
    }

    return nextSceneId || '';
  },

  playReaction() {
    if (this.data.isAnimating) return;

    const { currentScene, catState } = this.data;
    const catIsHere = currentScene.id === catState.currentSceneId;
    if (!catIsHere) {
      wx.showToast({ title: '这里没有找到它', icon: 'none' });
      return;
    }

    if (catState.visibility === 'hidden') {
      this.findCat();
      return;
    }

    const action = currentScene.actions[this.data.currentActionIndex];
    if (!action) return;

    const result = choose(action.outcomes);
    const targetSceneId = this.resolveTargetSceneId(result.nextSceneId);
    const finalState = applyPlayResult(catState, result.state, targetSceneId);
    this.saveCatState(finalState);
    this.setData({
      catState: finalState,
      responseText: result.text,
      responseMedia: result.media,
      hasPlayed: true,
      lastInteractionSceneName: currentScene.name
    });
    this.startReaction(result, finalState, targetSceneId, action.label);
  },

  startReaction(result, finalState, targetSceneId, actionLabel) {
    const currentScene = this.data.currentScene;
    this.clearTransitions();
    this.setData({
      isAnimating: true,
      catVisible: true,
      outgoingImageSrc: this.data.stableImageSrc,
      stableImageSrc: result.media.src,
      transitionPhase: 'reaction',
      sceneFeedback: cueForAction(actionLabel)
    });

    this.scheduleTransition(REACTION_IN_MS, () => {
      this.setData({
        outgoingImageSrc: '',
        transitionPhase: 'reaction-hold',
        sceneFeedback: result.text
      });

      this.scheduleTransition(REACTION_HOLD_MS, () => {
        if (targetSceneId) {
          this.playMoveTransition(currentScene, result, finalState, targetSceneId);
          return;
        }

        if (finalState.visibility === 'hidden') {
          this.playHideTransition(currentScene, result, finalState);
          return;
        }

        this.playStayTransition(currentScene, result, finalState);
      });
    });
  },

  playStayTransition(scene, result, finalState) {
    this.setData({
      catState: finalState,
      catVisible: true,
      outgoingImageSrc: this.data.stableImageSrc,
      stableImageSrc: scene.found,
      transitionPhase: 'settling',
      sceneFeedback: result.text
    });
    this.scheduleTransition(SETTLE_MS, () => {
      this.setData({
        outgoingImageSrc: '',
        transitionPhase: 'idle',
        isAnimating: false
      });
    });
  },

  playHideTransition(scene, result, finalState) {
    this.setData({
      catState: finalState,
      catVisible: false,
      outgoingImageSrc: this.data.stableImageSrc,
      stableImageSrc: scene.background,
      transitionPhase: 'leaving',
      sceneFeedback: `${result.text} 它暂时躲起来了。`
    });
    this.scheduleTransition(450, () => {
      this.setData({
        outgoingImageSrc: '',
        transitionPhase: 'idle',
        isAnimating: false,
        currentActionIndex: 0
      });
    });
  },

  playMoveTransition(scene, result, finalState, targetSceneId) {
    this.setData({
      catState: finalState,
      catVisible: false,
      outgoingImageSrc: this.data.stableImageSrc,
      stableImageSrc: scene.background,
      transitionPhase: 'leaving',
      sceneFeedback: `${result.text} 它已经离开这里了。`
    });
    this.scheduleTransition(450, () => {
      const nextScene = sceneById(targetSceneId);
      this.setData({
        currentScene: nextScene,
        currentSceneIndex: SCENES.indexOf(nextScene),
        currentActionIndex: 0,
        catState: finalState,
        catVisible: true,
        outgoingImageSrc: scene.background,
        stableImageSrc: nextScene.found,
        transitionPhase: 'arriving',
        sceneFeedback: '猫咪跑到这里来了。'
      });
      this.scheduleTransition(350, () => {
        this.setData({
          outgoingImageSrc: '',
          transitionPhase: 'idle',
          isAnimating: false
        });
      });
    });
  },

  findCat() {
    if (this.data.isAnimating) return;

    const { currentScene, catState } = this.data;
    if (currentScene.id !== catState.currentSceneId || catState.visibility !== 'hidden') return;

    const finalState = applyPlayResult(catState, 'visible', '');
    this.saveCatState(finalState);
    this.clearTransitions();
    this.setData({
      isAnimating: true,
      catState: finalState,
      catVisible: false,
      outgoingImageSrc: currentScene.background,
      stableImageSrc: currentScene.background,
      transitionPhase: 'searching',
      sceneFeedback: '你在角落里找找看……'
    });
    this.scheduleTransition(180, () => {
      this.setData({
        catVisible: true,
        outgoingImageSrc: currentScene.background,
        stableImageSrc: currentScene.found,
        transitionPhase: 'arriving',
        sceneFeedback: '找到了，它还在这里。'
      });
      this.scheduleTransition(350, () => {
        this.setData({
          outgoingImageSrc: '',
          transitionPhase: 'idle',
          isAnimating: false
        });
      });
    });
  },

  saveMemory() {
    if (this.data.isAnimating) {
      wx.showToast({ title: '等猫咪行动结束再收进回忆', icon: 'none' });
      return;
    }

    if (!this.data.hasPlayed) {
      wx.showToast({ title: '先和它互动一次吧', icon: 'none' });
      return;
    }

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const memories = wx.getStorageSync(MEMORY_KEY) || [];
    memories.unshift({
      id: `${Date.now()}`,
      date: formatDate(),
      time,
      scene: this.data.lastInteractionSceneName || this.data.currentScene.name,
      response: this.data.responseText,
      media: this.data.responseMedia
    });
    wx.setStorageSync(MEMORY_KEY, memories);
    this.setData({ memoryCount: memories.length });
    wx.showToast({ title: '已收进小剧场回忆', icon: 'success' });
  }
});
