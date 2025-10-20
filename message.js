let savedLines = JSON.parse(localStorage.getItem('savedLines')) || [];
let displayedNotifications = new Set(JSON.parse(localStorage.getItem('displayedNotifications')) || []);
let myMessages = new Set(JSON.parse(localStorage.getItem('myMessages')) || []);

let textDivScroll = 0;
let textDivScrollMax = 0;
const TEXT_SCROLL_STEP = 20;

// -------------------------
// 🔔 Fonction pour afficher une notification animée
// -------------------------
function addNotification(message) {
  const container = document.getElementById("notification-container");
  if (!container) return;

  // ✅ Limite à 3 notifs visibles
  if (container.children.length >= 1) {
    container.removeChild(container.firstChild); // supprime la plus ancienne
  }

  // Rangée qui force l'alignement à droite
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

  // Étape 1 : apparition du rond
  setTimeout(() => { notif.style.opacity = "1"; }, 50);

  // Étape 2 : transformation en bulle
  setTimeout(() => {
    notif.style.transition = "width 1.5s ease, height 1.5s ease, border-radius 1.5s ease";
    notif.style.width = "200px";
    notif.style.height = "auto";
    notif.style.padding = "10px 14px";
    notif.style.borderRadius = "20px";
  }, 2000);

  // Étape 3 : pause avant texte "Notification:"
  setTimeout(() => {
    notif.innerHTML = "<strong>Notification:</strong>&nbsp;";
  }, 4000);

  // Étape 4 : écriture progressive
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
        // reste 2 minutes avant suppression automatique
        setTimeout(() => row.remove(), 1200000);
      }
    }
    typeWriter();
  }, 4200);
}

// -------------------------
// ✉️ Fonction pour ENVOYER un message
// -------------------------
function drawText() {
  const noteInput = document.getElementById('noteInput');
  const message = noteInput.value.trim();
  
  if (!message) return;

  console.log("Envoi du message:", message);
  
  // 1. MARQUER COMME MESSAGE ENVOYÉ
  myMessages.add(message);
  localStorage.setItem('myMessages', JSON.stringify([...myMessages]));
  console.log("myMessages après ajout:", [...myMessages]);
  
  // 2. AJOUTER AUX MESSAGES (uniquement si pas déjà présent)
  if (!savedLines.includes(message)) {
    savedLines.push(message);
    localStorage.setItem('savedLines', JSON.stringify(savedLines));
    console.log("savedLines après ajout:", savedLines);
  }
  
  // 3. VIDER L'INPUT
  noteInput.value = '';
  
  // 4. AFFICHER IMMÉDIATEMENT (BLEU À DROITE)
  redrawTextDiv(true);
  
  // 5. ENVOYER À L'AUTRE ESP32 (optionnel)
  fetch('/getText2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message })
  }).catch(e => console.log("Erreur envoi ESP32:", e));
}

// -------------------------
// 📡 Récupération des nouveaux messages
// -------------------------
function fetchText() {
  fetch("/getText")
    .then(res => res.json())
    .then(newLines => {
      console.log("Messages reçus de /getText:", newLines);
      
      let updated = false;
      newLines.forEach(line => {
        // Ajouter seulement si c'est un nouveau message ET que ce n'est pas mon message
        if (!savedLines.includes(line) && !myMessages.has(line)) {
          savedLines.push(line);
          updated = true;
          console.log("Nouveau message reçu:", line);
          
          // Notification
          if (!displayedNotifications.has(line)) {
            addNotification(line);
            displayedNotifications.add(line);
            localStorage.setItem('displayedNotifications', JSON.stringify([...displayedNotifications]));
          }
        }
      });
      
      if (updated) {
        localStorage.setItem('savedLines', JSON.stringify(savedLines));
        redrawTextDiv();
        console.log("savedLines après mise à jour:", savedLines);
      }
    })
    .catch(e => console.error("Erreur fetch /getText:", e));
}

// -------------------------
// ✏️ Affiche les messages dans le DIV
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

  console.log("Affichage des messages. Total:", savedLines.length);
  console.log("myMessages:", [...myMessages]);

  savedLines.forEach(msg => {
    const bubble = document.createElement("div");
    bubble.innerText = msg;
    
    const isMyMessage = myMessages.has(msg);
    console.log(`Message: "${msg}", estMonMessage: ${isMyMessage}`);
    
    bubble.style.background = isMyMessage ? "#007bff" : "#666";
    bubble.style.borderRadius = "15px";
    bubble.style.display = "inline-block";
    bubble.style.maxWidth = "180px";
    bubble.style.padding = "8px 12px";
    bubble.style.wordWrap = "break-word";
    bubble.style.marginLeft = isMyMessage ? "auto" : "0";
    bubble.style.marginRight = isMyMessage ? "0" : "auto";
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
  console.log("=== DÉMARRAGE ===");
  
  // Charger les données
  const saved = localStorage.getItem("savedLines");
  if (saved) {
    savedLines = JSON.parse(saved);
    console.log("savedLines chargés:", savedLines);
  }

  const savedMyMessages = localStorage.getItem("myMessages");
  if (savedMyMessages) {
    myMessages = new Set(JSON.parse(savedMyMessages));
    console.log("myMessages chargés:", [...myMessages]);
  }

  const savedDisplayed = localStorage.getItem("displayedNotifications");
  if (savedDisplayed) {
    displayedNotifications = new Set(JSON.parse(savedDisplayed));
  }

  // Afficher les messages
  redrawTextDiv();

  // Gestion du scroll
  const textDiv = document.getElementById("textdiv");
  if (textDiv) {
    textDiv.addEventListener("scroll", () => {
      // si l'utilisateur scrolle manuellement, on désactive l'auto-scroll
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

  // Démarrer la récupération des messages
  fetchText();
  setInterval(fetchText, 3000);
  
  console.log("=== INITIALISATION TERMINÉE ===");
});
