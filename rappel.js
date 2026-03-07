const THEME = {
  bg:         '#07070e',
  panel:      '#0d0d1a',
  left:       '#0a0a16',
  bd:         'rgba(255,255,255,0.07)',
  bd2:        'rgba(255,255,255,0.13)',
  txt:        '#dde0f0',
  muted:      'rgba(221,224,240,0.38)',
  accent:     '#7c6df8',
  accentLo:   'rgba(124,109,248,0.18)',
  red:        '#ef4444',
  orange:     '#f97316',
  green:      '#22c55e',
  redBg:      'rgba(239,68,68,0.13)',
  orangeBg:   'rgba(249,115,22,0.13)',
  greenBg:    'rgba(34,197,94,0.13)',
  // helpers — returns computed value at runtime
  get(key) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--' + key).trim();
  },
  set(key, value) {
    document.documentElement.style.setProperty('--' + key, value);
  }
};

const CATS = ['food','family','money','trading','health','work','sport','travel','other'];
const CAT_CLR = {food:'#f59e0b',family:'#f472b6',money:'#34d399',trading:'#60a5fa',health:'#a78bfa',work:'#fb923c',sport:'#4ade80',travel:'#38bdf8',other:'#94a3b8'};
const IMP_BG = {red:'rgba(239,68,68,.14)',orange:'rgba(249,115,22,.14)',green:'rgba(34,197,94,.14)'};
const IMP_BD = {red:'rgba(239,68,68,.28)',orange:'rgba(249,115,22,.28)',green:'rgba(34,197,94,.28)'};
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const ROW_H = 50;

const S = {
  open:false,frozen:false,reminders:[],weekStart:null,
  color:'orange',cat:'other',tab:'personal',fImp:[],fCat:[],wx:28,wy:-1,
};

(function init(){
  loadLS();
  S.weekStart = S.weekStart || monday(new Date());
  buildHours(); buildGrid(); buildCatChips(); buildCatDD();
  render(); updateImpDD(); updateCatDDChecks(); scrollTo7();
  updateTimeLine(); setInterval(updateTimeLine, 60000);
  initWidgetDrag(); adjustPanelOrigin();
  document.addEventListener('mousedown', e => {
    if(S.open && !S.frozen){
      if(!document.getElementById('panel').contains(e.target) &&
         !document.getElementById('r-btn').contains(e.target)) closePanel();
    }
    if(!document.getElementById('ctrl-grp').contains(e.target)) closeAllDD();
  });
  if(S.color) pickColor(S.color, true);
  if(S.cat)   pickCat(S.cat, true);
  if(S.tab)   setTab(S.tab, true);
  if(S.frozen){
    document.getElementById('btn-freeze').classList.add('active');
    document.getElementById('panel').classList.add('freeze-mode');
  }
  if(S.open) openPanel(true);
})();

function save(){
  try{
    localStorage.setItem('rmdr-v2', JSON.stringify({
      reminders:S.reminders,color:S.color,cat:S.cat,tab:S.tab,
      fImp:S.fImp,fCat:S.fCat,frozen:S.frozen,open:S.open,
      weekStart:S.weekStart?S.weekStart.toISOString():null,wx:S.wx,wy:S.wy
    }));
  }catch(e){}
}
function loadLS(){
  try{
    const raw=localStorage.getItem('rmdr-v2');
    if(!raw) return;
    const d=JSON.parse(raw);
    S.reminders=d.reminders||[];S.color=d.color||'orange';S.cat=d.cat||'other';
    S.tab=d.tab||'personal';S.fImp=d.fImp||[];S.fCat=d.fCat||[];
    S.frozen=d.frozen||false;S.open=false;
    S.weekStart=d.weekStart?new Date(d.weekStart):null;
    S.wx=d.wx!=null?d.wx:28;S.wy=d.wy!=null?d.wy:-1;
  }catch(e){}
}

