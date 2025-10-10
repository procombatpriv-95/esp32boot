

  const canvas = document.getElementById("echange");
  const ctx = canvas.getContext("2d");

  let rate = 0.85;
  let euroValue = "";
  let poundValue = "";
  let activeField = null;
  
  // Variables pour le drag & drop
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let canvasX = 20; // Position initiale X
  let canvasY = 20; // Position initiale Y

  // Appliquer la position initiale
  canvas.style.left = canvasX + 'px';
  canvas.style.top = canvasY + 'px';

  // --- Gestion du Drag & Drop ---
  canvas.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);

  function startDrag(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Vérifier si on clique sur un champ de saisie
    const isEuroField = (x >= 50 && x <= 130 && y >= 65 && y <= 95);
    const isPoundField = (x >= 170 && x <= 250 && y >= 65 && y <= 95);
    
    // Si on ne clique pas sur un champ de saisie, on active le drag
    if (!isEuroField && !isPoundField) {
      isDragging = true;
      dragOffsetX = e.clientX - canvasX;
      dragOffsetY = e.clientY - canvasY;
      canvas.style.cursor = "grabbing";
      e.preventDefault(); // Empêcher la sélection de texte
    } else {
      // Gestion normale des clics sur les champs
      if (isEuroField) {
        activeField = "euro";
      } else if (isPoundField) {
        activeField = "pound";
      }
      drawUI();
    }
  }

  function drag(e) {
    if (!isDragging) return;
    
    canvasX = e.clientX - dragOffsetX;
    canvasY = e.clientY - dragOffsetY;
    
    // Limiter le déplacement dans la fenêtre
    canvasX = Math.max(0, Math.min(canvasX, window.innerWidth - canvas.width));
    canvasY = Math.max(0, Math.min(canvasY, window.innerHeight - canvas.height));
    
    canvas.style.left = canvasX + 'px';
    canvas.style.top = canvasY + 'px';
  }

  function stopDrag() {
    if (isDragging) {
      isDragging = false;
      canvas.style.cursor = "move";
    }
  }

  // --- Charger le taux réel ---
  async function fetchRate() {
    try {
      const res = await fetch("https://api.exchangerate.host/latest?base=EUR&symbols=GBP");
      const data = await res.json();
      rate = data.rates.GBP;
    } catch (e) {
      console.error("Erreur taux:", e);
    }
  }

  // --- Fonction pour dessiner un rectangle arrondi ---
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawUI() {
    ctx.fillStyle = "#111216";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Titre
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Echange EUR ↔ GBP", canvas.width/2, 25);

    // Labels
    ctx.font = "12px Arial";
    ctx.fillText("Euro (€)", 90, 55);
    ctx.fillText("Pound (£)", 210, 55);

    // Champ Euro
    roundRect(50, 65, 80, 30, 10);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = activeField === "euro" ? "#00ff99" : "#888";
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText(euroValue, 55, 85);

    // Champ Pound
    roundRect(170, 65, 80, 30, 10);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = activeField === "pound" ? "#00aaff" : "#888";
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.fillText(poundValue, 175, 85);

    // Taux affiché
    ctx.fillStyle = "#aaa";
    ctx.font = "11px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`1 EUR = ${rate.toFixed(2)} GBP`, canvas.width/2, 150);
  }

  // --- Conversion automatique ---
  function updateConversion() {
    if (activeField === "euro") {
      const euros = parseFloat(euroValue) || 0;
      poundValue = (euros * rate).toFixed(2);
    } else if (activeField === "pound") {
      const pounds = parseFloat(poundValue) || 0;
      euroValue = (pounds / rate).toFixed(2);
    }
  }

  // --- Gestion clics (pour sélectionner les champs) ---
  canvas.addEventListener("click", e => {
    if (isDragging) return; // Ne pas gérer les clics si on vient de déplacer
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= 50 && x <= 130 && y >= 65 && y <= 95) {
      activeField = "euro";
    } else if (x >= 170 && x <= 250 && y >= 65 && y <= 95) {
      activeField = "pound";
    } else {
      activeField = null;
    }
    drawUI();
  });

  // --- Gestion clavier ---
  window.addEventListener("keydown", e => {
    if (!activeField) return;
    if (e.key >= "0" && e.key <= "9" || e.key === ".") {
      if (activeField === "euro") euroValue += e.key;
      else poundValue += e.key;
    } else if (e.key === "Backspace") {
      if (activeField === "euro") euroValue = euroValue.slice(0, -1);
      else poundValue = poundValue.slice(0, -1);
    }
    updateConversion();
    drawUI();
  });

  // --- Initialisation ---
  window.addEventListener("load", async () => {
    await fetchRate();
    drawUI();
    setInterval(drawUI, 500);
  });
