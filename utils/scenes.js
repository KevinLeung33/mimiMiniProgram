const MEDIA = {
  background: scene => `/assets/scene-states/${scene}-real-bg-v01.jpg`,
  state: (scene, name) => `/assets/scene-states/${scene}-${name}-v01.jpg`,
  found: scene => `/assets/scene-states/${scene}-found-real-v01.jpg`
};

function response(text, media, nextSceneId, state) {
  return { text, media: { type: 'image', src: media }, nextSceneId, state: state || 'visible' };
}

function move(text, media, targetSceneId) { return response(text, media, targetSceneId); }

const SCENES = [
  { id: 'window', emoji: '☀️', name: '飘窗', description: '午后最爱晒太阳的位置。', background: MEDIA.background('window'), found: MEDIA.found('window'), actions: [
    { id: 'touch', label: '摸摸', outcomes: [
      { weight: 20, value: response('它伸了个懒腰，尾巴轻轻扫过窗台。', MEDIA.state('window', 'touch-stretch')) },
      { weight: 20, value: response('它继续趴着晒太阳，暂时不想动。', MEDIA.state('window', 'touch-ignore')) },
      { weight: 15, value: response('它轻轻咬了你一口，然后装作什么都没发生。', MEDIA.found('window')) },
      { weight: 15, value: move('它慢悠悠跑去客厅，换个位置晒太阳。', MEDIA.found('window'), 'living') },
      { weight: 15, value: move('它走到阳台，想继续吹风。', MEDIA.found('window'), 'balcony') },
      { weight: 15, value: move('它忽然钻下窗台，躲到床底去了。', MEDIA.found('window'), 'underbed') }
    ] },
    { id: 'pat', label: '拍屁股', outcomes: [
      { weight: 55, value: response('它伸了个懒腰，回头看了你一眼。', MEDIA.state('window', 'touch-stretch')) },
      { weight: 15, value: move('它跳下窗台，跑去客厅了。', MEDIA.found('window'), 'living') },
      { weight: 15, value: move('它扭头走向阳台，不理你了。', MEDIA.found('window'), 'balcony') },
      { weight: 15, value: move('它不接受这个互动，转身钻到床底。', MEDIA.found('window'), 'underbed') }
    ] },
    { id: 'wand', label: '逗猫棒', outcomes: [
      { weight: 20, value: response('它看了看逗猫棒，完全没有理会。', MEDIA.state('window', 'touch-ignore')) },
      { weight: 35, value: response('它突然来了精神，坐起来追着逗猫棒。', MEDIA.state('window', 'wand-sit')) },
      { weight: 15, value: move('它追着玩具跑去客厅。', MEDIA.state('window', 'wand-sit'), 'living') },
      { weight: 15, value: move('它追着玩具跑到阳台。', MEDIA.state('window', 'wand-sit'), 'balcony') },
      { weight: 15, value: move('它追着逗猫棒钻进床底。', MEDIA.found('window'), 'underbed') }
    ] }
  ] },
  { id: 'living', emoji: '🛋️', name: '客厅', description: '走来走去、晒太阳和观察你的一大片地方。', background: MEDIA.background('living'), found: MEDIA.found('living'), actions: [
    { id: 'touch', label: '摸摸', outcomes: [
      { weight: 20, value: response('它趴得更舒服了，尾巴在地上轻轻摆动。', MEDIA.state('living', 'touch-lie')) },
      { weight: 15, value: response('它伸了个懒腰，顺便巡视了一圈客厅。', MEDIA.found('living')) },
      { weight: 10, value: response('它突然回头，轻轻咬了你一口。', MEDIA.state('living', 'pat-bite')) },
      { weight: 10, value: response('它躲到一边，决定先观察你。', MEDIA.found('living'), null, 'hidden') },
      { weight: 15, value: move('它走回飘窗，想继续晒太阳。', MEDIA.found('living'), 'window') },
      { weight: 15, value: move('它慢慢走到阳台去吹风。', MEDIA.found('living'), 'balcony') },
      { weight: 15, value: move('它忽然钻到床底，想安静一会儿。', MEDIA.found('living'), 'underbed') }
    ] },
    { id: 'pat', label: '拍屁股', outcomes: [
      { weight: 15, value: response('它坐了起来，表情变得很认真。', MEDIA.state('living', 'wand-sit')) },
      { weight: 15, value: response('它伸了个懒腰，暂时原谅了你。', MEDIA.found('living')) },
      { weight: 15, value: response('它回头轻轻咬了一口，表示抗议。', MEDIA.state('living', 'pat-bite')) },
      { weight: 10, value: response('它躲到客厅角落，不想继续互动。', MEDIA.found('living'), null, 'hidden') },
      { weight: 15, value: move('它转身跑回飘窗了。', MEDIA.found('living'), 'window') },
      { weight: 15, value: move('它跑去阳台，决定吹吹风。', MEDIA.found('living'), 'balcony') },
      { weight: 15, value: move('它钻到床底，不想再被打扰。', MEDIA.found('living'), 'underbed') }
    ] },
    { id: 'wand', label: '逗猫棒', outcomes: [
      { weight: 15, value: response('它看着逗猫棒发呆，完全没有理会。', MEDIA.found('living')) },
      { weight: 20, value: response('它坐起来，认真盯住逗猫棒。', MEDIA.state('living', 'wand-sit')) },
      { weight: 10, value: response('它伸了个懒腰，准备开始追。', MEDIA.state('living', 'wand-sit')) },
      { weight: 10, value: response('它躲到角落里，等你把玩具送过去。', MEDIA.state('living', 'touch-lie'), null, 'hidden') },
      { weight: 15, value: move('它追着逗猫棒跑到飘窗。', MEDIA.found('living'), 'window') },
      { weight: 15, value: move('它追着玩具跑去阳台。', MEDIA.found('living'), 'balcony') },
      { weight: 15, value: move('它叼着玩具钻进床底。', MEDIA.found('living'), 'underbed') }
    ] }
  ] },
  { id: 'balcony', emoji: '🌿', name: '阳台', description: '吹风、看植物和观察外面世界的地方。', background: MEDIA.background('balcony'), found: MEDIA.found('balcony'), actions: [
    { id: 'touch', label: '摸摸', outcomes: [
      { weight: 25, value: response('它继续趴着吹风，舒服得眯起了眼睛。', MEDIA.state('balcony', 'touch-lie')) },
      { weight: 20, value: response('它慢慢伸了个懒腰。', MEDIA.state('balcony', 'pat-stretch')) },
      { weight: 15, value: response('它回头看了你一眼，又继续望着外面。', MEDIA.found('balcony')) },
      { weight: 10, value: response('它躲到盆栽旁边，不想被摸了。', MEDIA.found('balcony'), null, 'hidden') },
      { weight: 15, value: move('它离开阳台，跑回飘窗晒太阳。', MEDIA.found('balcony'), 'window') },
      { weight: 15, value: move('它慢慢踱回客厅去了。', MEDIA.found('balcony'), 'living') }
    ] },
    { id: 'pat', label: '拍屁股', outcomes: [
      { weight: 20, value: response('它坐了起来，认真地看着你。', MEDIA.found('balcony')) },
      { weight: 20, value: response('它伸展四肢，像是准备换个姿势。', MEDIA.state('balcony', 'pat-stretch')) },
      { weight: 20, value: response('它回头看了你一眼，像在提醒你别太得意。', MEDIA.found('balcony')) },
      { weight: 10, value: response('它躲到植物后面去了。', MEDIA.found('balcony'), null, 'hidden') },
      { weight: 15, value: move('它转身跑回飘窗了。', MEDIA.found('balcony'), 'window') },
      { weight: 15, value: move('它回屋里巡视，跑到客厅去了。', MEDIA.found('balcony'), 'living') }
    ] },
    { id: 'wand', label: '逗猫棒', outcomes: [
      { weight: 15, value: response('它看了一眼，决定继续看风景。', MEDIA.found('balcony')) },
      { weight: 30, value: response('它一口咬住逗猫棒，不肯松口。', MEDIA.state('balcony', 'wand-bite')) },
      { weight: 15, value: response('它伸了个懒腰，准备追过去。', MEDIA.state('balcony', 'pat-stretch')) },
      { weight: 10, value: response('它躲到角落里，等你继续逗它。', MEDIA.state('balcony', 'touch-lie'), null, 'hidden') },
      { weight: 15, value: move('它追着逗猫棒跑到飘窗。', MEDIA.found('balcony'), 'window') },
      { weight: 15, value: move('它追着玩具跑回客厅。', MEDIA.found('balcony'), 'living') }
    ] }
  ] },
  { id: 'underbed', emoji: '🛏️', name: '床底', description: '这里暂时只接受逗猫棒互动。', background: MEDIA.background('underbed'), found: MEDIA.state('underbed', 'wand-ignore'), actions: [
    { id: 'wand', label: '逗猫棒', outcomes: [
      { weight: 70, value: response('它看了一眼逗猫棒，决定继续躲着。', MEDIA.state('underbed', 'wand-ignore')) },
      { weight: 15, value: move('它被逗猫棒吸引，慢慢钻回飘窗。', MEDIA.state('underbed', 'wand-out'), 'window') },
      { weight: 15, value: move('它跟着逗猫棒，跑到客厅去了。', MEDIA.state('underbed', 'wand-out'), 'living') }
    ] }
  ] }
];

module.exports = { SCENES };
