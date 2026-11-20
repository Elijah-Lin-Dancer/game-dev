/* 背景音乐：原生 HTMLAudio 流式播放
 * 理由：本工程用 HTML5 Audio（禁了 WebAudio），音乐直接走浏览器流式解码，
 * 既不必进 Phaser 加载批次、也不占首屏；按情绪第一次出现时才新建 Audio。
 * 移动端/桌面都受自动播放策略约束，所以等第一次用户输入后 unlock 再响。
 */
const URLS = () => (window.ASSET_DATA && window.ASSET_DATA.music) || {};
const cache = {};        // mood -> HTMLAudioElement
let want = null;         // 当前想播的
let playing = null;      // 当前在响的
let unlocked = false;
let muted = false;

const VOL = 0.32;

function el(mood) {
  if (cache[mood]) return cache[mood];
  const url = URLS()[mood];
  if (!url) return null;
  const a = new Audio(url);
  a.loop = true;
  a.preload = 'auto';
  a.volume = muted ? 0 : VOL;
  cache[mood] = a;
  return a;
}

function stopCurrent() {
  if (playing) { playing.pause(); playing.currentTime = 0; }
  playing = null;
}

/* mood: 'dungeon' | 'fight'；同曲已在播就什么都不做 */
export function setMood(mood) {
  if (!mood) return;
  want = mood;
  if (playing && playing.dataset && playing.dataset.mood === mood) return;
  if (!unlocked) { el(mood); return; }   // 先把文件拉起来，等解锁再响
  const a = el(mood);
  if (!a) return;
  stopCurrent();
  a.dataset.mood = mood;
  const pr = a.play();
  if (pr && pr.catch) pr.catch(() => {});
  playing = a;
}

/* 第一次真实输入时调用；返回是否真的开始了播放 */
export function unlockMusic() {
  unlocked = true;
  if (want) setMood(want);
  return !!playing;
}

export function setMuted(v) {
  if (!!v !== muted) toggleMute();
  return muted;
}

export function toggleMute() {
  muted = !muted;
  Object.values(cache).forEach((a) => { a.volume = muted ? 0 : VOL; });
  return muted;
}

export function isMuted() { return muted; }

/* 调试用：给自动化测试读状态 */
export function musicState() {
  return {
    want, unlocked, muted,
    playing: playing ? playing.dataset.mood : null,
    paused: playing ? playing.paused : null,
    loaded: Object.keys(cache).map((k) => [k, cache[k].readyState]),
  };
}
