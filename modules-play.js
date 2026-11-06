/* Learning modules: small interactive pieces at the top of a module (modules.html leaves a <div data-play="..."> for each).
   people: sort statements into mass production or lean. jidoka: pull the andon cord when a defect reaches your station. std: 5S a messy workbench, step by step, in the right order.
   jit: the same three-station line run as push and as pull side by side, to watch inventory and lead time. */
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
    '<button type="button" class="s5-reset" hidden>Mess it up again<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button>';
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

/* ---------- JIT: push or pull, side by side ---------- */
// the same three-station line runs twice on one clock: on top every station pushes, below each one waits for a kanban.
// Weld is the slowest station; the customer takes one car every takt. 3 s here stands for one minute on a real line.
var ST = [['Cut', 1.5], ['Weld', 3], ['Paint', 2.5]], TAKT = 3, LIMIT = 2, SHOW = 12, SPAN = 90;
function jit(box){
  box.className = 'play pl-jit';
  function lane(m){
    return '<div class="pj-lane" data-m="' + m + '"><div class="pj-lh"><b>' + (m === 'push' ? 'Push' : 'Pull') + '</b><small>' +
      (m === 'push' ? 'Every station makes cars as fast as it can' : 'Kanban: a station makes a car only when the next one takes one') + '</small>' +
      '<p class="pj-ls"><span><b class="pj-wip">0</b> in the line</span><span><b class="pj-lt">0</b> min lead time</span><span><b class="pj-out">0</b> delivered</span></p></div>' +
      '<div class="pj-line">' + ST.map(function(s, i){
        return '<div class="pj-st" data-s="' + i + '"><b>' + s[0] + '</b><i class="pj-bar"><em></em></i><small class="pj-state">Waiting for parts</small></div>' +
          '<div class="pj-buf" data-b="' + i + '"><b class="pj-n">0</b><div class="pj-cars"></div>' + (m === 'pull' ? '<span class="pj-cap">max 2</span>' : '') + '</div>';
      }).join('') + '<div class="pj-st pj-cust"><b>Customer</b><small>takes 1 car per takt</small></div></div></div>';
  }
  box.innerHTML = '<div class="pl-head"><b>Push or pull?</b><small>The same line, run two ways at once. Weld is the slowest station.</small></div>' +
    lane('push') + lane('pull') +
    '<div class="pj-chart"><p class="pj-ch"><b>Cars in the line</b><span class="pj-key"><i class="k-push"></i>Push</span><span class="pj-key"><i class="k-pull"></i>Pull</span></p>' +
    '<svg viewBox="0 0 300 90" preserveAspectRatio="none" aria-hidden="true"><polyline class="pj-p-push" points=""/><polyline class="pj-p-pull" points=""/></svg></div>' +
    '<p class="pj-note"></p>' +
    '<div class="pj-ctl"><button type="button" class="pj-play"></button><button type="button" class="pj-reset">Start over</button></div>';
  var run = !reduce, raf = 0, last = 0, seen = false, t = 0, custT = TAKT, hist = [], sampleT = 0;
  var L = $$('.pj-lane', box).map(function(e){ return { el: e, mode: e.getAttribute('data-m') }; });
  function reset(){
    t = 0; custT = TAKT; hist = []; sampleT = 0;
    L.forEach(function(l){ l.S = ST.map(function(){ return { busy: false, left: 0, why: 'parts' }; }); l.buf = [0, 0, 0]; l.out = 0; $$('.pj-fly', l.el).forEach(function(f){ f.parentNode.removeChild(f); }); });
    paint(true);
  }
  // a car or a kanban card sliding from one box to another
  function fly(l, from, to, cls){
    if(reduce || !seen) return;
    var line = $('.pj-line', l.el), r0 = line.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    if(!a.width || !b.width || !line.animate) return;
    var f = document.createElement('i'); f.className = 'pj-fly ' + cls; line.appendChild(f);
    // cars land under a space's count, not on top of it
    function ys(e, r){ return r.top + r.height * (e.classList.contains('pj-buf') ? .74 : .5); }
    var x0 = a.left + a.width / 2 - r0.left, y0 = ys(from, a) - r0.top, x1 = b.left + b.width / 2 - r0.left, y1 = ys(to, b) - r0.top;
    var an = f.animate([{ transform: 'translate(' + x0 + 'px,' + y0 + 'px)' }, { transform: 'translate(' + x1 + 'px,' + y1 + 'px)' }], { duration: cls === 'pj-kb' ? 1000 : 700, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    an.onfinish = function(){ if(f.parentNode) f.parentNode.removeChild(f); };
  }
  function step(dt){
    t += dt; custT -= dt;
    var take = custT <= 0; if(take) custT += TAKT;
    L.forEach(function(l){
      var st = $$('.pj-st', l.el), bf = $$('.pj-buf', l.el);
      if(take && l.buf[2] > 0){ l.buf[2]--; l.out++; fly(l, bf[2], st[3], 'pj-car'); if(l.mode === 'pull') fly(l, bf[2], st[2], 'pj-kb'); }
      for(var i = ST.length - 1; i >= 0; i--){
        var s = l.S[i];
        if(s.busy){ s.left -= dt; if(s.left <= 0){ s.busy = false; l.buf[i]++; fly(l, st[i], bf[i], 'pj-car'); } }
        if(!s.busy){
          var hasIn = i === 0 || l.buf[i - 1] > 0, room = l.mode === 'push' || l.buf[i] < LIMIT;
          s.why = !hasIn ? 'parts' : !room ? 'kanban' : '';
          if(hasIn && room){
            if(i > 0){ l.buf[i - 1]--; if(l.mode === 'pull') fly(l, bf[i - 1], st[i - 1], 'pj-kb'); }
            s.busy = true; s.left = ST[i][1];
          }
        }
      }
    });
    sampleT -= dt;
    if(sampleT <= 0){ sampleT += 1; hist.push(L.map(wip)); if(hist.length > SPAN) hist.shift(); }
  }
  function wip(l){ return l.buf[0] + l.buf[1] + l.buf[2] + l.S.filter(function(s){ return s.busy; }).length; }
  function paint(force){
    L.forEach(function(l){
      l.S.forEach(function(s, i){
        var st = $('.pj-st[data-s="' + i + '"]', l.el);
        $('em', st).style.width = (s.busy ? 100 * (1 - s.left / ST[i][1]) : 0) + '%';
        st.classList.toggle('on', s.busy);
        var txt = s.busy ? 'Working' : s.why === 'kanban' ? 'Waiting for a kanban' : 'Waiting for parts';
        var sm = $('.pj-state', st); if(sm.__en !== txt){ sm.__en = txt; sm.textContent = txt; }
      });
      l.buf.forEach(function(n, i){
        var b = $('.pj-buf[data-b="' + i + '"]', l.el);
        if(!force && b.__n === n) return; b.__n = n;
        $('.pj-n', b).textContent = n;
        $('.pj-cars', b).innerHTML = new Array(Math.min(n, SHOW) + 1).join('<i class="pj-car"></i>') + (n > SHOW ? '<span>+' + (n - SHOW) + '</span>' : '');
        b.classList.toggle('pj-pile', n > 4);
      });
      var w = wip(l);
      $('.pj-wip', l.el).textContent = w; $('.pj-lt', l.el).textContent = w; $('.pj-out', l.el).textContent = l.out;
    });
    var top = Math.max(8, hist.reduce(function(m, h){ return Math.max(m, h[0], h[1]); }, 0) + 2);
    ['push', 'pull'].forEach(function(m, k){
      $('.pj-p-' + m, box).setAttribute('points', hist.map(function(h, i){ return (i * 300 / (SPAN - 1)).toFixed(1) + ',' + (88 - h[k] * 84 / top).toFixed(1); }).join(' '));
    });
    var p = wip(L[0]), q = wip(L[1]);
    var note = t < 8 ? 'Both lines start empty. Watch the space in front of Weld.'
      : p > q + 3 ? 'Push: Cut keeps going, so cars pile up in front of Weld and lead time keeps growing. Pull holds two cars per space, and both lines deliver the same number of cars.'
      : 'Pull: when a car is taken, a yellow kanban card goes back and tells the station before it to make one more.';
    var ne = $('.pj-note', box); if(ne.__en !== note){ ne.__en = note; ne.textContent = note; }
  }
  function frame(now){
    if(!last) last = now;
    var dt = Math.min(.1, (now - last) / 1000); last = now;
    step(dt); paint(false);
    raf = requestAnimationFrame(frame);
  }
  function go(){ if(run && seen && !raf){ last = 0; raf = requestAnimationFrame(frame); } }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } }
  function label(){ $('.pj-play', box).textContent = run ? 'Pause' : 'Play'; }
  $('.pj-play', box).addEventListener('click', function(){ run = !run; label(); if(run) go(); else stop(); });
  $('.pj-reset', box).addEventListener('click', function(){ reset(); if(!run){ run = true; label(); go(); } });
  whileSeen(box, function(){ seen = true; go(); }, function(){ seen = false; stop(); });
  reset(); label();
}

