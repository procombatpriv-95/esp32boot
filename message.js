// -------------------------
// 🔄 Système de rappels aléatoires
// -------------------------
const reminders = [
    "As-tu appelé ton père ?",
    "Check le XAUUSD !!",
    "As-tu fait la prière ?"
];

let currentReminder = null;
let reminderInterval = null;

// Fonction pour afficher un rappel aléatoire
function showRandomReminder() {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    // Supprimer l'ancien rappel s'il existe
    const existingReminder = document.getElementById('reminder-notification');
    if (existingReminder) {
        container.removeChild(existingReminder);
    }
    
    // Choisir un nouveau rappel différent du précédent
    let newReminder;
    do {
        newReminder = reminders[Math.floor(Math.random() * reminders.length)];
    } while (newReminder === currentReminder && reminders.length > 1);
    
    currentReminder = newReminder;
    
    // Créer l'élément de notification
    const reminderDiv = document.createElement('div');
    reminderDiv.id = 'reminder-notification';
    reminderDiv.className = 'notification';
    reminderDiv.innerHTML = `<strong>📝 Rappel:</strong> ${currentReminder}`;
    
    // Ajouter au conteneur
    container.appendChild(reminderDiv);
    
    // Démarrer l'animation
    setTimeout(() => {
        reminderDiv.classList.add('show');
        
        // Supprimer après 8 secondes
        setTimeout(() => {
            if (reminderDiv.parentNode === container) {
                reminderDiv.classList.remove('show');
                setTimeout(() => {
                    if (reminderDiv.parentNode === container) {
                        container.removeChild(reminderDiv);
                    }
                }, 1300);
            }
        }, 8000);
    }, 100);
}

// Fonction pour démarrer le cycle de rappels
function startReminderCycle() {
    // Afficher le premier rappel après 2 secondes
    setTimeout(showRandomReminder, 2000);
    
    // Afficher un nouveau rappel toutes les 60 secondes
    reminderInterval = setInterval(showRandomReminder, 60000);
}

// Arrêter le cycle de rappels
function stopReminderCycle() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
    }
    
    // Supprimer le rappel actuel
    const existingReminder = document.getElementById('reminder-notification');
    if (existingReminder && existingReminder.parentNode) {
        existingReminder.parentNode.removeChild(existingReminder);
    }
}

// -------------------------
// Variables globales
// -------------------------
let savedLines = JSON.parse(localStorage.getItem('savedLines')) || [];
let myMessages = JSON.parse(localStorage.getItem('myMessages')) || [];
let textDivScroll = 0;
let textDivScrollMax = 0;
const TEXT_SCROLL_STEP = 20;

// Liste des anniversaires (nom, jour, mois)
const birthdays = [
    { name: "Mohamed", day: 10, month: 6 },
    { name: "Dad", day: 18, month: 6 },
    { name: "Mom", day: 14, month: 3 },
    { name: "Bilal", day: 28, month: 10 },
    { name: "Assya", day: 21, month: 9 },
    { name: "Zackaria", day: 5, month: 4 }
];

// Système de notifications
let displayedNotifications = new Set(JSON.parse(localStorage.getItem('displayedNotifications')) || []);

// -------------------------
// 🔔 Fonction pour afficher une notification animée
// -------------------------
function addNotification(message, prefix = "Notification") {
    const container = document.getElementById("notification-container");
    if (!container) {
        console.error("Container de notifications non trouvé!");
        return;
    }

    // Supprimer l'ancienne notification s'il y en a une
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

    // Animation de la notification
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
                // Supprimer après 20 minutes (1200000 ms)
                setTimeout(() => {
                    if (row.parentNode === container) {
                        container.removeChild(row);
                    }
                }, 1200000);
            }
        }
        typeWriter();
    }, 4200);
}

// -------------------------
// Vérification des anniversaires
// -------------------------
function checkBirthdays() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth(); // 0-indexé (0 = janvier, 11 = décembre)
    
    console.log(`Vérification des anniversaires pour le ${currentDay}/${currentMonth + 1}`);
    
    // Vérifier chaque anniversaire
    for (const person of birthdays) {
        if (person.day === currentDay && person.month === currentMonth) {
            // C'est l'anniversaire de cette personne!
            let message, prefix;

            if (person.name === "Dad" || person.name === "Mom") {
                prefix = "🎂";
                message = `It's your ${person.name}'s birthday`;
            } else {
                prefix = "🎉";
                message = `It's ${person.name}'s birthday`;
            }
            
            console.log(`🎉 Anniversaire détecté pour ${person.name}!`);
            addNotification(message, prefix);
            return;
        }
    }
    
    console.log(`❌ Aucun anniversaire aujourd'hui (${today.toLocaleDateString()})`);
}

// Pour tester manuellement depuis la console
window.testBirthdayCheck = function() {
    console.log("Test manuel des anniversaires...");
    checkBirthdays();
};

// Pour simuler une date spécifique (utile pour le débogage)
window.simulateDate = function(day, month) {
    console.log(`Simulation de la date: ${day}/${month}`);
    
    // Sauvegarder la date originale
    const originalDate = Date;
    
    // Créer une date simulée
    const simulatedDate = new Date();
    simulatedDate.setMonth(month);
    simulatedDate.setDate(day);
    
    // Remplacer temporairement le constructeur Date
    window.Date = class extends Date {
        constructor() {
            return simulatedDate;
        }
        
        static now() {
            return simulatedDate.getTime();
        }
    };
    
    // Vérifier les anniversaires avec la date simulée
    checkBirthdays();
    
    // Restaurer le constructeur Date original après un délai
    setTimeout(() => {
        window.Date = originalDate;
        console.log("Date restaurée");
    }, 10000);
};

// Fonction pour tester une notification normale
window.testNotification = function() {
    addNotification("Ceci est une notification de test!", "🔔");
};

// Fonction pour tester un rappel
window.testReminder = function() {
    showRandomReminder();
};

// -------------------------
// 📝 Fonction pour envoyer un message
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
  
  // Vérification des anniversaires après 3 secondes
  setTimeout(checkBirthdays, 3000);
  
  // Démarrer le cycle de rappels
  startReminderCycle();
});

console.log("✅ Système complet chargé!");
console.log("Commandes disponibles:");
console.log("- testBirthdayCheck() : Vérifier manuellement les anniversaires");
console.log("- simulateDate(10, 6) : Simuler le 10 juillet (anniversaire de Mohamed)");
console.log("- testNotification() : Tester une notification normale");
console.log("- testReminder() : Tester l'affichage d'un rappel");
console.log("- stopReminderCycle() : Arrêter les rappels");
console.log("- startReminderCycle() : Redémarrer les rappels");
