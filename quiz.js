/* End-of-module quizzes. The questions live in modules-data.js (module.quiz). A page puts an empty element with
   data-quiz="<module key>" where the quiz card goes; this script fills it in and keeps it up to date:
   locked and greyed out until every resource of the module is done, then "Take the quiz". Questions come one at a
   time with the explanation (and an optional list, q.l) after each answer. Passing (module.quiz.pass correct answers) marks the quiz done
   through auth.js like any other resource, so it counts toward the module and the certificate. The best score is
   kept on this device and, when signed in, in the account. */
(function(){
'use strict';
var TM = window.TM; if(!TM || !TM.BYK) return;
var BEST_KEY = 'tm-quiz-best';
var LOCK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
var QICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17h.01"/></svg>';
var CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12.5l4 4L18 8"/></svg>';
var ARROW = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
var KIND = { mc: 'Multiple choice', tf: 'True or false', blank: 'Fill in the blank' };
var esc = TM.esc;

function auth(){ return window.TMAuth; }
function done(id){ var A = auth(); return !!(A && A.state.done[id]); }
function resources(m){ return (m.items || []).filter(function(it){ return it.url && it.id && !it.optional; }); }

/* ---------- best score: this device, plus the account when signed in ---------- */
function localBest(){ try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}') || {}; } catch(e){ return {}; } }
function accountBest(){ var A = auth(), u = A && A.state.user; return (u && u.user_metadata && u.user_metadata.quiz_best) || {}; }
function best(id){ var a = localBest()[id], b = accountBest()[id]; return Math.max(a == null ? -1 : a, b == null ? -1 : b); }
function saveBest(id, score){
  if(score <= best(id)) return;
  var l = localBest(); l[id] = score; try { localStorage.setItem(BEST_KEY, JSON.stringify(l)); } catch(e){}
  var A = auth(), u = A && A.state.user;
  if(u && A.client){
    var all = {}, ab = accountBest(); Object.keys(ab).forEach(function(k){ all[k] = ab[k]; }); all[id] = score;
    u.user_metadata = u.user_metadata || {}; u.user_metadata.quiz_best = all;
    A.client.auth.updateUser({ data: { quiz_best: all } }).then(function(r){ if(r.error) console.warn('quiz score', r.error.message); });
  }
}

/* ---------- the card ---------- */
function status(k){
  var m = TM.BYK[k], qz = m.quiz, res = resources(m), n = res.filter(function(it){ return done(it.id); }).length;
  var passed = done(qz.id), b = best(qz.id), total = qz.q.length;
  return { m: m, qz: qz, n: n, of: res.length, open: passed || n === res.length, passed: passed, best: b, total: total };
}
function cardHTML(k, mini){
  var s = status(k), title = 'Module ' + (+s.m.n) + ' quiz', line, act, cls;
  if(!s.open){
    cls = 'q-lock'; line = s.of === 2 ? 'Complete both resources to unlock' : 'Complete all ' + s.of + ' resources to unlock';
    act = mini ? '<span class="q-count">' + LOCK + '<b>' + s.n + '/' + s.of + '</b></span>'
               : '<span class="rc-act q-act" aria-disabled="true"><span>Locked</span>' + LOCK + '</span>';
  } else {
    cls = s.passed ? 'q-pass' : 'q-open';
    line = s.passed ? (s.best >= 0 ? 'Passed · best ' + s.best + '/' + s.total : 'Passed')
         : (s.best >= 0 ? 'Best ' + s.best + '/' + s.total + ' · ' + s.qz.pass + ' needed to pass' : s.total + ' questions · ' + s.qz.pass + ' of ' + s.total + ' to pass');
    var verb = s.passed ? 'Retake quiz' : 'Take the quiz';
    act = mini ? '<span class="q-go"><span>' + verb + '</span>' + ARROW + '</span>'
               : '<button type="button" class="rc-act q-act" data-quiz-open="' + k + '"><span>' + verb + '</span>' + ARROW + '</button>';
  }
  if(mini){
    return { cls: cls, html: '<span class="ic">' + (s.open ? (s.passed ? CHECK : QICON) : LOCK) + '</span><span><b>' + title + '</b><small>' + line + '</small></span>' + act };
  }
  var top = '<div class="rc-top"><span class="badge t-quiz">' + (s.open ? QICON : LOCK) + 'Quiz</span>' +
    (s.open ? '' : '<span class="rc-step q-count">' + s.n + '/' + s.of + '</span>') + '</div>';
  return { cls: cls, html: top + '<div><h4>' + title + '</h4><p>' + line + '</p></div>' + act };
}
function paint(){
  document.querySelectorAll('[data-quiz]').forEach(function(el){
    var k = el.getAttribute('data-quiz'); if(!TM.BYK[k] || !TM.BYK[k].quiz) return;
    var mini = el.classList.contains('mini'), c = cardHTML(k, mini), key = c.cls + c.html;
    if(el.getAttribute('data-qh') === key) return;
    el.setAttribute('data-qh', key);
    el.innerHTML = c.html;
    ['q-lock', 'q-open', 'q-pass'].forEach(function(x){ el.classList.toggle(x, x === c.cls); });
    el.classList.toggle('is-done', c.cls === 'q-pass');
    if(mini){
      el.disabled = c.cls === 'q-lock';
      if(c.cls === 'q-lock') el.removeAttribute('data-quiz-open'); else el.setAttribute('data-quiz-open', k);
    }
    el.title = c.cls === 'q-lock' ? 'Complete all the resources in this module to unlock the quiz' : '';
  });
}

/* ---------- the quiz dialog ---------- */
var dlg, run;
function build(){
  dlg = document.createElement('dialog');
  dlg.className = 'qz'; dlg.setAttribute('aria-labelledby', 'qz-h');
  dlg.innerHTML = '<div class="qz-in"><div class="qz-head"><div class="qz-bar"><span class="qz-k" id="qz-h"></span><button type="button" class="qz-x" aria-label="Close quiz"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="qz-prog" aria-hidden="true"><i></i></div></div><div class="qz-body" aria-live="polite"></div></div>';
  document.body.appendChild(dlg);
  dlg.querySelector('.qz-x').addEventListener('click', function(){ dlg.close(); });
  dlg.addEventListener('click', function(e){ if(e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function(){ document.documentElement.classList.remove('qz-open'); var o = run && run.opener; run = null; if(o && o.isConnected) o.focus(); });
  dlg.querySelector('.qz-body').addEventListener('click', onBody);
}
function open(k, opener){
  var m = TM.BYK[k]; if(!m || !m.quiz) return;
  if(!dlg) build();
  run = { k: k, m: m, qz: m.quiz, i: 0, score: 0, answered: false, opener: opener };
  dlg.querySelector('.qz-k').textContent = 'Module ' + (+m.n) + ' quiz · ' + m.name;
  question();
  document.documentElement.classList.add('qz-open');
  if(!dlg.open) dlg.showModal();
}
function setProg(n){ dlg.querySelector('.qz-prog i').style.width = (n * 100 / run.qz.q.length) + '%'; }
function question(){
  var q = run.qz.q[run.i], total = run.qz.q.length;
  run.answered = false; setProg(run.i);
  var opts = q.o.map(function(o, j){
    return '<button type="button" class="qz-o" data-o="' + j + '">' + (q.t === 'tf' ? '' : '<i aria-hidden="true">' + 'ABCD'.charAt(j) + '</i>') + '<span>' + esc(o) + '</span></button>';
  }).join('');
  body('<p class="qz-n"><span>Question ' + (run.i + 1) + ' of ' + total + '</span><span>' + KIND[q.t] + '</span></p>' +
    '<h3 class="qz-q">' + esc(q.q) + '</h3><div class="qz-opts' + (q.t === 'tf' ? ' qz-tf' : '') + '">' + opts + '</div><div class="qz-fb" hidden></div>');
  var f = dlg.querySelector('.qz-o'); if(f) setTimeout(function(){ f.focus({ preventScroll: true }); }, 30);
}
function answer(j){
  if(run.answered) return;
  run.answered = true;
  var q = run.qz.q[run.i], ok = j === q.a; if(ok) run.score++;
  dlg.querySelectorAll('.qz-o').forEach(function(b, n){
    b.disabled = true;
    if(n === q.a) b.classList.add('ok'); else if(n === j) b.classList.add('bad'); else b.classList.add('dim');
    if(n === j) b.setAttribute('aria-pressed', 'true');
  });
  setProg(run.i + 1);
  var last = run.i === run.qz.q.length - 1, fb = dlg.querySelector('.qz-fb');
  fb.innerHTML = '<p class="qz-v ' + (ok ? 'ok' : 'bad') + '">' + (ok ? CHECK : '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>') + '<b>' + (ok ? 'Correct' : 'Not quite') + '</b></p>' +
    (q.e ? '<p class="qz-e">' + esc(q.e) + '</p>' : '') + explList(q) + '<button type="button" class="btn btn-primary qz-next" data-next>' + '<span>' + (last ? 'See your result' : 'Next question') + '</span>' + ARROW + '</button>';
  fb.hidden = false;
  var nx = fb.querySelector('[data-next]'); setTimeout(function(){ nx.focus({ preventScroll: true }); fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 30);
}
// optional list under the explanation: q.l = [items], q.ol = true for a numbered list
function explList(q){
  if(!q.l) return '';
  var tag = q.ol ? 'ol' : 'ul';
  return '<' + tag + ' class="qz-l">' + q.l.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</' + tag + '>';
}
function result(){
  var qz = run.qz, total = qz.q.length, pass = run.score >= qz.pass;
  saveBest(qz.id, run.score);
  if(pass && window.TMAuth) TMAuth.markDone(qz.id);
  setProg(total);
  body('<div class="qz-res ' + (pass ? 'ok' : 'bad') + '"><div class="qz-score"><b>' + run.score + '/' + total + '</b></div>' +
    '<h3>' + (pass ? 'You passed!' : 'Not passed yet') + '</h3>' +
    '<p>You scored ' + run.score + ' out of ' + total + '.</p>' +
    '<p>' + (pass ? 'This module now counts as complete.' : 'You need at least ' + qz.pass + ' of ' + total + ' to pass. Read the explanations and try again as many times as you like.') + '</p>' +
    '<div class="qz-row"><button type="button" class="btn ' + (pass ? 'btn-ghost' : 'btn-primary') + '" data-again><span>' + (pass ? 'Retake quiz' : 'Try again') + '</span></button>' +
    '<button type="button" class="btn ' + (pass ? 'btn-primary' : 'btn-ghost') + '" data-done><span>Close</span></button></div></div>');
  paint();
  var b = dlg.querySelector(pass ? '[data-done]' : '[data-again]'); if(b) setTimeout(function(){ b.focus({ preventScroll: true }); }, 30);
}
function body(html){ var b = dlg.querySelector('.qz-body'); b.innerHTML = html; b.scrollTop = 0; dlg.querySelector('.qz-in').scrollTop = 0; }
function onBody(e){
  var o = e.target.closest('.qz-o'); if(o){ answer(+o.getAttribute('data-o')); return; }
  if(e.target.closest('[data-next]')){ if(run.i < run.qz.q.length - 1){ run.i++; question(); } else result(); return; }
  if(e.target.closest('[data-again]')){ run.i = 0; run.score = 0; question(); return; }
  if(e.target.closest('[data-done]')) dlg.close();
}

document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('[data-quiz-open]'); if(!b || b.disabled) return;
  e.preventDefault(); open(b.getAttribute('data-quiz-open'), b);
});

/* keep the cards in step with progress and with panels that re-render */
var t = 0;
function soon(){ clearTimeout(t); t = setTimeout(paint, 20); }
function hook(){ if(!window.TMAuth){ setTimeout(hook, 200); return; } TMAuth.onChange(paint); }
function boot(){
  paint(); hook();
  new MutationObserver(function(recs){
    if(recs.some(function(r){ return [].some.call(r.addedNodes, function(n){ return n.nodeType === 1 && (n.matches('[data-quiz]') || n.querySelector('[data-quiz]')); }); })) soon();
  }).observe(document.body, { childList: true, subtree: true });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
window.TMQuiz = { open: open, repaint: paint };
})();
