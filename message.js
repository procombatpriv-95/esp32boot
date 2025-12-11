let savedLines = JSON.parse(localStorage.getItem('savedLines')) || [];
let myMessages = JSON.parse(localStorage.getItem('myMessages')) || [];

let textDivScroll = 0;
let textDivScrollMax = 0;
const TEXT_SCROLL_STEP = 20;

// -------------------------
// 📝 Liste des phrases à afficher aléatoirement
// -------------------------
const randomPhrases = [
    "📞: As-tu appelé ton père ?",
    "Check l'XAUUSD !!",
    "🤲: T'as fait la prière ?",
    "La patience et la discipline mènent à la réussite."
];

// Gestionnaire des phrases affichées (avec timestamp)
let displayedRandomPhrases = JSON.parse(localStorage.getItem('displayedRandomPhrases')) || [];

// -------------------------
// 🔔 Fonction pour afficher une notification animée
// -------------------------
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

function addNotification(message, prefix = null, duration = 1200000) {
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
        if (prefix) {
            notif.innerHTML = `<strong>${prefix}:</strong>&nbsp;`;
        } else {
            notif.innerHTML = "";
        }
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
                // Supprimer après la durée spécifiée
                setTimeout(() => {
                    if (row.parentNode === container) {
                        container.removeChild(row);
                    }
                }, duration);
            }
        }
        typeWriter();
    }, prefix ? 4200 : 4000);
}

// -------------------------
// 🎲 Fonction pour afficher une phrase aléatoire
// -------------------------
function showRandomPhrase() {
    // Filtrer les phrases qui ont été affichées il y a moins de 3 heures
    const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
    displayedRandomPhrases = displayedRandomPhrases.filter(phrase => 
        phrase.timestamp > threeHoursAgo
    );
    
    // Si toutes les phrases ont été affichées récemment, ne rien faire
    if (displayedRandomPhrases.length >= randomPhrases.length) {
        return;
    }
    
    // Trouver les phrases qui n'ont pas été affichées récemment
    const availablePhrases = randomPhrases.filter(phraseText => 
        !displayedRandomPhrases.some(phrase => phrase.text === phraseText)
    );
    
    if (availablePhrases.length === 0) {
        return;
    }
    
    // Choisir une phrase aléatoire parmi les disponibles
    const randomIndex = Math.floor(Math.random() * availablePhrases.length);
    const selectedPhrase = availablePhrases[randomIndex];
    
    // Ajouter à l'historique avec timestamp
    displayedRandomPhrases.push({
        text: selectedPhrase,
        timestamp: Date.now()
    });
    
    // Sauvegarder dans localStorage
    localStorage.setItem('displayedRandomPhrases', JSON.stringify(displayedRandomPhrases));
    
    // Afficher la notification SANS PREFIXE
    addNotification(selectedPhrase, null, 10800000); // 3 heures en millisecondes
}

// -------------------------
// 🎂 Vérification des anniversaires
// -------------------------
function checkBirthdays() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    
    console.log(`Vérification des anniversaires pour le ${currentDay}/${currentMonth + 1}`);
    
    for (const person of birthdays) {
        if (person.day === currentDay && person.month === currentMonth) {
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

// -------------------------
// ⚡ Initialisation au chargement
// -------------------------
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, vérification des anniversaires dans 3 secondes...");
    
    // Vérifier les anniversaires après 3 secondes
    setTimeout(checkBirthdays, 3000);
    
    // Afficher une phrase aléatoire au chargement (après 5 secondes)
    setTimeout(showRandomPhrase, 5000);
    
    // Afficher des phrases aléatoires toutes les 30 minutes
    setInterval(showRandomPhrase, 30 * 60 * 1000);
});

// -------------------------
// 🛠️ Fonctions utilitaires pour tests
// -------------------------
window.testBirthdayCheck = function() {
    console.log("Test manuel des anniversaires...");
    checkBirthdays();
};

