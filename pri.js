const canvas = document.getElementById('prayerCanvas');
const ctx = canvas.getContext('2d');
const PRAYER_KEYS = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
let prayers = {};

async function fetchPrayers() {
  try {
    const lat = 51.5074; // Londres
    const lon = -0.1278;
    const method = 2;
    const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${method}`);
    const data = await res.json();
    PRAYER_KEYS.forEach(k => {
      prayers[k] = data.data.timings[k].slice(0,5); // hh:mm
    });
  } catch(e) {
    console.error("Erreur récupération API:", e);
  }
}

function parseTime(str) {
  const now = new Date();
  const [h,m] = str.split(':').map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
}

function nextPrayer() {
  const now = new Date();
  for(const key of PRAYER_KEYS) {
    const d = parseTime(prayers[key]);
    if(d > now) return {name: key, time: d};
  }
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()+1);
  const [h,m] = prayers['Fajr'].split(':').map(Number);
  return {name:'Fajr', time:new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), h, m,0)};
}

function formatDuration(ms) {
  ms = Math.max(ms,0);
  const total = Math.floor(ms/1000);
  const h = Math.floor(total/3600);
  const m = Math.floor((total%3600)/60);
  const s = total%60;
  return h>0 ? `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s` : `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#111216';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const np = nextPrayer();
  const now = new Date();
  const countdown = formatDuration(np.time - now);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 16px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(countdown, canvas.width/2, 36);

  ctx.font = '400 12px system-ui';
  ctx.fillStyle = '#a0a0a0';
  ctx.fillText(`Vers ${np.name}`, canvas.width/2, 52);

  const boxHeight = 90;
  const gap = 6;
  const boxWidth = Math.floor((canvas.width - 20 - gap*(PRAYER_KEYS.length-1))/PRAYER_KEYS.length);
  let x = 10;

  PRAYER_KEYS.forEach(key => {
    const by = canvas.height - boxHeight - 10;
    const isNext = key === np.name;
    ctx.fillStyle = isNext ? '#333' : '#1c1c1f';
    ctx.fillRect(x, by, boxWidth, boxHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 11px system-ui';
    ctx.fillText(key, x + boxWidth/2, by + 18);

    ctx.font = '700 14px system-ui';
    ctx.fillText(prayers[key], x + boxWidth/2, by + 44);

    const dayStr = now.toLocaleDateString(undefined, {day:'2-digit', month:'short'});
    ctx.font = '400 10px system-ui';
    ctx.fillStyle = '#a0a0a0';
    ctx.fillText(dayStr, x + boxWidth/2, by + 60);

    x += boxWidth + gap;
  });
}

// Boucle principale
async function main() {
  await fetchPrayers();
  draw();
  setInterval(draw,1000);
}

main();
