
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
    "N/A": "❓ Inconnu"
  };

  function getWeatherDescription(symbol) {
    return weatherEmojis[symbol] || weatherEmojis["N/A"];
  }

  async function loadWeather() {
    const canvas = document.getElementById("weather-canvas");
    const ctx = canvas.getContext("2d");

    // Nettoyer et remplir le fond
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#ec7263");
    grad.addColorStop(1, "#974859");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Données météo
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

    // --- Haut gauche : météo ---
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.textAlign = "left";
    ctx.fillText(emoji, 10, 25);
    ctx.font = "12px Arial";
    ctx.fillText(label.join(" "), 40, 25);

    // --- Température + humidité ---
    ctx.font = "24px Arial";
    ctx.fillText(`${Math.round(temp)}°`, 10, 70);

    ctx.font = "12px Arial";
    ctx.fillText(`💧 ${humidity}%`, 10, 90);

    // --- Ville (droite) ---
    ctx.font = "14px Arial";
    ctx.textAlign = "right";
    ctx.fillText("London", canvas.width - 10, 25);

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
    const barHeight = 40;
    const radius = 20;
    const barY = canvas.height - barHeight;

    ctx.fillStyle = "rgba(151, 72, 89, 0.95)";
    ctx.beginPath();
    ctx.moveTo(0, barY);
    ctx.lineTo(canvas.width, barY);
    ctx.lineTo(canvas.width, canvas.height - radius);
    ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
    ctx.lineTo(radius, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
    ctx.closePath();
    ctx.fill();

    // --- Ajouter les 3 jours ---
    const boxWidth = canvas.width / 3;
    forecast.forEach((val, i) => {
      const centerX = boxWidth * i + boxWidth / 2;

      ctx.fillStyle = "white";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(val.day.toUpperCase(), centerX, barY + 15);

      ctx.font = "14px Arial";
      ctx.fillText(val.emoji, centerX, barY + 30);
    });
  }

  loadWeather();
});