function applyWidgetPos(x,y){
  const w=document.getElementById('widget');
  const maxX=window.innerWidth-30,maxY=window.innerHeight-30;
  S.wx=Math.max(0,Math.min(maxX,x));S.wy=Math.max(0,Math.min(maxY,y));
  w.style.left=S.wx+'px';w.style.top=S.wy+'px';adjustPanelOrigin();
}
function adjustPanelOrigin(){
  const panel=document.getElementById('panel');
  panel.style.left=(30+8)+'px';panel.style.right='auto';
  panel.style.top='0px';panel.style.bottom='auto';
  panel.style.transformOrigin='top left';
}
function initWidgetDrag(){
  const btn=document.getElementById('r-btn');
  const panel=document.getElementById('panel');
  let mouseDownX,mouseDownY,startLeft,startTop,dragging=false;
  const DRAG_THRESHOLD=5;
  const initY=S.wy<0?window.innerHeight-58:S.wy;
  applyWidgetPos(S.wx,initY);adjustPanelOrigin();
  btn.addEventListener('mousedown',e=>{
    if(btn.classList.contains('hidden')) return;
    mouseDownX=e.clientX;mouseDownY=e.clientY;startLeft=S.wx;startTop=S.wy;dragging=false;
    function onMove(ev){
      const dx=ev.clientX-mouseDownX,dy=ev.clientY-mouseDownY;
      if(!dragging&&Math.sqrt(dx*dx+dy*dy)>DRAG_THRESHOLD){
        dragging=true;btn.classList.add('dragging-w');panel.classList.add('no-transition');
      }
      if(dragging) applyWidgetPos(startLeft+dx,startTop+dy);
    }
    function onUp(){
      document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);
      btn.classList.remove('dragging-w');panel.classList.remove('no-transition');
      if(!dragging) handleR(); else save();
      dragging=false;
    }
    document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp);
    e.preventDefault();
  });
}

function handleR(){ openPanel(); }
function openPanel(silent){
  adjustPanelOrigin();S.open=true;
  document.getElementById('panel').classList.add('open');
  document.getElementById('r-btn').classList.add('hidden');
  if(!silent) save();
}
function closePanel(){
  if(S.frozen) return;
  S.open=false;
  document.getElementById('panel').classList.remove('open');
  document.getElementById('r-btn').classList.remove('hidden');
  save();
}
function toggleFreeze(){
  S.frozen=!S.frozen;
  document.getElementById('btn-freeze').classList.toggle('active',S.frozen);
  document.getElementById('panel').classList.toggle('freeze-mode',S.frozen);
  renderReminders();save();
}
function setTab(t,silent){
  S.tab=t;
  document.getElementById('tab-p').classList.toggle('active',t==='personal');
  document.getElementById('tab-s').classList.toggle('active',t==='shared');
  renderReminders();if(!silent) save();
}
function pickColor(c,silent){
  S.color=c;
  document.querySelectorAll('.c-dot').forEach(d=>d.classList.remove('sel'));
  document.querySelector('.c-dot.'+c).classList.add('sel');
  if(!silent) save();
}
function buildCatChips(){
  const el=document.getElementById('cat-chips');el.innerHTML='';
  CATS.forEach(c=>{
    const chip=document.createElement('div');
    chip.className='cat-chip'+(c===S.cat?' sel':'');chip.textContent=c;chip.dataset.c=c;
    if(c===S.cat) styleChipSel(chip,c);chip.onclick=()=>pickCat(c);el.appendChild(chip);
  });
}
function pickCat(c,silent){
  S.cat=c;
  document.querySelectorAll('.cat-chip').forEach(ch=>{
    const isSel=ch.dataset.c===c;ch.classList.toggle('sel',isSel);
    if(isSel) styleChipSel(ch,c); else unstyleChip(ch);
  });
  if(!silent) save();
}
function styleChipSel(el,c){el.style.background=CAT_CLR[c]+'22';el.style.borderColor=CAT_CLR[c]+'66';el.style.color=CAT_CLR[c];}
function unstyleChip(el){el.style.background='';el.style.borderColor='';el.style.color='';}

function buildHours(){
  const col=document.getElementById('hours-col');col.innerHTML='';
  for(let h=0;h<24;h++){const r=document.createElement('div');r.className='h-row';r.textContent=h===0?'0h':h+'h';col.appendChild(r);}
}
function buildGrid(){
  const grid=document.getElementById('days-grid');const tl=document.getElementById('time-line');
  grid.innerHTML='';grid.appendChild(tl);
  for(let d=0;d<7;d++){
    const col=document.createElement('div');col.className='day-col';col.id='dc-'+d;
    for(let h=0;h<24;h++){const sl=document.createElement('div');sl.className='day-slot';col.appendChild(sl);}
    grid.appendChild(col);
  }
}

function monday(d){const r=new Date(d);const day=r.getDay();r.setDate(r.getDate()-day+(day===0?-6:1));r.setHours(0,0,0,0);return r;}
function weekDays(){return Array.from({length:7},(_,i)=>{const d=new Date(S.weekStart);d.setDate(d.getDate()+i);return d;});}
function navigate(dir){S.weekStart=new Date(S.weekStart);S.weekStart.setDate(S.weekStart.getDate()+dir*7);save();render();}

