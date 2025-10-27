
function makeCanvasDraggable(canvas) {
    let isDragging = false;
    let startX, startY;
    let startLeft = 0, startTop = 0;

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        // Récupérer la position actuelle
        startLeft = parseInt(canvas.style.left) || 0;
        startTop = parseInt(canvas.style.top) || 0;
        
        canvas.classList.add('dragging');
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
        e.preventDefault();
    });

    function onDrag(e) {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        canvas.style.position = 'relative';
        canvas.style.left = (startLeft + dx) + 'px';
        canvas.style.top = (startTop + dy) + 'px';
    }

    function stopDrag() {
        isDragging = false;
        canvas.classList.remove('dragging');
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
    }
}

window.addEventListener("load", () => {
  const canvas = document.getElementById("market");
  
  // AJOUT: Rendre le canvas déplaçable
  makeCanvasDraggable(canvas);

  // Retina scaling
  const DPR = window.devicePixelRatio || 1;
  const CSS_W = parseInt(canvas.getAttribute("width"), 10);
  const CSS_H = parseInt(canvas.getAttribute("height"), 10);
  canvas.style.width = CSS_W + "px";
  canvas.style.height = CSS_H + "px";
  canvas.width = CSS_W * DPR;
  canvas.height = CSS_H * DPR;
  const ctx = canvas.getContext("2d");
  ctx.scale(DPR, DPR);

  // Nettoyage ancienne instance
  if (window.marketInterval) clearInterval(window.marketInterval);
  if (window.marketWS) try { window.marketWS.close(); } catch(e) {}

  // État
  const state = {
    BTCUSDT: { name: "Bitcoin", short: "BTC", lastDisplayed: null, prev: null, latest: null, trend: null, firstUpdateDone: false },
    ETHUSDT: { name: "Ethereum", short: "ETH", lastDisplayed: null, prev: null, latest: null, trend: null, firstUpdateDone: false },
    XRPUSDT: { name: "XRP", short: "XRP", lastDisplayed: null, prev: null, latest: null, trend: null, firstUpdateDone: false },
    LTCUSDT: { name: "Litecoin", short: "LTC", lastDisplayed: null, prev: null, latest: null, trend: null, firstUpdateDone: false }
  };

  // Positions 2x2
  const pad = 8, gap = 8;
  const cardW = (CSS_W - pad*2 - gap) / 2;
  const cardH = (CSS_H - pad*2 - gap) / 2;
  const positions = [
    { x: pad,             y: pad,             key: "BTCUSDT" },
    { x: pad+cardW+gap,   y: pad,             key: "ETHUSDT" },
    { x: pad,             y: pad+cardH+gap,   key: "XRPUSDT" },
    { x: pad+cardW+gap,   y: pad+cardH+gap,   key: "LTCUSDT" }
  ];

  // Fonction dessin
function roundedRect(x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+r, r);
  ctx.arcTo(x+w,y+h,  x+w-r,y+h, r);
  ctx.arcTo(x,  y+h,  x,   y+h-r, r);
  ctx.arcTo(x,  y,    x+r, y, r);
  ctx.closePath();
}

  function draw() {
    ctx.clearRect(0, 0, CSS_W, CSS_H);

    ctx.textAlign = "left";
    positions.forEach(pos => {
      const info = state[pos.key];

      // carte
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      roundedRect(pos.x,pos.y,cardW,cardH,6);
      ctx.fill();

      // pastille symbole
const cx = pos.x+14, cy = pos.y+20;
ctx.beginPath();
ctx.arc(cx, cy, 10, 0, Math.PI*2);
ctx.fillStyle = "rgba(17, 18, 22, 0.8)"; // ← CHANGEMENT ICI
ctx.fill();
ctx.fillStyle = "#fff";
ctx.font = "600 8px Arial";
ctx.textAlign = "center";
ctx.fillText(info.short, cx, cy+1);

      // nom à droite du logo
      ctx.textAlign = "left";
      ctx.fillStyle = "#dbe6f0";
      ctx.font = "12px Arial";
      ctx.fillText(info.name, pos.x+30, pos.y+22);

      // prix
      if (info.lastDisplayed !== null) {
        ctx.font = "600 14px Arial";
        ctx.fillStyle = info.trend === "up" ? "#39d353" : "#ff6b6b";
        ctx.fillText("$" + info.lastDisplayed.toFixed(2), pos.x+12, pos.y+45);

        // flèche
        ctx.font = "12px Arial";
        ctx.fillText(info.trend === "up" ? "↑" : "↓", pos.x+110, pos.y+45);

        // % variation (dès la première fois)
        const pct = ((info.lastDisplayed - info.prev) / info.prev) * 100;
        ctx.font = "11px Arial";
        ctx.fillStyle = pct >= 0 ? "#39d353" : "#ff6b6b";
        ctx.fillText((pct>=0?"+":"") + pct.toFixed(2) + "%", pos.x+12, pos.y+62);
      } else {
        ctx.font = "600 14px Arial";
        ctx.fillStyle = "#ff6b6b"; 
        ctx.fillText("--", pos.x+12, pos.y+45);
      }
    });
  }

  // Mise à jour
  function updateDisplay(forceImmediate=false, symbolKey=null) {
    let changed = false;
    for (const key of Object.keys(state)) {
      const s = state[key];
      if (s.latest !== null) {
        if (forceImmediate && symbolKey === key && !s.firstUpdateDone) {
          s.trend = "up"; 
          s.prev = s.latest;            // ⚡ prev = latest → % = 0.00% dès la première fois
          s.lastDisplayed = s.latest;
          s.firstUpdateDone = true;
          changed = true;
        } else if (!forceImmediate) {
          s.trend = (s.latest > s.lastDisplayed) ? "up" : "down";
          s.prev = s.lastDisplayed;
          s.lastDisplayed = s.latest;
          changed = true;
        }
      }
    }
    if (changed) draw();
  }

  // --- Interval 30s ---
  window.marketInterval = setInterval(() => updateDisplay(false), 10000);

  // --- WebSocket ---
  const ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=btcusdt@trade/ethusdt@trade/xrpusdt@trade/ltcusdt@trade");
  window.marketWS = ws;

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    const symbol = msg.stream.split("@")[0].toUpperCase();
    if (state[symbol]) {
      state[symbol].latest = parseFloat(msg.data.p);

      // Premier affichage immédiat pour ce symbole
      if (!state[symbol].firstUpdateDone) {
        updateDisplay(true, symbol);
      }
    }
  };

  draw(); // layout vide
});
