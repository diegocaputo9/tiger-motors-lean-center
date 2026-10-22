/* Shared learning-module data and helpers, used by index.html (Lean House) and modules.html (Learning Modules).
   To add or change a resource, edit it here once. */
window.TM = (function(){
'use strict';
var TYPES = {
  lecture:   {label:'Lecture',        act:'Watch lecture',    d:'Lectures and instructional material'},
  podcast:   {label:'Podcast',        act:'Listen',           d:'Podcasts and supplemental resources'},
  reading:   {label:'Reading',        act:'Open reading',     d:'Readings and supplemental resources'},
  lab:       {label:'Lab activity',   act:'Launch activity',  d:'Laboratory activities and exercises'},
  video360:  {label:'360° video',     act:'Watch in 360°',    d:'Interactive and 360° experiences'},
  immersive: {label:'Immersive',      act:'Enter experience', d:'Interactive and 360° experiences'}
};
var VERBS = {
  learn:      {t:'LEARN',      d:'Lectures and instructional material'},
  explore:    {t:'EXPLORE',    d:'Readings, podcasts and supplemental resources'},
  experience: {t:'EXPERIENCE', d:'Interactive and 360° experiences'},
  apply:      {t:'APPLY',      d:'Laboratory activities and exercises'}
};
var M = [
  {k:'people', n:'01', name:'People', role:'Base of the house', items:[
    {id:'people.lecture.people', step:1, verb:'learn',   type:'lecture', title:'People', src:'Video lecture · YouTube', url:'https://youtu.be/u3-yG2JBuJo'},
    {id:'people.podcast.nummi', step:2, verb:'explore', type:'podcast', title:'NUMMI', src:'Podcast · This American Life', url:'https://www.thisamericanlife.org/561/nummi-2015'},
    {id:'people.lab.mass-system-no-lean-tools', step:3, verb:'apply',   type:'lab',     title:'Mass System (No Lean Tools)', src:'Lab activity · 360° environment', url:'https://storage.net-fs.com/hosting/8253122/2/'},
    {id:'people.video360.mass-production-run', step:4, verb:'experience', type:'video360', title:'Mass Production Run', src:'360° video with students · YouTube', url:'https://www.youtube.com/watch?v=21cAO-YCuek'}
  ]},
  {k:'std', n:'02', name:'Standardization', role:'Foundation', hide:['experience'], items:[
    {id:'std.lecture.standardization', step:1, verb:'learn',   type:'lecture', title:'Standardization', src:'Video lecture · YouTube', url:'https://youtu.be/n2_illFaVDQ'},
    {id:'std.lecture.5s', step:2, verb:'learn',   type:'lecture', title:'5S', src:'Video lecture · YouTube', url:'https://youtu.be/K9ojM534fco'},
    {id:'std.reading.clean-house-with-lean-5s', step:3, verb:'explore', type:'reading', title:'Clean House with Lean 5S', src:'Reading · Auburn Box', url:'https://auburn.box.com/s/qvshzp1efxd6098ybub9e7bj2e7w5ivx'},
    {id:'std.lab.5s-lab-activity', step:4, verb:'apply',   type:'lab',     title:'5S Lab Activity', src:'Lab activity · 3DVista 360°', url:'https://cloud.3dvista.com/hosting/8253122/4/index.htm'}
  ]},
  {k:'jidoka', n:'03', name:'Jidoka', role:'Pillar', hide:['experience'], items:[
    {id:'jidoka.lecture.jidoka', step:1, verb:'learn',   type:'lecture', title:'Jidoka', src:'Video lecture · YouTube', url:'https://youtu.be/3QxSfRsfVeM?si=gDBQsAAIxs1qQs_6'},
    {id:'jidoka.reading.jidoka', step:2, verb:'explore', type:'reading', title:'Jidoka', src:'Reading · kaizen.com', url:'https://kaizen.com/insights/jidoka-automation-human-touch/'}
  ], empty:{apply:'Coming in Spring 2027'}},
  {k:'jit', n:'04', name:'Just in Time', role:'Pillar', seq:true, items:[
    {id:'jit.lecture.current-state-vsm', step:1, verb:'learn',   type:'lecture', title:'Current State VSM', short:'Current State VSM', src:'Video lecture · YouTube', url:'https://youtu.be/j6aTC0uZgWg'},
    {id:'jit.lab.current-state-vsm', step:2, verb:'apply',   type:'lab',     title:'Current State VSM', short:'Current State VSM', src:'Lab activity · 360° environment', url:'https://storage.net-fs.com/hosting/8253122/5/'},
    {id:'jit.lecture.smed', step:3, verb:'learn',   type:'lecture', title:'SMED', short:'SMED', src:'Video lecture · YouTube', url:'https://youtu.be/tHWlLqAcs90'},
    {id:'jit.lecture.linked-cell-design', step:4, verb:'learn',   type:'lecture', title:'Linked Cell Design', short:'Linked Cell Design', src:'Video lecture · YouTube', url:'https://youtu.be/ZLkOt3Moi6c'},
    {id:'jit.lab.lean-system-lean-tools-included', step:5, verb:'apply',   type:'lab',     title:'Lean System (Lean Tools Included)', short:'Lean System', src:'Lab activity · 360° environment', url:'https://storage.net-fs.com/hosting/8253122/3/'},
    {id:'jit.lecture.future-state-vsm', step:6, verb:'learn',   type:'lecture', title:'Future State VSM', short:'Future State VSM', src:'Video lecture · YouTube', url:'https://youtu.be/0qA9NLfdy7c'},
    {id:'jit.lab.future-state-vsm', step:7, verb:'apply',   type:'lab',     title:'Future State VSM', short:'Future State VSM', src:'Lab activity · 360° environment', url:'https://storage.net-fs.com/hosting/8253122/6/'},
    {id:'jit.reading.just-in-time-jit', step:8, verb:'explore', type:'reading', title:'Just in Time (JIT)', short:'JIT reading', src:'Reading · 6sigma.us', url:'https://www.6sigma.us/manufacturing/just-in-time-production-system-jit/'},
    {id:'jit.video360.lean-production-run', verb:'experience', type:'video360', title:'Lean Production Run', src:'360° video with students · YouTube', url:'https://www.youtube.com/watch?v=OlPsvqmmc_A'}
  ]},
  {k:'ci', n:'05', name:'Continuous Improvement', role:'Kaizen · Core of the house', items:[
    {id:'ci.lecture.seven-wastes', step:1, verb:'learn',   type:'lecture', title:'Seven Wastes', src:'Video lecture · YouTube', url:'https://youtu.be/gJibxrRP3xc'},
    {id:'ci.lecture.continuous-improvement-system', step:2, verb:'learn',   type:'lecture', title:'Continuous Improvement System', src:'Video lecture · YouTube', url:'https://youtu.be/dXPb_cVIqZI'},
    {id:'ci.lecture.leadership', step:3, verb:'learn',   type:'lecture', title:'Leadership', src:'Video lecture · YouTube', url:'https://youtu.be/Hy6FQlziOVI'},
    {id:'ci.reading.continuous-improvement', step:4, verb:'explore', type:'reading', title:'Continuous Improvement', src:'Reading · kaizen.com', url:'https://kaizen.com/insights/continuous-improvement-operational-excellence/'},
    {id:'ci.video360.kaizen-production-run', verb:'experience', type:'video360', title:'Kaizen Production Run', src:'360° video with students · YouTube', url:'https://www.youtube.com/watch?v=BlooJxLysDA'}
  ], empty:{apply:'Coming in Spring 2027'}},
  {k:'sqdcm', n:'', name:'SQDCM', role:'Performance · Safety, Quality, Delivery, Cost, Morale', hide:['experience'], items:[
    {id:'sqdcm.reading.sqdcm', verb:'explore', type:'reading', title:'SQDCM', src:'Supplemental material', url:null, pending:'Coming in Spring 2027'}
  ], empty:{learn:'Coming in Spring 2027', apply:'Coming in Spring 2027'}},
  {k:'cs', n:'', name:'Customer Satisfaction', role:'Goal · Roof of the house', items:[], empty:{learn:'Coming in Spring 2027', explore:'Coming in Spring 2027', experience:'Coming in Spring 2027', apply:'Coming in Spring 2027'}}
];
var BYK = {}; M.forEach(function(m){BYK[m.k]=m;});
var SEQ = ['people','std','jidoka','jit','ci'];

function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function icon(id,cls){return '<svg'+(cls?' class="'+cls+'"':'')+' aria-hidden="true"><use href="#i-'+id+'"/></svg>';}
function ext(u){return 'href="'+esc(u)+'" target="_blank" rel="noopener"';}
function isLaunch(t){return t==='lab'||t==='immersive';}
// Resources that count toward the Lean House certificate of completion:
// every linked resource in the five Lean House elements, except items marked optional:true
var REQUIRED = []; SEQ.forEach(function(k){ (BYK[k].items||[]).forEach(function(it){ if(it.url && it.id && !it.optional) REQUIRED.push(it.id); }); });
var SQ = [['S','SAFETY'],['Q','QUALITY'],['D','DELIVERY'],['C','COST'],['M','MORALE']];
return {TYPES:TYPES, VERBS:VERBS, M:M, BYK:BYK, SEQ:SEQ, SQ:SQ, REQUIRED:REQUIRED, esc:esc, icon:icon, ext:ext, isLaunch:isLaunch};
})();
