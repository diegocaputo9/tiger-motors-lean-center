/* In-page viewer: YouTube videos, 3DVista lab activities and readings from sites that allow it open in a large
   window over the page instead of a new tab. Sites that refuse to be shown inside another page (This American Life,
   Auburn Box) keep opening in a new tab. Progress tracking is untouched: auth.js still sees the click on a[data-item]. */
(function(){
'use strict';
// hosts checked on 2026-11-02 to load inside a frame
var PAGES = /^https:\/\/(cloud\.3dvista\.com|storage\.net-fs\.com|kaizen\.com|www\.6sigma\.us)\//i;
var dlg, frame, els = {};

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
  if(PAGES.test(u)){
    var tour = /3dvista|net-fs/i.test(u);
    return { kind: tour ? 'tour' : 'page', src: u, open: 'Open in new tab' };
  }
  return null;
}

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
    '<a class="vw-hint" target="_blank" rel="noopener" hidden>Want the full 360° experience? Open it on YouTube to look around and choose what you see.</a>' +
    '<button type="button" class="vw-x" aria-label="Close"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="vw-body"><div class="vw-load" aria-hidden="true"><i></i></div></div>';
  document.body.appendChild(dlg);
  els.k = dlg.querySelector('.vw-k'); els.h = dlg.querySelector('#vw-h'); els.out = dlg.querySelector('.vw-out'); els.body = dlg.querySelector('.vw-body'); els.hint = dlg.querySelector('.vw-hint');
  dlg.querySelector('.vw-x').addEventListener('click', close);
  dlg.addEventListener('click', function(e){ if(e.target === dlg) close(); });
  dlg.addEventListener('close', function(){ if(frame){ frame.remove(); frame = null; } document.documentElement.classList.remove('vw-open'); });
  els.out.addEventListener('click', function(){ close(); });
  els.hint.addEventListener('click', function(){ close(); });
}

function open(a, p){
  if(!dlg) build();
  var KIND = { video: 'Video', tour: 'Lab activity', page: 'Reading' };
  dlg.className = 'vw vw-' + p.kind;
  els.k.textContent = KIND[p.kind];
  els.h.textContent = titleOf(a);
  els.out.href = a.href; els.out.querySelector('span').textContent = p.open;
  els.hint.href = a.href; els.hint.hidden = !p.v360; dlg.classList.toggle('vw-360', !!p.v360);
  if(frame) frame.remove();
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
}
function close(){ if(dlg && dlg.open) dlg.close(); }

document.addEventListener('click', function(e){
  if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // modified clicks still open a new tab
  var a = e.target.closest && e.target.closest('a[href]'); if(!a || a.closest('.vw')) return;
  var p = plan(a); if(!p) return;
  e.preventDefault();
  open(a, p);
});

window.TMViewer = { handles: function(a){ return !!plan(a); }, close: close };

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
  '.vw-hint{position:absolute;top:calc(100% + 10px);right:62px;z-index:3;max-width:300px;padding:11px 14px;border-radius:12px;background:rgba(255,255,255,.96);color:#0C1B2E;font:500 13px/1.45 "IBM Plex Sans",system-ui,sans-serif;text-decoration:none;box-shadow:0 14px 34px -12px rgba(0,0,0,.6);opacity:0;transform:translateY(-4px);animation:vwHint .6s ease .9s forwards}' +
  '.vw-hint::before{content:"";position:absolute;top:-6px;right:52px;width:12px;height:12px;background:inherit;transform:rotate(45deg);border-radius:2px}' +
  '.vw-hint:hover{background:#fff;text-decoration:underline}' +
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
  '@media (max-width:640px){.vw,.vw.vw-video{width:100vw;height:100dvh;border-radius:0;border:0}.vw.vw-video[open]{grid-template-rows:auto minmax(0,1fr)}.vw.vw-video .vw-body{aspect-ratio:auto}.vw-out span{display:none}.vw-out{padding:0;width:42px;height:42px;justify-content:center}.vw-bar{padding-left:14px}}' +
  '@media (max-width:640px){.vw-hint{right:10px;left:10px;max-width:none}.vw-hint::before{right:68px}}' +
  '@media (prefers-reduced-motion:reduce){.vw-load i{animation:none}.vw-hint{animation:none;opacity:1;transform:none}}';
document.head.appendChild(css);
})();
