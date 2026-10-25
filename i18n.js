/* Site language: English is the page source (what search engines index); Spanish and German are swapped in here.
   Translations live in i18n-dict.js as { "English text": ["Español", "Deutsch"] }. A text block that mixes text and
   inline tags (links, bold) is translated as one unit, tags included. Keys starting with "re:" are patterns for text
   with numbers or names in it ($1, $2 ... are the captured parts). Anything inside [data-i18n-skip] stays English. */
(function(){
'use strict';
var LANGS = ['en','es','de'], IDX = { es: 0, de: 1 };
var KEY = 'tm-lang';
var INLINE = { A:1, B:1, STRONG:1, EM:1, I:1, SPAN:1, BR:1, SMALL:1, SUP:1, SUB:1, CODE:1, U:1, MARK:1 };
var SKIP = { SCRIPT:1, STYLE:1, NOSCRIPT:1, TEMPLATE:1, TEXTAREA:1, INPUT:1, SELECT:1, OPTION:1, IMG:1, IFRAME:1, VIDEO:1, CANVAS:1 };
var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
var lang = 'en';
try { var saved = localStorage.getItem(KEY); if(IDX[saved] !== undefined) lang = saved; } catch(e){}

var DICT = window.TM_I18N || {}, plain = {}, pats = [];
function norm(s){ return String(s).replace(/\s+/g, ' ').trim(); }
Object.keys(DICT).forEach(function(k){
  if(k.indexOf('re:') === 0) pats.push({ re: new RegExp(k.slice(3)), v: DICT[k] });
  else plain[norm(k)] = DICT[k];
});
function lookup(en){
  if(lang === 'en') return null;
  var i = IDX[lang], key = norm(en), v = plain[key];
  if(v && v[i]) return v[i];
  for(var p = 0; p < pats.length; p++){
    var m = key.match(pats[p].re);
    if(m && pats[p].v[i]){
      var out = pats[p].v[i].replace(/\$(\d)/g, function(_, n){ var g = m[+n] || ''; var t = lookup(g); return t || g; });
      if(out !== key) return out;   // a pattern that changes nothing gives way to the next one
    }
  }
  // "A · B · C" labels: translate each part (names and years stay as they are)
  if(key.indexOf(' · ') > 0 && key.indexOf('<') < 0){
    var any = false, parts = key.split(' · ').map(function(part){ var t = hasLetters(part) ? lookup(part) : null; if(t){ any = true; return t; } return part; });
    if(any) return parts.join(' · ');
  }
  return null;
}
function hasLetters(s){ return /[A-Za-zÀ-ÿ]/.test(s); }
function skipped(el){ return el.closest && el.closest('[data-i18n-skip]'); }
// a block whose element children are all inline and which has its own text is handled as one unit
function isUnit(el){
  var own = false, inl = false;
  for(var n = el.firstChild; n; n = n.nextSibling){
    if(n.nodeType === 3){ if(norm(n.nodeValue)) own = true; }
    else if(n.nodeType === 1){ if(!INLINE[n.tagName] || n.querySelector('svg,img,button,input')) return false; inl = true; }
  }
  return own && inl;
}

/* walk a subtree and call fn for every translatable piece */
function walk(root, fn){
  if(root.nodeType === 3){ if(root.parentNode && !skipped(root.parentNode)) fn({ type: 'text', node: root }); return; }
  if(root.nodeType !== 1 || SKIP[root.tagName] || root.hasAttribute('data-i18n-skip')) return;
  ATTRS.forEach(function(a){ if(root.hasAttribute(a) && !(a === 'title' && root.tagName === 'HTML')) fn({ type: 'attr', node: root, attr: a }); });
  if(root.tagName !== 'svg' && root.tagName !== 'SVG' && root.namespaceURI !== 'http://www.w3.org/2000/svg' && isUnit(root)){ fn({ type: 'unit', node: root }); return; }
  for(var n = root.firstChild; n; n = n.nextSibling){
    if(n.nodeType === 3){ if(norm(n.nodeValue)) fn({ type: 'text', node: n }); }
    else walk(n, fn);
  }
}

/* remember the English of each piece so switching back is exact; refresh it when the page changes the text itself */
function apply(it){
  var n = it.node;
  if(it.type === 'text'){
    var cur = n.nodeValue;
    if(n.__tm === undefined || cur !== n.__tmOut) n.__tm = cur;
    var en = n.__tm; if(!hasLetters(en)) return;
    var t = lookup(en), out = t ? en.replace(norm(en), t) : en;
    if(cur !== out){ n.nodeValue = out; }
    n.__tmOut = out;
  } else if(it.type === 'unit'){
    var html = n.innerHTML;
    if(n.__tm === undefined || html !== n.__tmOut) n.__tm = html;
    var t2 = lookup(n.__tm), out2 = t2 || n.__tm;
    if(html !== out2){ n.innerHTML = out2; }
    n.__tmOut = n.innerHTML;
  } else {
    var a = it.attr, val = n.getAttribute(a), store = '__tm_' + a, outk = '__tmOut_' + a;
    if(n[store] === undefined || val !== n[outk]) n[store] = val;
    if(!hasLetters(n[store])) return;
    var t3 = lookup(n[store]), out3 = t3 || n[store];
    if(val !== out3) n.setAttribute(a, out3);
    n[outk] = out3;
  }
}
function translate(root){ walk(root || document.body, apply); }

/* text the site adds or changes later (panels, dialogs, progress box) is translated as it appears */
var mo = new MutationObserver(function(recs){
  var roots = [];
  recs.forEach(function(r){
    if(r.type === 'characterData') roots.push(r.target);
    else if(r.type === 'attributes') roots.push(r.target);
    else r.addedNodes.forEach(function(n){ roots.push(n); });
  });
  if(lang === 'en' && !roots.some(function(n){ return n.__tm !== undefined; })){ return; }
  roots.forEach(function(n){ if(n.isConnected) { if(n.nodeType === 1 && n.parentElement && isUnit(n.parentElement)) n = n.parentElement; walk(n, apply); } });
  mo.takeRecords();
});
function watch(){ mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS }); }

