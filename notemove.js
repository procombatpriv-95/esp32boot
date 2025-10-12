const notemove = document.getElementById('notemove');
const contentArea = document.getElementById('contentArea');
const wordInput = document.getElementById('wordInput');
const freezenote = document.getElementById('freezenote');
const inputnote = document.getElementById('inputnote');
const noteContain = document.querySelector('.notecontain');
let savedWords = JSON.parse(localStorage.getItem('protocolWords') || '[]');
let isExpanded = false;
let isDragging = false;
let isFrozen = false;
let dragOffset = { x: 0, y: 0 };
let hasDragged = false;

// FORCER le z-index au chargement et constamment
function enforceZIndex() {
  noteContain.style.zIndex = '9500';
  notemove.style.zIndex = '9500';
  document.querySelectorAll('.notecontain, #notemove, #inputnote, .content-area').forEach(el => {
    el.style.zIndex = '9500';
  });
}

// Appeler au chargement
document.addEventListener('DOMContentLoaded', enforceZIndex);
// Appeler constamment
setInterval(enforceZIndex, 100);

renderWords();

// Ouvrir en cliquant sur le bouton N
notemove.addEventListener('click', (e) => {
  if (hasDragged || e.target.id === 'resetBtn' || e.target.id === 'freezenote') {
    hasDragged = false;
    return;
  }
  
  if (!isExpanded) {
    notemove.classList.add('expanded');
    isExpanded = true;
    renderWords();
    enforceZIndex(); // Forcer z-index après expansion
  } else {
    if (!isFrozen) {
      closeMenu();
    }
  }
});

// Gestion du bouton freezenote
freezenote.addEventListener('click', (e) => {
  e.stopPropagation();
  
  isFrozen = !isFrozen;
  freezenote.classList.toggle('active');
  
  if (isFrozen) {
    notemove.classList.add('frozen');
  } else {
    notemove.classList.remove('frozen');
  }
  
  enforceZIndex(); // Forcer z-index après changement d'état
});

// Fonction pour fermer le menu
function closeMenu() {
  noteContain.classList.add('closing');
  
  setTimeout(() => {
    notemove.classList.remove('expanded');
    isExpanded = false;
    isFrozen = false;
    freezenote.classList.remove('active');
    notemove.classList.remove('frozen');
    renderWords();
    
    setTimeout(() => {
      noteContain.classList.remove('closing');
      enforceZIndex(); // Forcer z-index après fermeture
    }, 500);
  }, 50);
}

// Fermer le menu quand on clique en dehors
document.addEventListener('click', (e) => {
  if (isExpanded && !isFrozen && !notemove.contains(e.target) && e.target !== inputnote && !inputnote.contains(e.target)) {
    closeMenu();
  }
});

// Gestion de la saisie
wordInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && wordInput.value.trim() !== '') {
    savedWords.push(wordInput.value.trim());
    wordInput.value = '';
    saveAndRender();
  }
});

function saveAndRender() {
  localStorage.setItem('protocolWords', JSON.stringify(savedWords));
  renderWords();
}

function renderWords() {
  if (isExpanded) {
    contentArea.innerHTML = savedWords.map(w => `• ${w}`).join('<br>');
  } else {
    contentArea.innerHTML = '';
  }
  
  document.getElementById('resetBtn').onclick = (e) => {
    e.stopPropagation();
    savedWords = [];
    saveAndRender();
  };
}

// Système de déplacement
let dragStartFrozenState = false;

function startDrag(e) {
  if (!isExpanded || (isExpanded && isFrozen)) {
    if (e.target === wordInput) {
      return;
    }
    
    dragStartFrozenState = isFrozen;
    hasDragged = false;
    isDragging = true;
    
    // Forcer z-index au début du drag
    enforceZIndex();
    
    const rect = noteContain.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    noteContain.classList.add('dragging');
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    
    e.preventDefault();
  }
}

function doDrag(e) {
  if (!isDragging) return;
  
  const noteContain = document.querySelector('.notecontain');
  noteContain.style.left = (e.clientX - dragOffset.x) + 'px';
  noteContain.style.top = (e.clientY - dragOffset.y) + 'px';
  noteContain.style.marginLeft = '0';
  noteContain.style.bottom = 'auto';
  
  // Forcer z-index pendant le drag
  enforceZIndex();
  
  if (Math.abs(e.movementX) > 3 || Math.abs(e.movementY) > 3) {
    hasDragged = true;
  }
}

function stopDrag(e) {
  if (!isDragging) return;
  
  isDragging = false;
  const noteContain = document.querySelector('.notecontain');
  noteContain.classList.remove('dragging');
  document.removeEventListener('mousemove', doDrag);
  document.removeEventListener('mouseup', stopDrag);
  
  // Forcer z-index après le drag
  enforceZIndex();
  
  if (isExpanded && !dragStartFrozenState && !isFrozen) {
    if (!notemove.contains(e.target) && e.target !== inputnote && !inputnote.contains(e.target)) {
      closeMenu();
    }
  }
}

// Événements de déplacement
notemove.addEventListener('mousedown', startDrag);
contentArea.addEventListener('mousedown', startDrag);

// Empêcher le déplacement sur l'input et boutons
wordInput.addEventListener('mousedown', (e) => e.stopPropagation());
document.getElementById('resetBtn').addEventListener('mousedown', (e) => e.stopPropagation());
freezenote.addEventListener('mousedown', (e) => e.stopPropagation());

// Forcer le z-index initial
enforceZIndex();
