let savedLines = JSON.parse(localStorage.getItem('savedLines')) || [];
let displayedNotifications = new Set(JSON.parse(localStorage.getItem('displayedNotifications')) || []);
let myMessages = new Set(); // Pour distinguer mes messages des messages reçus

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
// ✉️ Fonction pour envoyer un message - CORRIGÉE
// -------------------------
function drawText() {
  const noteInput = document.getElementById('noteInput');
  const message = noteInput.value.trim();
  
  if (!message) return;

  // Marquer comme message envoyé
  myMessages.add(message);
  savedLines.push(message);
  localStorage.setItem('savedLines', JSON.stringify(savedLines));
  
  // Vider l'input
  noteInput.value = '';
  
  // Redessiner immédiatement (message bleu à droite)
  redrawTextDiv(true);
  
  // Envoyer au serveur
  fetch('/getText2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: message })
  })
  .then(response => response.json())
  .then(data => {
    console.log("Message envoyé avec succès");
  })
  .catch(e => {
    console.error("Erreur envoi message:", e);
  });
}

// -------------------------
// 📡 Récupération des nouveaux messages - CORRIGÉE
// -------------------------
function fetchText() {
  fetch("/getText")
    .then(res => res.json())
    .then(newLines => {
      let hasNewMessages = false;
      
      newLines.forEach(line => {
        if (!savedLines.includes(line)) {
          savedLines.push(line);
          hasNewMessages = true;
        }
        if (!displayedNotifications.has(line) && !myMessages.has(line)) {
          addNotification(line);
          displayedNotifications.add(line);
          localStorage.setItem('displayedNotifications', JSON.stringify([...displayedNotifications]));
        }
      });

      if (hasNewMessages) {
        localStorage.setItem('savedLines', JSON.stringify(savedLines));
        redrawTextDiv();
      }
    })
    .catch(e => {
      console.error("Erreur fetch /getText:", e);
    });
}

// -------------------------
// ✏️ Affiche les messages dans le DIV - CORRIGÉE
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

  savedLines.forEach(msg => {
    const bubble = document.createElement("div");
    bubble.innerText = msg;
    
    // ✅ CORRECTION : Utiliser myMessages pour une distinction claire
    const isMyMessage = myMessages.has(msg);
    
    bubble.style.background = isMyMessage ? "#007bff" : "#666"; // Bleu pour mes messages, gris pour les autres
    bubble.style.borderRadius = "15px";
    bubble.style.display = "inline-block";
    bubble.style.maxWidth = "180px";
    bubble.style.padding = "8px 12px";
    bubble.style.wordWrap = "break-word";
    bubble.style.marginLeft = isMyMessage ? "auto" : "0"; // ✅ À droite pour mes messages
    bubble.style.marginRight = isMyMessage ? "0" : "auto"; // ✅ À gauche pour les autres
    
    div.appendChild(bubble);
  });

  if (autoScroll && wasAtBottom) {
    div.scrollTop = div.scrollHeight;
  }
}

// -------------------------
// ⚡ Init au chargement - CORRIGÉE
// -------------------------
window.addEventListener('load', function () {
  // Charger les données sauvegardées
  const saved = localStorage.getItem("savedLines");
  if (saved) {
    savedLines = JSON.parse(saved);
  }

  const savedDisplayed = localStorage.getItem("displayedNotifications");
  if (savedDisplayed) {
    displayedNotifications = new Set(JSON.parse(savedDisplayed));
  }

  // Charger myMessages depuis le localStorage
  const savedMyMessages = localStorage.getItem("myMessages");
  if (savedMyMessages) {
    myMessages = new Set(JSON.parse(savedMyMessages));
  }

  // Afficher les messages
  redrawTextDiv();

  // Gestion du scroll
  const textDiv = document.getElementById("textdiv");
  if (textDiv) {
    textDiv.addEventListener("scroll", () => {
      redrawTextDiv(false);
    });
  }

  // Ajouter l'événement Enter sur l'input
  const noteInput = document.getElementById('noteInput');
  if (noteInput) {
    noteInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        drawText();
      }
    });
  }

  // Sauvegarder myMessages périodiquement
  setInterval(() => {
    localStorage.setItem("myMessages", JSON.stringify([...myMessages]));
  }, 1000);

  // Démarrer les intervalles
  fetchText();
  setInterval(fetchText, 3000);
});
