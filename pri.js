const weatherEmojis = {
  "clearsky_day": "☀️",
  "clearsky_night": "🌙",
  "fair_day": "🌤️",
  "fair_night": "🌙✨",
  "partlycloudy_day": "⛅",
  "partlycloudy_night": "☁️🌙",
  "cloudy": "☁️",
  "lightrain": "🌦️",
  "rain": "🌧️",
  "heavyrain": "🌧️🌧️",
  "snow": "❄️",
  "thunderstorm": "⛈️",
  "fog": "🌫️",
  "N/A": "❓"
};

function getWeatherEmoji(symbol) {
  return weatherEmojis[symbol] || weatherEmojis["N/A"];
}

async function loadWeather() {
  const response = await fetch("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=51.509865&lon=-0.118092");
  const data = await response.json();

  const canvas = document.getElementById("weather-canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  // ---- Fond dégradé + cercles ----
  const grad = ctx.createLinearGradient(0,0,W,H);
  grad.addColorStop(0,"#ec7263");
  grad.addColorStop(1,"#974859");
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  ctx.fillStyle = "rgba(239,199,69,0.4)";
  ctx.beginPath(); ctx.arc(W*0.8,-H*0.8, 300,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(W*0.7,-H*0.7, 210,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(W*0.92,-H*0.35,100,0,Math.PI*2); ctx.fill();

  // ---- Météo actuelle ----
  const current = data.properties.timeseries[0];
  const temp = Math.round(current.data.instant.details.air_temperature);
  const symbol = current.data.next_1_hours?.summary?.symbol_code || "N/A";
  const emoji = getWeatherEmoji(symbol);
  const city = "London";

  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  ctx.fillText(emoji, 10, 20);
  ctx.fillText(symbol.replace(/_/g," "), 30, 20);
  
  ctx.font = "28px Arial";
  ctx.fillText(`${temp}°`, 10, 50);

  ctx.font = "18px Arial";
  ctx.textAlign = "right";
  ctx.fillText(city, W-10, 30);
  ctx.textAlign = "left"; // reset

  // ---- 3 prochains jours ----
  const forecastDays = {};
  let today = new Date().toLocaleDateString("fr-FR", { weekday: "short" });

  for (let item of data.properties.timeseries) {
    const d = new Date(item.time);
    const day = d.toLocaleDateString("fr-FR", { weekday: "short" });
    if (day === today) continue;

    if (!forecastDays[day] && d.getHours() >= 9 && d.getHours() <= 18) {
      // symbol le plus fréquent entre 9h et 18h
      const sym = item.data.next_6_hours?.summary?.symbol_code || "N/A";
      forecastDays[day] = getWeatherEmoji(sym);
    }

    if (Object.keys(forecastDays).length >= 3) break;
  }

  // ---- Barre arrondie ----
  const barHeight = 40;
  const barY = H - barHeight;
  const radius = 25;
  ctx.fillStyle = "#974859";
  ctx.beginPath();
  ctx.moveTo(0, barY);
  ctx.lineTo(W, barY);
  ctx.lineTo(W, H-radius);
  ctx.quadraticCurveTo(W, H, W-radius, H);
  ctx.lineTo(radius, H);
  ctx.quadraticCurveTo(0,H,0,H-radius);
  ctx.closePath();
  ctx.fill();

  // ---- Dessiner les 3 prochains jours ----
  const keys = Object.keys(forecastDays);
  const boxWidth = W / 3;
  ctx.font = "14px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  keys.forEach((day,i)=>{
    const x = i*boxWidth + boxWidth/2;
    ctx.fillText(day.toUpperCase(), x, barY+15);
    ctx.fillText(forecastDays[day], x, barY+35);
  });
  ctx.textAlign = "left"; // reset
}

loadWeather();