function render(){updateMonthLbl();updateDaysHdr();renderReminders();updateTimeLine();}
function updateMonthLbl(){
  const days=weekDays();const s=days[0],e=days[6];
  const lbl=s.getMonth()===e.getMonth()
    ?MONTHS[s.getMonth()]+' '+s.getFullYear()
    :MONTHS[s.getMonth()].slice(0,3)+' – '+MONTHS[e.getMonth()].slice(0,3)+' '+e.getFullYear();
  document.getElementById('month-lbl').textContent=lbl;
}
function updateDaysHdr(){
  const hdr=document.getElementById('days-hdr');hdr.querySelectorAll('.dh-day').forEach(e=>e.remove());
  const today=new Date();const days=weekDays();
  days.forEach((day,i)=>{
    const cell=document.createElement('div');cell.className='dh-day';
    const isToday=day.toDateString()===today.toDateString();
    if(isToday) cell.classList.add('today');
    cell.innerHTML=DAYS[i]+'<span>'+day.getDate()+'</span>';
    hdr.appendChild(cell);
    const col=document.getElementById('dc-'+i);if(col) col.classList.toggle('today-col',isToday);
  });
}
function updateTimeLine(){
  const tl=document.getElementById('time-line');const days=weekDays();const now=new Date();
  const todayIndex=days.findIndex(d=>d.toDateString()===now.toDateString());
  if(todayIndex<0){tl.style.display='none';return;}
  const grid=document.getElementById('days-grid');
  const topPx=(now.getHours()*60+now.getMinutes())/60*ROW_H;
  tl.style.display='block';tl.style.top=topPx+'px';tl.style.left='0px';tl.style.width='100%';
}

function renderReminders(){
  document.querySelectorAll('.rem-box').forEach(e=>e.remove());
  const days=weekDays();const wS=days[0];const wE=new Date(days[6]);wE.setHours(23,59,59,999);
  const filtered=S.reminders.filter(r=>{
    const d=new Date(r.dt);
    if(d<wS||d>wE) return false;
    if(r.tab!==S.tab) return false;
    if(S.fImp.length&&!S.fImp.includes(r.color)) return false;
    if(S.fCat.length&&!S.fCat.includes(r.cat)) return false;
    return true;
  });
  const grid=document.getElementById('days-grid');
  const colW=grid.offsetWidth/7;
  filtered.forEach(r=>placeBox(r,colW,days));
}

