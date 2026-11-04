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
  ],
  quiz:{id:'std.quiz', pass:8, q:[
    {t:'mc', q:'Taiichi Ohno said, “Where there is no standard, there can be no improvement.” What does the lecturer say Ohno really meant?',
     o:['Every operation needs a written work instruction posted at the station','Without a consistent standard there is no “control group,” so you can’t test a change and trust the result','Standards should be rewritten every time someone finds a better method','Only management can make improvements'], a:1,
     e:'A valid experiment needs a control group. In a factory, the standard process plays that role. If people do the job differently from shift to shift or station to station, you can’t tell whether a change actually worked or whether the result was just random variation.'},
    {t:'blank', q:'Plan-Do-Check-Act (PDCA), the structured improvement cycle that follows the scientific method, is also known as the ________ cycle.',
     o:['Ohno','Deming','Ford','Shingo'], a:1,
     e:'W. Edwards Deming, a famous statistician and management theorist, helped Japanese industry after World War II and developed PDCA. It lines up with the scientific method:',
     l:['Plan: form a hypothesis','Do: test it with an experiment','Check: analyze the data and draw conclusions','Act: respond to what you found']},
    {t:'tf', q:'If an operator finds a faster or higher-quality way to do the job, they should start using it right away, even if it differs from the standard work.',
     o:['True','False'], a:1,
     e:'The lecturer says it’s better for the operator to follow the standard as written, even a weaker one. A new idea may not actually be better, and if everyone changes the method on their own, you lose control of the system. The right path is to suggest the idea. The organization then evaluates it, updates the standard and trains operators on every shift.'},
    {t:'mc', q:'In the McDonald’s “tennis court” scene from The Founder, the team chalks out the kitchen and runs the staff through pretend orders over and over. What does the lecturer want you to take from it?',
     o:['Fast food doesn’t need standards','Kitchen layout matters more than training','With a well-defined, disciplined standard, you can experiment with PDCA cycles and improve the system','Improvement should be left to individual workers'], a:2,
     e:'McDonald’s already had a highly detailed standard, down to how people moved in the kitchen. That let them try a layout, check the outcome, adjust and repeat until it was “a symphony of efficiency.” The Smashburger example is the contrast: a weak standard full of variation (seasoning amounts, angles, missing tools), which makes real experiments impossible.'},
    {t:'mc', q:'According to the lecture, what happens when you try to improve a system that has no standards?',
     o:['Improvement happens faster because people are free to innovate','Any improvement will only be random, and you can’t tell what actually caused it','Variation goes down on its own','Results are just as reliable, only slower to measure'], a:1,
     e:'Without standards, a good result might come from your change or from some other source of variation, and the same goes for a bad result. There’s no control group, so it isn’t really an experiment. A disciplined standard removes the “wild variation” caused by people doing the job however they like and leaves only the process’s true variation.'},
    {t:'tf', q:'5S is mainly a housekeeping system for keeping the workplace clean and neat.',
     o:['True','False'], a:1,
     e:'The lecturer stresses this point twice: 5S is not a housekeeping system. Its purpose is to standardize the facility beyond the workstation and create a visual management system that makes any deviation from the standard obvious, so it gets corrected right away. A clean workplace is a side benefit.'},
    {t:'mc', q:'What is the correct order for implementing 5S?',
     o:['Shine → Sort → Set in order → Sustain → Standardize','Sort → Set in order → Shine → Standardize → Sustain','Set in order → Sort → Standardize → Shine → Sustain','Sort → Shine → Set in order → Sustain → Standardize'], a:1,
     e:'', ol:true,
     l:['Sort: remove what isn’t needed.','Set in order: give everything a designated, marked location (footprints, labels, shadow boards).','Shine: deep-clean so deviations stand out.','Standardize: document the rules, metrics and maintenance plans.','Sustain: keep it going through goals, measurement and leadership.']},
    {t:'mc', q:'During the Sort step, what does a yellow tag mean?',
     o:['The item is not needed and must be permanently removed','The item is used every cycle at the workstation','The item is needed, but not every cycle, so it belongs in a secondary location','The item is damaged and needs repair'], a:2,
     e:'Red tags mark items that aren’t needed and get permanently removed. Yellow tags mark items that are needed but not every cycle, like a calibration kit used once a month, so they move out of the workstation to a secondary spot. Green tags (optional) mark items used every cycle, so anything left without a tag clearly hasn’t been reviewed yet.'},
    {t:'blank', q:'In the Shine step, cleaning equipment and machinery is the first step in ________, because oil leaks and other problems become easy to spot.',
     o:['Kanban','Total productive maintenance (TPM)','Value stream mapping','Single-minute exchange of die'], a:1,
     e:'A spotless machine shows a deviation like an oil leak right away. The lecturer’s Continental Motors story makes the point: he wanted to replace a filthy cylinder-honing machine, and the CEO asked why they didn’t just clean it up and maintain it. After a deep clean, a new coat of paint, sight glasses for oil and maintenance instructions, the machine was like new.'},
    {t:'mc', q:'Sustain is often called the hardest part of 5S. According to the lecturer, what does it really depend on?',
     o:['Buying better storage and labeling equipment','Hiring more careful employees','Strong leadership: never walking by a deviation, especially in the first couple of months','Doing a full 5S audit only once a year'], a:2,
     e:'The lecturer’s “good sheep” idea is that it’s natural for people to drift from a standard, so it’s never the people’s fault. Sustaining 5S takes leadership that treats every deviation, even a trash can outside its square, as a teaching moment. About two months of intense leadership after implementation usually makes the system run itself. Without it, the system falls apart and is very hard to restart.'}
  ]}},
  {k:'jidoka', n:'03', name:'Jidoka', role:'Pillar', hide:['experience'], items:[
    {id:'jidoka.lecture.jidoka', step:1, verb:'learn',   type:'lecture', title:'Jidoka', src:'Video lecture · YouTube', url:'https://youtu.be/3QxSfRsfVeM?si=gDBQsAAIxs1qQs_6'},
    {id:'jidoka.reading.jidoka', step:2, verb:'explore', type:'reading', title:'Jidoka', src:'Reading · kaizen.com', url:'https://kaizen.com/insights/jidoka-automation-human-touch/'}
  ], empty:{apply:'Coming in Spring 2027'},
  quiz:{id:'jidoka.quiz', pass:8, q:[
    {t:'mc', q:'What is the difference between error proofing and mistake proofing?',
     o:['They mean the same thing','Error proofing makes the defect impossible to make; mistake proofing lets the defect happen but exposes it in the station','Error proofing uses inspectors; mistake proofing uses machines','Mistake proofing makes the defect impossible; error proofing only warns the operator'], a:1,
     e:'Error proofing redesigns the product or process so the failure can never happen again. Mistake proofing doesn’t stop the defect from being made, but it makes the defect obvious in the station where it happened, so it isn’t passed forward. Both count as jidoka. Error proofing is the higher level.'},
    {t:'blank', q:'The lecturer’s plant manager, Bob Bowers, would ask, “Why did the defect occur?” The only answer he accepted was: “Because ________.”',
     o:['The operator wasn’t careful','It can','The work instruction was unclear','The machine was old'], a:1,
     e:'If a defect is possible, it will eventually happen. The answer isn’t to tell operators to “be careful.” It’s to change the product or process so the defect can’t happen, or so it shows itself right away. As the lecture puts it, you wouldn’t run a surgery on “please be careful.”'},
    {t:'mc', q:'Which list puts quality control methods in order from most to least effective?',
     o:['Detection → Procedural → Mistake proofing → Error proofing','Error proofing → Mistake proofing → Detection → Procedural','Mistake proofing → Error proofing → Procedural → Detection','Procedural → Detection → Error proofing → Mistake proofing'], a:1,
     e:'', l:['Error proofing and mistake proofing are jidoka: quality is controlled in the station.','Detection, such as inspection (manual or automatic), happens after the failure, so many defective units may already be in the system.','Procedural control (standard work instructions) is the weakest, though it’s still necessary for a consistent process.']},
    {t:'mc', q:'On a Continental Motors engine, the oil sump could be installed backwards. Engineering added a pin that physically blocks it from going on the wrong way. What kind of control is this?',
     o:['Mistake proofing: warning','Detection','Error proofing through product design','Procedural'], a:2,
     e:'The pin makes it impossible to install the sump backwards, so the defect can never happen again. That’s error proofing, done by changing the product’s design. The lecture’s bearing example is error proofing too, but there the process was changed (a plate on the chute) and the part wasn’t.'},
    {t:'blank', q:'Sakichi Toyoda’s 1926 automatic loom shut itself down the moment a thread broke. This is an example of mistake proofing at the ________ level.',
     o:['Warning','Operational','Control','Procedural'], a:2,
     e:'Control-level mistake proofing automatically stops the operation when a defect happens. The defect is still made, but it’s caught and fixed in the station instead of passed forward. The lecturer says this idea has been in Toyota’s “DNA” since the family made fabric, not cars.'},
    {t:'mc', q:'A torque tool reports each reading to a screen, and the screen turns red if the torque is out of spec. The operator could still ignore it and pass the part forward. What kind of control is this?',
     o:['Error proofing','Mistake proofing: control','Mistake proofing: warning','Detection'], a:2,
     e:'The red screen clearly alerts the operator, but nothing stops the part from moving on, so it’s a warning. To make it a control, the fixture would keep the part locked in place until it read the correct torque.'},
    {t:'mc', q:'When a vehicle enters a station, lights show the operator exactly which bins to pick from, because some parts look alike but differ by engine size or options. What kind of mistake proofing is this?',
     o:['Control','Warning','Operational','Error proofing'], a:2,
     e:'Operational mistake proofing helps the operator do the job right, here by taking the “which part?” decision away from them. The lecturer stresses that people will always make mistakes, so engineers and managers must design processes that don’t depend on the operator choosing correctly.'},
    {t:'tf', q:'A light beam that detects a missing oil pan at the station where the engine is joined to the body, and then shuts down the line, is an example of jidoka.',
     o:['True','False'], a:1,
     e:'This is automated detection, not jidoka, because the oil pan was left off in an earlier zone and the defect traveled downstream before it was caught. It does protect the customer, but other defective units may already be in the system. The goal is to control the defect back at the station where the part is installed.'},
    {t:'tf', q:'Visual inspection by people is a reliable form of quality control, because the human mind is very good at making sense of what it sees.',
     o:['True','False'], a:1,
     e:'The scrambled-words paragraph shows that the brain sees what it expects to see. That’s useful in everyday life but bad for inspection, because people overlook defects. The lecturer calls inspection a weak form of control and uses the Boeing door incident as an example of relying on people for something too critical.'},
    {t:'mc', q:'When does an organization have the best opportunity to error proof a product or process?',
     o:['After customers start reporting defects','During the earliest stages of development, before production, mainly through engineering','Once the product is in full production, through manufacturing fixes','At final inspection'], a:1,
     e:'Engineering has the most power to design defects out before launch. Once a product is in production, changes get much harder, and teams have to rely on manufacturing fixes. That’s why companies use tools like DFMEA and PFMEA, with risk priority numbers, to decide where to focus before production starts.'}
  ]}},
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
  ],
  quiz:{id:'jit.quiz', pass:8, q:[
    {t:'mc', q:'What is takt time?',
     o:['The time it takes an operator to finish all their work elements','The rate at which the customer pulls product from the facility','The time it takes one part to travel through the entire value stream','The time between the last good part and the first good part during a changeover'], a:1,
     e:'Takt time represents customer demand. Cycle time (A) is how long an operator takes to complete their work, and it’s usually faster than takt because companies try to run as fast as they can. Lead time (C) is how long one part takes to flow through all the inventory to the truck. Option D is the definition of changeover time.'},
    {t:'tf', q:'In a lean production culture, you should run cycle times as fast as possible, well beyond takt time, because faster production means more profit.',
     o:['True','False'], a:1,
     e:'“Faster is cheaper” is the mass production mindset, where managers are rewarded for efficiency even when nobody ordered the parts. Producing faster than demand fills the system with inventory and stretches lead time. Lean does the opposite: slow cycle time toward takt time, build only what the customer pulls, and remove waste.'},
    {t:'mc', q:'There are 7,000 units of work-in-process between stamping and Weld 1. The weld operation’s cycle time is 39 seconds, and customer demand is 920 units per day. What is the lead time for this inventory?',
     o:['About 4.9 days (7,000 × the 39-second cycle time)','About 7.6 days (7,000 ÷ 920 units per day)','About 0.13 days (920 ÷ 7,000)','39 seconds, the cycle time'], a:1,
     e:'Lead time is based on takt time, the rate at which the customer actually takes product, not on how fast the machines run. Running faster than takt just moves parts from one pile to the next. Inventory only goes down at the rate the customer removes it. In the lecture’s full example, total lead time was 23.6 days, compared with a total cycle time of only 188 seconds.'},
    {t:'blank', q:'When an MRP computer schedule tells each process what to build, instead of the next process downstream signaling what it needs, the factory is running a ________ system.',
     o:['Pull','Push','Kanban','One-piece-flow'], a:1,
     e:'With MRP, each process works like an island, following a forecast schedule that starts going wrong the moment it reaches the floor. Orders change, machines break down, people are absent and inventory counts are off, which is why plants employ expediters. In a pull system, the customer’s withdrawal sets off a chain reaction of replenishment back through the supply chain.'},
    {t:'mc', q:'According to Taiichi Ohno, which of the seven wastes is the most significant?',
     o:['Motion','Waiting','Overproduction','Transportation'], a:2,
     e:'Overproduction creates many other wastes:',
     l:['batches that need storage space','people and equipment to handle them','quality problems that mean sorting, rework or scrap','extra operators and equipment to run faster than demand'],
     e2:'All of that lengthens lead time and makes it harder to respond to the customer.'},
    {t:'mc', q:'In SMED, what are “internal” elements of a changeover, and what is the key improvement step?',
     o:['Steps done while the machine is running; eliminate them completely','Steps that can only be done while the machine is stopped; convert as many as possible to external so they’re done before shutdown','Steps done by outside contractors; bring them in-house','Steps related to paperwork; automate them'], a:1,
     e:'SMED’s four steps:', ol:true,
     l:['Identify every element of the current setup.','Separate internal elements (machine stopped) from external elements (machine running).','Convert internal elements to external.','Optimize what’s left, especially the internal elements.'],
     e2:'It’s how an Indy pit crew works: everything possible is ready before the car stops. The goal is a changeover under 10 minutes.'},
    {t:'tf', q:'After cutting changeover time with SMED, a plant should use the freed-up time to run larger batches and boost its performance numbers.',
     o:['True','False'], a:1,
     e:'This is a common mistake. Companies take the savings as cost per unit, building more WIP and inventory, which increases lead time and goes the wrong way. The real purpose of SMED is to change over more often (moving “every part every…” closer to every part every one) so batches shrink, inventory drops and lead time goes down.'},
    {t:'mc', q:'What is a key feature of a subassembly cell, compared with a manufacturing cell?',
     o:['The operator only loads, unloads and moves parts while machines do the work','It is self-balancing through operator handoff points and can flex with volume by adding or removing operators','It requires large WIP buffers between stations','Every station must have exactly the same cycle time'], a:1,
     e:'In a manufacturing cell, the machines add the value and the operator just moves parts from station to station. In a subassembly cell, operators add value and hand work off to each other. The handoff points balance the cell even when station times differ, and the cell can run with 5, 4, 3, 2 or 1 operators as demand changes. It also supports teamwork, cross-training and ergonomics.'},
    {t:'tf', q:'When demand drops, the best response for a vehicle assembly plant is to slow down the assembly line.',
     o:['True','False'], a:1,
     e:'An assembly line can’t flex with demand. When Chrysler slowed a line, about 200 jobs had to be redistributed and the operation fell apart. Instead, plants keep line speed steady for the life of the product. They boost demand with incentives (cash back, 0% financing) or adjust with down weeks, shift changes and overtime.'},
    {t:'blank', q:'In a future state value stream map, the customer schedule is sent to only one point in the system, usually near the end of the line. This is called the ________ process.',
     o:['Bottleneck','Pacemaker','Supermarket','Expediter'], a:1,
     e:'Scheduling only the pacemaker replaces MRP schedules sent to every department. At the pacemaker:',
     l:['heijunka levels both the volume (paced to takt) and the mix (matching how customers buy)','kanban cards send pull signals back upstream','supermarkets keep the pull going where one-piece flow isn’t possible yet, and continuous improvement shrinks them over time']}
  ]}},
  {k:'ci', n:'05', name:'Continuous Improvement', role:'Kaizen · Core of the house', items:[
    {id:'ci.lecture.seven-wastes', step:1, verb:'learn',   type:'lecture', title:'Seven Wastes', src:'Video lecture · YouTube', url:'https://youtu.be/gJibxrRP3xc'},
    {id:'ci.lecture.continuous-improvement-system', step:2, verb:'learn',   type:'lecture', title:'Continuous Improvement System', src:'Video lecture · YouTube', url:'https://youtu.be/dXPb_cVIqZI'},
    {id:'ci.lecture.leadership', step:3, verb:'learn',   type:'lecture', title:'Leadership', src:'Video lecture · YouTube', url:'https://youtu.be/Hy6FQlziOVI'},
    {id:'ci.reading.continuous-improvement', step:4, verb:'explore', type:'reading', title:'Continuous Improvement', src:'Reading · kaizen.com', url:'https://kaizen.com/insights/continuous-improvement-operational-excellence/'},
    {id:'ci.video360.kaizen-production-run', step:5, verb:'experience', type:'video360', title:'Kaizen Production Run', src:'360° video with students · YouTube', url:'https://www.youtube.com/watch?v=BlooJxLysDA'}
  ], empty:{apply:'Coming in Spring 2027'},
  quiz:{id:'ci.quiz', pass:8, q:[
    {t:'mc', q:'The name “TIM WOOD” is a memory aid for the seven wastes. Which list matches it?',
     o:['Time, Inventory, Material, Waiting, Output, Overtime, Delays','Transportation, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects','Transportation, Inspection, Maintenance, Waiting, Overtime, Organization, Downtime','Tools, Inventory, Motion, Workload, Overproduction, Operators, Defects'], a:1,
     e:'Taiichi Ohno created seven “buckets” that every non-value-added activity can be sorted into. None of these activities positively transforms the product, and the customer isn’t willing to pay for them. Once you can name a waste, you can go after it: eliminate it if possible, or minimize it if you can’t.'},
    {t:'mc', q:'Continental Motors polished the paint on its engines and re-measured every part it received from suppliers. The customer said they didn’t need either one. Which waste is this?',
     o:['Overproduction','Motion','Overprocessing','Defects'], a:2,
     e:'Overprocessing means doing more to a product than the customer needs. Other examples from the lecture:',
     l:['buying equipment that is more precise or faster than necessary','“bulletproofing” a design','adding features nobody asked for, like seats that heat themselves automatically','unneeded approval steps','quality checks that should be built into the process']},
    {t:'tf', q:'Shigeo Shingo said that the most dangerous kind of waste is the waste we don’t recognize.',
     o:['True','False'], a:0,
     e:'You can’t remove a waste you can’t see. That’s why excess inventory is so harmful. In the ship analogy, high inventory is water that hides the “rocks”: long setups, unreliable machines, supplier problems, rejects. The company floats along without seeing them. The rocks have to be removed before the water level (inventory) can safely come down.'},
    {t:'mc', q:'In the Undercover Boss clips, Waste Management’s CEO works alongside a few employees and fixes their problems. Why does the lecturer call this a poor approach to continuous improvement?',
     o:['The CEO should have stayed in his office and used data','The company had about 45,000 employees, but only a handful got their problems solved; there was no structured system connecting all workers to problem solving','The employees’ problems weren’t real','Continuous improvement should only be done by engineers'], a:1,
     e:'Nearly every employee the CEO met had problems with their job, which is true in most operations. Fixing a few of them left about 44,995 people’s problems untouched. After he went back to the office, nothing had changed, because there was no standardized system to collect and solve problems from the people doing the work.'},
    {t:'mc', q:'On the continuous improvement board, what is acceptable in the “Responsibility” column?',
     o:['A department name, such as “Maintenance”','“TBD” until someone volunteers','Only a single person’s name','The supervisor’s name for every issue'], a:2,
     e:'If a department is responsible, no one really is. One named person must stand at the board at each review and speak to the issue. The lecture backs this up with a former Chrysler manager who credited his success to a lesson from plant manager Bob Bowers: assign one person to “move each needle,” and things get done.'},
    {t:'tf', q:'Once a target date is set for an issue on the board, the responsible person can push it back if they need more time.',
     o:['True','False'], a:1,
     e:'Once set, a target date can never change. If dates could be moved, people would quietly reset late items to yellow before the plant manager’s review. The other rules:',
     l:['the team member who raised the issue negotiates the date and is the only one who can close it','if no date is agreed, the item turns red right away','only the plant site leader can remove an issue without the team’s agreement']},
    {t:'blank', q:'Kaoru Ishikawa said it takes about ________ of small improvements (kaizens) before you see a significant impact on an operation.',
     o:['Six months','One year','Three years','Ten years'], a:2,
     e:'Like small, regular deposits in a 401(k), many small improvements build up until the curve turns exponential. Three years after Chrysler’s Sterling Heights plant started this system, it had its first perfect build in 40 years: a full 8-hour shift without one lost unit. At Continental Motors, labor and revenue began to separate at the same three-year mark.'},
    {t:'blank', q:'The lecturer’s leadership formula is: Empathy + Trust + ________ = Respect for People.',
     o:['Pride','Confidence','Humility','Authority'], a:2,
     e:'Respect for people is one of the two pillars of the Toyota Way, and the lecturer argues you can’t lead without it. He calls humility the key ingredient. Pride and arrogance get in the way: as Tolstoy put it, an arrogant person thinks they’re already perfect and so stops getting better. His advice: if you know you aren’t humble, don’t take a leadership position.'},
    {t:'mc', q:'Auburn and the University of North Carolina had the same mask policy for basketball games during COVID, in the same region at the same time. At Auburn almost nobody wore a mask; at UNC almost everyone did. What made the difference?',
     o:['The fans’ personal beliefs','The size of the arena','Leadership: UNC actively enforced the standard and reminded fans to follow it','Ticket prices'], a:2,
     e:'It’s the same standard with opposite results, just like two plants with identical work instructions where one follows them and the other doesn’t. People are “good sheep” and naturally drift from a standard unless leaders guide them back. Leaders also have to follow the standard themselves. The lecturer’s example is a football coach who didn’t wear a mask at a game, showing he didn’t care about the rule.'},
    {t:'mc', q:'According to W. Edwards Deming, and reflected in how Ohno treated his managers, what is the main job of leadership?',
     o:['To supervise workers closely and correct their mistakes','To help people do a better job','To set targets and cost-cutting goals from the office','To get “buy-in” from employees for management’s ideas'], a:1,
     e:'Deming said supervision should be replaced by leadership, and that leadership’s job is to help people. Ohno was very tough on managers but not on operators. He expected managers to understand why things fail and get people what they need. Operators are involved because they’re the only ones who can “hear the process,” not as a goodwill gesture or to win buy-in.'}
  ]}},
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