function setLang(l){
  if(LANGS.indexOf(l) < 0) l = 'en';
  lang = l; try { localStorage.setItem(KEY, l); } catch(e){}
  document.documentElement.lang = l;
  translate(document.body);
  var tt = document.querySelector('title');
  if(tt){ if(tt.__tm === undefined) tt.__tm = tt.textContent; var t = lookup(tt.__tm); document.title = t || tt.__tm; }
  mo.takeRecords();
  paintSwitch();
  document.dispatchEvent(new CustomEvent('tm-lang', { detail: l }));
}

/* ---------- the language switch (flag + code, opens downward on hover or tap) ---------- */
var FLAGS = {
  en: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#B22234"/><g fill="#fff"><rect y="3.08" width="60" height="3.08"/><rect y="9.23" width="60" height="3.08"/><rect y="15.38" width="60" height="3.08"/><rect y="21.54" width="60" height="3.08"/><rect y="27.69" width="60" height="3.08"/><rect y="33.85" width="60" height="3.08"/></g><rect width="26" height="21.54" fill="#3C3B6E"/><g fill="#fff" opacity=".9"><circle cx="4" cy="4" r="1"/><circle cx="10" cy="4" r="1"/><circle cx="16" cy="4" r="1"/><circle cx="22" cy="4" r="1"/><circle cx="7" cy="8" r="1"/><circle cx="13" cy="8" r="1"/><circle cx="19" cy="8" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="10" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="22" cy="12" r="1"/><circle cx="7" cy="16" r="1"/><circle cx="13" cy="16" r="1"/><circle cx="19" cy="16" r="1"/></g></svg>',
  es: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#AA151B"/><rect y="10" width="60" height="20" fill="#F1BF00"/></svg>',
  de: '<svg viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="13.34" fill="#000"/><rect y="13.33" width="60" height="13.34" fill="#DD0000"/><rect y="26.66" width="60" height="13.34" fill="#FFCE00"/></svg>'
};
var NAMES = { en: 'English', es: 'Español', de: 'Deutsch' };
function opt(l){ return '<button type="button" class="ls-opt" data-lang="' + l + '" lang="' + l + '" aria-label="' + NAMES[l] + '" title="' + NAMES[l] + '"><span class="ls-flag">' + FLAGS[l] + '</span><b>' + l.toUpperCase() + '</b></button>'; }
function paintSwitch(){
  document.querySelectorAll('[data-lang-switch]').forEach(function(sw){
    var order = [lang].concat(LANGS.filter(function(l){ return l !== lang; }));
    sw.setAttribute('data-i18n-skip', '');
    sw.innerHTML = '<div class="ls-menu" role="group" aria-label="Language">' + order.map(opt).join('') + '</div>';
    sw.querySelector('.ls-opt').setAttribute('aria-expanded', sw.classList.contains('open') ? 'true' : 'false');
  });
}
document.addEventListener('click', function(e){
  var sw = e.target.closest && e.target.closest('[data-lang-switch]');
  document.querySelectorAll('[data-lang-switch].open').forEach(function(o){ if(o !== sw) o.classList.remove('open'); });
  if(!sw) return;
  var b = e.target.closest('.ls-opt'); if(!b) return;
  var l = b.getAttribute('data-lang');
  if(l === lang){ sw.classList.toggle('open'); b.setAttribute('aria-expanded', sw.classList.contains('open') ? 'true' : 'false'); return; }
  sw.classList.remove('open'); setLang(l);
});
document.addEventListener('keydown', function(e){ if(e.key === 'Escape') document.querySelectorAll('[data-lang-switch].open').forEach(function(o){ o.classList.remove('open'); }); });


