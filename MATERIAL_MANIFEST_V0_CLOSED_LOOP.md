# 小剧场 V0 三场景闭环物料清单

这份清单把小剧场的内容直接整理成可开发配置：场景 → 行为 → 概率反应 → 反馈素材 → 猫咪状态 → 目标场景。每个行为下的概率合计必须为 100%。

## 玩法闭环

```text
进入小剧场 → 读取 currentSceneId 和 catState
→ 首次进入随机选择飘窗 / 客厅 / 阳台
→ 超过冷却时间后，约 30% 概率移动到另外一个场景，约 70% 留在原场景
→ 点击当前场景找到猫 → 选择摸摸 / 拍拍屁股 / 逗猫棒
→ 按概率播放图片或视频 → 更新 visible / hidden / currentSceneId
```

- `visible`：猫在当前场景，可以互动；
- `hidden`：猫钻到当前场景的隐蔽处，当前不能互动；下次真正进入小剧场时再判定重新出现或移动；
- `move`：猫离开当前场景，淡出后更新到目标场景；
- 切换页面、返回前台或重复点击不能重新抽概率。

## 场景和移动关系

| 场景 ID | 展示名称 | 默认画面 | 可移动到 | 背景 | 找到猫图层 |
| --- | --- | --- | --- | --- | --- |
| `window` | 飘窗 | 趴在窗台晒太阳 | 客厅、阳台 | `window-bg-v01.jpg` | `window-found-v01.png` |
| `living` | 客厅 | 坐在沙发或地毯旁 | 飘窗、阳台 | `living-bg-v01.jpg` | `living-found-v01.png` |
| `balcony` | 阳台 | 趴在垫子或盆栽旁 | 飘窗、客厅 | `balcony-bg-v01.jpg` | `balcony-found-v01.png` |
| `underbed` | 床底 | 露出脑袋或两只眼睛 | 飘窗（或 `previousSceneId`） | `underbed-bg-v01.jpg` | `underbed-found-v01.png` |

“去其他场景”的目标从另外两个场景中选择，V0 可先等概率；后续再根据真实猫咪习惯调整目标权重。床底是特殊场景：只提供逗猫棒互动，出来后回到 `previousSceneId`，如果没有记录则回到飘窗。

## 概率配置

### 飘窗 `window`

| 行为 | 概率反应 | 反馈素材 | 结果 |
| --- | --- | --- | --- |
| 摸摸 | 30% 伸懒腰；30% 继续趴着；30% 咬一口；5% 钻到床底；5% 走出房间 | `window-stretch-v01.png`；found 图；`window-bite-v01.png`；移动淡出 | 留在飘窗；移动到床底；移动到客厅或阳台 |
| 拍屁股 | 40% 伸懒腰；30% 钻到床底；30% 走出房间 | `window-stretch-v01.png`；移动淡出 | 留在飘窗；移动到床底；移动到客厅或阳台 |
| 逗猫棒 | 30% 不理会；50% 玩逗猫棒；10% 钻到床底；10% 走出房间 | found 图；`window-play-v01.png`；移动淡出 | 留在飘窗；移动到床底；移动到客厅或阳台 |

### 客厅 `living`

| 行为 | 概率反应 | 反馈素材 | 结果 |
| --- | --- | --- | --- |
| 摸摸 | 25% 坐着享受；25% 伸懒腰；20% 继续趴着；20% 咬一口；10% 去其他场景 | `living-sit-v01.png`；`living-stretch-v01.png`；found 图；`living-bite-v01.png`；移动淡出 | 留在客厅；移动到飘窗或阳台 |
| 拍屁股 | 20% 坐起来；20% 伸懒腰；20% 咬一口；20% 躲到沙发后；20% 跑去其他场景 | `living-sit-v01.png`；`living-stretch-v01.png`；`living-bite-v01.png`；隐藏/移动淡出 | 留在客厅；隐藏；移动到飘窗或阳台 |
| 逗猫棒 | 20% 不理会；50% 玩逗猫棒；10% 躲到沙发后；20% 追着玩具跑走 | found 图；`living-play-v01.png`；隐藏/移动淡出 | 留在客厅；隐藏；移动到飘窗或阳台 |

### 阳台 `balcony`

