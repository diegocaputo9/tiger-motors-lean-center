/* Tiger Motors Lean: free learner accounts (Supabase magic link), progress tracking, certificate of completion.
   Shared by index.html, modules.html, certificate.html and admin.html.
   Needs: supabase-js (CDN) and, for progress, modules-data.js (window.TM). */
(function(){
'use strict';

var CFG = {
  url: 'https://txmcwrwxqbribdhyprqu.supabase.co',
  key: 'sb_publishable_rv7klDuiZhvrve5O8wsqmg_1rctcFoo',   // public key: safe to ship in the page
  certificates: true,                                     // false hides the free certificate of completion everywhere
  enabled: true                                           // true: accounts are live for everyone (false hides them; ?preview=accounts still shows them)
};
var PREVIEW = false;
try {
  if(/[?&]preview=accounts\b/.test(location.search)) localStorage.setItem('tm-acct-preview', '1');
  if(/[?&]preview=off\b/.test(location.search)) localStorage.removeItem('tm-acct-preview');
  PREVIEW = localStorage.getItem('tm-acct-preview') === '1';
} catch(e){}
var ON = CFG.enabled || PREVIEW || window.TM_ACCOUNTS_FORCE === true;

var TM = window.TM || {};
var REQUIRED = TM.REQUIRED || [];
var LOCAL_KEY = 'tm-progress-local';
var sb = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(CFG.url, CFG.key, { auth: { flowType: 'implicit', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

var state = { ready: false, user: null, profile: null, done: {}, cert: null };
var listeners = [];
var lastUid = undefined;

/* ---------- what the magic link brought back in the URL ---------- */
var hash = location.hash || '';
var cameFromLink = /access_token=/.test(hash);
var linkError = /error_code=|error=access_denied/.test(hash) ? decodeURIComponent((hash.match(/error_description=([^&]+)/) || [,''])[1]).replace(/\+/g, ' ') : '';

/* ---------- helpers ---------- */
function $(s, r){ return (r || document).querySelector(s); }
function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function loadLocal(){ try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') || {}; } catch(e){ return {}; } }
function saveLocal(o){ try { localStorage.setItem(LOCAL_KEY, JSON.stringify(o)); } catch(e){} }
function firstName(){ return (state.profile && state.profile.first_name) || ''; }
function redirectUrl(){ return location.origin + location.pathname; }

function stats(){
  var done = REQUIRED.filter(function(id){ return state.done[id]; }).length, total = REQUIRED.length;
  return { done: done, total: total, pct: total ? Math.round(done * 100 / total) : 0 };
}
function moduleStats(k){
  var m = TM.BYK && TM.BYK[k]; if(!m) return { done: 0, total: 0, pct: 0 };
  var ids = (m.items || []).filter(function(it){ return it.url && it.id && !it.optional; }).map(function(it){ return it.id; });
  var done = ids.filter(function(id){ return state.done[id]; }).length;
  return { done: done, total: ids.length, pct: ids.length ? Math.round(done * 100 / ids.length) : 0 };
}

/* ---------- progress ---------- */
async function loadRemote(){
  var r = await sb.from('progress').select('item_id,done_at');
  if(r.error) throw r.error;
  var d = {}; r.data.forEach(function(x){ d[x.item_id] = x.done_at; }); return d;
}
async function mergeLocal(){
  var loc = loadLocal(), ids = Object.keys(loc).filter(function(k){ return !state.done[k]; });
  if(!ids.length){ saveLocal({}); return; }
  var r = await sb.from('progress').upsert(ids.map(function(id){ return { item_id: id, done_at: loc[id] }; }), { onConflict: 'user_id,item_id', ignoreDuplicates: true });
  if(!r.error){ ids.forEach(function(id){ state.done[id] = loc[id]; }); saveLocal({}); }
}
function markDone(id){
  if(!id || state.done[id]) return;
  var t = new Date().toISOString(); state.done[id] = t;
  if(state.user && sb){ sb.from('progress').insert({ item_id: id }).then(function(r){ if(r.error && r.error.code !== '23505') console.warn('progress', r.error.message); }); }
  else { var l = loadLocal(); l[id] = t; saveLocal(l); }
  emit();
}
function unmark(id){
  if(!id || !state.done[id]) return;
  delete state.done[id];
  if(state.user && sb){ sb.from('progress').delete().eq('item_id', id).then(function(){}); }
  else { var l = loadLocal(); delete l[id]; saveLocal(l); }
  emit();
}

/* ---------- session ---------- */
async function onSession(session){
  var uid = session && session.user ? session.user.id : null;
  if(uid === lastUid && state.ready) return;
  lastUid = uid;
  state.user = session ? session.user : null;
  if(state.user){
    try {
      var p = await sb.from('profiles').select('*').eq('id', state.user.id).maybeSingle();
      state.profile = p.data || null;
      state.done = await loadRemote();
      await mergeLocal();
      if(CFG.certificates){ var c = await sb.from('certificates').select('*').eq('kind', 'lean-house').maybeSingle(); state.cert = c.data || null; }
    } catch(e){ console.warn('account load', e); }
    if(cameFromLink){ cameFromLink = false; toast('Welcome' + (firstName() ? ', ' + firstName() : '') + '! You are signed in, and your progress is saved to your account.'); }
  } else {
    state.profile = null; state.cert = null; state.done = loadLocal();
  }
  state.ready = true;
  emit();
}
if(sb){
  sb.auth.onAuthStateChange(function(ev, session){ setTimeout(function(){ onSession(session); }, 0); });
} else {
  state.done = loadLocal(); state.ready = true;
}
if(/access_token=|error_code=|error=access_denied/.test(hash)){
  setTimeout(function(){ try { history.replaceState(null, '', location.pathname + location.search); } catch(e){} }, 1500);
}

async function signOut(){ if(sb) await sb.auth.signOut(); toast('You are signed out. Sign in again any time with your email.'); }

/* ---------- certificate ---------- */
async function getCertificate(){
  if(!CFG.certificates || !state.user) return;
  if(!state.cert){
    var r = await sb.rpc('issue_certificate', { p_required: REQUIRED });
    if(r.error){ toast('We could not issue the certificate yet: ' + r.error.message); return; }
    state.cert = r.data;
  }
  location.href = 'certificate?id=' + encodeURIComponent(state.cert.id);
}

/* ---------- painting the page ---------- */
function emit(){ paint(); listeners.forEach(function(fn){ try { fn(state); } catch(e){} }); }

function paint(){
  if(!ON) return;
  paintNav(); paintBanners(); paintChecks(); paintChips();
}

function ring(pct, size){
  var r = 15, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return '<svg class="acct-ring" viewBox="0 0 36 36" width="' + size + '" height="' + size + '" aria-hidden="true"><circle cx="18" cy="18" r="' + r + '" class="rt"/><circle cx="18" cy="18" r="' + r + '" class="rv" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"/></svg>';
}

function paintNav(){
  var host = $('.nav-in'); if(!host) return;
  var box = $('#acctNav');
  if(!box){
    box = document.createElement('div'); box.id = 'acctNav'; box.className = 'acct-nav';
    var anchor = $('.mode-btn', host); host.insertBefore(box, anchor || null);
  }
  if(!state.ready){ box.innerHTML = ''; return; }
  if(!state.user){
    box.innerHTML = '<button type="button" class="acct-btn" data-acct="signin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg><span>Sign in</span></button>';
    return;
  }
  var s = stats();
  var fn = (state.profile && state.profile.first_name) || state.user.email || '?', ln = (state.profile && state.profile.last_name) || '';
  var ini = (fn.charAt(0) + ln.charAt(0)).toUpperCase();
  box.innerHTML = '<button type="button" class="acct-btn signed" aria-haspopup="true" aria-expanded="false" data-acct="menu">' + ring(s.pct, 30) + '<b class="acct-ini">' + esc(ini) + '</b><span class="acct-pct">' + s.pct + '%</span></button>' +
    '<div class="acct-menu" role="menu"><div class="am-head"><b>' + esc(((state.profile && (state.profile.first_name + ' ' + state.profile.last_name)) || '').trim() || state.user.email) + '</b><small>' + esc(state.user.email) + '</small></div>' +
    '<div class="am-prog"><span>Lean House progress</span><b>' + s.done + ' / ' + s.total + ' · ' + s.pct + '%</b><i><em style="width:' + s.pct + '%"></em></i></div>' +
    '<a role="menuitem" href="modules">Continue in the Learning Modules</a>' +
    (CFG.certificates ? (state.cert ? '<a role="menuitem" href="certificate?id=' + encodeURIComponent(state.cert.id) + '">View my certificate</a>' : (s.pct === 100 ? '<button type="button" role="menuitem" data-acct="cert">Get my certificate</button>' : '<span class="am-lock">Certificate unlocks at 100%</span>')) : '') +
    '<button type="button" role="menuitem" data-acct="signout">Sign out</button></div>';
}

function bannerHTML(){
  var s = stats();
  if(!state.user){
    var local = Object.keys(state.done).filter(function(k){ return REQUIRED.indexOf(k) > -1; }).length;
    return '<div class="ab-ico" aria-hidden="true">' + ring(s.pct, 54) + '<b>' + s.pct + '%</b></div>' +
      '<div class="ab-txt"><p class="ab-k">Free account</p><h3>Create a free account to track your progress' + (CFG.certificates ? ' and earn a certificate of completion' : '') + '</h3>' +
      '<p>Every lecture, reading and lab you open is checked off automatically' + (CFG.certificates ? ', and when you complete all the Lean House modules you get a certificate of completion' : '') + '. Your progress is saved to your account, so you can pick up on any device.' +
      (local ? ' <b>You have already opened ' + local + ' resource' + (local > 1 ? 's' : '') + ' on this device. Create an account to keep ' + (local > 1 ? 'them' : 'it') + '.</b>' : '') + '</p></div>' +
      '<div class="ab-act"><button type="button" class="btn btn-primary" data-acct="signup">Create free account</button><button type="button" class="ab-link" data-acct="signin">I already have an account</button></div>';
  }
  var name = firstName();
  var mods = (TM.SEQ || []).map(function(k){
    var m = TM.BYK[k], ms = moduleStats(k);
    return '<li class="' + (ms.pct === 100 ? 'ok' : '') + '"><span>' + esc(m.name) + '</span><i><em style="width:' + ms.pct + '%"></em></i><b>' + ms.done + '/' + ms.total + '</b></li>';
  }).join('');
  var cert = '';
  if(CFG.certificates){
    cert = state.cert ? '<a class="btn btn-primary" href="certificate?id=' + encodeURIComponent(state.cert.id) + '">View my certificate</a>'
      : (s.pct === 100 ? '<button type="button" class="btn btn-primary" data-acct="cert">Get my certificate</button>' : '<p class="ab-lock">Your certificate unlocks when you complete all ' + s.total + ' resources.</p>');
  }
  return '<div class="ab-ico" aria-hidden="true">' + ring(s.pct, 54) + '<b>' + s.pct + '%</b></div>' +
    '<div class="ab-txt"><p class="ab-k">Your progress</p><h3>' + (name ? 'Hi ' + esc(name) + ', ' : '') + 'you have completed ' + s.done + ' of ' + s.total + ' resources</h3><ul class="ab-mods">' + mods + '</ul></div>' +
    '<div class="ab-act">' + cert + '</div>';
}
function promoDismissed(){ try { return localStorage.getItem('tm-promo-closed') === '1'; } catch(e){ return false; } }
function paintBanners(){
  $$('[data-acct-banner]').forEach(function(el){
    if(!state.ready || (!state.user && promoDismissed())){ el.hidden = true; return; }
    el.hidden = false; el.classList.toggle('in', !!state.user);
    el.innerHTML = (state.user ? '' : '<button type="button" class="ab-x" data-acct="close-promo" aria-label="Close" title="Close. You can still sign in with the button at the top">×</button>') + bannerHTML();
  });
}

function paintChecks(){
  $$('[data-item]').forEach(function(el){
    var id = el.getAttribute('data-item'), on = !!state.done[id];
    el.classList.toggle('is-done', on);
    if(el.matches('article.rc')){
      var tg = $('.tm-tg', el);
      if(!tg){ tg = document.createElement('button'); tg.type = 'button'; tg.className = 'tm-tg'; tg.setAttribute('data-tg', id); var top = $('.rc-top', el); if(top) top.appendChild(tg); }
      if(tg.getAttribute('aria-pressed') === (on ? 'true' : 'false')) return;
      tg.setAttribute('aria-pressed', on ? 'true' : 'false');
      tg.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12.5l4 4L18 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      tg.title = on ? 'Done. Click to mark as not done' : 'Mark as done';
      tg.setAttribute('aria-label', tg.title);
    }
  });
}
function paintChips(){
  $$('.step-chip[data-k]').forEach(function(ch){
    var k = ch.getAttribute('data-k'); if(!TM.BYK || !TM.BYK[k] || (TM.SEQ || []).indexOf(k) < 0) return;
    var ms = moduleStats(k), tag = $('.chip-prog', ch);
    if(!tag){ tag = document.createElement('span'); tag.className = 'chip-prog'; ch.appendChild(tag); }
    var txt = ms.pct === 100 ? '✓' : ms.done + '/' + ms.total; if(tag.textContent !== txt) tag.textContent = txt;
    ch.classList.toggle('chip-done', ms.pct === 100);
  });
}

/* ---------- events ---------- */
document.addEventListener('click', function(e){
  if(!ON) return;
  var a = e.target.closest('a[data-item]');
  if(a){ markDone(a.getAttribute('data-item')); }
  var tg = e.target.closest('[data-tg]');
  if(tg){ e.preventDefault(); e.stopPropagation(); var id = tg.getAttribute('data-tg'); if(state.done[id]) unmark(id); else markDone(id); return; }
  var b = e.target.closest('[data-acct]');
  if(b){
    var act = b.getAttribute('data-acct');
    if(act === 'signin' || act === 'signup'){ e.preventDefault(); openDialog(act); }
    else if(act === 'menu'){ var nav = $('#acctNav'); var open = !nav.classList.contains('open'); nav.classList.toggle('open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    else if(act === 'signout'){ signOut(); }
    else if(act === 'cert'){ getCertificate(); }
    else if(act === 'close-promo'){ try { localStorage.setItem('tm-promo-closed', '1'); } catch(err){} paintBanners(); toast('No problem. You can create an account or sign in any time with the Sign in button at the top.'); }
    return;
  }
  var nav2 = $('#acctNav'); if(nav2 && !nav2.contains(e.target)) nav2.classList.remove('open');
}, true);

/* ---------- sign-in / sign-up dialog ---------- */
var dlg = null, cooldownT = 0, lastEmail = '', lastCreate = false, lastData = null;
function buildDialog(){
  dlg = document.createElement('dialog'); dlg.className = 'auth-dlg'; dlg.setAttribute('aria-labelledby', 'authH');
  document.body.appendChild(dlg);
  dlg.addEventListener('click', function(e){ if(e.target === dlg) dlg.close(); });
}
function field(name, label, type, auto, req){
  return '<label class="af"><span>' + label + (req ? '' : ' <i>(optional)</i>') + '</span><input name="' + name + '" type="' + type + '" autocomplete="' + auto + '"' + (req ? ' required' : '') + ' maxlength="' + (name === 'organization' ? 160 : 120) + '"></label>';
}
function openDialog(view, opts){
  if(!dlg) buildDialog();
  opts = opts || {};
  var html = '<div class="ad-in"><button type="button" class="ad-x" aria-label="Close" data-close>×</button>';
  if(view === 'signup'){
    html += '<p class="ad-k">Free account</p><h3 id="authH">Create your free account</h3>' +
      '<p class="ad-p">Track every lecture, reading and lab automatically' + (CFG.certificates ? ' and earn a certificate of completion when you finish the Lean House' : '') + '. No password: we email you a unique sign-in link, and clicking it signs you in automatically.</p>' +
      '<form class="ad-f" data-form="signup" novalidate>' +
      '<div class="af-row">' + field('first_name', 'First name', 'text', 'given-name', true) + field('last_name', 'Last name', 'text', 'family-name', true) + '</div>' +
      field('email', 'Email', 'email', 'email', true) +
      field('organization', 'Organization or school', 'text', 'organization', true) +
      '<label class="ac"><input type="checkbox" name="cert_updates"><span>Email me about the official certification when it becomes available.</span></label>' +
      '<p class="ad-err" role="alert" hidden></p>' +
      '<p class="ad-spam"><b>Heads up:</b> the sign-in email sometimes lands in <b>Spam</b> or <b>Junk</b>. If you do not see it in your inbox within a minute, please check there.</p>' +
      '<button type="submit" class="btn btn-primary ad-go">Email me my sign-in link</button>' +
      '<p class="ad-fine">We only use your details for your account and, if you tick the box, certification news. <a href="privacy" target="_blank" rel="noopener">Privacy</a></p></form>' +
      '<p class="ad-sw">Already have an account? <button type="button" data-view="signin">Sign in</button></p>';
  } else if(view === 'signin'){
    html += '<p class="ad-k">Welcome back</p><h3 id="authH">Sign in</h3>' +
      '<p class="ad-p">' + (opts.message ? esc(opts.message) + ' ' : '') + 'Enter the email you signed up with. We will email you a new one-time link; click it to sign in on this device.</p>' +
      '<form class="ad-f" data-form="signin" novalidate>' + field('email', 'Email', 'email', 'email', true) +
      '<p class="ad-err" role="alert" hidden></p><p class="ad-spam">The email can take a minute and sometimes lands in <b>Spam</b> or <b>Junk</b>.</p><button type="submit" class="btn btn-primary ad-go">Email me a sign-in link</button></form>' +
      '<p class="ad-sw">New here? <button type="button" data-view="signup">Create a free account</button></p>';
  } else if(view === 'sent'){
    html += '<div class="ad-mail" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 7 8.5-7"/></svg></div>' +
      '<p class="ad-k">Check your email</p><h3 id="authH">Your sign-in link is on its way</h3>' +
      '<p class="ad-p">We sent a link to <b>' + esc(lastEmail) + '</b>. Open the email <b>on this device</b> and click <b>Sign in</b>. You will come back here signed in, with your progress saved.</p>' +
      '<p class="ad-spam"><b>Do not see it?</b> Please check your <b>Spam</b> or <b>Junk</b> folder (and Promotions in Gmail). If it is there, mark it as “Not spam” so future emails reach your inbox.</p>' +
      '<ul class="ad-tips"><li>The link works once and expires after about an hour.</li><li>If you already had an account, this link simply signs you in.</li></ul>' +
      '<div class="ad-row"><button type="button" class="btn btn-primary" data-resend disabled>Resend link</button><button type="button" class="ab-link" data-view="' + (lastCreate ? 'signup' : 'signin') + '">Use a different email</button></div>';
  } else if(view === 'expired'){
    html += '<p class="ad-k">Link expired</p><h3 id="authH">That sign-in link no longer works</h3>' +
      '<p class="ad-p">Sign-in links work once and expire after about an hour' + (opts.detail ? ' (' + esc(opts.detail) + ')' : '') + '. Request a fresh one below.</p>' +
      '<form class="ad-f" data-form="signin" novalidate>' + field('email', 'Email', 'email', 'email', true) +
      '<p class="ad-err" role="alert" hidden></p><button type="submit" class="btn btn-primary ad-go">Send me a new link</button></form>';
  }
  html += '</div>';
  dlg.innerHTML = html;
  if(!dlg.open){ if(dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  if(opts.email){ var em = $('input[name=email]', dlg); if(em) em.value = opts.email; }
  var first = $('input', dlg); if(first) setTimeout(function(){ first.focus(); }, 30);
  if(view === 'sent') startCooldown(60);
  $$('[data-close]', dlg).forEach(function(x){ x.addEventListener('click', function(){ dlg.close(); }); });
  $$('[data-view]', dlg).forEach(function(x){ x.addEventListener('click', function(){ var em2 = $('input[name=email]', dlg); openDialog(x.getAttribute('data-view'), { email: (em2 && em2.value) || lastEmail }); }); });
  var f = $('form', dlg); if(f) f.addEventListener('submit', onSubmit);
  var rs = $('[data-resend]', dlg); if(rs) rs.addEventListener('click', function(){ send(lastEmail, lastCreate, lastData, rs); });
}
function startCooldown(sec){
  clearInterval(cooldownT);
  var btn = dlg && $('[data-resend]', dlg); if(!btn) return;
  var left = sec; btn.disabled = true; btn.textContent = 'Resend link in ' + left + 's';
  cooldownT = setInterval(function(){ left--; if(left <= 0){ clearInterval(cooldownT); btn.disabled = false; btn.textContent = 'Resend link'; } else btn.textContent = 'Resend link in ' + left + 's'; }, 1000);
}
function showErr(form, msg){ var e = $('.ad-err', form); e.innerHTML = msg; e.hidden = !msg; }
async function onSubmit(e){
  e.preventDefault();
  var form = e.target, kind = form.getAttribute('data-form'), fd = new FormData(form);
  var email = String(fd.get('email') || '').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)){ showErr(form, 'Please enter a valid email address.'); return; }
  var data = null;
  if(kind === 'signup'){
    data = {
      first_name: String(fd.get('first_name') || '').trim(),
      last_name: String(fd.get('last_name') || '').trim(),
      organization: String(fd.get('organization') || '').trim(),
      cert_updates: !!fd.get('cert_updates')
    };
    if(!data.first_name || !data.last_name || !data.organization){ showErr(form, 'Please fill in your first name, last name and organization or school.'); return; }
  }
  await send(email, kind === 'signup', data, $('.ad-go', form), form);
}
async function send(email, create, data, btn, form){
  if(!sb){ if(form) showErr(form, 'Sign-in is temporarily unavailable. Please try again later.'); return; }
  lastEmail = email; lastCreate = create; lastData = data;
  var label = btn ? btn.textContent : '';
  if(btn){ btn.disabled = true; btn.textContent = 'Sending…'; }
  var opts = { emailRedirectTo: redirectUrl(), shouldCreateUser: !!create };
  if(create && data) opts.data = data;
  var r = await sb.auth.signInWithOtp({ email: email, options: opts });
  if(btn){ btn.disabled = false; btn.textContent = label; }
  if(r.error){
    var m = r.error.message || '', msg;
    if(/signups? not allowed|not found|user not found/i.test(m)) msg = 'We could not find an account for <b>' + esc(email) + '</b>. <button type="button" class="ad-inline" data-view="signup">Create a free account</button>';
    else if(r.error.status === 429 || /security purposes|rate limit|after \d+ seconds/i.test(m)) msg = 'Too many requests right now. Please wait a minute and try again.';
    else msg = 'We could not send the link: ' + esc(m);
    if(form){ showErr(form, msg); var v = $('[data-view]', form); if(v) v.addEventListener('click', function(){ openDialog('signup', { email: email }); }); }
    else toast(msg.replace(/<[^>]+>/g, ''));
    return;
  }
  if(form) openDialog('sent'); else startCooldown(60);
}

/* ---------- toast ---------- */
function toast(msg){
  var t = $('#acctToast');
  if(!t){ t = document.createElement('div'); t.id = 'acctToast'; t.className = 'acct-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function(){ t.classList.remove('show'); }, 5200);
}

/* ---------- start ---------- */
function boot(){
  if(!ON) return;
  paint();
  // panels and libraries re-render themselves: keep their checkmarks in sync
  var mt = 0;
  new MutationObserver(function(){ clearTimeout(mt); mt = setTimeout(function(){ paintChecks(); paintChips(); }, 30); })
    .observe(document.body, { childList: true, subtree: true });
  if(linkError){ openDialog('expired', { detail: linkError }); }
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

window.TMAuth = {
  client: sb, config: CFG, enabled: ON, state: state, stats: stats, moduleStats: moduleStats,
  markDone: markDone, unmark: unmark, signOut: signOut, openSignIn: function(){ openDialog('signin'); },
  onChange: function(fn){ listeners.push(fn); if(state.ready) fn(state); }, repaint: paint
};
})();
