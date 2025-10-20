let savedLines = JSON.parse(localStorage.getItem('savedLines')) || [];
let myMessages = new Set(JSON.parse(localStorage.getItem('myMessages')) || []); // Messages que J'AI envoyés

// -------------------------
// ✉️ Fonction pour ENVOYER un message (SIMPLIFIÉE)
// -------------------------
function drawText() {
  const noteInput = document.getElementById('noteInput');
  const message = noteInput.value.trim();
  
  if (!message) return;

  // 1. MARQUER COMME MESSAGE ENVOYÉ
  myMessages.add(message);
  
  // 2. AJOUTER AUX MESSAGES
  savedLines.push(message);
  
  // 3. SAUVEGARDER
  localStorage.setItem('savedLines', JSON.stringify(savedLines));
  localStorage.setItem('myMessages', JSON.stringify([...myMessages]));
  
  // 4. VIDER L'INPUT
  noteInput.value = '';
  
  // 5. AFFICHER IMMÉDIATEMENT (BLEU À DROITE)
  redrawTextDiv(true);
}

// -------------------------
// ✏️ AFFICHAGE DES MESSAGES (SIMPLIFIÉ)
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
    
    // SIMPLE : Si c'est mon message → BLEU À DROITE
    const isMyMessage = myMessages.has(msg);
    
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
// ⚡ INITIALISATION SIMPLE
// -------------------------
window.addEventListener('load', function () {
  // Charger les messages sauvegardés
  const saved = localStorage.getItem("savedLines");
  if (saved) {
    savedLines = JSON.parse(saved);
  }

  // Charger mes messages
  const savedMyMessages = localStorage.getItem("myMessages");
  if (savedMyMessages) {
    myMessages = new Set(JSON.parse(savedMyMessages));
  }

  // Afficher les messages
  redrawTextDiv();

  // Enter pour envoyer
  const noteInput = document.getElementById('noteInput');
  if (noteInput) {
    noteInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        drawText();
      }
    });
  }

  // Gestion du scroll
  const textDiv = document.getElementById("textdiv");
  if (textDiv) {
    textDiv.addEventListener("scroll", () => {
      redrawTextDiv(false);
    });
  }
});
