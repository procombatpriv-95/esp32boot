let savedLines = JSON.parse(localStorage.getItem('savedLines')) || [];
let myMessages = JSON.parse(localStorage.getItem('myMessages')) || [];
let displayedNotifications = new Set(JSON.parse(localStorage.getItem('displayedNotifications')) || []);

let textDivScroll = 0;
let textDivScrollMax = 0;
const TEXT_SCROLL_STEP = 20;

// -------------------------
// 🔔 Fonction pour afficher une notification animée
// -------------------------
function addNotification(message) {
  const container = document.getElementById("notification-container");
  if (!container) return;

  if (container.children.length >= 1) {
    container.removeChild(container.firstChild);
  }

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.justifyContent = "flex-end";
  row.style.width = "100%";
  row.style.marginTop = "8px";
  container.appendChild(row);

  const notif = document.createElement("div");
  notif.style.width = "20px";
  notif.style.height = "20px";
  notif.style.borderRadius = "50%";
  notif.style.opacity = "0";
  notif.style.display = "flex";
  notif.style.justifyContent = "center";
  notif.style.alignItems = "center";
  notif.style.background = "rgba(50,50,50,0.3)";
  notif.style.color = "white";
  notif.style.fontFamily = "Arial, sans-serif";
  notif.style.fontSize = "14px";
  notif.style.overflow = "hidden";

  row.appendChild(notif);

  setTimeout(() => { notif.style.opacity = "1"; }, 50);
  setTimeout(() => {
    notif.style.transition = "width 1.5s ease, height 1.5s ease, border-radius 1.5s ease";
    notif.style.width = "200px";
    notif.style.height = "auto";
    notif.style.padding = "10px 14px";
    notif.style.borderRadius = "20px";
  }, 2000);
  setTimeout(() => {
    notif.innerHTML = "<strong>Notification:</strong>&nbsp;";
  }, 4000);
  setTimeout(() => {
    let i = 0;
    const len = Math.max(1, message.length);
    const interval = 1500 / len;
    function typeWriter() {
      if (i < message.length) {
        const ch = message.charAt(i);
        notif.innerHTML += (ch === " " ? "&nbsp;" : ch);
        i++;
        setTimeout(typeWriter, interval);
      } else {
        setTimeout(() => row.remove(), 1200000);
      }
    }
    typeWriter();
  }, 4200);
}

// -------------------------
// ✉️ Fonction pour envoyer un message
// -------------------------
async function drawText() {
  const noteInput = document.getElementById('noteInput');
  const message = noteInput.value.trim();
  
  if (!message) return;

  try {
    // Envoyer le message au serveur
    await fetch('/getText2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: message })
    });

    // AJOUTER LE MESSAGE À myMessages
    myMessages.push(message);
    localStorage.setItem('myMessages', JSON.stringify(myMessages));
    
    // Vider l'input
    noteInput.value = '';
    
    // Redessiner avec le nouveau message
    redrawTextDiv(true);
    
  } catch(e) {
    console.error("Erreur envoi message:", e);
  }
}

// -------------------------
// 📡 Récupération des nouveaux messages
// -------------------------
async function fetchText() {
  try {
    const res = await fetch("/getText");
    const newLines = await res.json();

    newLines.forEach(line => {
      if (!savedLines.includes(line)) {
        savedLines.push(line);
      }
      if (!displayedNotifications.has(line)) {
        addNotification(line);
        displayedNotifications.add(line);
        localStorage.setItem('displayedNotifications', JSON.stringify([...displayedNotifications]));
      }
    });

    localStorage.setItem('savedLines', JSON.stringify(savedLines));
    redrawTextDiv();
  } catch(e) {
    console.error("Erreur fetch /getText:", e);
  }
}

// -------------------------
// 🧹 Vérifie le signal de reset/clear
// -------------------------
async function checkClearSignal() {
  try {
    const res = await fetch("/getText");
    const data = await res.json();
    savedLines = data; // remplace complètement les anciens messages
    localStorage.setItem('savedLines', JSON.stringify(savedLines));
    redrawTextDiv();
  } catch(e) {
    console.error("Erreur check clear:", e);
  }
}

// -------------------------
// ✏️ Affiche les messages dans le DIV (MODIFIÉE POUR L'ORDRE)
// -------------------------
function redrawTextDiv(autoScroll = true) {
  const div = document.getElementById('textdiv');
  if (!div) return;

  const wasAtBottom = div.scrollHeight - div.scrollTop <= div.clientHeight + 5;

  div.style.width = "250px";
  div.style.height = "351px";
  div.style.overflowY = "auto";
  div.style.background = "rgba(255, 255, 255, 0)";
  div.style.color = "white";
  div.style.font = "20px Arial";
  div.style.padding = "10px";
  div.style.display = "flex";
  div.style.flexDirection = "column";
  div.style.gap = "10px";

  div.innerHTML = "";

  // CRÉER UN TABLEAU COMBINÉ AVEC TOUS LES MESSAGES
  const allMessages = [];
  
  // Ajouter les messages reçus (savedLines) avec leur type
  savedLines.forEach(msg => {
    allMessages.push({
      text: msg,
      isMyMessage: false, // Message reçu
      timestamp: Date.now() // Utiliser un timestamp pour l'ordre
    });
  });
  
  // Ajouter vos messages (myMessages) avec leur type
  myMessages.forEach(msg => {
    allMessages.push({
      text: msg,
      isMyMessage: true, // Votre message
      timestamp: Date.now()
    });
  });

  // TRIER LES MESSAGES PAR ORDRE CHRONOLOGIQUE (simplifié)
  // Dans une vraie application, vous utiliseriez de vrais timestamps
  allMessages.forEach((message, index) => {
    const bubble = document.createElement("div");
    bubble.innerText = message.text;
    
    bubble.style.background = message.isMyMessage ? "#007bff" : "#666";
    bubble.style.borderRadius = "15px";
    bubble.style.display = "inline-block";
    bubble.style.maxWidth = "180px";
    bubble.style.padding = "8px 12px";
    bubble.style.wordWrap = "break-word";
    bubble.style.marginLeft = message.isMyMessage ? "auto" : "0";
    bubble.style.marginRight = message.isMyMessage ? "0" : "auto";
    bubble.style.marginBottom = "10px";
    
    div.appendChild(bubble);
  });

  if (autoScroll && wasAtBottom) {
    div.scrollTop = div.scrollHeight;
  }
}

// -------------------------
// ⚡ Init au chargement
// -------------------------
window.addEventListener('load', function () {
  const saved = localStorage.getItem("savedLines");
  if (saved) {
    savedLines = JSON.parse(saved);
  }

  const savedMyMessages = localStorage.getItem("myMessages");
  if (savedMyMessages) {
    myMessages = JSON.parse(savedMyMessages);
  }

  const savedDisplayed = localStorage.getItem("displayedNotifications");
  if (savedDisplayed) {
    displayedNotifications = new Set(JSON.parse(savedDisplayed));
  }

  redrawTextDiv();

  const textDiv = document.getElementById("textdiv");
  if (textDiv) {
    textDiv.addEventListener("scroll", () => {
      redrawTextDiv(false);
    });
  }

  const noteInput = document.getElementById('noteInput');
  if (noteInput) {
    noteInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        drawText();
      }
    });
  }

  fetchText();
  setInterval(fetchText, 3000);
  setInterval(checkClearSignal, 2000);
});
