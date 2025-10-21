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

    // AJOUTER LE MESSAGE À myMessages AVEC TIMESTAMP
    myMessages.push({
      text: message,
      timestamp: Date.now(),
      isMyMessage: true
    });
    
    // LIMITER À 3 MESSAGES BLEUS MAXIMUM
    if (myMessages.length > 3) {
      myMessages = myMessages.slice(-3);
    }
    
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

    let updated = false;
    
    newLines.forEach(line => {
      const exists = savedLines.some(msg => 
        typeof msg === 'string' ? msg === line : msg.text === line
      );
      
      if (!exists) {
        savedLines.push({
          text: line,
          timestamp: Date.now(),
          isMyMessage: false
        });
        updated = true;
      }
      
      if (!displayedNotifications.has(line)) {
        addNotification(line);
        displayedNotifications.add(line);
        localStorage.setItem('displayedNotifications', JSON.stringify([...displayedNotifications]));
      }
    });

    if (updated) {
      localStorage.setItem('savedLines', JSON.stringify(savedLines));
      redrawTextDiv();
    }
  } catch(e) {
    console.error("Erreur fetch /getText:", e);
  }
}

// -------------------------
// ✏️ Affiche les messages dans le DIV (COMPLÈTE)
// -------------------------
function redrawTextDiv(autoScroll = true) {
  const div = document.getElementById('textdiv');
  if (!div) return;

  const wasAtBottom = div.scrollHeight - div.scrollTop <= div.clientHeight + 5;

  // Vider le contenu mais garder la structure
  let messageContainer = div.querySelector('.message-container');
  if (!messageContainer) {
    // Créer le conteneur de messages s'il n'existe pas
    messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    div.innerHTML = '';
    div.appendChild(messageContainer);
  } else {
    messageContainer.innerHTML = '';
  }

  // COMBINER TOUS LES MESSAGES
  const allMessages = [];

  // Convertir savedLines (messages gris)
  savedLines.forEach(msg => {
    if (typeof msg === 'string') {
      allMessages.push({
        text: msg,
        timestamp: Date.now(),
        isMyMessage: false
      });
    } else {
      allMessages.push(msg);
    }
  });

  // Convertir myMessages (messages bleus)
  myMessages.forEach(msg => {
    if (typeof msg === 'string') {
      allMessages.push({
        text: msg,
        timestamp: Date.now(),
        isMyMessage: true
      });
    } else {
      allMessages.push(msg);
    }
  });

  // TRIER PAR TIMESTAMP (plus ancien en premier)
  allMessages.sort((a, b) => a.timestamp - b.timestamp);

  // AFFICHER DANS L'ORDRE AVEC LES CLASSES CSS
  allMessages.forEach(message => {
    const messageDiv = document.createElement('div');
    messageDiv.className = message.isMyMessage ? 'message message-user' : 'message message-other';
    
    const textDiv = document.createElement('div');
    textDiv.textContent = message.text;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date(message.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    messageDiv.appendChild(textDiv);
    messageDiv.appendChild(timeDiv);
    
    messageContainer.appendChild(messageDiv);
  });

  if (autoScroll && wasAtBottom) {
    div.scrollTop = div.scrollHeight;
  }
}

// -------------------------
// ⚡ Init au chargement (COMPLÈTE)
// -------------------------
window.addEventListener('load', function () {
  console.log("🚀 Initialisation du chat...");

  // Charger et migrer les données
  const saved = localStorage.getItem("savedLines");
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.length > 0 && typeof parsed[0] === 'string') {
      savedLines = parsed.map(text => ({
        text: text,
        timestamp: Date.now(),
        isMyMessage: false
      }));
      localStorage.setItem('savedLines', JSON.stringify(savedLines));
    } else {
      savedLines = parsed;
    }
  }

  const savedMyMessages = localStorage.getItem("myMessages");
  if (savedMyMessages) {
    const parsed = JSON.parse(savedMyMessages);
    if (parsed.length > 0 && typeof parsed[0] === 'string') {
      myMessages = parsed.map(text => ({
        text: text,
        timestamp: Date.now(),
        isMyMessage: true
      }));
    } else {
      myMessages = parsed;
    }
    
    // LIMITER À 3 MESSAGES BLEUS AU CHARGEMENT
    if (myMessages.length > 3) {
      myMessages = myMessages.slice(-3);
      localStorage.setItem('myMessages', JSON.stringify(myMessages));
    }
  }

  const savedDisplayed = localStorage.getItem("displayedNotifications");
  if (savedDisplayed) {
    displayedNotifications = new Set(JSON.parse(savedDisplayed));
  }

  // Afficher les messages initiaux
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

  // Démarrer la récupération des messages
  fetchText();
  setInterval(fetchText, 3000);

  console.log("✅ Chat initialisé avec succès!");
  console.log(`📊 Messages chargés: ${savedLines.length} gris, ${myMessages.length} bleus`);
});

// -------------------------
// 🔄 Gestion de la navigation (si nécessaire)
// -------------------------
document.addEventListener('DOMContentLoaded', function() {
  // Gestion des onglets de navigation
  const navItems = document.querySelectorAll('.nav-item');
  const highlight = document.querySelector('.highlight2');
  const slider = document.querySelector('.sliderpetitpage');
  
  if (navItems.length > 0 && highlight && slider) {
    navItems.forEach(item => {
      item.addEventListener('click', function() {
        const target = this.getAttribute('data-target');
        
        // Mettre à jour l'onglet actif
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        // Déplacer le highlight
        const itemRect = this.getBoundingClientRect();
        const containerRect = this.parentElement.getBoundingClientRect();
        
        highlight.style.width = `${itemRect.width}px`;
        highlight.style.transform = `translateX(${itemRect.left - containerRect.left}px)`;
        
        // Déplacer le slider
        slider.style.transform = `translateX(-${target * 100}%)`;
      });
    });
  }
});
