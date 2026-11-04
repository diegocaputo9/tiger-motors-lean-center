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
  ],
  // end-of-module quiz (quiz.js): unlocks once every resource above is done; passing counts as a required item
  quiz:{id:'people.quiz', pass:8, q:[
    {t:'mc', q:'What are the three generations of manufacturing, in order?',
     o:['Mass production → Job shop → Lean production','Job shop → Mass production → Lean production','Job shop → Lean production → Mass production','Craft guilds → Job shop → Mass production'], a:1,
     e:'The first factory design was the job shop, where water-wheel-driven shafts ran all the machines on belts. The second was mass production, Henry Ford’s Model T line. The third is lean production, the Toyota Production System (TPS).'},
    {t:'mc', q:'What inspired Taiichi Ohno’s “pull” system and kanban?',
     o:['Ford’s moving assembly line','Chicago meatpacking plants','The American supermarket','Japanese textile mills'], a:2,
     e:'On a visit to the US, Ohno saw that when a customer takes a gallon of milk off the shelf, it gets replaced, setting off a chain reaction “back to the cow” with almost no inventory in the system. Supermarkets worked this way because food spoils. Ohno used the same idea to pull material through Toyota.'},
    {t:'mc', q:'According to the lecture, what really made mass production possible?',
     o:['The moving conveyor','Interchangeable parts','Vertical integration','Immigrant labor'], a:1,
     e:'Pre-hardened metal cutting tools made parts to near-exact specifications, so workers no longer had to file parts to fit each car. Most people credit the moving conveyor, but it had already been used in Chicago meatpacking before Ford. The lecturer calls it less important than interchangeable parts.'},
    {t:'tf', q:'In Ford’s mass production system, workers were encouraged to stop the line and help solve quality problems.',
     o:['True','False'], a:1,
     e:'Ford’s system was designed so workers didn’t need to communicate. They couldn’t stop the line and had no role in problem solving. Defective units went to the end of the line, and mass producers used 20–25% of their labor offline just to repair them.'},
    {t:'blank', q:'Sakichi Toyoda’s automatic loom stopped itself as soon as a thread broke, so a defect could never be passed forward. This principle of building error detection into the process is called ________.',
     o:['Kanban','Jidoka','Kaizen','Muda'], a:1,
     e:'Jidoka means error-proofing at the station, in the process. The lecturer calls it part of Toyota’s “DNA,” dating back to when the Toyoda family made fabric, not cars. If the process stops when a defect happens and the problem is fixed permanently, quality keeps getting better over time.'},
    {t:'mc', q:'Shigeo Shingo developed SMED (Single-Minute Exchange of Die). What does “single minute” actually mean?',
     o:['Exactly 60 seconds','A changeover of under 10 minutes (a single-digit number of minutes)','One minute of downtime per shift','One operator doing the change in one step'], a:1,
     e:'“Single minute” means a single-digit number of minutes, so anything under 10. Detroit could take a full day to change a die. Toyota got it down to about three minutes, running die changes like a pit crew. That let a few presses build many different models.'},
    {t:'mc', q:'After the 1949 strike, Toyota agreed to lifetime employment. What did Ohno expect from employees in return?',
     o:['Lower wages','Strict job classifications','Flexibility in work assignments and active problem solving','Working longer shifts'], a:2,
     e:'Ohno said that if Toyota was taking people on for life, they had to do the jobs that needed doing and help solve problems. Employees became “fixed assets” to be maintained, the way you’d maintain a machine. That is the opposite of Ford’s rigid job classifications, where an electrician couldn’t do a millwright’s job.'},
    {t:'mc', q:'How does Toyota’s andon cord work?',
     o:['Pulling it stops the line immediately, every time','It calls a team leader, and the line stops only if help doesn’t arrive in time (for example, about 60 seconds)','It sends the defective car to an offline repair area','It is only for supervisors to use'], a:1,
     e:'The operator pulls the cord, a timer starts and the line keeps moving while a team leader comes to help. If no one arrives in time, the line stops. Defects get fixed in the process instead of at the end of the line, and problems have to be solved for good, because Toyota can’t keep stopping the line.'},
    {t:'tf', q:'The NUMMI joint venture showed that GM’s quality problems came mainly from a lazy, undisciplined workforce.',
     o:['True','False'], a:1,
     e:'At NUMMI, most of the same “troublesome” GM workers were rehired and trained in the Toyota Production System. The plant soon matched Japanese defect levels and became GM’s best-performing plant. The problem was the mass production system, not the people.'},
    {t:'blank', q:'The Toyota Way names two things that make Toyota special: respect for people and ________.',
     o:['Vertical integration','Mass production','Continuous improvement','Lifetime employment'], a:2,
     e:'The lecturer stresses that respect for people isn’t about feeling good. It’s practical: the people closest to the process are the only ones who really understand its many failures. Continuous improvement is how Toyota helps them remove the problems they find.'}
  ]}},
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
    {id:'jit.video360.lean-production-run', step:9, verb:'experience', type:'video360', title:'Lean Production Run', src:'360° video with students · YouTube', url:'https://www.youtube.com/watch?v=OlPsvqmmc_A'}
  ]},
  {k:'ci', n:'05', name:'Continuous Improvement', role:'Kaizen · Core of the house', items:[
    {id:'ci.lecture.seven-wastes', step:1, verb:'learn',   type:'lecture', title:'Seven Wastes', src:'Video lecture · YouTube', url:'https://youtu.be/gJibxrRP3xc'},
    {id:'ci.lecture.continuous-improvement-system', step:2, verb:'learn',   type:'lecture', title:'Continuous Improvement System', src:'Video lecture · YouTube', url:'https://youtu.be/dXPb_cVIqZI'},
    {id:'ci.lecture.leadership', step:3, verb:'learn',   type:'lecture', title:'Leadership', src:'Video lecture · YouTube', url:'https://youtu.be/Hy6FQlziOVI'},
    {id:'ci.reading.continuous-improvement', step:4, verb:'explore', type:'reading', title:'Continuous Improvement', src:'Reading · kaizen.com', url:'https://kaizen.com/insights/continuous-improvement-operational-excellence/'},
    {id:'ci.video360.kaizen-production-run', step:5, verb:'experience', type:'video360', title:'Kaizen Production Run', src:'360° video with students · YouTube', url:'https://www.youtube.com/watch?v=BlooJxLysDA'}
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
// every linked resource in the five Lean House elements (except items marked optional:true), plus each module quiz
var REQUIRED = []; SEQ.forEach(function(k){ (BYK[k].items||[]).forEach(function(it){ if(it.url && it.id && !it.optional) REQUIRED.push(it.id); }); if(BYK[k].quiz) REQUIRED.push(BYK[k].quiz.id); });
var SQ = [['S','SAFETY'],['Q','QUALITY'],['D','DELIVERY'],['C','COST'],['M','MORALE']];
return {TYPES:TYPES, VERBS:VERBS, M:M, BYK:BYK, SEQ:SEQ, SQ:SQ, REQUIRED:REQUIRED, esc:esc, icon:icon, ext:ext, isLaunch:isLaunch};
})();