/* ---------- Jidoka: pull the andon cord ---------- */
// cars ride a conveyor through your station. When one is missing a wheel, pull the cord: the light turns yellow and a
// team leader comes to fix it while the line keeps moving. If the car reaches the end of your station first, the line stops (red).
// A defect nobody flags ends up in the repair area at the end of the line.
var JV = 42, JGAP = 2.6, JZ0 = 230, JZ1 = 350, JEND = 548, JFIX = 1.6, JDEF = [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1];
function carSvg(defect){
  return '<rect x="-20" y="-16" width="40" height="13" rx="4" class="jc-body"/><path d="M-12 -16l5-8h14l6 8z" class="jc-body"/>' +
    '<rect x="-8" y="-22" width="7" height="5" rx="1" class="jc-win"/><rect x="2" y="-22" width="7" height="5" rx="1" class="jc-win"/>' +
    '<circle cx="-11" cy="-2" r="5" class="jc-wheel"/>' +
    (defect ? '<circle cx="11" cy="-2" r="7.5" class="jc-miss"/><circle cx="11" cy="-2" r="5" class="jc-wheel jc-new"/>' : '<circle cx="11" cy="-2" r="5" class="jc-wheel"/>');
}
function jidoka(box){
  box.className = 'play pl-jdk';
  box.innerHTML = '<div class="pl-head"><b>Pull the andon cord</b><small>You work the station in the middle. Watch for a car with a missing wheel.</small></div>' +
    '<div class="jd-stage"><svg class="jd-svg" viewBox="0 0 600 190" aria-hidden="true">' +
      '<rect x="' + JZ0 + '" y="40" width="' + (JZ1 - JZ0) + '" height="118" rx="8" class="jd-zone"/>' +
      '<rect x="' + (JEND - 4) + '" y="40" width="56" height="118" rx="8" class="jd-repair"/>' +
      '<rect x="0" y="134" width="600" height="12" class="jd-belt"/><g class="jd-rollers"></g>' +
      '<g class="jd-cars"></g>' +
      '<g class="jd-leader" style="transform:translate(' + ((JZ0 + JZ1) / 2) + 'px,-140px)"><circle cx="0" cy="58" r="8"/><path d="M-11 92v-14a11 11 0 0 1 22 0v14z"/><rect x="-7" y="95" width="14" height="3" rx="1.5"/></g>' +
      '<g class="jd-andon" transform="translate(' + (JZ1 + 10) + ' 0)"><rect x="-1" y="6" width="22" height="58" rx="5"/><circle class="jl-red" cx="10" cy="17" r="6.5"/><circle class="jl-yel" cx="10" cy="35" r="6.5"/><circle class="jl-grn" cx="10" cy="53" r="6.5"/><rect x="9" y="64" width="2" height="66" class="jd-pole"/></g>' +
    '</svg><div class="jd-labels"><span class="jd-you">Your station</span><span class="jd-rep">Repair area</span></div></div>' +
    '<div class="jd-ctl"><button type="button" class="jd-cord"><i aria-hidden="true"></i>Pull the andon cord</button><button type="button" class="jd-run"></button><button type="button" class="jd-reset">Start over</button></div>' +
    '<p class="jd-msg" aria-live="polite"></p>' +
    '<div class="jd-stats"><p><b class="jd-caught">0</b><span>defects fixed at your station</span></p><p><b class="jd-stops">0</b><span>times the line stopped</span></p><p><b class="jd-missed">0</b><span>sent to the repair area</span></p></div>';
  var svg = $('.jd-svg', box), carsG = $('.jd-cars', box), rollers = $('.jd-rollers', box), leader = $('.jd-leader', box);
  var cars, nextIn, made, state, target, fixLeft, stats, run = false, seen = false, raf = 0, last = 0, belt = 0;
  for(var x = 10; x < 600; x += 26) rollers.insertAdjacentHTML('beforeend', '<circle cx="' + x + '" cy="146" r="3"/>');
  function msg(t, kind){ var m = $('.jd-msg', box); m.textContent = t; m.className = 'jd-msg' + (kind ? ' ' + kind : ''); }
  function setState(s){ state = s; box.classList.remove('jd-green', 'jd-yellow', 'jd-red'); box.classList.add('jd-' + s); }
  function reset(){
    cars = []; nextIn = 0; made = 0; target = null; fixLeft = 0; stats = { caught: 0, stops: 0, missed: 0 };
    carsG.innerHTML = ''; setState('green'); leader.style.transform = 'translate(' + ((JZ0 + JZ1) / 2) + 'px,-140px)';
    paint(); msg('Press Start the line. Pull the cord as soon as a car with a missing wheel is in your station.');
  }
  function spawn(){
    var c = { x: -30, defect: !!JDEF[made % JDEF.length], fixed: false, flagged: false, done: false };
    made++;
    c.el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    c.el.setAttribute('class', 'jd-car' + (c.defect ? ' is-bad' : ''));
    c.el.innerHTML = carSvg(c.defect);
    carsG.appendChild(c.el); cars.push(c);
  }
  function inZone(c){ return c.x >= JZ0 && c.x <= JZ1; }
  function pull(){
    if(!run){ msg('Start the line first.'); return; }
    if(target){ msg('Help is already on the way.'); return; }
    var c = cars.filter(function(c){ return c.defect && !c.fixed && inZone(c); })[0];
    if(!c){ msg('Nothing is wrong at your station right now. Pull the cord only when you see a problem.', 'no'); return; }
    target = c; c.flagged = true; fixLeft = JFIX; setState('yellow');
    leader.style.transform = 'translate(' + ((JZ0 + JZ1) / 2) + 'px,0px)';
    msg('Yellow: you called for help. The team leader fixes the car while the line keeps moving.', 'warn');
  }
  function step(dt){
    var moving = state !== 'red';
    if(moving){
      belt = (belt + JV * dt) % 26;
      nextIn -= dt; if(nextIn <= 0){ nextIn += JGAP; spawn(); }
      cars.forEach(function(c){ c.x += JV * dt; });
    }
    if(target){
      fixLeft -= dt;
      if(fixLeft <= 0){
        target.fixed = true; target.el.classList.add('fixed'); target = null; stats.caught++;
        leader.style.transform = 'translate(' + ((JZ0 + JZ1) / 2) + 'px,-140px)';
        if(state === 'red') msg('Fixed. The line starts again. Problems found at the station get solved for good.', 'ok');
        else msg('Fixed in station, and the line never stopped. That is jidoka: quality built in.', 'ok');
        setState('green');
      } else if(state === 'yellow' && target.x >= JZ1){
        setState('red'); stats.stops++;
        msg('Red: the car reached the end of your station before the fix, so the line stopped. Pull sooner next time.', 'no');
      }
    }
    cars.forEach(function(c){
      if(c.defect && !c.fixed && !c.flagged && c.x > JZ1 && !c.passed){ c.passed = true; msg('A car with a missing wheel got past your station.', 'no'); }
      if(c.x >= JEND + 24 && !c.done){
        c.done = true;
        if(c.defect && !c.fixed){ stats.missed++; msg('A defect reached the repair area. Mass producers kept 20 to 25% of their workers busy just on repairs like this.', 'no'); }
      }
    });
    cars = cars.filter(function(c){ if(c.x > 640){ c.el.parentNode.removeChild(c.el); return false; } return true; });
  }
  function paint(){
    cars.forEach(function(c){ c.el.setAttribute('transform', 'translate(' + c.x.toFixed(1) + ' 132)'); });
    rollers.setAttribute('transform', 'translate(' + belt.toFixed(1) + ' 0)');
    $('.jd-caught', box).textContent = stats.caught; $('.jd-stops', box).textContent = stats.stops; $('.jd-missed', box).textContent = stats.missed;
  }
  function frame(now){
    if(!last) last = now;
    var dt = Math.min(.1, (now - last) / 1000); last = now;
    step(dt); paint();
    raf = requestAnimationFrame(frame);
  }
  function go(){ if(run && seen && !raf){ last = 0; raf = requestAnimationFrame(frame); } }
  function stop(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } }
  function label(){ $('.jd-run', box).textContent = run ? 'Pause' : made ? 'Resume' : 'Start the line'; box.classList.toggle('jd-on', run); }
  $('.jd-cord', box).addEventListener('click', pull);
  $('.jd-run', box).addEventListener('click', function(){ run = !run; label(); if(run){ if(!made) msg('The line is running. Watch your station.'); go(); } else stop(); });
  $('.jd-reset', box).addEventListener('click', function(){ stop(); run = false; reset(); label(); });
  whileSeen(box, function(){ seen = true; go(); }, function(){ seen = false; stop(); });
  reset(); label();
}

var PLAY = { people: people, std: std, jidoka: jidoka, jit: jit };
$$('[data-play]').forEach(function(box){ var f = PLAY[box.getAttribute('data-play')]; if(f) f(box); });
})();
