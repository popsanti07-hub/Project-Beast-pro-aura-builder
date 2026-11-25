const $=id=>document.getElementById(id);
const KEY='beastModeDataV1';
const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const groups=[
{id:'1',title:'1 · Morning warm-up & jogging',priority:'MANDATORY',tasks:[['Warm-up & brushing','3:45 AM'],['Lemon water','Morning'],['Stretching – all 30 joints','4:00 AM'],['200 jumping jacks','5 minutes'],['Jogging','20 minutes']]},
{id:'2',title:'2 · Upper-body workout',priority:'OPTIONAL',tasks:[['Push-ups','4 × 30'],['Pull-ups','3 × 12']]},
{id:'3',title:'3 · Core workout',priority:'OPTIONAL',tasks:[['Chin-ups','3 × 12'],['Leg raises','3 × 30'],['Side raises','3 × 30']]},
{id:'4',title:'4 · Leg workout',priority:'OPTIONAL',tasks:[['Leg workouts','20 minutes']]},
{id:'5',title:'5 · Plank & meditation',priority:'MANDATORY',tasks:[['Plank','1 minute'],['Meditation','12 minutes']]}
];
const events=[['sprint','100m Sprint','Acceleration and speed mechanics'],['long','Long jump','Approach, take-off and landing'],['high','High jump','Approach, clearance and safe landing'],['1500','1500m Run','Pacing and aerobic endurance']];
const defaultHabits=[{id:'water',name:'Water target',desc:'Reach your daily hydration target',icon:'💧',type:'water',target:3},{id:'tobacco',name:'No tobacco',desc:'Tobacco-free day',icon:'🚭',type:'boolean'},{id:'alcohol',name:'No alcohol',desc:'Alcohol-free day',icon:'🚫',type:'boolean'},{id:'reading',name:'Reading',desc:'Meet your reading target',icon:'📖',type:'minutes',target:30},{id:'exercise',name:'Daily movement',desc:'Intentional exercise or walk',icon:'🏃',type:'boolean'},{id:'sleep',name:'Sleep routine',desc:'Aim for a consistent sleep schedule',icon:'🌙',type:'boolean'},{id:'meditation',name:'Meditation',desc:'Mindfulness or breathing',icon:'🧘',type:'boolean'},{id:'study',name:'Study / learning',desc:'Focused learning session',icon:'🎓',type:'minutes',target:60}];
const habitDefs=()=>Array.isArray(data.habitDefs)?data.habitDefs:structuredClone(defaultHabits);
const activeHabits=()=>habitDefs().filter(h=>h.active!==false);
const activeHabitsForDate=date=>habitDefs().filter(h=>(!h.createdAt||h.createdAt<=date)&&(!h.archivedAt||date<=h.archivedAt));
const recoveryDefaults={startDate:'',boundaries:{porn:true,masturbation:false},logs:{},urgeEvents:[],restarts:[],unlocked:[],weeklyReviews:{},started:false};
const defaults={recovery:structuredClone(recoveryDefaults),days:{},records:[],settings:{weekStart:'1',examDate:'',waterTarget:3,readingTarget:30,studyTarget:60},habitDefs:structuredClone(defaultHabits),lifeCells:0,rewardClaims:[],ledger:[]};
let data=load(),currentDate=todayISO();
function load(){try{const old=JSON.parse(localStorage.getItem(KEY));return old?{...defaults,...old,recovery:{...structuredClone(recoveryDefaults),...(old.recovery||{}),boundaries:{...recoveryDefaults.boundaries,...(old.recovery?.boundaries||{})},logs:old.recovery?.logs||{},urgeEvents:old.recovery?.urgeEvents||[],restarts:old.recovery?.restarts||[],unlocked:old.recovery?.unlocked||[],weeklyReviews:old.recovery?.weeklyReviews||{}},settings:{...defaults.settings,...old.settings},habitDefs:Array.isArray(old.habitDefs)?old.habitDefs:structuredClone(defaultHabits),days:old.days||{},records:old.records||[],rewardClaims:old.rewardClaims||[],ledger:old.ledger||[],lifeCells:Number(old.lifeCells)||0}:structuredClone(defaults)}catch(e){return structuredClone(defaults)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function day(date=currentDate){if(!data.days[date])data.days[date]={tasks:{},events:{},reflection:{},habits:{waterMl:0}};let x=data.days[date];x.tasks=x.tasks||{};x.events=x.events||{};x.reflection=x.reflection||{};x.habits=x.habits||{waterMl:0};return x}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function claim(id,amount,label,date=currentDate){if(data.rewardClaims.includes(id))return;data.rewardClaims.push(id);data.lifeCells+=amount;data.ledger.unshift({date,amount,label,claimId:id});}
function habitValueDone(habit,date){let h=(data.days[date]||{habits:{}}).habits||{};if(habit.type==='water')return Number(h.waterMl||0)>=Number(data.settings.waterTarget||habit.target||3)*1000;if(habit.type==='minutes'){let target=habit.id==='reading'?data.settings.readingTarget:habit.id==='study'?data.settings.studyTarget:habit.target;return Number(h[habit.id+'Minutes']||0)>=Number(target||habit.target||1)}return !!h[habit.id]}
function completedHabits(date){return activeHabitsForDate(date).filter(h=>habitValueDone(h,date)).length}
function habitCount(date=currentDate){return completedHabits(date)}
function checkHabitRewards(date=currentDate){
 const dates=new Set([...Object.keys(data.days),date]);
 // Reconcile previously issued habit rewards against the current truth. A reversed action reverses its reward.
 for(const d of dates){
  const defs=activeHabitsForDate(d),desired=new Map();
  defs.forEach(h=>{if(habitValueDone(h,d))desired.set(`${d}:habit:${h.id}`,{amount:10,label:`${h.name} completed`,date:d})});
  if(defs.length&&defs.every(h=>habitValueDone(h,d)))desired.set(`${d}:daily-bonus`,{amount:50,label:'All daily habits completed',date:d});
  const ws=startOfWeek(d,data.settings.weekStart||'1'),week=[];for(let i=0;i<7;i++){let dt=new Date(ws+'T12:00:00');dt.setDate(dt.getDate()+i);week.push(iso(dt))}
  if(week.every(dayDate=>data.rewardClaims.includes(`${dayDate}:daily-bonus`)|| (dayDate===d&&desired.has(`${d}:daily-bonus`))))desired.set(`${ws}:weekly-bonus`,{amount:150,label:'7-day consistency bonus',date:d});
  // Only reconcile reward IDs for habits that are currently active; archived habit history is retained.
  const activeIds=new Set(defs.map(h=>`${d}:habit:${h.id}`));
  for(const id of [...data.rewardClaims]){
   const isHabit=id.startsWith(`${d}:habit:`),isDaily=id===`${d}:daily-bonus`,isWeekly=id===`${ws}:weekly-bonus`;
   if(!(isHabit||isDaily||isWeekly))continue;
   if(isHabit&&!activeIds.has(id))continue;
   if(!desired.has(id)){
    const amount=isDaily?50:isWeekly?150:10;
    let idx=data.ledger.findIndex(x=>x.claimId===id);
    if(idx<0){const expected=isDaily?'All daily habits completed':isWeekly?'7-day consistency bonus':'completed';idx=data.ledger.findIndex(x=>x.date===d&&Number(x.amount)===amount&&String(x.label||'').toLowerCase().includes(expected.toLowerCase()))}
    if(idx>=0){data.lifeCells-=Number(data.ledger[idx].amount)||0;data.ledger.splice(idx,1)}else data.lifeCells-=amount
    data.rewardClaims=data.rewardClaims.filter(x=>x!==id);
   }
  }
  desired.forEach((v,id)=>claim(id,v.amount,v.label,v.date));
 }
 data.lifeCells=Math.max(0,Number(data.lifeCells)||0);save();
}
function isHabitDone(id,date=currentDate){let h=habitDefs().find(x=>x.id===id);return h?habitValueDone(h,date):false}
function streak(){let n=0,d=new Date(currentDate+'T12:00:00');for(let i=0;i<500;i++){let s=iso(d),required=activeHabitsForDate(s).length;if(required>0&&habitCount(s)===required)n++;else if(i===0&&s===todayISO()){d.setDate(d.getDate()-1);continue}else break;d.setDate(d.getDate()-1)}return n}
function levelInfo(){let levels=['Beginner','Disciplined','Consistent','Warrior','Beast Mode','Legend'];let thresholds=[0,500,1500,3000,5000,8000];let n=0;for(let i=0;i<thresholds.length;i++)if(data.lifeCells>=thresholds[i])n=i;let next=thresholds[n+1]??thresholds[n]+3000;return {name:levels[n],level:n+1,base:thresholds[n],next,progress:Math.min(100,Math.round((data.lifeCells-thresholds[n])/(next-thresholds[n])*100))}}
function startOfWeek(date,ws){let d=new Date(date+'T12:00:00');d.setDate(d.getDate()-(d.getDay()-Number(ws)+7)%7);return iso(d)}
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function pct(n,d){return d?Math.round(n/d*100):0}
function renderHabits(){
 let h=day().habits,water=Number(h.waterMl||0),target=Number(data.settings.waterTarget||3)*1000;
 $('waterValue').textContent=(water/1000).toFixed(2).replace(/\.?0+$/,'');$('waterTargetLabel').textContent='/ '+Number(data.settings.waterTarget||3)+' L';$('waterBar').style.width=Math.min(100,water/target*100)+'%';
 $('habitList').innerHTML=activeHabitsForDate(currentDate).map(item=>{let numeric=item.type==='minutes',val=Number(h[item.id+'Minutes']||0),goal=Number(item.id==='reading'?data.settings.readingTarget:item.id==='study'?data.settings.studyTarget:item.target||30),done=isHabitDone(item.id);return `<div class="habit-card ${done?'done':''}"><div class="habit-symbol">${esc(item.icon||'✓')}</div><div class="habit-copy"><b>${esc(item.name)}</b><small>${esc(item.desc||'')}</small>${numeric?`<div class="numeric-row"><input type="number" min="0" max="600" step="5" data-minutes="${esc(item.id)}" value="${val}" aria-label="${esc(item.name)} minutes"><span>/ ${goal} min</span></div>`:''}</div>${numeric||item.type==='water'?`<span class="status ${done?'yes':''}">${done?'✓':'…'}</span>`:`<label class="switch"><input type="checkbox" data-habit="${esc(item.id)}" ${done?'checked':''}><span></span></label>`}<div class="habit-actions"><button class="tiny-btn" data-edit-habit="${esc(item.id)}" aria-label="Edit ${esc(item.name)}">Edit</button>${item.id!=='water'?`<button class="tiny-btn" data-archive-habit="${esc(item.id)}" aria-label="Archive ${esc(item.name)}">Archive</button>${item.id.startsWith('custom_')?`<button class="tiny-btn danger-text" data-delete-habit="${esc(item.id)}" aria-label="Delete ${esc(item.name)}">Delete</button>`:''}`:''}</div></div>`}).join('');
 let count=habitCount(),total=activeHabitsForDate(currentDate).length;$('habitCount').textContent=count+' / '+total;$('habitBar').style.width=(total?count/total*100:0)+'%';$('habitMessage').textContent=count===total&&total?'All daily habits complete. Excellent discipline.':`${total-count} habits remaining. Keep building consistency.`;
 document.querySelectorAll('[data-habit]').forEach(el=>el.onchange=()=>{day().habits[el.dataset.habit]=el.checked;checkHabitRewards();renderAll()});
 document.querySelectorAll('[data-minutes]').forEach(el=>el.onchange=()=>{day().habits[el.dataset.minutes+'Minutes']=Math.max(0,Number(el.value)||0);checkHabitRewards();renderAll()});
 document.querySelectorAll('[data-edit-habit]').forEach(el=>el.onclick=()=>editHabit(el.dataset.editHabit));
 document.querySelectorAll('[data-archive-habit]').forEach(el=>el.onclick=()=>{let item=habitDefs().find(x=>x.id===el.dataset.archiveHabit);if(!item||!confirm(`Archive “${item.name}”? Past entries remain in your history.`))return;item.active=false;let archiveDate=new Date(todayISO()+'T12:00:00');archiveDate.setDate(archiveDate.getDate()-1);item.archivedAt=iso(archiveDate);save();checkHabitRewards();renderAll()});
 document.querySelectorAll('[data-delete-habit]').forEach(el=>el.onclick=()=>{let item=habitDefs().find(x=>x.id===el.dataset.deleteHabit);if(!item||!confirm(`Permanently remove “${item.name}” from your habit list? Existing daily records remain in your stored history.`))return;data.habitDefs=data.habitDefs.filter(x=>x.id!==item.id);save();checkHabitRewards();renderAll()});
}
function editHabit(id){let item=habitDefs().find(x=>x.id===id);if(!item)return;let name=prompt('Habit name',item.name);if(name===null)return;name=name.trim();if(!name)return alert('Habit name cannot be empty.');let desc=prompt('Short description',item.desc||'')??item.desc;let icon=prompt('Icon / emoji',item.icon||'✓')??item.icon;item.name=name;item.desc=desc;item.icon=icon;if(item.type==='minutes'&&item.id!=='reading'&&item.id!=='study'){let n=Number(prompt('Daily target in minutes',item.target||30));if(Number.isFinite(n)&&n>0)item.target=n}save();checkHabitRewards();renderAll()}
function addHabit(){let name=prompt('New habit name');if(name===null)return;name=name.trim();if(!name)return;let id='custom_'+Date.now().toString(36);let desc=prompt('Short description','Build this habit consistently')||'';let icon=prompt('Icon / emoji','⭐')||'⭐';let type=confirm('Use a minutes-based target? Choose Cancel for a simple checkbox habit.')?'minutes':'boolean';let item={id,name,desc,icon,type,active:true,createdAt:todayISO()};if(type==='minutes'){let target=Number(prompt('Daily target in minutes','30'));item.target=Number.isFinite(target)&&target>0?target:30}habitDefs().push(item);save();checkHabitRewards();renderAll()}
function renderWorkout(){
 $('workoutGroups').innerHTML=groups.map(g=>`<div class="group"><div class="group-title"><h3>${g.title}</h3><span class="pill ${g.priority==='MANDATORY'?'green':'amber'}">${g.priority}</span></div>${g.tasks.map((t,i)=>{let id=g.id+'-'+i,done=!!day().tasks[id];return `<label class="task ${done?'done':''}"><input type="checkbox" data-task="${id}" ${done?'checked':''}><span><b>${esc(t[0])}</b><small>${esc(t[1])}</small></span></label>`}).join('')}</div>`).join('');
 document.querySelectorAll('[data-task]').forEach(el=>el.onchange=()=>{day().tasks[el.dataset.task]=el.checked;save();renderHome();});
 $('petEvents').innerHTML=events.map(([id,name,desc])=>`<label class="event"><input type="checkbox" data-event="${id}" ${day().events[id]?'checked':''}><span><b>${name}</b><small>${desc}</small></span></label>`).join('');
 document.querySelectorAll('[data-event]').forEach(el=>el.onchange=()=>{day().events[el.dataset.event]=el.checked;save();renderHome();renderReports()});
 $('eventPoints').textContent=events.filter(([id])=>day().events[id]).length*10+' points';
}
function renderHome(){
 let count=habitCount(),total=activeHabitsForDate(currentDate).length,p=pct(count,total),li=levelInfo(),points=events.filter(([id])=>day().events[id]).length*10;
 $('todayLabel').textContent=new Date(currentDate+'T12:00:00').toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric',year:'numeric'});
 $('lifeCells').textContent=data.lifeCells.toLocaleString()+' LC';$('levelLabel').textContent=`Level ${li.level} · ${li.name}`;$('levelBar').style.width=li.progress+'%';$('levelProgress').textContent=`${Math.max(0,data.lifeCells-li.base)} / ${li.next-li.base} to next level`;
 $('dailyPct').textContent=p+'%';$('streakDays').textContent=streak();$('petPoints').textContent=points;$('completionText').textContent=`${count} / ${total} complete`;$('dailyBar').style.width=p+'%';$('missionHint').textContent=count===total?'Daily habits complete. Keep the momentum.':`${total-count} daily habits remaining. Progress, not perfection.`;
 $('homeHabits').innerHTML=activeHabitsForDate(currentDate).map(({id,name})=>[id,name]).map(([id,label])=>`<div class="mini-row"><span>${esc(label)}</span><b class="${isHabitDone(id)?'good':''}">${isHabitDone(id)?'DONE':'PENDING'}</b></div>`).join('');
}
function renderRewards(){
 let li=levelInfo();$('rewardBalance').textContent=data.lifeCells.toLocaleString()+' LC';$('rewardLevel').textContent=`Level ${li.level} · ${li.name} · ${li.progress}% to next level`;$('rewardBar').style.width=li.progress+'%';
 let days=[['7','7 fully completed days','150 LC'],['14','14 fully completed days','300 LC'],['30','30 tobacco-free days','500 LC'],['90','90 tobacco-free days','1,000 LC'],['180','180 tobacco-free days','2,000 LC'],['365','One year tobacco-free','Beast badge']];
 $('milestones').innerHTML=days.map(([n,label,reward])=>`<div class="milestone"><span class="medal">✦</span><div class="grow"><b>${label}</b><small>${n} days · ${reward}</small></div><span class="muted">${n==='7'&&data.rewardClaims.some(x=>x.endsWith(':weekly-bonus'))?'✓':'☆'}</span></div>`).join('');
 $('ledgerList').innerHTML=data.ledger.length?data.ledger.slice(0,30).map(x=>`<div class="history-item"><b>+${x.amount} LC</b> · ${esc(x.label)}<small>${esc(x.date)}</small></div>`).join(''):'<div class="empty">Your earned Life Cells will appear here.</div>';
}
function renderReports(){
 let now=new Date(currentDate+'T12:00:00'),ws=startOfWeek(currentDate,data.settings.weekStart||'1'),week=[],month=[];for(let i=0;i<7;i++){let d=new Date(ws+'T12:00:00');d.setDate(d.getDate()+i);week.push(iso(d))}for(let i=1;i<=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();i++)month.push(iso(new Date(now.getFullYear(),now.getMonth(),i,12)));
 const avg=dates=>{let elapsed=dates.filter(d=>d<=currentDate),total=elapsed.reduce((n,d)=>n+activeHabitsForDate(d).length,0),done=elapsed.reduce((n,d)=>n+habitCount(d),0);return {pct:pct(done,total),done,total}};
 let w=avg(week),m=avg(month);$('weekHabitPct').textContent=w.pct+'%';$('weekWorkout').textContent=week.reduce((n,d)=>n+Object.values(data.days[d]?.tasks||{}).filter(Boolean).length,0);$('weekLC').textContent=data.ledger.filter(x=>week.includes(x.date)).reduce((n,x)=>n+x.amount,0);
 $('monthHabitPct').textContent=m.pct+'%';$('monthPET').textContent=month.reduce((n,d)=>n+events.filter(([id])=>data.days[d]?.events?.[id]).length*10,0);$('monthDays').textContent=month.filter(d=>data.days[d]&&habitCount(d)>0).length;
 $('weekHabitBars').innerHTML=activeHabitsForDate(currentDate).map(({id,name})=>{let eligible=week.filter(d=>d<=currentDate&&activeHabitsForDate(d).some(h=>h.id===id)),n=eligible.filter(d=>isHabitDone(id,d)).length;return `<div class="bar-row"><span>${esc(name)}</span><span class="bar-bg"><i style="width:${eligible.length?n/eligible.length*100:0}%"></i></span><b>${n}/${eligible.length}</b></div>`}).join('');
 let dates=Object.keys(data.days).sort().reverse().slice(0,14);$('historyList').innerHTML=dates.length?dates.map(d=>`<div class="history-item"><b>${d}</b> · Habits ${habitCount(d)}/${activeHabitsForDate(d).length} · PET ${events.filter(([id])=>data.days[d].events?.[id]).length*10} pts</div>`).join(''):'<div class="empty">Your history appears here as you use the app.</div>';
}
function renderRecords(){$('recordsList').innerHTML=data.records.length?data.records.slice().reverse().map(r=>`<div class="history-item"><b>${esc(r.event)}</b> · ${esc(r.value)}<small>${esc(r.date)}${r.notes?' · '+esc(r.notes):''}</small></div>`).join(''):'<div class="empty">No performance records yet.</div>'}

const recoveryMilestones=[1,2,3,7,14,21,30,42,50,60,72,90,108,120,150,180,210,250,300,365];
const recoveryTitles={1:'First Spark',2:'Ignition',3:'Awakening',7:'First Evolution',14:'Warrior Flame',21:'Resilience Field',30:'Inner Shield',42:'Orbit Rings',50:'Power Surge',60:'Lightning Core',72:'Iron Will',90:'BEAST',108:'Ascension',120:'Overdrive',150:'Dominance',180:'Phoenix',210:'Transcendence',250:'Immortal Spirit',300:'Legend',365:'BEAST PRO'};
const recoveryThemes=[
['Foundation','Days 1–7','Notice triggers, shape the environment and build a simple daily routine.'],
['Control','Days 8–14','Practice delaying impulses and keeping your routines predictable.'],
['Resilience','Days 15–21','Use exercise, mindfulness and a planned response when urges appear.'],
['Identity','Days 22–30','Build a schedule and replace unhelpful patterns with meaningful activities.'],
['Mental Strength','Days 31–37','Prepare for boredom, loneliness and emotional triggers.'],
['Discipline','Days 38–44','Protect focus for study, work and physical training.'],
['Confidence','Days 45–51','Practice communication, posture and positive social interaction.'],
['Self-image','Days 52–58','Build self-care habits through grooming, fitness and clothing.'],
['Resilience II','Days 59–65','Identify high-risk situations and create prevention plans.'],
['Focus','Days 66–72','Set one meaningful goal and protect focused time.'],
['Connection','Days 73–79','Invest in friendships, family and healthy relationships.'],
['Independence','Days 80–86','Strengthen decisions that align with your values.'],
['Transformation','Days 87–90','Review your progress and design a sustainable maintenance plan.'],
['Maintenance','Days 91–365','Rotate themes: healthy sexuality, emotional regulation, relationships, long-term goals, resilience, leadership and independent discipline.']
];
function dateDiff(a,b){if(!a||!b)return 0;return Math.floor((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000)}
function recoveryDay(){let r=data.recovery;if(!r.started||!r.startDate)return 0;return Math.max(0,dateDiff(r.startDate,todayISO())+1)}
function auraXP(){return Object.values(data.recovery.logs).reduce((n,x)=>n+(Number(x.auraEarned)||0),0)}
function recoveryTier(d){if(d>=181)return 'Beast Pro';if(d>=91)return 'Beast';if(d>=43)return 'Elite';if(d>=15)return 'Warrior';return 'Beginner'}
function recoveryTheme(d){if(d<=90)return recoveryThemes[Math.max(0,Math.min(12,Math.ceil(d/7)-1))];return recoveryThemes[13]}
function unlockRecoveryMilestones(d){let r=data.recovery,changed=false;recoveryMilestones.filter(n=>n<=d&&!r.unlocked.includes(n)).forEach(n=>{r.unlocked.push(n);changed=true;let reward=n===365?500:n>=90?100:n>=30?50:20;claim(`recovery:${n}`,reward,`Recovery milestone · Day ${n}`,todayISO())});if(changed)save()}
function renderRecovery(){
 let r=data.recovery,d=recoveryDay(),tier=recoveryTier(d),xp=auraXP(),visual=$('auraVisual');if(r.started&&d>0)unlockRecoveryMilestones(d);
 $('auraScore').textContent=xp;$('recoveryDay').textContent=d;$('recoveryLevel').textContent=`${tier} · ${d>=181?'Days 181–365':d>=91?'Days 91–180':d>=43?'Days 43–90':d>=15?'Days 15–42':'Days 1–14'}`;
 $('recoveryBar').style.width=Math.min(100,d/90*100)+'%';
 let stage=d?([...recoveryMilestones].reverse().find(n=>n<=d)||1):0;
 $('auraStage').textContent=stage?`Day ${stage} · ${recoveryTitles[stage]}`:'Awaiting ignition';
 $('auraCaption').textContent=d?`${tier} evolution · accumulated growth stays with you`:'Your aura begins when you start. Every constructive action adds to your evolution.';
 visual.classList.toggle('level-blue',d>=14&&d<90);visual.classList.toggle('level-gold',d>=90);visual.classList.toggle('evolved',d>=3);visual.style.setProperty('--aura-scale',String(1+Math.min(xp,500)/1000));
 $('startRecovery').textContent=r.started?'Mission active · start date saved':'Start recovery mission';$('startRecovery').disabled=!!r.started;
 $('recoveryStartDate').value=r.startDate||todayISO();$('boundaryPorn').checked=!!r.boundaries.porn;$('boundaryMasturbation').checked=!!r.boundaries.masturbation;
 let log=r.logs[todayISO()]||{};['Porn','Masturbation','Exercise','Meditation','Learning','Sleep','Social'].forEach(k=>{let id='log'+k,field={Porn:'porn',Masturbation:'masturbation',Exercise:'exercise',Meditation:'meditation',Learning:'learning',Sleep:'sleep',Social:'social'}[k];$(id).checked=!!log[field]});
 $('urgeIntensity').value=log.urgeIntensity||0;$('urgeValue').textContent=(log.urgeIntensity||0)+' / 10';$('urgesManaged').value=log.urgesManaged||0;$('recoveryMood').value=log.mood||'';$('recoveryConfidence').value=log.confidence||'';$('recoveryReflection').value=log.reflection||'';
 $('recoveryTodayStatus').textContent=log.saved?'SAVED':'NOT LOGGED';$('recoverySaveStatus').textContent='';
 $('auraMilestones').innerHTML=recoveryMilestones.map(n=>`<div class="milestone ${r.unlocked.includes(n)?'unlocked':''}"><span class="medal">${r.unlocked.includes(n)?'✦':'◇'}</span><div class="grow"><b>Day ${n} · ${recoveryTitles[n]}</b><small>${r.unlocked.includes(n)?'Unlocked · growth permanently retained':'Unlock at challenge day '+n}</small></div><span>${r.unlocked.includes(n)?'✓':'○'}</span></div>`).join('');
 let wk=Math.max(1,Math.ceil(d/7)),theme=recoveryTheme(d);$('weeklyProgramme').innerHTML=`<div class="programme-week current"><b>Week ${wk} · ${theme[0]}</b><small>${theme[1]} · ${theme[2]}</small></div>`+recoveryThemes.slice(0,13).map((x,i)=>`<div class="programme-week"><b>Week ${i+1} · ${x[0]}</b><small>${x[1]} · ${x[2]}</small></div>`).join('')+`<div class="programme-week"><b>Days 91–365 · Maintenance</b><small>${recoveryThemes[13][2]}</small></div>`;
 let review=r.weeklyReviews[wk]||'';$('weeklyReview').value=review;
 $('urgeHistory').innerHTML=r.urgeEvents.slice(-5).reverse().map(x=>`<div class="history-item"><b>${esc(x.trigger||'Unspecified trigger')}</b> · Intensity ${x.intensity}/10<small>${esc(x.date)} · ${x.managed?'Managed':'Recorded'}</small></div>`).join('')||'<div class="empty">Managed urges you record will appear here.</div>';
 $('recoveryHistory').innerHTML=r.restarts.slice(-5).reverse().map(x=>`<div class="history-item"><b>Comeback · ${esc(x.date)}</b><small>${esc(x.reason||'Boundary break recorded; streak restarted. Aura retained.')}</small></div>`).join('')||'<div class="empty">No restarts recorded. Your history remains available here.</div>';
}

function renderAll(){renderHabits();renderWorkout();renderHome();renderRewards();renderReports();renderRecords();renderRecovery()}
function showTab(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));window.scrollTo(0,0)}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.go)));
$('dateInput').value=currentDate;$('recordDate').value=currentDate;$('dateInput').onchange=e=>{currentDate=e.target.value||todayISO();$('recordDate').value=currentDate;renderAll()};
$('addHabitBtn').onclick=addHabit;$('waterPlus').onclick=()=>{day().habits.waterMl=Math.min(10000,Number(day().habits.waterMl||0)+250);checkHabitRewards();renderAll()};
$('waterMinus').onclick=()=>{day().habits.waterMl=Math.max(0,Number(day().habits.waterMl||0)-250);checkHabitRewards();renderAll()};
$('recordForm').onsubmit=e=>{e.preventDefault();data.records.push({date:$('recordDate').value,event:$('eventType').value,value:$('recordValue').value.trim(),notes:$('recordNotes').value.trim()});save();e.target.reset();$('recordDate').value=currentDate;renderRecords();alert('Performance record saved.')};
$('saveReflection').onclick=()=>{day().reflection={energy:$('energy').value,fatigue:$('fatigue').value,pain:$('pain').value,notes:$('notes').value};save();$('saveStatus').textContent='Reflection saved on this device.'};
$('saveSettings').onclick=()=>{data.settings={...data.settings,waterTarget:Number($('waterTarget').value)||3,readingTarget:Number($('readingTarget').value)||30,studyTarget:Number($('studyTarget').value)||60,weekStart:$('weekStart').value,examDate:$('examDate').value};save();checkHabitRewards();renderAll();alert('Settings saved.')};

