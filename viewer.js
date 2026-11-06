/* In-page viewer: YouTube videos, 3DVista lab activities and readings from sites that allow it open in a large
   window over the page instead of a new tab. Auburn Box readings use Box's embed address, which allows it. This American Life
   refuses to be shown inside another page, so its episode plays in a small audio player here, with credit and a link to the show. Progress tracking is untouched: auth.js still sees the click on a[data-item].
   Lectures and podcasts played here are the exception: they count as done only once played to the end, with no skipping ahead,
   and they pause when the tab is hidden. The furthest point reached is kept in localStorage (tm-watch) so they pick up where they stopped. */
(function(){
'use strict';
// hosts checked on 2026-11-02 to load inside a frame
var PAGES = /^https:\/\/(cloud\.3dvista\.com|storage\.net-fs\.com|kaizen\.com|www\.6sigma\.us)\//i;
// This American Life episodes: the audio file the episode page itself offers for download
var AUDIO = {
  'www.thisamericanlife.org/561/nummi-2015': { mp3: 'https://www.thisamericanlife.org/sites/default/files/audio/561/r3IzbG6bzFT0_Lc5yVlHhsT8VKLOrSeFX2k4ksmlSUw/561.mp3',
    show: 'This American Life', ep: 'Episode 561 · NUMMI (2015)' }
};
var dlg, frame, els = {};
var WKEY = 'tm-watch';
var W = null;   // the lecture or podcast playing: { id, kind, player, max, dur, timer, ... }
// what each kind says: [counts message, skip message, complete message]
var MSG = {
  lecture: ['Watch to the end to complete this lecture. Skipping ahead is off, and it pauses if you leave this tab.',
    'Skipping ahead is off for lectures. You can go back, but not forward past what you have watched.',
    'Lecture complete. It now counts toward your progress.'],
  podcast: ['Listen to the end to complete this episode. Skipping ahead is off, and it pauses if you leave this tab.',
    'Skipping ahead is off for podcasts. You can go back, but not forward past what you have heard.',
    'Episode complete. It now counts toward your progress.']
};

function ytId(u){
  var m = u.match(/^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : null;
}
// YouTube's player inside another page cannot be dragged around in 360°, so 360° videos point learners to YouTube
function is360(id){
  var items = [], B = window.TM && TM.BYK;
  if(B) Object.keys(B).forEach(function(k){ items = items.concat(B[k].items || []); });
  return items.some(function(it){ return it.type === 'video360' && it.url && ytId(it.url) === id; });
}
function ytStart(u){ var m = u.match(/[?&]t=(\d+)/); return m ? '&start=' + m[1] : ''; }

function plan(a){
  var u = a.href || '';
  var id = ytId(u);
  if(id) return { kind: 'video', v360: is360(id), src: 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1' + ytStart(u), open: 'Watch on YouTube' };
  var au = audioOf(u);
  if(au) return { kind: 'audio', audio: au, open: 'Open on This American Life' };
  var box = u.match(/^https:\/\/auburn(?:\.app)?\.box\.com\/s\/(\w+)/i);
  if(box) return { kind: 'page', src: 'https://auburn.app.box.com/embed/s/' + box[1], open: 'Open in new tab' };
  if(PAGES.test(u)){
    var tour = /3dvista|net-fs/i.test(u);
    return { kind: tour ? 'tour' : 'page', src: u, open: 'Open in new tab' };
  }
  return null;
}

/* ---------- lecture watch tracking ---------- */
function itemOf(id){
  var B = window.TM && TM.BYK, hit = null; if(!id || !B) return null;
  Object.keys(B).forEach(function(k){ (B[k].items || []).forEach(function(it){ if(it.id === id) hit = it; }); });
  return hit;
}
function audioOf(u){ return AUDIO[String(u || '').replace(/^https?:\/\//, '').replace(/[?#].*$/, '').replace(/\/$/, '')]; }
// lectures on YouTube and podcasts with an in-page player are tracked; everything else counts on the click
function tracked(id){ var it = itemOf(id); return !!it && (it.type === 'lecture' && !!ytId(it.url || '') || it.type === 'podcast' && !!audioOf(it.url)); }
function loadW(){ try { return JSON.parse(localStorage.getItem(WKEY) || '{}') || {}; } catch(e){ return {}; } }
function saveW(id, max, dur){
  var all = loadW();
  if(max == null) delete all[id]; else all[id] = { m: Math.round(max), d: Math.round(dur || 0) };
  try { localStorage.setItem(WKEY, JSON.stringify(all)); } catch(e){}
}
function auth(){ return window.TMAuth && TMAuth.enabled ? TMAuth : null; }
function isDone(id){ var A = auth(); return !!(A && A.state.done[id]); }

var ytReady = null;
function loadYT(){
  if(ytReady) return ytReady;
  ytReady = new Promise(function(res, rej){
    if(window.YT && YT.Player) return res();
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function(){ if(prev) prev(); res(); };
    var s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
    s.onerror = function(){ ytReady = null; rej(); };
    document.head.appendChild(s);
    setTimeout(rej, 12000);
  });
  return ytReady;
}

function note(msg, ms){
  els.note.textContent = msg; els.note.classList.add('show');
  clearTimeout(els.note._h); els.note._h = setTimeout(function(){ els.note.classList.remove('show'); }, ms || 4200);
}
function paintW(){
  if(!W) return;
  var pct = W.done ? 100 : W.dur ? Math.min(100, Math.floor(W.max * 100 / W.dur)) : 0;
  els.wFill.style.width = pct + '%';
  els.wPct.textContent = pct + '%';
  dlg.classList.toggle('vw-wdone', W.done);
}
function complete(){
  if(W.done) return;
  W.done = true; saveW(W.id, null);
  var A = auth(); if(A) A.markDone(W.id);
  paintW(); note(MSG[W.kind][2], 5200);
}
function tick(){
  var P = W && W.player; if(!P || !P.getCurrentTime) return;
  var t = P.getCurrentTime() || 0, d = P.getDuration() || 0, now = Date.now();
  var dt = (now - W.wall) / 1000; W.wall = now;
  if(d) W.dur = d;
  if(W.done){ return; }
  // a jump past the furthest point watched is sent back there; going back to rewatch is fine
  var room = Math.max(2, dt * (P.getPlaybackRate ? P.getPlaybackRate() : 1) * 1.5 + 1);
  if(t > W.max + room){
    P.seekTo(W.max, true);
    note(MSG[W.kind][1]);
    return;
  }
  if(P.getPlayerState() === 1 && document.visibilityState === 'visible') W.max = Math.max(W.max, t);
  if(W.dur && W.max >= W.dur - 2) complete();
  if(now - W.saved > 5000){ W.saved = now; saveW(W.id, W.max, W.dur); }
  paintW();
}
function startWatch(a, id, kind, audioEl){
  var prev = loadW()[id] || {};
  W = { id: id, kind: kind, player: null, max: prev.m || 0, dur: prev.d || 0, done: isDone(id), wall: Date.now(), saved: Date.now(), timer: 0 };
  dlg.classList.add('vw-lec');
  els.wl.textContent = kind === 'podcast' ? 'Listened' : 'Watched';
  paintW();
  var w = W;
  function begin(){
    if(!w.done && w.max > 5){ w.player.seekTo(Math.max(0, w.max - 3), true); note('Picking up where you left off.'); }
    else if(!w.done) note(MSG[kind][0], 6000);
    w.timer = setInterval(tick, 500);
  }
  if(audioEl){
    // the same calls as the YouTube player, so tick() works for both
    w.player = { getCurrentTime: function(){ return audioEl.currentTime; }, getDuration: function(){ return isFinite(audioEl.duration) ? audioEl.duration : 0; },
      getPlaybackRate: function(){ return audioEl.playbackRate; }, getPlayerState: function(){ return audioEl.paused ? 2 : 1; },
      seekTo: function(t){ audioEl.currentTime = t; }, pauseVideo: function(){ audioEl.pause(); } };
    if(audioEl.readyState >= 1) begin(); else audioEl.addEventListener('loadedmetadata', function(){ if(W === w) begin(); }, { once: true });
    audioEl.addEventListener('ended', function(){ if(W === w && !w.done && w.max >= w.player.getDuration() - 5) complete(); });
    audioEl.addEventListener('error', function(){ if(W === w && !w.done){ var A = auth(); if(A) A.markDone(id); dlg.classList.remove('vw-lec'); } });
    return;
  }
  loadYT().then(function(){
    if(W !== w || !frame) return;
    w.player = new YT.Player(frame, { events: {
      onReady: function(){ if(W === w) begin(); },
      onStateChange: function(e){ if(W === w && e.data === 0 && !w.done && w.max >= (w.dur || 0) - 5) complete(); }
    }});
  }, function(){
    // the YouTube player API did not load (blocked or offline): count the lecture on opening, as before
    if(W === w){ var A = auth(); if(A) A.markDone(id); dlg.classList.remove('vw-lec'); }
  });
}
function stopWatch(){
  if(!W) return;
  clearInterval(W.timer);
  if(!W.done && W.player && W.max > 0) saveW(W.id, W.max, W.dur);
  W = null;
  dlg.classList.remove('vw-lec', 'vw-wdone');
  if(window.TMAuth && TMAuth.repaint) TMAuth.repaint();
}
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState !== 'hidden' || !W || W.done || !W.player || !W.player.getPlayerState) return;
  if(W.player.getPlayerState() === 1){ W.player.pauseVideo(); W.away = true; }
});
document.addEventListener('visibilitychange', function(){
  if(document.visibilityState === 'visible' && W && W.away){ W.away = false; note('Paused while you were away. Press play to keep going.'); }
});

function titleOf(a){
  var t = a.getAttribute('data-title') || (a.querySelector('b') && a.querySelector('b').textContent) || a.getAttribute('aria-label') || a.textContent;
  t = (t || '').replace(/\s+/g, ' ').trim();
  return a.getAttribute('aria-label') === t && t.indexOf(': ') > 0 ? t.slice(t.indexOf(': ') + 2) : t;   // "Watch lecture: People" -> "People"
}

function build(){
  dlg = document.createElement('dialog');
  dlg.className = 'vw';
  dlg.setAttribute('aria-labelledby', 'vw-h');
  dlg.innerHTML =
    '<div class="vw-bar"><div class="vw-t"><span class="vw-k"></span><b id="vw-h"></b></div>' +
    '<a class="vw-out" target="_blank" rel="noopener"><span></span><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></a>' +
    '<div class="vw-hint" hidden><a class="vw-hint-a" target="_blank" rel="noopener">Want the full 360° experience? Open it on YouTube to look around and choose what you see, and change the quality to 4K.</a><button type="button" class="vw-hint-x" aria-label="Close"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<button type="button" class="vw-x" aria-label="Close"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="vw-wbar" aria-hidden="true"><i></i></div>' +
    '<div class="vw-body"><div class="vw-load" aria-hidden="true"><i></i></div><p class="vw-note" role="status"></p></div>';
  document.body.appendChild(dlg);
  els.k = dlg.querySelector('.vw-k'); els.note = dlg.querySelector('.vw-note'); els.wFill = dlg.querySelector('.vw-wbar i');
  els.w = document.createElement('span'); els.w.className = 'vw-w'; els.w.innerHTML = '<span class="vw-wl">Watched</span> <span class="vw-wp"></span><span class="vw-wok">Complete</span>';
  els.k.after(els.w); els.wPct = els.w.querySelector('.vw-wp'); els.wl = els.w.querySelector('.vw-wl');
   els.h = dlg.querySelector('#vw-h'); els.out = dlg.querySelector('.vw-out'); els.body = dlg.querySelector('.vw-body'); els.hint = dlg.querySelector('.vw-hint'); els.hintA = dlg.querySelector('.vw-hint-a');
  dlg.querySelector('.vw-x').addEventListener('click', close);
  dlg.addEventListener('click', function(e){ if(e.target === dlg) close(); });
  dlg.addEventListener('close', function(){ stopWatch(); var au = frame && frame.querySelector && frame.querySelector('audio'); if(au) au.pause(); if(frame){ frame.remove(); frame = null; } document.documentElement.classList.remove('vw-open'); });
  els.out.addEventListener('click', function(){ close(); });
  els.hintA.addEventListener('click', function(){ close(); });
  dlg.querySelector('.vw-hint-x').addEventListener('click', function(){ els.hint.hidden = true; });
}

function open(a, p){
  if(!dlg) build();
  var KIND = { video: 'Video', tour: 'Lab activity', page: 'Reading', audio: 'Podcast' };
  dlg.className = 'vw vw-' + p.kind;
  els.k.textContent = KIND[p.kind];
  els.h.textContent = titleOf(a);
  els.out.href = a.href; els.out.querySelector('span').textContent = p.open;
  els.hintA.href = a.href; els.hint.hidden = !p.v360; dlg.classList.toggle('vw-360', !!p.v360);
  stopWatch();
  if(frame) frame.remove();
  if(p.kind === 'audio'){
    var au = p.audio;
    frame = document.createElement('div'); frame.className = 'vw-au';
    frame.innerHTML = '<div class="vw-au-art" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/></svg></div><div class="vw-au-t"><span class="vw-au-show"></span><b></b>' +
      '<audio controls autoplay preload="metadata"></audio><p class="vw-au-err" hidden>The episode could not be loaded here. Use the button above to listen on This American Life.</p>' +
      '<p class="vw-au-c">Audio courtesy of This American Life.</p></div>';
    frame.querySelector('.vw-au-show').textContent = au.show; frame.querySelector('b').textContent = au.ep;
    var el = frame.querySelector('audio'); el.src = au.mp3;
    el.addEventListener('error', function(){ el.hidden = true; frame.querySelector('.vw-au-err').hidden = false; });
    dlg.classList.add('vw-ready');
    els.body.appendChild(frame);
    document.documentElement.classList.add('vw-open');
    dlg.showModal();
    var pid = a.getAttribute('data-item');
    if(pid && tracked(pid)) startWatch(a, pid, 'podcast', el);
    return;
  }
  var lec = p.kind === 'video' && a.getAttribute('data-item');
  if(lec && !(tracked(lec) && itemOf(lec).type === 'lecture')) lec = null;
  if(lec) p.src += '&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
  frame = document.createElement('iframe');
  frame.title = titleOf(a);
  frame.src = p.src;
  frame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen; gyroscope; accelerometer; xr-spatial-tracking');
  frame.setAttribute('allowfullscreen', '');
  frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  frame.addEventListener('load', function(){ dlg.classList.add('vw-ready'); });
  dlg.classList.remove('vw-ready');
  els.body.appendChild(frame);
  document.documentElement.classList.add('vw-open');
  dlg.showModal();
  if(lec) startWatch(a, lec, 'lecture');
}
function close(){ if(dlg && dlg.open) dlg.close(); }

document.addEventListener('click', function(e){
  if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // modified clicks still open a new tab
  var a = e.target.closest && e.target.closest('a[href]'); if(!a || a.closest('.vw')) return;
  var p = plan(a); if(!p) return;
  e.preventDefault();
  open(a, p);
});

window.TMViewer = { handles: function(a){ return !!plan(a); }, close: close, tracked: tracked, watched: function(id){ var w = loadW()[id]; return w && w.d && w.m > 0 ? Math.max(1, Math.min(99, Math.floor(w.m * 100 / w.d))) : 0; } };

var css = document.createElement('style');
css.textContent =
  'html.vw-open{overflow:hidden}' +
  '.vw{width:min(1400px,96vw);height:min(900px,92vh);max-width:none;max-height:none;padding:0;border:1px solid rgba(160,185,212,.3);border-radius:18px;background:#07121F;color:#EAF0F7;overflow:hidden;box-shadow:0 40px 100px -30px rgba(0,0,0,.8)}' +
  '.vw[open]{display:grid;grid-template-rows:auto minmax(0,1fr);grid-template-columns:minmax(0,1fr)}' +
  '.vw.vw-video{width:min(1280px,96vw,calc((92vh - 64px) * 16 / 9));height:fit-content}' +
  '.vw.vw-video[open]{grid-template-rows:auto auto}' +
  '.vw.vw-video .vw-body{aspect-ratio:16/9}' +
  '.vw::backdrop{background:rgba(3,8,15,.82);backdrop-filter:blur(3px)}' +
  '.vw-bar{display:flex;align-items:center;gap:12px;padding:10px 10px 10px 18px;border-bottom:1px solid rgba(160,185,212,.18);min-height:58px;box-sizing:border-box}' +
  '.vw-t{display:grid;gap:2px;min-width:0;margin-right:auto}' +
  '.vw-k{font:600 12px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#FF9B4D}' +
  '.vw-t b{font:600 16px/1.3 "IBM Plex Sans",system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.vw-out{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;border:1px solid rgba(201,214,228,.45);color:#EAF0F7;text-decoration:none;font:600 13px "IBM Plex Sans",system-ui,sans-serif;white-space:nowrap}' +
  '.vw-out:hover,.vw-out:focus-visible{border-color:#FF9B4D;color:#FF9B4D}' +
  '.vw-bar{position:relative}' +
  '.vw-hint{position:absolute;top:calc(100% + 10px);right:62px;z-index:3;max-width:320px;padding:11px 38px 11px 14px;border-radius:12px;background:rgba(255,255,255,.96);color:#0C1B2E;font:500 13px/1.45 "IBM Plex Sans",system-ui,sans-serif;text-decoration:none;box-shadow:0 14px 34px -12px rgba(0,0,0,.6);opacity:0;transform:translateY(-4px);animation:vwHint .6s ease .9s forwards}' +
  '.vw-hint::before{content:"";position:absolute;top:-6px;right:52px;width:12px;height:12px;background:inherit;transform:rotate(45deg);border-radius:2px}' +
  '.vw-hint-a{color:inherit;text-decoration:none}.vw-hint-a:hover,.vw-hint-a:focus-visible{text-decoration:underline}' +
  '.vw-hint-x{position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;border:0;background:transparent;color:#26313F;display:grid;place-items:center;cursor:pointer}' +
  '.vw-hint-x:hover,.vw-hint-x:focus-visible{background:rgba(12,27,46,.08)}' +
  '@keyframes vwHint{to{opacity:1;transform:none}}' +
  '.vw-x{flex:none;width:42px;height:42px;border-radius:50%;border:1px solid rgba(201,214,228,.45);background:transparent;color:#EAF0F7;display:grid;place-items:center;cursor:pointer}' +
  '.vw-x:hover,.vw-x:focus-visible{border-color:#FF9B4D;color:#FF9B4D}' +
  '.vw-body{position:relative;background:#000;min-height:0}' +
  '.vw-page .vw-body{background:#fff}' +
  '.vw-body iframe{position:absolute;inset:0;width:100%;height:100%;border:0;opacity:0;transition:opacity .3s}' +
  '.vw-ready .vw-body iframe{opacity:1}' +
  '.vw-load{position:absolute;inset:0;display:grid;place-items:center}' +
  '.vw-load i{width:34px;height:34px;border-radius:50%;border:3px solid rgba(255,155,77,.25);border-top-color:#FF9B4D;animation:vwSpin .8s linear infinite}' +
  '.vw-ready .vw-load{display:none}' +
  '@keyframes vwSpin{to{transform:rotate(360deg)}}' +
  '.vw-wbar{display:none;height:3px;background:rgba(160,185,212,.16)}' +
  '.vw-wbar i{display:block;height:100%;width:0;background:#FF9B4D;transition:width .5s linear,background .3s}' +
  '.vw.vw-lec[open]{grid-template-rows:auto auto auto}' +
  '.vw.vw-lec .vw-wbar{display:block}' +
  '.vw-wdone .vw-wbar i{background:#3FB68B}' +
  '.vw-w{display:none;font:600 12px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:#C9D6E4}' +
  '.vw-lec .vw-w{display:inline}.vw-lec .vw-k{display:none}' +
  '.vw-wok{display:none;color:#6FD6AE}.vw-wdone .vw-wl,.vw-wdone .vw-wp{display:none}.vw-wdone .vw-wok{display:inline}' +
  '.vw-wok::before{content:"\\2713  "}' +
  '.vw-note{position:absolute;left:50%;top:14px;z-index:3;margin:0;max-width:min(560px,calc(100% - 32px));width:max-content;padding:10px 16px;border-radius:12px;background:rgba(7,18,31,.94);border:1px solid rgba(160,185,212,.3);color:#EAF0F7;font:500 14px/1.45 "IBM Plex Sans",system-ui,sans-serif;text-align:center;box-shadow:0 14px 34px -12px rgba(0,0,0,.7);opacity:0;transform:translate(-50%,-6px);transition:opacity .3s,transform .3s;pointer-events:none}' +
  '.vw-note.show{opacity:1;transform:translate(-50%,0)}' +
  '.vw.vw-audio{width:min(760px,96vw);height:fit-content}' +
  '.vw.vw-audio[open]{grid-template-rows:auto auto}' +
  '.vw-audio .vw-body{background:#07121F}' +
  '.vw.vw-audio.vw-lec[open]{grid-template-rows:auto auto auto}' +
  '.vw-au{display:grid;grid-template-columns:200px minmax(0,1fr);gap:24px;align-items:center;padding:24px}' +
  '.vw-au-art{aspect-ratio:1;border-radius:14px;display:grid;place-items:center;color:#FF9B4D;background:radial-gradient(120% 120% at 30% 20%,rgba(232,119,34,.28),rgba(232,119,34,0) 60%),#0E1E31;border:1px solid rgba(160,185,212,.2)}' +
  '.vw-au-art svg{width:42%;height:42%}' +
  '.vw-au-t{display:grid;gap:10px;min-width:0}' +
  '.vw-au-show{font:600 12px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:#FF9B4D}' +
  '.vw-au-t b{font:600 20px/1.3 "IBM Plex Sans",system-ui,sans-serif}' +
  '.vw-au audio{width:100%;margin-top:6px;color-scheme:dark}' +
  '.vw-au-err{margin:0;font:500 14px/1.5 "IBM Plex Sans",system-ui,sans-serif;color:#EAF0F7}' +
  '.vw-au-c{margin:0;font:500 13px/1.5 "IBM Plex Sans",system-ui,sans-serif;color:#C9D6E4}.vw-au-c a{color:#FF9B4D}' +
  '@media (max-width:640px){.vw.vw-audio{height:100dvh}.vw.vw-audio[open]{grid-template-rows:auto minmax(0,1fr)}.vw.vw-audio.vw-lec[open]{grid-template-rows:auto auto minmax(0,1fr)}.vw-au{grid-template-columns:1fr;align-content:start;justify-items:center;text-align:center}.vw-au-art{width:140px}.vw-au-t{width:100%}}' +
  '@media (max-width:640px){.vw.vw-video.vw-lec[open]{grid-template-rows:auto auto minmax(0,1fr)}}' +
  '@media (max-width:640px){.vw,.vw.vw-video{width:100vw;height:100dvh;border-radius:0;border:0}.vw.vw-video[open]{grid-template-rows:auto minmax(0,1fr)}.vw.vw-video .vw-body{aspect-ratio:auto}.vw-out span{display:none}.vw-out{padding:0;width:42px;height:42px;justify-content:center}.vw-bar{padding-left:14px}}' +
  '@media (max-width:640px){.vw-hint{right:10px;left:10px;max-width:none}.vw-hint::before{right:68px}}' +
  '@media (prefers-reduced-motion:reduce){.vw-load i{animation:none}.vw-hint{animation:none;opacity:1;transform:none}}';
document.head.appendChild(css);
})();
