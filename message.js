let savedLines = JSON.parse(localStorage.getItem('savedLines')) || [];
let myMessages = JSON.parse(localStorage.getItem('myMessages')) || [];


let textDivScroll = 0;
let textDivScrollMax = 0;
const TEXT_SCROLL_STEP = 20;

// -------------------------
// 🔔 Fonction pour afficher une notification animée
// -------------------------
// Liste des anniversaires (nom, jour, mois)
// Liste des anniversaires (nom, jour, mois)
const birthdays = [
    { name: "Mohamed", day: 10, month: 6 }, // Juillet = 6 (0-indexé)
    { name: "Dad", day: 23, month: 9 },    // Octobre = 9
    { name: "Mom", day: 15, month: 4 },    // Mai = 4
    { name: "Bilal", day: 3, month: 11 }, // Décembre = 11
    { name: "Assya", day: 3, month: 11 },
    { name: "Zackaria", day: 3, month: 11 }// Décembre = 11
];

// Vérification des anniversaires
function checkBirthdays() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth(); // 0-indexé (0 = janvier, 11 = décembre)
    
    // Vérifier chaque anniversaire
    for (const person of birthdays) {
        if (person.day === currentDay && person.month === currentMonth) {
            // C'est l'anniversaire de cette personne!
            let message, prefix;
            

            if (person.name === "Dad") {
                prefix = "🎂";
                message = `It's your ${person.name}'s birthday`;
            }
            else if (person.name === "Mom") {
                prefix = "🎂";
                message = `It's your ${person.name}'s birthday`;
            } else {
                prefix = "🎉";
                message = `It's ${person.name}'s birthday`;
            }
            
            addNotification(message, prefix);
            console.log(`Anniversaire détecté pour ${person.name}!`);
            return;
        }
    }
    
    console.log(`Aucun anniversaire aujourd'hui (${today.toLocaleDateString()})`);
}

// Système de notifications modifié
let displayedNotifications = new Set(JSON.parse(localStorage.getItem('displayedNotifications')) || []);

function addNotification(message, prefix = "Notification") {
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
        notif.innerHTML = `<strong>${prefix}:</strong>&nbsp;`;
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

// Vérification automatique au chargement
window.addEventListener('load', () => {
    // Vérifier les anniversaires après 3 secondes
    setTimeout(checkBirthdays, 3000);
});

// Pour tester manuellement depuis la console
window.testBirthdayCheck = function() {
    checkBirthdays();
};

// Pour simuler une date spécifique (utile pour le débogage)
window.simulateDate = function(day, month) {
    const originalDate = Date;
    
    // Créer une date simulée
    const simulatedDate = new Date();
    simulatedDate.setMonth(month);
    simulatedDate.setDate(day);
    
    // Remplacer temporairement le constructeur Date
    global.Date = class extends Date {
        constructor() {
            return simulatedDate;
        }
    };
    
    // Vérifier les anniversaires avec la date simulée
    checkBirthdays();
    
    // Restaurer le constructeur Date original après un délai
    setTimeout(() => {
        global.Date = originalDate;
    }, 5000);
};

console.log("Système de notifications d'anniversaires chargé!");
console.log("Utilisez testBirthdayCheck() pour vérifier manuellement les anniversaires");
console.log("Utilisez simulateDate(10, 6) pour simuler le 10 juillet (anniversaire de Mohamed)");
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
      // Vérifier si le message n'existe pas déjà dans savedLines
      const exists = savedLines.some(msg => 
        typeof msg === 'string' ? msg === line : msg.text === line
      );
      
      if (!exists) {
        // Ajouter avec timestamp
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
// ✏️ Affiche les messages dans le DIV (AVEC Z-INDEX)
// -------------------------
function redrawTextDiv(autoScroll = true) {
  const div = document.getElementById('textdiv');
  if (!div) return;

  const wasAtBottom = div.scrollHeight - div.scrollTop <= div.clientHeight + 5;

  div.style.width = "250px";
  div.style.height = "321px";
  div.style.overflowY = "auto";
  div.style.background = "rgba(255, 255, 255, 0)";
  div.style.color = "white";
  div.style.font = "20px Arial";
  div.style.padding = "10px";
  div.style.display = "flex";
  div.style.flexDirection = "column";
  div.style.gap = "10px";
  div.style.zIndex = "7000"; // Z-INDEX DU DIV PRINCIPAL
  div.style.position = "relative"; // Nécessaire pour z-index

  div.innerHTML = "";

  // COMBINER TOUS LES MESSAGES
  const allMessages = [];

  // Convertir savedLines
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

  // Convertir myMessages
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

  // AFFICHER DANS L'ORDRE
  allMessages.forEach(message => {
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
    bubble.style.zIndex = "7200"; // Z-INDEX DES BULLES
    bubble.style.position = "relative"; // Nécessaire pour z-index
    
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
      localStorage.setItem('myMessages', JSON.stringify(myMessages));
    } else {
      myMessages = parsed;
    }
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
});
