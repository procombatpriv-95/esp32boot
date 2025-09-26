const weatherEmojis = {
  "clearsky_day": { emoji: "☀️", text: "Ensoleillé" },
  "clearsky_night": { emoji: "🌙", text: "Nuit claire" },
  "fair_day": { emoji: "🌤️", text: "Beau temps" },
  "fair_night": { emoji: "🌙✨", text: "Beau temps nuit" },
  "partlycloudy_day": { emoji: "⛅", text: "Partiellement nuageux" },
  "partlycloudy_night": { emoji: "☁️🌙", text: "Nuageux nuit" },
  "cloudy": { emoji: "☁️", text: "Nuageux" },
  "lightrain": { emoji: "🌦️", text: "Pluie légère" },
  "rain": { emoji: "🌧️", text: "Pluie" },
  "heavyrain": { emoji: "🌧️🌧️", text: "Forte pluie" },
  "snow": { emoji: "❄️", text: "Neige" },
  "thunderstorm": { emoji: "⛈️", text: "Orage" },
  "fog": { emoji: "🌫️", text: "Brouillard" },
  "N/A": { emoji: "☁️", text: "Indisponible" }
};

function getWeather(symbol) {
  return weatherEmojis[symbol] || weatherEmojis["N/A"];
}

async function loadWeather() {
  const response = await fetch("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=51.509865&lon=-0.118092");
  const data = await response.json();

  const canvas = document.getElementById("weather-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 300;
  canvas.height = 180;

  // Fond dégradé
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#ec7263");
  grad.addColorStop(1, "#974859");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Données actuelles
  const current = data.properties.timeseries[0];
  const temp = Math.round(current.data.instant.details.air_temperature);
  const humidity = Math.round(current.data.instant.details.relative_humidity);
  const symbol = current.data.next_1_hours?.summary?.symbol_code || "N/A";
  const { emoji, text } = getWeather(symbol);

  // Emoji météo actuel
  ctx.font = "28px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(emoji, 10, 30);

  // Texte météo défini par toi
  ctx.font = "14px Arial";
  ctx.fillText(text, 45, 30);

  // Température en gros
  ctx.font = "40px Arial";
  ctx.fillText(`${temp}°`, 10, 90);

  // Humidité
  ctx.font = "14px Arial";
  ctx.fillText(`💧 ${humidity}%`, 10, 110);

  // Ville à droite
  ctx.font = "18px Arial";
  ctx.textAlign = "right";
  ctx.fillText("London", canvas.width - 10, 40);
  ctx.textAlign = "left";

  // Prévisions 3 prochains jours
  const days = {};
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "short" });

  for (let item of data.properties.timeseries) {
    const d = new Date(item.time);
    const day = d.toLocaleDateString("fr-FR", { weekday: "short" });

    if (day === today) continue;

    if (!days[day] && d.getHours() === 12) {
      const symbolDay = item.data.next_6_hours?.summary?.symbol_code || "N/A";
      days[day] = getWeather(symbolDay).emoji;
    }

    if (Object.keys(days).length >= 3) break;
  }

  // Barre arrondie
  const barHeight = 50;
  const radius = 25;
  ctx.fillStyle = "#974859";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - barHeight);
  ctx.lineTo(canvas.width, canvas.height - barHeight);
  ctx.arcTo(canvas.width, canvas.height, canvas.width - radius, canvas.height, radius);
  ctx.lineTo(radius, canvas.height);
  ctx.arcTo(0, canvas.height, 0, canvas.height - radius, radius);
  ctx.closePath();
  ctx.fill();

  // Affichage jours
  const keys = Object.keys(days);
  const sectionWidth = canvas.width / 3;
  ctx.fillStyle = "white";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";

  keys.forEach((day, i) => {
    const x = sectionWidth * i + sectionWidth / 2;
    const y = canvas.height - barHeight / 2;
    ctx.fillText(day.toUpperCase(), x, y - 8);
    ctx.fillText(days[day], x, y + 12);
  });

  ctx.textAlign = "left";
}

loadWeather();
