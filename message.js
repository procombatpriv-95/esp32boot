#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <HTTPClient.h>
#define LED 2

const char* ssids[] = { "VM3268647", "Livebox-6A10" };
const char* passwords[] = { "dr5aGyxudyptnWbz", "2v5KxmEzqPYqhf44tb" };
const int nbNetworks = 2;
String connectedSSID = "";
String connectedPassword = ""; 
WebServer server(80);

// --- état d'ESP32-2 ---
struct idStatus {
  unsigned long lastPing = 0;
  unsigned long lastMenuPing = 0;
  bool online = false;
  bool menuOpen = false;
} id;

// Stockage des messages
String receivedMessages[50];
int messageCount = 0;

void connectWiFi() {
  for (int i = 0; i < nbNetworks; i++) {
    Serial.print("Tentative de connexion à : ");
    Serial.println(ssids[i]);
    WiFi.begin(ssids[i], passwords[i]);

    unsigned long startAttemptTime = millis();

    while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
      delay(500);
      Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("");
      Serial.print("Connecté à ");
      Serial.println(ssids[i]);
      Serial.print("Adresse IP: ");
      Serial.println(WiFi.localIP());

      connectedSSID = String(ssids[i]);
      connectedPassword = String(passwords[i]);
      digitalWrite(LED, HIGH);
      return;
    } else {
      digitalWrite(LED, LOW);
      Serial.println("");
      Serial.print("Échec connexion à ");
      Serial.println(ssids[i]);
    }
  }

  Serial.println("Aucun réseau trouvé, réessayer plus tard...");
  connectedSSID = "N/A";
  connectedPassword = "";
}

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  connectWiFi();

  if (MDNS.begin("quickchat")) {
    Serial.println("mDNS démarré : http://quickchat.local");
  }

  // --- Routes de communication ---
  server.on("/ping", []() {
    id.lastPing = millis();
    id.online = true;
    server.send(200, "text/plain", "pong");
  });

  server.on("/menuPing", []() {
    id.lastMenuPing = millis();
    id.menuOpen = true;
    id.online = true;
    server.send(200, "text/plain", "menuPong");
  });

  server.on("/idstatus", []() {
    String json = "{";
    json += "\"online\":" + String(id.online ? "true" : "false") + ",";
    json += "\"menuOpen\":" + String(id.menuOpen ? "true" : "false");
    json += "}";
    server.send(200, "application/json", json);
  });

  // Route pour recevoir les messages de l'autre ESP32
  server.on("/getText2", HTTP_POST, []() {
    if (server.hasArg("plain")) {
      String message = server.arg("plain");
      Serial.println("Message reçu: " + message);
      
      // Extraire le texte du JSON
      int start = message.indexOf("\"message\":\"") + 11;
      int end = message.indexOf("\"", start);
      if (start != -1 && end != -1) {
        String textContent = message.substring(start, end);
        
        // Stocker le message reçu
        if (messageCount < 50) {
          receivedMessages[messageCount] = textContent;
          messageCount++;
        }
        
        server.send(200, "application/json", "{\"status\":\"received\"}");
      } else {
        server.send(400, "application/json", "{\"error\":\"Invalid format\"}");
      }
    } else {
      server.send(400, "application/json", "{\"error\":\"No data\"}");
    }
  });

  // Route pour récupérer tous les messages
  server.on("/getText", []() {
    String json = "[";
    for (int i = 0; i < messageCount; i++) {
      if (i > 0) json += ",";
      json += "\"" + receivedMessages[i] + "\"";
    }
    json += "]";
    server.send(200, "application/json", json);
  });

  // --- Page principale AVEC CANVAS ORIGINAL ---
  server.on("/", []() {
    String html = R"rawliteral(
<!DOCTYPE html>
<html>
<body>
<style>
  body { background-color: black; color: white; text-align: center; margin: 0; }
  #statusDot, #statusDot2 { width:15px; height:15px; border-radius:50%; background:red; margin-right:10px; }
  h1 { font-size: 70px; }
</style>

<h1>Quickchat</h1>

<div style="display:flex; align-items:center; justify-content:center; margin-bottom: 5px;">
  <div id="statusDot2"></div>
  <span id="statusText">Offline</span>
</div>

<center>
<canvas id="myCanvas" width="900" height="300" style="background-color:black; display:block; margin:20px auto; border-radius:20px;"></canvas><br>

<div style="display:flex; align-items:center; justify-content:center; margin-top:10px;">
  <div id="statusDot"></div>
  <input type="text" id="noteInput" placeholder="write here" style="padding:12px; border-radius:50px; border:none; outline:none; background-color:white; color:black; font-size:16px; width:775px; height:30px;">
  <button onclick="drawText()" style="background-color:white; border:none; border-radius:50%; width:50px; height:50px; cursor:pointer; margin-left:10px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5 12 12 5 19 12"/>
    </svg>
  </button>
  <button onclick="clearCanvas()" style="background-color:white; border:none; border-radius:50%; width:50px; height:50px; cursor:pointer; margin-left:5px;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 6h18"></path>
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  </button>
</div>
</center>

<script>
let savedLines = JSON.parse(localStorage.getItem('savedLines') || '[]');
let scrollOffset = 0;

// Stocker les messages envoyés vs reçus
let myMessages = new Set();

function getCurrentStatus() {
  let dot = document.getElementById("statusDot");
  return (dot && dot.style.background === "green") ? "received" : "sent";
}

// Fonction pour envoyer un message
async function drawText() {
  let text = document.getElementById('noteInput').value.trim();
  if (text !== "") {
    // Marquer comme message envoyé
    myMessages.add(text);
    savedLines.push(text);
    localStorage.setItem('savedLines', JSON.stringify(savedLines));
    
    // Envoyer à l'autre ESP32 via /getText2
    try {
      await fetch("/getText2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
    } catch(err) {
      console.error("Erreur envoi texte :", err);
    }
    
    document.getElementById('noteInput').value = "";
    autoScroll();
  }
  redrawCanvas();
}

function measureTotalHeight(ctx, messages) {
  const padding = 15;
  const lineHeight = 30;
  const maxWidth = ctx.canvas.width - 40;
  let totalHeight = 20;

  messages.forEach(msg => {
    ctx.font = "20px Arial";
    const words = msg.split(" ");
    let line = "", lines = [];
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
        lines.push(line);
        line = words[i] + " ";
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);

    const bubbleHeight = lines.length * lineHeight + 20;
    totalHeight += bubbleHeight + 40;
  });

  return totalHeight;
}

function redrawCanvas() {
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 15;
  const lineHeight = 30;
  const maxWidth = canvas.width - 40;
  let y = 20 - scrollOffset;

  function roundRect(ctx, x, y, w, h, r) {
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

  savedLines.forEach((msg, idx) => {
    const isMyMessage = myMessages.has(msg);
    
    ctx.font = "20px Arial";
    ctx.textAlign = isMyMessage ? "right" : "left";

    // Découpe du texte
    const words = msg.split(" ");
    let line = "", lines = [];
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      if (ctx.measureText(testLine).width > maxWidth && i > 0) {
        lines.push(line);
        line = words[i] + " ";
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);

    const bubbleHeight = lines.length * lineHeight + 20;
    const bubbleWidth = Math.min(maxWidth, Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2);
    
    // Position différente selon si c'est mon message ou non
    const bubbleX = isMyMessage ? canvas.width - bubbleWidth - 10 : 10;

    // Couleur différente selon l'expéditeur
    ctx.fillStyle = isMyMessage ? "#2196F3" : "#666"; // Bleu pour moi, gris pour les autres
    
    roundRect(ctx, bubbleX, y, bubbleWidth, bubbleHeight, 15);
    ctx.fill();

    // Texte
    ctx.fillStyle = "white";
    lines.forEach((l, i) => {
      const textX = isMyMessage ? canvas.width - padding : padding;
      ctx.fillText(l, textX, y + 25 + (i * lineHeight));
    });

    // Statut sous la bulle
    ctx.font = "14px Arial";
    ctx.fillStyle = "gray";
    ctx.textAlign = isMyMessage ? "right" : "left";
    const statusX = isMyMessage ? bubbleX + bubbleWidth : bubbleX;
    ctx.fillText(isMyMessage ? "sent" : "received", statusX, y + bubbleHeight + 15);

    y += bubbleHeight + 40;
  });
}

function autoScroll() {
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');
  const totalHeight = measureTotalHeight(ctx, savedLines);

  scrollOffset = Math.max(0, totalHeight - canvas.height);
  redrawCanvas();
}

// Scroll manuel
document.getElementById('myCanvas').addEventListener("wheel", (e) => {
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');
  const totalHeight = measureTotalHeight(ctx, savedLines);

  scrollOffset += e.deltaY;

  if (scrollOffset < 0) scrollOffset = 0;
  const maxOffset = Math.max(0, totalHeight - canvas.height);
  if (scrollOffset > maxOffset) scrollOffset = maxOffset;

  redrawCanvas();
});

function clearCanvas() {
  savedLines = [];
  myMessages.clear();
  localStorage.setItem('savedLines', JSON.stringify(savedLines));
  scrollOffset = 0;
  redrawCanvas();
  fetch("/clearMessages", { method: "POST" }).catch(err => console.error("Erreur envoi clear :", err));
}

// Fonction pour récupérer les nouveaux messages
async function fetchNewMessages() {
  try {
    const res = await fetch("/getText");
    const newMessages = await res.json();
    
    newMessages.forEach(msg => {
      if (!savedLines.includes(msg)) {
        savedLines.push(msg);
        // Les messages du serveur sont considérés comme reçus (pas dans myMessages)
      }
    });
    
    localStorage.setItem('savedLines', JSON.stringify(savedLines));
    redrawCanvas();
  } catch(e) {
    console.error("Erreur fetch messages:", e);
  }
}

function updateStatus() {
  fetch("/idstatus")
    .then(res => res.json())
    .then(data => {
      let dot = document.getElementById("statusDot");
      let dot2 = document.getElementById("statusDot2");
      let statusText = document.getElementById("statusText");

      if (!data.online) {
        dot.style.background = "red";
        dot2.style.background = "red";
        statusText.textContent = "Offline";
        statusText.style.fontSize = "40px";
      } else if (data.menuOpen) {
        dot.style.background = "green";
        dot2.style.background = "green";
        statusText.textContent = "Online";
        statusText.style.fontSize = "40px";
      } else {
        dot.style.background = "blue";
        dot2.style.background = "blue";
        statusText.textContent = "Available";
        statusText.style.fontSize = "40px";
      }
    })
    .catch(() => {
      document.getElementById("statusDot").style.background = "red";
      document.getElementById("statusDot2").style.background = "red";
      document.getElementById("statusText").textContent = "Offline";
    });
}

window.onload = () => {
  redrawCanvas();
  updateStatus();
  setInterval(updateStatus, 2000);
  setInterval(fetchNewMessages, 3000);
  
  // Enter pour envoyer
  document.getElementById('noteInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      drawText();
    }
  });
};
</script>
</body>
</html>
)rawliteral";
    server.send(200, "text/html", html);
  });

  // Route pour effacer les messages
  server.on("/clearMessages", HTTP_POST, []() {
    messageCount = 0;
    server.send(200, "application/json", "{\"status\":\"cleared\"}");
  });

  server.begin();
}

unsigned long lastPingTime = 0;

void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (id.online && now - id.lastPing > 3700) {
    id.online = false;
    id.menuOpen = false;
  }
  if (id.menuOpen && now - id.lastMenuPing > 3000) {
    id.menuOpen = false;
  }
}