| 行为 | 概率反应 | 反馈素材 | 结果 |
| --- | --- | --- | --- |
| 摸摸 | 35% 继续趴着；25% 伸懒腰；15% 咬一口；15% 躲到角落；10% 跑回屋里 | found 图；`balcony-stretch-v01.png`；`balcony-bite-v01.png`；隐藏/移动淡出 | 留在阳台；隐藏；移动到飘窗或客厅 |
| 拍屁股 | 25% 坐起来；25% 伸懒腰；25% 咬一口；15% 躲到角落；10% 跑回屋里 | `balcony-sit-v01.png`；`balcony-stretch-v01.png`；`balcony-bite-v01.png`；隐藏/移动淡出 | 留在阳台；隐藏；移动到飘窗或客厅 |
| 逗猫棒 | 25% 不理会；35% 玩逗猫棒；15% 伸爪试探；15% 躲到角落；10% 追玩具跑回屋里 | found 图；`balcony-play-v01.png`；隐藏/移动淡出 | 留在阳台；隐藏；移动到飘窗或客厅 |

## 场景四：床底

床底不是普通活动场景，而是猫咪从其他场景“钻进去”后的特殊场景。这里不提供摸摸和拍拍屁股，只提供逗猫棒。

### 用逗猫棒跟床底的小猫咪玩

| 概率 | 猫咪反应 | 反馈素材 | 状态变化 |
| ---: | --- | --- | --- |
| 30% | 被逗猫棒吸引，慢慢出来 | `underbed-out-v01.png` | `move`，回到 `previousSceneId`；没有记录时回到飘窗 |
| 70% | 不理会，继续躲在床底 | 复用 `underbed-found-v01.png` | `visible`，留在床底 |

## 需要准备的物料

### 参考照片

```text
[ ] cat-id-01-front.jpg
[ ] cat-id-02-left.jpg
[ ] cat-id-03-right.jpg
[ ] cat-id-04-fullbody.jpg
[ ] cat-id-05-sit.jpg
[ ] cat-id-06-sleep.jpg
[ ] cat-id-07-marking-detail.jpg
[ ] room-window-01.jpg
[ ] room-living-01.jpg
[ ] room-balcony-01.jpg
```

### 最终图片

| 类型 | 数量 | 文件规则 |
| --- | ---: | --- |
| 猫咪风格母版 | 1 | `cat-style-master-v01.png` |
| 无猫场景背景 | 4 | `window-bg-v01.jpg`、`living-bg-v01.jpg`、`balcony-bg-v01.jpg`、`underbed-bg-v01.jpg` |
| 找到猫图层 | 4 | `window-found-v01.png`、`living-found-v01.png`、`balcony-found-v01.png`、`underbed-found-v01.png` |
| 互动回应图 | 12 | 飘窗 `stretch`、`bite`、`play` 各一张；客厅和阳台各有 `stretch`、`sit`、`bite`、`play`；床底有 `underbed-out`；没有对应状态时复用 found 图 |
| 可选短视频 | 2–3 | 先确认同名 PNG，再制作同名 `.mp4`，首版可以不做 |

核心图片共 21 个：1 张母版 + 4 张背景 + 4 张 found 图 + 12 张回应图。钻到床底和移动使用猫咪图层淡出；床底的“不理会”复用 found 图，不额外制作“消失图”。

目录建议：

```text
assets/scenes/window-bg-v01.jpg
assets/scenes/living-bg-v01.jpg
assets/scenes/balcony-bg-v01.jpg
assets/scenes/underbed-bg-v01.jpg
assets/reactions/window-found-v01.png
assets/reactions/window-stretch-v01.png
assets/reactions/window-bite-v01.png
assets/reactions/window-play-v01.png
assets/reactions/living-found-v01.png
assets/reactions/living-sit-v01.png
assets/reactions/living-stretch-v01.png
assets/reactions/living-bite-v01.png
assets/reactions/living-play-v01.png
assets/reactions/balcony-found-v01.png
assets/reactions/balcony-sit-v01.png
assets/reactions/balcony-stretch-v01.png
assets/reactions/balcony-bite-v01.png
assets/reactions/balcony-play-v01.png
assets/reactions/underbed-found-v01.png
assets/reactions/underbed-out-v01.png
```

每条代码配置至少保存：`outcomeId`、`weight`、`mediaAssetId`、`nextState`、`targetSceneId`、`message`。每个移动结果必须有目标场景；每个行为的概率必须为 100%。

## 验收清单

- [ ] 三张背景无猫、无人物、视角和光线稳定；
- [ ] found 图和回应图是同一只猫，花纹位置一致；
- [ ] PNG 有真正透明通道，猫没有被裁掉；
- [ ] 每个结果都明确对应 `visible`、`hidden` 或 `move`；
- [ ] 三处场景互相可达，形成闭环；
- [ ] 只把 approved 素材放进小程序，草稿和原始照片留在源文件夹；
- [ ] 新版本使用 `v02`，不覆盖 `v01`。
