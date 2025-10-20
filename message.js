let myMessages = JSON.parse(localStorage.getItem('myMessages')) || [];
let savedLines = JSON.parse(localStorage.getItem('savedLines')) || [];

// -------------------------
// ✉️ Fonction pour ENVOYER un message
// -------------------------
function drawText() {
  const noteInput = document.getElementById('noteInput');
  const message = noteInput.value.trim();
  
  if (!message) return;

  // 1. AJOUTER LE MESSAGE À myMessages (VOS MESSAGES)
  myMessages.push(message);
  
  // 2. SAUVEGARDER
  localStorage.setItem('myMessages', JSON.stringify(myMessages));
  
  // 3. VIDER L'INPUT
  noteInput.value = '';
  
  // 4. AFFICHER IMMÉDIATEMENT (BLEU À DROITE)
  redrawTextDiv(true);
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

  // AFFICHER myMessages EN BLEU À DROITE
  myMessages.forEach(msg => {
    const bubble = document.createElement("div");
    bubble.innerText = msg;
    
    bubble.style.background = "#007bff"; // BLEU
    bubble.style.borderRadius = "15px";
    bubble.style.display = "inline-block";
    bubble.style.maxWidth = "180px";
    bubble.style.padding = "8px 12px";
    bubble.style.wordWrap = "break-word";
    bubble.style.marginLeft = "auto"; // À DROITE
    bubble.style.marginRight = "0";
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
  // Charger VOS messages sauvegardés
  const savedMyMessages = localStorage.getItem("myMessages");
  if (savedMyMessages) {
    myMessages = JSON.parse(savedMyMessages);
    redrawTextDiv();
  }

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
});