$('startRecovery').onclick=()=>{let r=data.recovery;if(r.started)return;r.startDate=$('recoveryStartDate').value||todayISO();r.boundaries={porn:$('boundaryPorn').checked,masturbation:$('boundaryMasturbation').checked};r.started=true;unlockRecoveryMilestones(recoveryDay());save();renderRecovery()};
$('saveRecoverySetup').onclick=()=>{let r=data.recovery;if(r.started&&r.startDate!==$('recoveryStartDate').value&&!confirm('Changing the start date will recalculate the current challenge day. Existing aura and history will remain. Continue?'))return;r.startDate=$('recoveryStartDate').value||todayISO();r.boundaries={porn:$('boundaryPorn').checked,masturbation:$('boundaryMasturbation').checked};save();renderRecovery()};
$('urgeIntensity').oninput=e=>$('urgeValue').textContent=e.target.value+' / 10';
$('saveRecoveryLog').onclick=()=>{let r=data.recovery,old=r.logs[todayISO()]||{},log={porn:$('logPorn').checked,masturbation:$('logMasturbation').checked,exercise:$('logExercise').checked,meditation:$('logMeditation').checked,learning:$('logLearning').checked,sleep:$('logSleep').checked,social:$('logSocial').checked,urgeIntensity:Number($('urgeIntensity').value),urgesManaged:Number($('urgesManaged').value)||0,mood:$('recoveryMood').value,confidence:$('recoveryConfidence').value,reflection:$('recoveryReflection').value,saved:true};
 let valid=0;['exercise','meditation','learning','sleep','social'].forEach(k=>{if(log[k])valid++});if(log.urgesManaged>0)valid++;if(log.reflection.trim())valid++;
 log.auraEarned=Math.max(Number(old.auraEarned)||0,Math.min(30,5+valid*3+(log.urgeIntensity>0&&log.urgesManaged>0?3:0)));r.logs[todayISO()]=log;
 if(r.started)unlockRecoveryMilestones(recoveryDay());save();renderRecovery();$('recoverySaveStatus').textContent='Daily recovery log saved on this device.'};
