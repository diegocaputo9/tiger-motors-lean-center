/* "We want to hear your feedback": the footer button opens a small box; the text goes to the
   submit_feedback function in Supabase, which stores it and emails it (recipient in feedback_settings). */
(function(){
'use strict';
var SB_URL = 'https://txmcwrwxqbribdhyprqu.supabase.co', SB_KEY = 'sb_publishable_rv7klDuiZhvrve5O8wsqmg_1rctcFoo';
var ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>';
var X = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
var dlg;

function t(en){ return window.TMI18n && TMI18n.t ? TMI18n.t(en) : en; }

function build(){
  dlg = document.createElement('dialog');
  dlg.className = 'fbk-dlg';
  dlg.setAttribute('aria-labelledby', 'fbk-h');
  dlg.innerHTML =
    '<button type="button" class="fbk-x" aria-label="Close" data-fbk-close>' + X + '</button>' +
    '<form class="fbk-form" novalidate>' +
      '<p class="fbk-kicker">Feedback</p>' +
      '<h3 id="fbk-h">We want to hear your feedback</h3>' +
      '<p class="fbk-sub">Suggestions, ideas, or something that did not work. Every message is read by the Lean Team.</p>' +
      '<label class="fbk-l"><span>Your suggestion</span><textarea name="message" rows="5" maxlength="3000" required placeholder="What could we improve?"></textarea></label>' +
      '<label class="fbk-l"><span>Your email <small>(optional, if you would like a reply)</small></span><input type="email" name="email" maxlength="200" autocomplete="email" placeholder="name@example.com"></label>' +
      '<input type="text" name="website" class="fbk-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="fbk-err" role="alert" hidden></p>' +
      '<div class="fbk-act"><button type="button" class="fbk-btn" data-fbk-close>Cancel</button><button type="submit" class="fbk-btn solid">Send feedback</button></div>' +
    '</form>' +
    '<div class="fbk-done" hidden><p class="fbk-kicker">Feedback</p><h3>Thank you!</h3><p class="fbk-sub">Your feedback was sent to the Lean Team.</p><div class="fbk-act"><button type="button" class="fbk-btn solid" data-fbk-close>Close</button></div></div>';
  document.body.appendChild(dlg);
  dlg.addEventListener('click', function(e){ if(e.target === dlg || e.target.closest('[data-fbk-close]')) dlg.close(); });
  dlg.querySelector('form').addEventListener('submit', send);
}

function open(){
  if(!dlg) build();
  var f = dlg.querySelector('form'), done = dlg.querySelector('.fbk-done');
  f.hidden = false; done.hidden = true; f.querySelector('.fbk-err').hidden = true;
  dlg.showModal();
  f.querySelector('textarea').focus();
}

function send(e){
  e.preventDefault();
  var f = e.target, err = f.querySelector('.fbk-err'), btn = f.querySelector('[type=submit]');
  var msg = f.message.value.trim(), mail = f.email.value.trim();
  function fail(m){ err.textContent = t(m); err.hidden = false; }
  if(msg.length < 5) return fail('Please write a little more.');
  if(mail && !/^[^@\s<>,;]+@[^@\s<>,;]+\.[a-z]{2,}$/i.test(mail)) return fail('Please enter a valid email address.');
  err.hidden = true; btn.disabled = true; btn.textContent = t('Sending…');
  fetch(SB_URL + '/rest/v1/rpc/submit_feedback', {
    method: 'POST',
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_message: msg, p_email: mail, p_page: location.pathname, p_lang: document.documentElement.lang || 'en', p_website: f.website.value })
  }).then(function(r){
    if(r.ok){ f.reset(); f.hidden = true; dlg.querySelector('.fbk-done').hidden = false; return; }
    return r.json().then(function(j){ fail((j && j.message) || 'We could not send your feedback. Please check your connection and try again.'); });
  }).catch(function(){ fail('We could not send your feedback. Please check your connection and try again.'); })
    .then(function(){ btn.disabled = false; btn.textContent = t('Send feedback'); });
}

