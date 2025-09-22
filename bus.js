async function fetchBusData() {
  try {
    // ---------------- Bus 14 ----------------
    const busUrl = "https://api.tfl.gov.uk/Line/14/Arrivals";
    const busRes = await fetch(busUrl);
    const busData = await busRes.json();

    let busBuses = busData
      .filter(b => b.stationName.toLowerCase().includes("south kensington"))
      .sort((a, b) => a.timeToStation - b.timeToStation)
      .slice(0, 3)
      .map(b => {
        const adjustedSeconds = Math.max(0, b.timeToStation - 10);
        const minutes = Math.ceil(adjustedSeconds / 60);
        return minutes === 0 ? "Due" : `${minutes}m`;
      });

    while(busBuses.length < 3) busBuses.push("N");
    busBuses = [busBuses[0], busBuses[2]];

    // ---------------- Circle Line Train ----------------
    const trainUrl = "https://api.tfl.gov.uk/Line/Circle/Arrivals";
    const trainRes = await fetch(trainUrl);
    const trainData = await trainRes.json();

    let circleTrains = trainData
      .filter(t => t.stationName.toLowerCase().includes("south kensington"))
      .sort((a, b) => a.timeToStation - b.timeToStation)
      .slice(0, 3)
      .map(t => {
        const adjustedSeconds = Math.max(0, t.timeToStation - 30);
        const minutes = Math.ceil(adjustedSeconds / 60);
        return minutes === 0 ? "Due" : `${minutes}m`;
      });

    while(circleTrains.length < 3) circleTrains.push("N");
    circleTrains = [circleTrains[0], circleTrains[2]];

    drawCanvas(busBuses, circleTrains);
  } catch (e) {
    console.error(e);
    drawCanvas(["N","N"], ["N","N"]);
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius, fillColor) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
}

function drawCanvas(busTimes, trainTimes) {
  const canvas = document.getElementById("bustime");
  const ctx = canvas.getContext("2d");
  canvas.width = 300;
  canvas.height = 180;

  // Fond arrondi
  drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, 15, "#111216");

  // Charger le logo du bus
  const logo = new Image();
  logo.src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8sc9T3Hgva1EyRAPeZmmBmaXuaVUt8LDrU7HrULgScpjDjvjHmOhec4cKKZLdGr8eXXM&usqp=CAU";
logo.onload = () => {
  const logoSize = 40;
  const padding = 8;
  const radius = 8;

  // Créer un rectangle arrondi pour le logo et clipper l'image
  ctx.save(); // sauvegarder l'état du canvas
  ctx.beginPath();
  ctx.moveTo(padding + radius, padding);
  ctx.lineTo(padding + logoSize - radius, padding);
  ctx.quadraticCurveTo(padding + logoSize, padding, padding + logoSize, padding + radius);
  ctx.lineTo(padding + logoSize, padding + logoSize - radius);
  ctx.quadraticCurveTo(padding + logoSize, padding + logoSize, padding + logoSize - radius, padding + logoSize);
  ctx.lineTo(padding + radius, padding + logoSize);
  ctx.quadraticCurveTo(padding, padding + logoSize, padding, padding + logoSize - radius);
  ctx.lineTo(padding, padding + radius);
  ctx.quadraticCurveTo(padding, padding, padding + radius, padding);
  ctx.closePath();
  ctx.clip(); // appliquer le clip

  // Dessiner l'image à l'intérieur du clip
  ctx.drawImage(logo, padding, padding, logoSize, logoSize);

  ctx.restore(); // restaurer le canvas pour continuer à dessiner normalement

  // Texte "Bus time" à droite du logo
  ctx.fillStyle = "white";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Transport time", padding + logoSize + 10, 25);

  // -------- Bus 14 --------
  ctx.font = "bold 16px Arial";
  ctx.fillStyle = "#F55E27";
  let busText = "Bus 14 → Putney Heath";
  if (busTimes.length > 0) {
    busText += "  " + busTimes.join(" | ");
  }
  ctx.fillText(busText, 8, 80);

  // -------- Circle Line Train --------
  ctx.font = "bold 16px Arial";
  ctx.fillStyle = "#00A1DE"; // bleu pour le train
  let trainText = "Circle Line → Paddington";
  if (trainTimes.length > 0) {
    trainText += "  " + trainTimes.join(" | ");
  }
  ctx.fillText(trainText, 8, 120);
};
}

// Mise à jour toutes les 15 secondes
fetchBusData();
setInterval(fetchBusData, 15000);




async function displayCityOnCanvas() {
    const canvas = document.getElementById("loca");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Taille exacte du canvas
    canvas.width = 300;
    canvas.height = 180;

    // Fond orange
    ctx.fillStyle = "#F55E27";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let city = "Localisation non dispo";

    // Essai GPS
    if (navigator.geolocation) {
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            const lat = pos.coords.latitude.toFixed(6);
            const lon = pos.coords.longitude.toFixed(6);

            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
            const data = await res.json();

            if (data.address?.city) city = data.address.city;
            else if (data.address?.town) city = data.address.town;
            else if (data.address?.village) city = data.address.village;
            else city = "GPS OK, ville inconnue";
        } catch (e) {
            console.warn("GPS refusé ou indisponible, fallback IP", e);
        }
    }

    // Fallback IP si GPS non disponible
    if (city === "Localisation non dispo") {
        try {
            const res = await fetch("https://ipapi.co/json/");
            const data = await res.json();
            if (data.city) city = data.city;
        } catch (e) {
            console.error("Impossible de récupérer IP:", e);
        }
    }

    // Affichage texte centré dans le canvas
    ctx.fillStyle = "black";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Gestion multi-lignes si le nom est trop long
    const maxWidth = 280; // laisser un peu de marge
    const words = city.split(" ");
    let line = "";
    const lines = [];

    words.forEach(word => {
        const testLine = line ? line + " " + word : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth) {
            if (line) lines.push(line);
            line = word;
        } else {
            line = testLine;
        }
    });
    if (line) lines.push(line);

    const lineHeight = 26;
    let startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach(l => {
        ctx.fillText(l, canvas.width / 2, startY);
        startY += lineHeight;
    });
}

// Appel direct
displayCityOnCanvas();