function placeBox(r,colW,days){
  const d=new Date(r.dt);
  const dow=d.getDay();const di=dow===0?6:dow-1;
  const hr=d.getHours(),mn=d.getMinutes();
  const topPx=hr*ROW_H+(mn/60)*ROW_H;
  const leftPx=di*colW+2;

  // Outer ghost wrapper
  const box=document.createElement('div');
  box.className='rem-box rem-'+r.color+(S.frozen?' grabbable':'');
  box.dataset.id=r.id;
  box.style.left=leftPx+'px';
  box.style.width=(colW-4)+'px';
  box.style.top=topPx+'px';

  const timeStr=d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  const trashSVG=`<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;

  box.innerHTML=`
    <div class="rb-bar" style="background:${CAT_CLR[r.cat]||'#94a3b8'}"></div>
    <div class="rb-content">
      <div class="rb-title">${esc(r.title)}</div>
      ${r.desc?`<div class="rb-desc">${esc(r.desc)}</div>`:''}
      <div class="rb-time">${timeStr}</div>
    </div>
    <div class="rb-delete" title="Supprimer">${trashSVG}</div>
  `;

  box.querySelector('.rb-delete').addEventListener('click',e=>{
    e.stopPropagation(); deleteR(r.id);
  });
  box.addEventListener('contextmenu',e=>{e.preventDefault();deleteR(r.id);});
  makeDraggable(box,r.id);
  document.getElementById('days-grid').appendChild(box);
}

function makeDraggable(canvas,reminderId){
  let isDragging=false,startX,startY,startLeft=0,startTop=0;
  canvas.addEventListener('mousedown',e=>{
    if(!S.frozen) return;
    isDragging=true;startX=e.clientX;startY=e.clientY;
    startLeft=parseInt(canvas.style.left)||0;startTop=parseInt(canvas.style.top)||0;
    canvas.classList.add('dragging');
    document.addEventListener('mousemove',onDrag);document.addEventListener('mouseup',stopDrag);
    e.preventDefault();e.stopPropagation();
  });
  function onDrag(e){
    if(!isDragging) return;
    canvas.style.left=Math.max(0,startLeft+(e.clientX-startX))+'px';
    canvas.style.top=Math.max(0,startTop+(e.clientY-startY))+'px';
  }
  function stopDrag(){
    if(!isDragging) return;isDragging=false;
    canvas.classList.remove('dragging');
    document.removeEventListener('mousemove',onDrag);document.removeEventListener('mouseup',stopDrag);
    const grid=document.getElementById('days-grid');const colW=grid.offsetWidth/7;
    const di=Math.max(0,Math.min(6,Math.round((parseInt(canvas.style.left)||0)/colW)));
    const hr=Math.max(0,Math.min(23,Math.round((parseInt(canvas.style.top)||0)/ROW_H)));
    const r=S.reminders.find(r=>r.id===reminderId);
    if(r){const wd=weekDays();const nd=new Date(wd[di]);nd.setHours(hr,0,0,0);r.dt=dtLocal(nd);save();renderReminders();}
  }
}

function addReminder(){
  const title=document.getElementById('f-title').value.trim();
  const desc=document.getElementById('f-desc').value.trim();
  const dt=document.getElementById('f-dt').value;
  if(!title||!dt){shake(document.querySelector('.form-scroll'));return;}
  S.reminders.push({
    id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),
    title,desc,dt,color:S.color,cat:S.cat,tab:S.tab,created:new Date().toISOString()
  });
  document.getElementById('f-title').value='';
  document.getElementById('f-desc').value='';
  document.getElementById('f-dt').value='';
  save();renderReminders();toast('Reminder added ✓');
}
function deleteR(id){S.reminders=S.reminders.filter(r=>r.id!==id);save();renderReminders();toast('Reminder removed');}

function toggleDD(type){
  const ddId=type==='imp'?'dd-imp':'dd-cat',btnId=type==='imp'?'btn-imp':'btn-cat';
  const dd=document.getElementById(ddId),btn=document.getElementById(btnId);
  const isOpen=!dd.classList.contains('hidden');closeAllDD();
  if(!isOpen){dd.classList.remove('hidden');btn.classList.add('active');}
}
function closeAllDD(){
  document.getElementById('dd-imp').classList.add('hidden');document.getElementById('dd-cat').classList.add('hidden');
  document.getElementById('btn-imp').classList.remove('active');document.getElementById('btn-cat').classList.remove('active');
}
function impFilter(v){
  if(v==='all'){S.fImp=[];}else{const i=S.fImp.indexOf(v);i>-1?S.fImp.splice(i,1):S.fImp.push(v);}
  updateImpDD();renderReminders();save();
}
function updateImpDD(){
  const all=S.fImp.length===0;document.getElementById('ddi-all').classList.toggle('sel',all);
  ['red','orange','green'].forEach(c=>document.getElementById('ddi-'+c).classList.toggle('sel',S.fImp.includes(c)));
  document.getElementById('btn-imp').classList.toggle('active',S.fImp.length>0);
}
function buildCatDD(){
  const dd=document.getElementById('dd-cat');dd.innerHTML='';
  CATS.forEach(c=>{
    const item=document.createElement('div');item.className='dd-item';item.id='ddc-'+c;
    item.innerHTML=`<div class="dd-dot" style="background:${CAT_CLR[c]}"></div><div class="dd-chk"></div><span>${c}</span>`;
    item.onclick=()=>catFilter(c);dd.appendChild(item);
  });updateCatDDChecks();
}
function catFilter(c){const i=S.fCat.indexOf(c);i>-1?S.fCat.splice(i,1):S.fCat.push(c);updateCatDDChecks();renderReminders();save();}
function updateCatDDChecks(){
  CATS.forEach(c=>{const el=document.getElementById('ddc-'+c);if(el) el.classList.toggle('sel',S.fCat.length===0||S.fCat.includes(c));});
  document.getElementById('btn-cat').classList.toggle('active',S.fCat.length>0);
}

function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function dtLocal(d){const p=n=>String(n).padStart(2,'0');return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;}
function scrollTo7(){
  setTimeout(()=>{
    const s=document.getElementById('cal-scroll');
    if(!s) return;
    const now=new Date();
    const topPx=(now.getHours()*60+now.getMinutes())/60*ROW_H;
    // center the current time in the visible area
    s.scrollTop=Math.max(0, topPx - s.clientHeight/2 + 40);
  },150);
}
function shake(el){el.style.animation='none';el.offsetHeight;el.style.animation='shk .35s ease';}
let _toast;
function toast(msg){
  if(_toast){_toast.classList.add('out');setTimeout(()=>{if(_toast)_toast.remove();},300);}
  const t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);_toast=t;
  setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),300);},2200);
}
