let savedLines = JSON.parse(localStorage.getItem('savedLines')) || [];
let displayedNotifications = new Set(JSON.parse(localStorage.getItem('displayedNotifications')) || []);

let textDivScroll = 0;
let textDivScrollMax = 0;
const TEXT_SCROLL_STEP = 20;

// -------------------------
// ✏️ Fonction pour envoyer le message
// -------------------------
async function drawText() {
  const input = document.getElementById('noteInput');
  const message = input.value.trim();
  
  if (message === '') return;

  // Ajouter le message localement à droite en bleu
  const messageObj = { 
    text: message, 
    type: 'sent', // Pour identifier les messages envoyés
    timestamp: Date.now()
  };
  
  savedLines.push(messageObj);
  localStorage.setItem('savedLines', JSON.stringify(savedLines));
  
  // Réafficher les messages
  redrawTextDiv();
  
  // Envoyer le message à l'ESP32
  try {
    await fetch('http://quickchat.local/getText2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'text=' + encodeURIComponent(message)
    });
    console.log('Message envoyé avec succès');
  } catch (error) {
    console.error('Erreur envoi message:', error);
  }
  
  // Vider le champ de saisie
  input.value = '';
  input.focus();
}

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
// 📡 Récupération des nouveaux messages
// -------------------------
async function fetchText() {
  try {
    const res = await fetch("/getText");
    const newLines = await res.json();

    newLines.forEach(line => {
      // Vérifier si c'est un nouveau message (string simple)
      const isNewString = typeof line === 'string' && !savedLines.some(msg => 
        typeof msg === 'string' ? msg === line : msg.text === line
      );
      
      // Vérifier si c'est un nouvel objet message
      const isNewObject = typeof line === 'object' && !savedLines.some(msg => 
        typeof msg === 'object' && msg.text === line.text
      );

      if (isNewString || isNewObject) {
        // Les messages reçus n'ont pas de type 'sent', donc ils apparaîtront à gauche
        savedLines.push(line);
        
        // Notification uniquement pour les messages reçus (pas les envoyés)
        if (!displayedNotifications.has(typeof line === 'string' ? line : line.text)) {
          addNotification(typeof line === 'string' ? line : line.text);
          displayedNotifications.add(typeof line === 'string' ? line : line.text);
          localStorage.setItem('displayedNotifications', JSON.stringify([...displayedNotifications]));
        }
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
    
    // Convertir les strings simples en objets pour la cohérence
    const normalizedData = data.map(item => 
      typeof item === 'string' ? { text: item, type: 'received' } : item
    );
    
    // Garder les messages envoyés locaux qui ne sont pas dans les données reçues
    const localSentMessages = savedLines.filter(msg => 
      typeof msg === 'object' && msg.type === 'sent'
    );
    
    savedLines = [...normalizedData, ...localSentMessages];
    localStorage.setItem('savedLines', JSON.stringify(savedLines));
    redrawTextDiv();
  } catch(e) {
    console.error("Erreur check clear:", e);
  }
}
setInterval(checkClearSignal, 2000);

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

  savedLines.forEach(msg => {
    const bubble = document.createElement("div");
    
    // Déterminer si c'est un message envoyé ou reçu
    const isSent = msg.type === 'sent' || msg.hasOwnProperty('type');
    
    bubble.innerText = typeof msg === 'string' ? msg : msg.text;
    
    if (isSent) {
      // Message envoyé - à droite en bleu
      bubble.style.background = "#007bff"; // Bleu
      bubble.style.borderRadius = "15px";
      bubble.style.padding = "8px 12px";
      bubble.style.maxWidth = "180px";
      bubble.style.wordWrap = "break-word";
      bubble.style.marginLeft = "auto"; // Aligne à droite
      bubble.style.marginRight = "0";
      bubble.style.color = "white";
    } else {
      // Message reçu - à gauche en gris
      bubble.style.background = "#666";
      bubble.style.borderRadius = "15px";
      bubble.style.padding = "8px 12px";
      bubble.style.maxWidth = "180px";
      bubble.style.wordWrap = "break-word";
      bubble.style.marginRight = "auto"; // Aligne à gauche
      bubble.style.color = "white";
    }
    
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
    // Convertir les anciens messages strings en objets
    savedLines = JSON.parse(saved).map(msg => 
      typeof msg === 'string' ? { text: msg, type: 'received' } : msg
    );
    redrawTextDiv();
  }

  const savedDisplayed = localStorage.getItem("displayedNotifications");
  if (savedDisplayed) {
    displayedNotifications = new Set(JSON.parse(savedDisplayed));
  }

  const textDiv = document.getElementById("textdiv");
  if (textDiv) {
    textDiv.addEventListener("scroll", () => {
      // si l'utilisateur scrolle manuellement, on désactive l'auto-scroll
      redrawTextDiv(false);
    });
  }

  // Permettre l'envoi avec la touche Entrée
  const noteInput = document.getElementById('noteInput');
  if (noteInput) {
    noteInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        drawText();
      }
    });
  }

  fetchText();
  setInterval(fetchText, 3000);
});
