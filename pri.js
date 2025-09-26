
    const canvas = document.getElementById('prayerCanvas');
    const ctx = canvas.getContext('2d');

    const DEFAULTS = { latitude: 51.5074, longitude: -0.1278, method: 2 };
    const PRAYER_KEYS = ['Fajr','Dhuhr','Asr','Maghrib','Isha'];
    let prayers = {};

    function stripToHHMM(s){
      const m = s.match(/(\d{1,2}:\d{2})/);
      return m ? m[1] : s;
    }

    async function fetchTimings(lat, lon){
      const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=${DEFAULTS.method}`;
      const r = await fetch(url);
      const j = await r.json();
      if(!j || j.code !== 200) throw new Error('Impossible de récupérer les timings');
      const t = j.data.timings;
      prayers = {};
      PRAYER_KEYS.forEach(k => prayers[k] = stripToHHMM(t[k] || ''));
    }

    function parseTimeToDateObj(timeStr){
      const now = new Date();
      const parts = timeStr.split(':');
      if(parts.length<2) return null;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(parts[0],10), parseInt(parts[1],10), 0);
    }

    function nextPrayerInfo(){
      const now = new Date();
      for(const key of PRAYER_KEYS){
        const tstr = prayers[key];
        const d = parseTimeToDateObj(tstr);
        if(!d) continue;
        if(d.getTime() > now.getTime()+500) return {name:key,time:d};
      }
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate()+1);
      const fajr = prayers['Fajr'] || '00:00';
      const parts = fajr.split(':');
      return {name:'Fajr', time:new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), parseInt(parts[0]||0,10), parseInt(parts[1]||0,10),0)};
    }

    function formatDuration(ms){
      if(ms<0) ms=0;
      const total = Math.floor(ms/1000);
      const h = Math.floor(total/3600);
      const m = Math.floor((total%3600)/60);
      const s = total%60;
      return h>0 ? `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s` : `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
    }

    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.textAlign = 'center';

      ctx.fillStyle = '#111216';
      ctx.fillRect(0,0,canvas.width,canvas.height);

      const np = nextPrayerInfo();
      const now = new Date();
      const remainingMs = np.time.getTime() - now.getTime();
      const countdown = formatDuration(remainingMs);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 16px system-ui';
      ctx.fillText(countdown, canvas.width/2, 36);

      ctx.font = '400 12px system-ui';
      ctx.fillStyle = '#a0a0a0';
      ctx.fillText(`Vers ${np.name}`, canvas.width/2, 52);

      const boxHeight = 90;
      const gap = 6;
      const totalGap = gap*(PRAYER_KEYS.length-1);
      const boxWidth = Math.floor((canvas.width - 20 - totalGap) / PRAYER_KEYS.length);
      let x = 10;

      PRAYER_KEYS.forEach((key) => {
        const bx = x;
        const by = canvas.height - boxHeight - 10;
        const isNext = (key === np.name);
        const boxColor = isNext ? '#333' : '#1c1c1f';
        roundRect(bx, by, boxWidth, boxHeight, 8, true, false, boxColor);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 11px system-ui';
        ctx.fillText(key, bx + boxWidth/2, by + 18);

        ctx.font = '700 14px system-ui';
        const timeStr = prayers[key] || '--:--';
        ctx.fillText(timeStr, bx + boxWidth/2, by + 44);

        const dayStr = now.toLocaleDateString(undefined, {day:'2-digit', month:'short'});
        ctx.font = '400 10px system-ui';
        ctx.fillStyle = '#a0a0a0';
        ctx.fillText(dayStr, bx + boxWidth/2, by + 60);

        x += boxWidth + gap;
      });

      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      roundRect(0.5,0.5,canvas.width-1,canvas.height-1,12,false,true);
    }

    function roundRect(x, y, w, h, r, fill = true, stroke = true, fillColor = null){
      if (typeof r === 'number') r = {tl: r, tr: r, br: r, bl: r};
      ctx.beginPath();
      ctx.moveTo(x + r.tl, y);
      ctx.lineTo(x + w - r.tr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
      ctx.lineTo(x + w, y + h - r.br);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
      ctx.lineTo(x + r.bl, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
      ctx.lineTo(x, y + r.tl);
      ctx.quadraticCurveTo(x, y, x + r.tl, y);
      ctx.closePath();
      if(fill){ if(fillColor){ ctx.fillStyle = fillColor; } ctx.fill(); }
      if(stroke) ctx.stroke();
    }

    // Directement initialiser et démarrer
    (async () => {
      await fetchTimings(DEFAULTS.latitude, DEFAULTS.longitude);
      draw();
      setInterval(draw, 1000);
    })();

