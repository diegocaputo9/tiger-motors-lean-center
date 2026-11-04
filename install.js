/* "Install the app": opens a dialog with the steps to add the site to an iPhone or Android home screen or install it on a computer.
   Any link with data-install opens it. Chrome and Edge also get a one-click Install button when the browser offers one.
   The links hide themselves when the site is already running as an installed app. */
(function(){
'use strict';

var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
var links = document.querySelectorAll('[data-install]');
if(standalone){ links.forEach(function(a){ a.hidden = true; }); return; }

var ua = navigator.userAgent;
var IOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
var ANDROID = /Android/.test(ua);
var deferred = null, dlg = null;

var I = {
  safari: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  share: '<path d="M12 3.5v11M8.2 7.3L12 3.5l3.8 3.8"/><path d="M9 10.5H7a1.5 1.5 0 00-1.5 1.5v7A1.5 1.5 0 007 20.5h10a1.5 1.5 0 001.5-1.5v-7a1.5 1.5 0 00-1.5-1.5h-2"/>',
  add: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8.2 12.3l2.6 2.6 5-5.4"/>',
  chrome: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.4"/><path d="M12 8.6h8.2M9.1 13.7L5 6.6M14.9 13.7L10.8 20.9"/>',
  dots: '<circle cx="12" cy="5.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="18.5" r="1.3" fill="currentColor" stroke="none"/>',
  install: '<rect x="3" y="4.5" width="18" height="12.5" rx="2"/><path d="M12 7.5v6M9.3 10.8L12 13.5l2.7-2.7M8.5 20.5h7"/>',
  pin: '<path d="M4 20.5h16"/><rect x="9" y="11" width="6" height="6" rx="1.5"/><path d="M12 3.5v4.5M9.8 5.8L12 8l2.2-2.2"/>',
  phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.8"/><path d="M10.5 5.3h3"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 18.5h18"/>'
};
function ic(k){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + '</svg>'; }

var SITE = '<b>tigermotorslean.com</b>';
var PANES = {
  ios: { tab: 'iPhone', icon: 'phone', steps: [
    ['safari', 'Open ' + SITE + ' in <b>Safari</b>.'],
    ['share', 'Tap the <b>Share</b> button. On newer iPhones it is inside the <b>•••</b> menu.'],
    ['add', 'Scroll down and choose <b>Add to Home Screen</b>.'],
    ['check', 'Tap <b>Add</b>, then <b>Done</b>. The Tiger Motors icon is now on your home screen.']
  ]},
  android: { tab: 'Android', icon: 'phone', steps: [
    ['chrome', 'Open ' + SITE + ' in <b>Chrome</b>.'],
    ['dots', 'Tap the <b>three-dot menu</b> in the top right corner.'],
    ['add', 'Choose <b>Add to Home screen</b>, then <b>Install</b>.'],
    ['check', 'Tap <b>Install</b> again to confirm. The Tiger Motors icon is now on your home screen.']
  ]},
  pc: { tab: 'Desktop', icon: 'laptop', steps: [
    ['chrome', 'Open ' + SITE + ' in <b>Chrome</b> or <b>Edge</b>.'],
    ['install', 'Click the <b>install</b> icon at the right end of the address bar, or open the <b>three-dot menu</b> and choose <b>Install page as app</b>.'],
    ['check', 'Click <b>Install</b>. Tiger Motors opens in its own window, like an app.'],
    ['pin', 'To keep it close, right-click its icon and choose <b>Keep in Dock</b> or <b>Pin to taskbar</b>.']
  ], note: 'On a Mac with Safari, choose <b>File</b>, then <b>Add to Dock</b>.' }
};

function build(){
  dlg = document.createElement('dialog');
  dlg.className = 'bdlg idlg';
  dlg.id = 'installDlg';
  dlg.setAttribute('aria-labelledby', 'idlg-h');
  var tabs = '', panes = '';
  Object.keys(PANES).forEach(function(k){
    var p = PANES[k];
    tabs += '<button type="button" role="tab" class="idlg-tab" data-pane="' + k + '" aria-selected="false">' + ic(p.icon) + '<span>' + p.tab + '</span></button>';
    panes += '<div class="idlg-pane" role="tabpanel" data-pane="' + k + '" hidden>' +
      (k !== 'ios' ? '<div class="idlg-now" hidden><button type="button" class="btn btn-primary" data-install-now>Install now</button><span>Your browser can install it in one click.</span></div>' : '') +
      '<ol class="idlg-steps">' + p.steps.map(function(s){ return '<li><i class="idlg-ic">' + ic(s[0]) + '</i><span>' + s[1] + '</span></li>'; }).join('') + '</ol>' +
      (p.note ? '<p class="idlg-note">' + p.note + '</p>' : '') + '</div>';
  });
  dlg.innerHTML =
    '<button class="bdlg-x dlg-x" type="button" aria-label="Close" data-close-install><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    '<div class="bdlg-in">' +
      '<div class="bdlg-top"><div><p class="eyebrow">Free · No app store</p><h3 id="idlg-h">Install the app</h3>' +
      '<p class="bdlg-role">Add Tiger Motors to your home screen or desktop. It opens full screen, like an app.</p></div></div>' +
      '<div class="idlg-tabs" role="tablist" aria-label="Device">' + tabs + '</div>' + panes +
    '</div>';
  document.body.appendChild(dlg);
  dlg.addEventListener('click', function(e){
    if(e.target === dlg || e.target.closest('[data-close-install]')) dlg.close();
    var t = e.target.closest('.idlg-tab'); if(t) show(t.getAttribute('data-pane'));
    if(e.target.closest('[data-install-now]') && deferred){
      deferred.prompt();
      deferred.userChoice.then(function(r){ if(r.outcome === 'accepted') dlg.close(); deferred = null; offer(); });
    }
  });
  offer();
}
function show(k){
  dlg.querySelectorAll('.idlg-tab').forEach(function(t){ t.setAttribute('aria-selected', t.getAttribute('data-pane') === k ? 'true' : 'false'); });
  dlg.querySelectorAll('.idlg-pane').forEach(function(p){ p.hidden = p.getAttribute('data-pane') !== k; });
}
// the one-click button only shows where the browser has offered to install
function offer(){ if(dlg) dlg.querySelectorAll('.idlg-now').forEach(function(n){ n.hidden = !deferred; }); }

window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); deferred = e; offer(); });
window.addEventListener('appinstalled', function(){ deferred = null; offer(); links.forEach(function(a){ a.hidden = true; }); });

links.forEach(function(a){
  a.addEventListener('click', function(e){
    e.preventDefault();
    if(!dlg) build();
    show(IOS ? 'ios' : ANDROID ? 'android' : 'pc');
    dlg.showModal();
  });
});
})();