window.simulateDate = function(day, month) {
    console.log(`Simulation de la date: ${day}/${month}`);
    
    const originalDate = Date;
    const simulatedDate = new Date();
    simulatedDate.setMonth(month);
    simulatedDate.setDate(day);
    
    window.Date = class extends Date {
        constructor() {
            return simulatedDate;
        }
        
        static now() {
            return simulatedDate.getTime();
        }
    };
    
    checkBirthdays();
    
    setTimeout(() => {
        window.Date = originalDate;
        console.log("Date restaurée");
    }, 10000);
};

window.testNotification = function() {
    addNotification("Ceci est une notification de test!", "🔔");
};

// Fonction pour forcer l'affichage d'une phrase aléatoire (pour test)
window.forceRandomPhrase = function() {
    showRandomPhrase();
};

// Fonction pour réinitialiser l'historique des phrases
window.resetRandomPhrases = function() {
    displayedRandomPhrases = [];
    localStorage.setItem('displayedRandomPhrases', JSON.stringify([]));
    console.log("Historique des phrases réinitialisé!");
};

// Fonction pour ajouter une nouvelle phrase à la liste
window.addNewPhrase = function(newPhrase) {
    if (!randomPhrases.includes(newPhrase)) {
        randomPhrases.push(newPhrase);
        console.log(`Phrase ajoutée: "${newPhrase}"`);
        console.log(`Liste actuelle: ${randomPhrases.join(', ')}`);
    } else {
        console.log("Cette phrase existe déjà!");
    }
};

// -------------------------
// ✉️ Gestion des messages
// -------------------------
async function drawText() {
    const noteInput = document.getElementById('noteInput');
    const message = noteInput.value.trim();
    
    if (!message) return;

    try {
        await fetch('/getText2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        myMessages.push({
            text: message,
            timestamp: Date.now(),
            isMyMessage: true
        });
        localStorage.setItem('myMessages', JSON.stringify(myMessages));
        
        noteInput.value = '';
        redrawTextDiv(true);
        
    } catch(e) {
        console.error("Erreur envoi message:", e);
    }
}

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
                addNotification(line, "Notification");
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
    div.style.zIndex = "7000";
    div.style.position = "relative";

    div.innerHTML = "";

    const allMessages = [];

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

    allMessages.sort((a, b) => a.timestamp - b.timestamp);

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
        bubble.style.zIndex = "7200";
        bubble.style.position = "relative";
        
        div.appendChild(bubble);
    });

    if (autoScroll && wasAtBottom) {
        div.scrollTop = div.scrollHeight;
    }
}

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

    // Charger l'historique des phrases
    const savedPhrases = localStorage.getItem("displayedRandomPhrases");
    if (savedPhrases) {
        displayedRandomPhrases = JSON.parse(savedPhrases);
        
        // Nettoyer les phrases vieilles de plus de 3 heures
        const threeHoursAgo = Date.now() - (3 * 60 * 60 * 1000);
        displayedRandomPhrases = displayedRandomPhrases.filter(phrase => 
            phrase.timestamp > threeHoursAgo
        );
        localStorage.setItem('displayedRandomPhrases', JSON.stringify(displayedRandomPhrases));
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

console.log("✅ Système de notifications et rappels chargé!");
console.log("Phrases disponibles:", randomPhrases);
console.log("Commandes disponibles:");
console.log("- testBirthdayCheck() : Vérifier manuellement les anniversaires");
console.log("- simulateDate(10, 6) : Simuler le 10 juillet");
console.log("- testNotification() : Tester une notification normale");
console.log("- forceRandomPhrase() : Forcer l'affichage d'une phrase aléatoire");
console.log("- resetRandomPhrases() : Réinitialiser l'historique des phrases");
console.log("- addNewPhrase('ma nouvelle phrase') : Ajouter une phrase à la liste");
console.log("- forceRandomPhrase() : Forcer l'affichage d'une phrase aléatoire");
console.log("- resetRandomPhrases() : Réinitialiser l'historique des phrases");
console.log("- addNewPhrase('ma nouvelle phrase') : Ajouter une phrase à la liste");
