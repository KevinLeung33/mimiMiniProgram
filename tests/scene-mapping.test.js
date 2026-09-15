const test = require('node:test');
const assert = require('node:assert/strict');
const { SCENES } = require('../utils/scenes');

function actionById(scene, id) {
  return scene.actions.find((action) => action.id === id);
}

function imageSources(action) {
  return action.outcomes.map((outcome) => outcome.value.media.src);
}

test('the balcony wand photo is reserved for the wand action', () => {
  const balcony = SCENES.find((scene) => scene.id === 'balcony');
  const wandPhoto = '/assets/scene-states/balcony-wand-bite-v01.jpg';

  assert.ok(imageSources(actionById(balcony, 'wand')).includes(wandPhoto));
  assert.ok(!imageSources(actionById(balcony, 'touch')).includes(wandPhoto));
  assert.ok(!imageSources(actionById(balcony, 'pat')).includes(wandPhoto));
});
