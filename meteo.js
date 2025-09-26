
window.addEventListener("load", () => {

  const weatherEmojis = {
    "clearsky_day": "☀️ Clear sky",
    "clearsky_night": "🌙 Clear night",
    "fair_day": "🌤️ Sunny",
    "fair_night": "🌙✨ Bright night",
    "partlycloudy_day": "⛅ Light rain",
    "partlycloudy_night": "☁️🌙 Cloudy night",
    "cloudy": "☁️ Cloudy",
    "lightrain": "🌦️ Light rain",
    "rain": "🌧️ Rain",
    "heavyrain": "🌧️🌧️ Heavy rain",
    "snow": "❄️ Snow",
    "thunderstorm": "⛈️ Thunderstorm",
    "fog": "🌫️ Fog",
    "N/A": "☁️ Inconnu"
  };

  function getWeatherDescription(symbol) {
    return weatherEmojis[symbol] || weatherEmojis["N/A"];
  }

  async function loadWeather() {
    const canvas = document.getElementById("weather-canvas");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    // --- Fond dégradé + cercles ---
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#ec7263");
    grad.addColorStop(1, "#974859");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(239,199,69,0.4)";
    ctx.beginPath(); ctx.arc(W*0.8, -H*0.8, 300, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.7, -H*0.7, 210, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.92, -H*0.35, 100, 0, Math.PI*2); ctx.fill();

    // --- Données météo ---
    const response = await fetch(
      "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=51.509865&lon=-0.118092"
    );
    const data = await response.json();

    const current = data.properties.timeseries[0];
    const temp = current.data.instant.details.air_temperature;
    const humidity = current.data.instant.details.relative_humidity;
    const symbol = current.data.next_1_hours?.summary?.symbol_code || "N/A";
    const desc = getWeatherDescription(symbol);

    const [emoji, ...label] = desc.split(" ");

    // --- Emoji en haut à gauche ---
    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.textAlign = "left";
    ctx.fillText(emoji, 10, 30);

    // --- Description plus grosse ---
    ctx.font = "16px Arial";
    ctx.fillText(label.join(" "), 50, 25);

    // --- Température plus grosse ---
    ctx.font = "36px Arial";
    ctx.fillText(`${Math.round(temp)}°`, 10, 80);

    // --- Humidité ---
    ctx.font = "14px Arial";
    ctx.fillText(`💧 ${humidity}%`, 10, 100);

    // --- Ville à droite ---
    ctx.font = "16px Arial";
    ctx.textAlign = "right";
    ctx.fillText("London", W - 10, 30);

    // --- Prévisions 3 prochains jours ---
    const forecast = [];
    const seenDays = new Set();
    const today = new Date().toLocaleDateString("fr-FR", { weekday: "short" });

    for (let item of data.properties.timeseries) {
      const d = new Date(item.time);
      const day = d.toLocaleDateString("fr-FR", { weekday: "short" });
      const hour = d.getHours();

      if (day === today) continue;

      if (!seenDays.has(day) && hour >= 9 && hour <= 15) {
        const symbolDay = item.data.next_6_hours?.summary?.symbol_code || "N/A";
        const [emojiDay] = getWeatherDescription(symbolDay).split(" ");
        forecast.push({ day, emoji: emojiDay });
        seenDays.add(day);
      }

      if (forecast.length >= 3) break;
    }

    // --- Dessiner la barre arrondie ---
    const barHeight = 50;
    const radius = 20;
    const barY = H - barHeight;

    ctx.fillStyle = "rgba(151, 72, 89, 0.95)";
    ctx.beginPath();
    ctx.moveTo(0, barY);
    ctx.lineTo(W, barY);
    ctx.lineTo(W, H - radius);
    ctx.quadraticCurveTo(W, H, W - radius, H);
    ctx.lineTo(radius, H);
    ctx.quadraticCurveTo(0, H, 0, H - radius);
    ctx.closePath();
    ctx.fill();

    // --- Ajouter les 3 jours avec texte plus gros ---
    const boxWidth = W / 3;
    forecast.forEach((val, i) => {
      const centerX = boxWidth * i + boxWidth / 2;

      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(val.day.toUpperCase(), centerX, barY + 18);

      ctx.font = "20px Arial"; // emoji plus gros
      ctx.fillText(val.emoji, centerX, barY + 38);
    });
  }

  loadWeather();
});



