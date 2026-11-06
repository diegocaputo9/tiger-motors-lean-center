/* Learning modules: small interactive pieces at the top of a module (modules.html leaves a <div data-play="..."> for each).
   people: sort statements into mass production or lean. std: 5S a messy workbench, step by step, in the right order.
   jit: the same three-station line run as push and as pull, to watch inventory and lead time. */
(function(){
'use strict';
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(s, r){ return (r || document).querySelector(s); }
function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function el(html){ var d = document.createElement('div'); d.innerHTML = html; return d.firstChild; }
// runs fn only while the box is on screen
function whileSeen(box, on, off){
  if(!('IntersectionObserver' in window)){ on(); return; }
  new IntersectionObserver(function(es){ if(es[0].isIntersecting) on(); else if(off) off(); }, { threshold: .3 }).observe(box);
}

/* ---------- People: mass production or lean? ---------- */
var SORT = [
  ['Workers can’t stop the line, and they have no part in solving quality problems.', 'mass', 'Ford’s line was designed so workers didn’t need to talk to each other or fix problems.'],
  ['An operator pulls the andon cord, a team leader comes to help, and the line stops only if help doesn’t arrive in time.', 'lean', 'Problems get fixed in the process, so they have to be solved for good.'],
  ['Cars with defects go to a repair area at the end of the line, where specialists fix them.', 'mass', 'Mass producers used 20 to 25% of their labor just on these offline repairs.'],
  ['Parts are pulled: a process makes more only after the next one uses some, like a supermarket refilling a shelf.', 'lean', 'Ohno got the idea from American supermarkets, which restock only what customers take.'],
  ['A machine stops itself the moment something goes wrong, so a defect is never passed on.', 'lean', 'That is jidoka, which started with Sakichi Toyoda’s automatic loom.'],
  ['Everyone has one narrow job: an electrician can’t do a millwright’s work.', 'mass', 'Rigid job classifications were part of Ford’s system.'],
  ['People are hired for life and are expected to take on the jobs that need doing and help solve problems.', 'lean', 'Toyota agreed to lifetime employment after the 1949 strike, and Ohno asked for flexibility in return.'],
  ['The same GM workers once called troublesome built some of GM’s best quality cars after learning the Toyota system.', 'lean', 'That was NUMMI: the problem was the system, not the people.']
];
function people(box){
  box.className = 'play pl-sort';
  box.innerHTML = '<div class="pl-head"><b>Mass production or lean?</b><small>Read each statement and decide which system it describes</small></div>' +
    '<div class="ps-stage"><p class="ps-count"><span class="ps-n"></span> / ' + SORT.length + '</p><p class="ps-q"></p>' +
    '<div class="ps-btns"><button type="button" class="ps-b" data-a="mass"><b>Mass production</b><small>Ford · GM</small></button><button type="button" class="ps-b" data-a="lean"><b>Lean</b><small>Toyota · NUMMI</small></button></div>' +
    '<div class="ps-fb" hidden><p class="ps-res"></p><p class="ps-why"></p><button type="button" class="ps-next">Next statement</button></div></div>' +
    '<div class="ps-end" hidden><p class="ps-score"></p><p class="ps-msg"></p><button type="button" class="ps-again">Play again</button></div>';
  var i = 0, right = 0, stage = $('.ps-stage', box), end = $('.ps-end', box), fb = $('.ps-fb', box);
  function show(){
    $('.ps-n', box).textContent = i + 1; $('.ps-q', box).textContent = SORT[i][0];
    fb.hidden = true; $$('.ps-b', box).forEach(function(b){ b.disabled = false; b.classList.remove('ok', 'no'); });
    stage.classList.remove('in'); void stage.offsetWidth; stage.classList.add('in');
  }
  $$('.ps-b', box).forEach(function(b){ b.addEventListener('click', function(){
    var q = SORT[i], ok = b.getAttribute('data-a') === q[1];
    if(ok) right++;
    $$('.ps-b', box).forEach(function(x){ x.disabled = true; if(x.getAttribute('data-a') === q[1]) x.classList.add('ok'); else if(x === b) x.classList.add('no'); });
    $('.ps-res', box).textContent = ok ? 'Right.' : (q[1] === 'lean' ? 'Not quite. This is lean.' : 'Not quite. This is mass production.');
    $('.ps-res', box).className = 'ps-res ' + (ok ? 'ok' : 'no');
    $('.ps-why', box).textContent = q[2];
    $('.ps-next', box).textContent = i === SORT.length - 1 ? 'See your score' : 'Next statement';
    fb.hidden = false; $('.ps-next', box).focus({ preventScroll: true });
  }); });
  $('.ps-next', box).addEventListener('click', function(){
    if(++i < SORT.length) return show();
    stage.hidden = true; end.hidden = false;
    $('.ps-score', box).textContent = right + ' / ' + SORT.length;
    $('.ps-msg', box).textContent = right === SORT.length ? 'Perfect. You can tell the two systems apart.' : right >= 6 ? 'Nice work. Rewatch the People lecture for the ones you missed.' : 'Keep going. The People lecture and the NUMMI podcast explain the difference.';
    $('.ps-again', box).focus({ preventScroll: true });
  });
  $('.ps-again', box).addEventListener('click', function(){ i = 0; right = 0; end.hidden = true; stage.hidden = false; show(); });
  show();
}

/* ---------- Standardization: 5S the workbench ---------- */
var S5 = [
  ['sort', 'Sort', 'Remove what isn’t needed. The broken wrench, the mug and the scrap get red tags and leave the bench.'],
  ['set', 'Set in order', 'Give everything a marked home. Each tool goes on the shadow board, where a missing one is obvious.'],
  ['shine', 'Shine', 'Deep-clean, so leaks and other problems stand out as soon as they appear.'],
  ['std', 'Standardize', 'Write down the rules: labels, a standard sheet and a cleaning plan everyone follows.'],
  ['sustain', 'Sustain', 'Keep it going with regular audits and leaders who never walk past a deviation.']
];
var SHUFFLE = [2, 4, 0, 3, 1];
// tools: [id, svg drawn around 0,0, messy x, y, angle, home x, y]
var TOOLS = [
  ['hammer', '<rect x="-4" y="-30" width="8" height="52" rx="3" fill="#B98A57"/><rect x="-16" y="-38" width="32" height="13" rx="3" fill="#9AA7B6"/>', 150, 170, 72, 90, 70],
  ['wrench', '<rect x="-4" y="-26" width="8" height="48" rx="4" fill="#9AA7B6"/><path d="M-11-34a11 11 0 0 1 22 0v4h-6v-6h-10v6h-6z" fill="#9AA7B6"/>', 270, 178, -64, 170, 70],
  ['driver', '<rect x="-6" y="-30" width="12" height="24" rx="4" fill="#E87722"/><rect x="-2" y="-6" width="4" height="32" fill="#C3CDD8"/>', 352, 166, 28, 250, 70],
  ['pliers', '<path d="M-3-6L-12 28M3-6L12 28" stroke="#E5484D" stroke-width="7" stroke-linecap="round"/><path d="M-5-8L-3-34M5-8L3-34" stroke="#9AA7B6" stroke-width="6" stroke-linecap="round"/>', 210, 172, 104, 330, 70]
];
function std(box){
  box.className = 'play pl-5s';
  var shadows = TOOLS.map(function(t){ return '<g class="s5-shadow" transform="translate(' + t[5] + ' ' + t[6] + ')">' + t[1].replace(/fill="[^"]+"/g, 'fill="none"').replace(/stroke="#[0-9A-F]+"/g, 'stroke="currentColor"') + '<rect class="s5-tag" x="-20" y="38" width="40" height="10" rx="3"/></g>'; }).join('');
  var tools = TOOLS.map(function(t){ return '<g class="s5-tool" data-t="' + t[0] + '" style="transform:translate(' + t[2] + 'px,' + t[3] + 'px) rotate(' + t[4] + 'deg)">' + t[1] + '</g>'; }).join('');
  var svg = '<svg class="s5-svg" viewBox="0 0 520 250" aria-hidden="true">' +
    '<rect x="20" y="12" width="480" height="128" rx="8" class="s5-board"/>' +
    '<g class="s5-holes">' + (function(){ var h = ''; for(var y = 26; y < 136; y += 18) for(var x = 34; x < 496; x += 18) h += '<circle cx="' + x + '" cy="' + y + '" r="1.6"/>'; return h; })() + '</g>' +
    '<g class="s5-shadows">' + shadows + '</g>' +
    '<g class="s5-sheet"><rect x="404" y="24" width="80" height="104" rx="4"/><path d="M416 44h56M416 58h56M416 72h40M416 86h56M416 100h30"/><path class="s5-chk" d="M444 112l7 7 14-15"/></g>' +
    '<rect x="10" y="196" width="500" height="16" rx="4" class="s5-bench"/><rect x="34" y="212" width="12" height="34" class="s5-bench"/><rect x="474" y="212" width="12" height="34" class="s5-bench"/>' +
    '<g class="s5-grime"><ellipse cx="120" cy="203" rx="26" ry="5"/><ellipse cx="300" cy="204" rx="18" ry="4"/><ellipse cx="430" cy="203" rx="22" ry="5"/><ellipse cx="70" cy="60" rx="14" ry="9"/><ellipse cx="300" cy="110" rx="12" ry="8"/><path class="s5-drip" d="M232 140q4 14 0 24q-4 10 0 22" /></g>' +
    '<g class="s5-junk" data-j="mug" style="transform:translate(420px,172px)"><rect x="-13" y="-16" width="24" height="32" rx="4" fill="#4C78A8"/><path d="M11-8a8 8 0 0 1 0 16" fill="none" stroke="#4C78A8" stroke-width="4"/><rect class="s5-red" x="-9" y="-30" width="18" height="10" rx="2"/></g>' +
    '<g class="s5-junk" data-j="broken" style="transform:translate(80px,182px) rotate(-12deg)"><rect x="-26" y="-4" width="22" height="8" rx="3" fill="#7D8896"/><rect x="2" y="-3" width="20" height="7" rx="3" fill="#7D8896" transform="rotate(14)"/><rect class="s5-red" x="-9" y="-20" width="18" height="10" rx="2"/></g>' +
    '<g class="s5-junk" data-j="scrap" style="transform:translate(470px,184px)"><path d="M-12 8l4-16 10 4 8-6 4 14-12 6z" fill="#C9B79C"/><rect class="s5-red" x="-9" y="-22" width="18" height="10" rx="2"/></g>' +
    tools +
    '<g class="s5-sparkles"><path d="M150 186l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><path d="M380 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path d="M290 186l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></g>' +
    '<g class="s5-audit"><circle cx="60" cy="40" r="20"/><path d="M50 40l7 7 13-14"/></g>' +
    '</svg>';
  box.innerHTML = '<div class="pl-head"><b>5S the workbench</b><small>Press the five steps in the right order to clean up this bench</small></div>' +
    '<div class="s5-wrap">' + svg + '<div class="s5-side"><ol class="s5-done"></ol><p class="s5-msg" aria-live="polite">Which step comes first?</p></div></div>' +
    '<div class="s5-btns">' + SHUFFLE.map(function(i){ return '<button type="button" class="s5-b" data-i="' + i + '">' + S5[i][1] + '</button>'; }).join('') + '</div>' +
    '<button type="button" class="s5-reset" hidden>Mess it up again</button>';
  var next = 0, msg = $('.s5-msg', box), done = $('.s5-done', box);
  function apply(k){
    box.classList.add('s5-' + k);
    if(k === 'set') TOOLS.forEach(function(t){ $('.s5-tool[data-t="' + t[0] + '"]', box).style.transform = 'translate(' + t[5] + 'px,' + t[6] + 'px) rotate(0deg)'; });
  }
  $$('.s5-b', box).forEach(function(b){ b.addEventListener('click', function(){
    var i = +b.getAttribute('data-i');
    if(i !== next){
      b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      msg.textContent = 'Not yet. ' + (next === 0 ? 'Start with the step that gets rid of what isn’t needed.' : 'Think about what has to happen after ' + S5[next - 1][1] + '.');
      msg.className = 's5-msg no';
      return;
    }
    b.disabled = true; b.classList.add('ok');
    apply(S5[i][0]);
    done.insertAdjacentHTML('beforeend', '<li><b>' + S5[i][1] + '</b><span>' + S5[i][2] + '</span></li>');
    next++;
    msg.className = 's5-msg' + (next === 5 ? ' ok' : '');
    msg.textContent = next === 5 ? 'Done. The bench is 5S. Leaders keep it this way by checking it every day.' : 'Good. What comes next?';
    if(next === 5) $('.s5-reset', box).hidden = false;
  }); });
  $('.s5-reset', box).addEventListener('click', function(){
    next = 0; done.innerHTML = ''; msg.textContent = 'Which step comes first?'; msg.className = 's5-msg';
    S5.forEach(function(s){ box.classList.remove('s5-' + s[0]); });
    TOOLS.forEach(function(t){ $('.s5-tool[data-t="' + t[0] + '"]', box).style.transform = 'translate(' + t[2] + 'px,' + t[3] + 'px) rotate(' + t[4] + 'deg)'; });
    $$('.s5-b', box).forEach(function(b){ b.disabled = false; b.classList.remove('ok'); });
    this.hidden = true;
  });
}

/* ---------- JIT: push or pull ---------- */
// three stations; Weld is the slowest. The customer takes one car every takt (1.2 s here, one minute on a real line)
var ST = [['Cut', .6], ['Weld', 1.2], ['Paint', 1]], TAKT = 1.2, LIMIT = 2, SHOW = 18, SPEED = 1.5;
function jit(box){
  box.className = 'play pl-jit';
  box.innerHTML = '<div class="pl-head"><b>Push or pull?</b><small>The same line, run two ways. Weld is the slowest station.</small></div>' +
    '<div class="pj-mode" role="group" aria-label="How the line is run"><button type="button" data-m="push" aria-pressed="true"><b>Push</b><small>Every station makes parts as fast as it can</small></button><button type="button" data-m="pull" aria-pressed="false"><b>Pull</b><small>Kanban: make only what the next station used</small></button></div>' +
    '<div class="pj-line">' + ST.map(function(s, i){
      return '<div class="pj-st" data-s="' + i + '"><b>' + s[0] + '</b><i class="pj-bar"><em></em></i><small>' + s[1] + ' s</small></div>' +
        '<div class="pj-buf" data-b="' + i + '"><div class="pj-dots"></div><span class="pj-cap">max 2</span></div>';
    }).join('') + '<div class="pj-st pj-cust"><b>Customer</b><small>1 every 1.2 s</small></div></div>' +
    '<div class="pj-stats"><p><b class="pj-wip">0</b><span>cars in the line (WIP)</span></p><p><b class="pj-lt">0</b><span>minutes of lead time, if takt is 1 minute</span></p><p><b class="pj-out">0</b><span>cars delivered</span></p></div>' +
    '<p class="pj-note"></p>' +
    '<div class="pj-ctl"><button type="button" class="pj-play"></button><button type="button" class="pj-reset">Start over</button></div>';
  var mode = 'push', run = !reduce, raf = 0, last = 0, t = 0, seen = false;
  var S, buf, out, custT;
  function reset(){ S = ST.map(function(){ return { busy: false, left: 0 }; }); buf = [0, 0, 0]; out = 0; custT = TAKT; t = 0; paint(true); }
  function step(dt){
    t += dt;
    // the customer takes a finished car every takt
    custT -= dt; if(custT <= 0){ custT += TAKT; if(buf[2] > 0){ buf[2]--; out++; } }
    for(var i = ST.length - 1; i >= 0; i--){
      var s = S[i];
      if(s.busy){ s.left -= dt; if(s.left <= 0){ s.busy = false; buf[i]++; } }
      if(!s.busy){
        var hasIn = i === 0 || buf[i - 1] > 0;
        var room = mode === 'push' || buf[i] < LIMIT;
        if(hasIn && room){ if(i > 0) buf[i - 1]--; s.busy = true; s.left = ST[i][1]; }
      }
    }
  }
  function paint(force){
    S.forEach(function(s, i){ $('.pj-st[data-s="' + i + '"] em', box).style.width = (s.busy ? 100 * (1 - s.left / ST[i][1]) : 0) + '%'; });
    buf.forEach(function(n, i){
      var d = $('.pj-buf[data-b="' + i + '"] .pj-dots', box);
      if(!force && d.__n === n) return; d.__n = n;
      d.innerHTML = new Array(Math.min(n, SHOW) + 1).join('<i></i>') + (n > SHOW ? '<span>+' + (n - SHOW) + '</span>' : '');
      d.parentNode.classList.toggle('pj-pile', n > 6);
    });
    var wip = buf[0] + buf[1] + buf[2] + S.filter(function(s){ return s.busy; }).length;
    $('.pj-wip', box).textContent = wip; $('.pj-lt', box).textContent = Math.round(wip * 1);
    $('.pj-out', box).textContent = out;
    $('.pj-note', box).textContent = mode === 'push'
      ? (buf[0] > 6 ? 'Cut keeps going, so cars pile up in front of Weld. Lead time keeps growing, but the customer still gets one car per takt.' : 'Watch the space in front of Weld.')
      : 'Each station waits for a kanban signal. Inventory stays at two cars per space, and the customer gets just as many cars.';
  }
  function frame(now){
    if(!last) last = now;
    var dt = Math.min(.1, (now - last) / 1000) * SPEED; last = now;
    step(dt); paint(false);
    raf = requestAnimationFrame(frame);
  }
  function go(){ if(run && seen && !raf){ last = 0; raf = requestAnimationFrame(frame); } }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } }
  function label(){ $('.pj-play', box).textContent = run ? 'Pause' : 'Play'; }
  $$('.pj-mode button', box).forEach(function(b){ b.addEventListener('click', function(){
    mode = b.getAttribute('data-m');
    $$('.pj-mode button', box).forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    box.classList.toggle('pj-pullm', mode === 'pull');
    reset(); if(!run){ run = true; label(); } go();
  }); });
  $('.pj-play', box).addEventListener('click', function(){ run = !run; label(); if(run) go(); else stop(); });
  $('.pj-reset', box).addEventListener('click', function(){ reset(); });
  whileSeen(box, function(){ seen = true; go(); }, function(){ seen = false; stop(); });
  reset(); label();
}

var PLAY = { people: people, std: std, jit: jit };
$$('[data-play]').forEach(function(box){ var f = PLAY[box.getAttribute('data-play')]; if(f) f(box); });
})();
