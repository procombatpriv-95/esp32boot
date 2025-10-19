let savedLines = JSON.parse(localStorage.getItem('savedLines')) || [];
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
    bubble.innerText = msg;
    bubble.style.background = "#666";
    bubble.style.borderRadius = "15px";
    bubble.style.display = "inline-block";  // ✅ largeur auto
    bubble.style.maxWidth = "180px";        // ✅ largeur max
    bubble.style.padding = "8px 12px";      // ✅ espace texte-bord
    bubble.style.wordWrap = "break-word";
    bubble.style.marginRight = "auto";      // ✅ garde bulles alignées à gauche
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
    redrawTextDiv();
  }

  const savedDisplayed = localStorage.getItem("displayedNotifications");
  if (savedDisplayed) {
    displayedNotifications = new Set(JSON.parse(savedDisplayed));
  }

const textDiv = document.getElementById("textdiv");
if (textDiv) {
  textDiv.addEventListener("scroll", () => {
    // si l’utilisateur scrolle manuellement, on désactive l’auto-scroll
    redrawTextDiv(false);
  });
}


  fetchText();
  setInterval(fetchText, 3000);
});