/* ---------- switch styles (shared by every page) ---------- */
var CSS = '.lang-sw{position:relative;width:42px;height:42px;flex:none;z-index:5}' +
  '.ls-menu{position:absolute;top:0;left:0;width:42px;max-height:42px;display:grid;overflow:hidden;border-radius:21px;border:1px solid var(--line-2,rgba(160,185,212,.32));background:rgba(20,40,64,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:max-height .45s cubic-bezier(.65,0,.35,1),box-shadow .3s}' +
  '.lang-sw.open .ls-menu{max-height:130px;box-shadow:0 18px 36px -16px rgba(0,0,0,.6)}' +
  '@media (hover:hover){.lang-sw:hover .ls-menu{max-height:130px;box-shadow:0 18px 36px -16px rgba(0,0,0,.6)}}' +
  '.ls-opt{width:40px;height:42px;flex:none;display:grid;place-items:center;align-content:center;gap:2px;padding:0;border:0;background:transparent;color:var(--text,#E9EEF4);cursor:pointer;font:700 9.5px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.06em;transition:background .2s}' +
  '.ls-opt+.ls-opt{border-top:1px solid var(--line,rgba(160,185,212,.16))}' +
  '.ls-opt:hover,.ls-opt:focus-visible{background:rgba(232,119,34,.18)}' +
  '.ls-opt:first-child b{color:var(--orange-2,#FF9B4D)}' +
  '.ls-flag{width:20px;height:14px;border-radius:3px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.25)}.ls-flag svg{display:block;width:100%;height:100%}' +
  'html[data-mode="light"] .ls-menu{background:rgba(255,255,255,.92);border-color:rgba(12,35,64,.18)}html[data-mode="light"] .ls-opt{color:#0C1B2E}html[data-mode="light"] .ls-opt:first-child b{color:#9A460C}' +
  '@media (max-width:480px){.lang-sw,.ls-menu{width:38px}.lang-sw{height:38px}.ls-menu{max-height:38px;border-radius:19px}.ls-opt{width:36px;height:38px}}';
function addCSS(){ if(document.getElementById('tm-lang-css')) return; var st = document.createElement('style'); st.id = 'tm-lang-css'; st.textContent = CSS; document.head.appendChild(st); }

window.TMI18n = {
  get lang(){ return lang; }, set: setLang, t: function(en){ return lookup(en) || en; }, translate: translate,
  // used to list every piece of English text on a page (for building the dictionary)
  collect: function(){ var out = []; walk(document.body, function(it){
    var v = it.type === 'text' ? norm(it.node.__tm !== undefined ? it.node.__tm : it.node.nodeValue) : it.type === 'unit' ? norm(it.node.__tm !== undefined ? it.node.__tm : it.node.innerHTML) : norm(it.node['__tm_' + it.attr] !== undefined ? it.node['__tm_' + it.attr] : it.node.getAttribute(it.attr));
    if(v && hasLetters(v)) out.push(v); }); return out; }
};
/* keep the desktop header on one line in every language */
function fitNav(){
  var n = document.querySelector('.nav-in'); if(!n) return;
  var root = document.documentElement;
  root.classList.remove('nav-snug', 'nav-snug2', 'nav-compact');
  if(window.innerWidth <= 1060) return;
  function fits(){ return n.scrollWidth <= n.clientWidth + 1; }
  // step by step: tighter menu, then no brand subtitle, then the menu button
  var steps = ['nav-snug', 'nav-snug2', 'nav-compact'];
  for(var i = 0; i < steps.length && !fits(); i++) root.classList.add(steps[i]);
}
var fitT = 0; function fitSoon(){ cancelAnimationFrame(fitT); fitT = requestAnimationFrame(fitNav); }
window.addEventListener('resize', fitSoon);
document.addEventListener('tm-lang', fitSoon);
function watchNav(){
  var n = document.querySelector('.nav-in'); if(!n) return;
  new MutationObserver(fitSoon).observe(n, { childList: true, subtree: true, characterData: true });
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitSoon);
  fitNav();
}

function init(){ addCSS(); paintSwitch(); watchNav(); watch(); if(lang !== 'en') setLang(lang); else document.documentElement.lang = 'en'; }
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
