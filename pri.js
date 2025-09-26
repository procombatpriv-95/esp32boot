const weatherEmojis = {
  "clearsky_day": "☀️ Clear sky",
  "clearsky_night": "🌙 Clear night",
  "fair_day": "🌤️ Nice day",
  "fair_night": "🌙✨ Nice night",
  "partlycloudy_day": "⛅ Cloudy",
  "partlycloudy_night": "☁️🌙 Cloudy night",
  "cloudy": "☁️ Cloudy",
  "lightrain": "🌦️ Light rain",
  "rain": "🌧️ Rain",
  "heavyrain": "🌧️🌧️ Heavy rain",
  "snow": "❄️ Snow",
  "thunderstorm": "⛈️ Orage",
  "fog": "🌫️ Brouillard",
  "N/A": "☁️ Cloudy"
};

function getWeatherDescription(symbol) {
  return weatherEmojis[symbol] || weatherEmojis["N/A"];
}

async function loadWeather() {
  const response = await fetch("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=51.509865&lon=-0.118092");
  const data = await response.json();

  const current = data.properties.timeseries[0];
  const temp = current.data.instant.details.air_temperature;
  const symbol = current.data.next_1_hours?.summary?.symbol_code || "N/A";
  const desc = getWeatherDescription(symbol);

  const [emoji, ...text] = desc.split(" ");
  document.getElementById("weather-icon").textContent = emoji;
  document.getElementById("weather-description").textContent = text.join(" ");
  document.getElementById("temperature").textContent = `${Math.round(temp)}°`;
  document.getElementById("city").textContent = "London";

  // prévisions 3 prochains jours
  const forecastContainer = document.getElementById("forecast");
  forecastContainer.innerHTML = "";
  const days = {};
  let today = new Date().toLocaleDateString("fr-FR", { weekday: "short" });

  for (let item of data.properties.timeseries) {
    const d = new Date(item.time);
    const day = d.toLocaleDateString("fr-FR", { weekday: "short" });

    if (day === today) continue;
    if (!days[day]) {
      const symbolDay = item.data.next_6_hours?.summary?.symbol_code || "N/A";
      const [emojiDay] = getWeatherDescription(symbolDay).split(" ");
      days[day] = { emoji: emojiDay };
    }
    if (Object.keys(days).length >= 3) break;
  }

  for (let [day, val] of Object.entries(days)) {
    const div = document.createElement("div");
    div.className = "day-box";
    div.innerHTML = `<span>${day.toUpperCase()}</span><span class="day-emoji">${val.emoji}</span>`;
    forecastContainer.appendChild(div);
  }
}

// Arrière-plan canvas
function drawBackground() {
  const canvas = document.getElementById("weather-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#ec7263");
  grad.addColorStop(1, "#974859");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(239, 199, 69, 0.4)";
  ctx.beginPath();
  ctx.arc(canvas.width * 0.8, -canvas.height * 0.8, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(canvas.width * 0.7, -canvas.height * 0.7, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(canvas.width * 0.92, -canvas.height * 0.35, 70, 0, Math.PI * 2);
  ctx.fill();
}

drawBackground();
loadWeather();
