const test = require('node:test');
const assert = require('node:assert/strict');
const { SCENES } = require('../utils/scenes');

const EXPECTED_DESTINATIONS = {
  window: ['living', 'balcony', 'underbed'],
  living: ['window', 'balcony', 'underbed'],
  balcony: ['window', 'living'],
  underbed: ['window', 'living']
};

const EXPECTED_STAY_WEIGHT = {
  window: 55,
  living: 55,
  balcony: 70,
  underbed: 70
};

test('every interaction uses the agreed fixed scene-transition probabilities', () => {
  SCENES.forEach((scene) => {
    scene.actions.forEach((action) => {
      const movingOutcomes = action.outcomes.filter((outcome) => outcome.value.nextSceneId);
      const destinations = movingOutcomes
        .map((outcome) => ({ id: outcome.value.nextSceneId, weight: outcome.weight }))
        .sort((left, right) => left.id.localeCompare(right.id));

      assert.deepEqual(
        destinations,
        EXPECTED_DESTINATIONS[scene.id]
          .map((id) => ({ id, weight: 15 }))
          .sort((left, right) => left.id.localeCompare(right.id)),
        `${scene.name}的${action.label}应只前往约定的场景，且每条路径为15%`
      );
      assert.equal(
        action.outcomes.reduce((total, outcome) => total + outcome.weight, 0),
        100,
        `${scene.name}的${action.label}总概率应为100%`
      );
      assert.equal(
        action.outcomes
          .filter((outcome) => !outcome.value.nextSceneId)
          .reduce((total, outcome) => total + outcome.weight, 0),
        EXPECTED_STAY_WEIGHT[scene.id],
        `${scene.name}的${action.label}应保留约定比例的原地反应`
      );
    });
  });
});