$('saveUrge').onclick=()=>{let r=data.recovery;r.urgeEvents.push({date:todayISO(),trigger:$('urgeTrigger').value.trim(),intensity:Number($('urgeIntensity').value),managed:true});if(r.logs[todayISO()]){r.logs[todayISO()].urgesManaged=(Number(r.logs[todayISO()].urgesManaged)||0)+1;r.logs[todayISO()].auraEarned=Math.min(30,(r.logs[todayISO()].auraEarned||0)+2)}else r.logs[todayISO()]={saved:false,urgeIntensity:Number($('urgeIntensity').value),urgesManaged:1,auraEarned:2};$('urgeTrigger').value='';save();renderRecovery()};
$('saveWeeklyReview').onclick=()=>{let wk=Math.max(1,Math.ceil(recoveryDay()/7));data.recovery.weeklyReviews[wk]=$('weeklyReview').value;save();alert('Weekly review saved.')};
$('restartRecovery').onclick=()=>{let r=data.recovery;if(!r.started){alert('Start your mission first.');return}if(!confirm('Record a boundary break and restart the current challenge streak? Your aura, Life Cells, milestones and previous logs will remain.'))return;r.restarts.push({date:todayISO(),reason:$('restartReason').value.trim(),previousStart:r.startDate,previousDay:recoveryDay()});r.startDate=todayISO();r.started=true;$('restartReason').value='';save();renderRecovery()};
let urgeInterval=null,urgeSeconds=600;$('startUrgeTimer').onclick=()=>{if(urgeInterval)return;urgeSeconds=600;$('urgeTimer').textContent='10:00';$('startUrgeTimer').textContent='Reset in progress';urgeInterval=setInterval(()=>{urgeSeconds--;let m=String(Math.floor(urgeSeconds/60)).padStart(2,'0'),ss=String(urgeSeconds%60).padStart(2,'0');$('urgeTimer').textContent=m+':'+ss;if(urgeSeconds<=0){clearInterval(urgeInterval);urgeInterval=null;$('startUrgeTimer').textContent='Start 10-minute reset';$('urgeTimer').textContent='RESET COMPLETE';}},1000)};
function download(name,content,type){let a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('exportBtn').onclick=()=>download('project-beast-mode-backup.json',JSON.stringify(data,null,2),'application/json');
$('csvBtn').onclick=()=>{let rows=[['Date','Habits completed','Water ml','PET points','Life Cells earned']];Object.keys(data.days).sort().forEach(d=>rows.push([d,habitCount(d),data.days[d].habits?.waterMl||0,events.filter(([id])=>data.days[d].events?.[id]).length*10,data.ledger.filter(x=>x.date===d).reduce((n,x)=>n+x.amount,0)]));download('beast-mode-history.csv',rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv')};
$('importFile').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let incoming=JSON.parse(await f.text());if(!incoming.days||!incoming.records)throw Error('Invalid backup');if(confirm('Replace current app data with this backup? Export current data first if needed.')){data={...defaults,...incoming,settings:{...defaults.settings,...incoming.settings},habitDefs:Array.isArray(incoming.habitDefs)?incoming.habitDefs:structuredClone(defaultHabits),rewardClaims:incoming.rewardClaims||[],ledger:incoming.ledger||[],lifeCells:Number(incoming.lifeCells)||0};save();renderAll();alert('Backup imported.')}}catch(err){alert('Could not import this backup file.')}e.target.value=''};
$('resetBtn').onclick=()=>{if(confirm('Permanently delete all app data on this device? Export a backup first.')){localStorage.removeItem(KEY);data=structuredClone(defaults);save();renderAll()}};
$('waterTarget').value=data.settings.waterTarget;$('readingTarget').value=data.settings.readingTarget;$('studyTarget').value=data.settings.studyTarget;$('weekStart').value=data.settings.weekStart;$('examDate').value=data.settings.examDate;
let deferredPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').classList.remove('hidden')});$('installBtn').onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('installBtn').classList.add('hidden')};
// Register relative to this project path; wait for page load and expose errors for diagnosis.
if('serviceWorker'in navigator&&location.protocol!=='file:'){window.addEventListener('load',()=>navigator.serviceWorker.register(new URL('sw.js',document.baseURI),{scope:new URL('./',document.baseURI).pathname}).catch(err=>console.error('Service worker registration failed:',err)))}
checkHabitRewards(currentDate);renderAll();
