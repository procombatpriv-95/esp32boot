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
// ✉️ Fonction pour ENVOYER un message
// -------------------------
function drawText() {
  const noteInput = document.getElementById('noteInput');
  const message = noteInput.value.trim();
  
  if (!message) return;

  // 1. MARQUER COMME MESSAGE ENVOYÉ
  myMessages.add(message);
  localStorage.setItem('myMessages', JSON.stringify([...myMessages]));
  
  // 2. AJOUTER AUX MESSAGES (SEULEMENT SI PAS DÉJÀ PRÉSENT)
  if (!savedLines.includes(message)) {
    savedLines.push(message);
    localStorage.setItem('savedLines', JSON.stringify(savedLines));
  }
  
  // 3. VIDER L'INPUT
  noteInput.value = '';
  
  // 4. AFFICHER IMMÉDIATEMENT (BLEU À DROITE)
  redrawTextDiv(true);
  
  // 5. ENVOYER À L'AUTRE ESP32
  fetch('http://quickchat.local/getText2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message })
  })
  .then(response => {
    console.log("Message envoyé à ESP32 2");
  })
  .catch(e => {
    console.log("ESP32 2 non trouvé, mais message affiché");
  });
}

// -------------------------
// 📡 Récupération des messages REÇUS
// -------------------------
function fetchText() {
  fetch("/getText")
    .then(res => res.json())
    .then(newLines => {
      // FILTRER SEULEMENT LES NOUVEAUX MESSAGES QUI NE SONT PAS LES MIENS
      const newReceivedMessages = newLines.filter(line => 
        !savedLines.includes(line) && !myMessages.has(line)
      );
      
      if (newReceivedMessages.length > 0) {
        // AJOUTER LES NOUVEAUX MESSAGES REÇUS
        newReceivedMessages.forEach(line => {
          savedLines.push(line);
          
          // NOTIFICATION SEULEMENT POUR LES VRAIS MESSAGES REÇUS
          if (!displayedNotifications.has(line)) {
            addNotification(line);
            displayedNotifications.add(line);
          }
        });
        
        localStorage.setItem('savedLines', JSON.stringify(savedLines));
        localStorage.setItem('displayedNotifications', JSON.stringify([...displayedNotifications]));
        redrawTextDiv();
      }
    })
    .catch(e => {
      console.error("Erreur fetch /getText:", e);
    });
}

// -------------------------
// ✏️ AFFICHAGE CORRECT DES MESSAGES
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

  // FILTRER ET S'ASSURER QUE TOUS LES MESSAGES SONT DES STRINGS
  savedLines.forEach(msg => {
    // S'ASSURER QUE msg EST UNE STRING
    const messageText = typeof msg === 'string' ? msg : 
                       (msg && msg.text ? msg.text : String(msg));
    
    const bubble = document.createElement("div");
    bubble.innerText = messageText;
    
    // DÉTERMINATION CORRECTE - UNIQUEMENT BASÉE SUR myMessages
    const isMyMessage = myMessages.has(messageText);
    
    bubble.style.background = isMyMessage ? "#007bff" : "#666";
    bubble.style.borderRadius = "15px";
    bubble.style.display = "inline-block";
    bubble.style.maxWidth = "180px";
    bubble.style.padding = "8px 12px";
    bubble.style.wordWrap = "break-word";
    bubble.style.marginLeft = isMyMessage ? "auto" : "0";
    bubble.style.marginRight = isMyMessage ? "0" : "auto";
    
    div.appendChild(bubble);
  });

  if (autoScroll && wasAtBottom) {
    div.scrollTop = div.scrollHeight;
  }
}

// -------------------------
// ⚡ INITIALISATION
// -------------------------
window.addEventListener('load', function () {
  // Charger les données
  const saved = localStorage.getItem("savedLines");
  if (saved) {
    // S'ASSURER QUE TOUS LES ÉLÉMENTS SONT DES STRINGS
    savedLines = JSON.parse(saved).map(msg => 
      typeof msg === 'string' ? msg : 
      (msg && msg.text ? msg.text : String(msg))
    );
  }

  const savedDisplayed = localStorage.getItem("displayedNotifications");
  if (savedDisplayed) {
    displayedNotifications = new Set(JSON.parse(savedDisplayed));
  }

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

  // Enter pour envoyer
  const noteInput = document.getElementById('noteInput');
  if (noteInput) {
    noteInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        drawText();
      }
    });
  }

  // SUPPRIMER checkClearSignal QUI CAUSAIT LA DISPARITION
  fetchText();
  setInterval(fetchText, 3000);
  
  // SAUVEGARDER myMessages RÉGULIÈREMENT
  setInterval(() => {
    localStorage.setItem("myMessages", JSON.stringify([...myMessages]));
  }, 1000);
});