document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('[data-feedback]'); if(b){ e.preventDefault(); open(); } });
document.querySelectorAll('[data-feedback]').forEach(function(b){ if(!b.querySelector('svg')) b.insertAdjacentHTML('afterbegin', ICON); });

var css = document.createElement('style');
css.textContent =
  '.fbk-open{display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border-radius:999px;border:1px solid var(--line-2,rgba(160,185,212,.32));background:transparent;color:var(--text,#E9EEF4);font:600 14px/1.2 var(--f-body,"IBM Plex Sans",system-ui,sans-serif);cursor:pointer;transition:border-color .2s,color .2s,background .2s}' +
  '.fbk-open:hover,.fbk-open:focus-visible{border-color:var(--orange,#E87722);color:var(--orange-2,#F2994A);background:rgba(232,119,34,.08)}' +
  '.fbk-dlg{width:min(520px,calc(100vw - 32px));padding:0;border:1px solid var(--line-2,rgba(160,185,212,.32));border-radius:20px;background:var(--bg-2,#0A1828);color:var(--text,#E9EEF4);box-shadow:0 30px 80px -30px rgba(0,0,0,.7)}' +
  '.fbk-dlg::backdrop{background:rgba(4,10,18,.6);backdrop-filter:blur(4px)}' +
  '.fbk-form,.fbk-done{display:grid;gap:14px;padding:28px}' +
  '.fbk-form[hidden],.fbk-done[hidden]{display:none}' +
  '.fbk-x{position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:50%;border:1px solid var(--line,rgba(160,185,212,.16));background:transparent;color:inherit;display:grid;place-items:center;cursor:pointer}' +
  '.fbk-kicker{margin:0;font:500 12px var(--f-mono,"IBM Plex Mono",monospace);letter-spacing:.16em;text-transform:uppercase;color:var(--orange-2,#F2994A)}' +
  '.fbk-dlg h3{margin:0;font:700 24px/1.2 var(--f-display,system-ui,sans-serif);padding-right:36px}' +
  '.fbk-sub{margin:0;font-size:15px;color:var(--text-2,#A9B8C9)}' +
  '.fbk-l{display:grid;gap:6px;font-size:14px;font-weight:600}.fbk-l small{font-weight:400;color:var(--text-2,#A9B8C9)}' +
  '.fbk-l textarea,.fbk-l input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1px solid var(--line-2,rgba(160,185,212,.32));background:rgba(255,255,255,.04);color:inherit;font:400 15px/1.5 var(--f-body,system-ui,sans-serif);resize:vertical}' +
  '.fbk-l textarea:focus,.fbk-l input:focus{outline:2px solid var(--orange,#E87722);outline-offset:1px;border-color:transparent}' +
  '.fbk-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
  '.fbk-err{margin:0;font-size:14px;color:#FF9C8A}' +
  '.fbk-act{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}' +
  '.fbk-btn{padding:11px 20px;border-radius:999px;border:1px solid var(--line-2,rgba(160,185,212,.32));background:transparent;color:inherit;font:600 14px var(--f-body,system-ui,sans-serif);cursor:pointer}' +
  '.fbk-btn.solid{background:var(--orange,#E87722);border-color:var(--orange,#E87722);color:#1A0C02}.fbk-btn:disabled{opacity:.6;cursor:wait}' +
  'html[data-mode="light"] .fbk-dlg{background:#fff;color:#0C1B2E;border-color:rgba(12,35,64,.14)}' +
  'html[data-mode="light"] .fbk-sub,html[data-mode="light"] .fbk-l small{color:#26313F}' +
  'html[data-mode="light"] .fbk-l textarea,html[data-mode="light"] .fbk-l input{background:#F4F6F9;border-color:rgba(12,35,64,.18)}' +
  'html[data-mode="light"] .fbk-open{color:#0C1B2E;border-color:rgba(12,35,64,.22)}html[data-mode="light"] .fbk-kicker{color:#5A2603}html[data-mode="light"] .fbk-err{color:#B42318}';
document.head.appendChild(css);
})();
