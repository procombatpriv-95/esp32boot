const specialNotemove = document.getElementById('special-notemove');
const specialContentArea = document.getElementById('special-contentArea');
const specialWordInput = document.getElementById('special-wordInput');
const specialFreezeBtn = document.getElementById('special-freezeBtn');
const specialInputnote = document.getElementById('special-inputnote');
const specialNoteContain = document.querySelector('.special-note-container');
let specialSavedWords = JSON.parse(localStorage.getItem('specialProtocolWords') || '[]');
let specialIsExpanded = false;
let specialIsDragging = false;
let specialIsFrozen = false;
let specialDragOffset = { x: 0, y: 0 };
let specialHasDragged = false;

specialRenderWords();

// Ouvrir en cliquant sur le bouton N
specialNotemove.addEventListener('click', (e) => {
  if (specialHasDragged || e.target.id === 'special-resetBtn' || e.target.id === 'special-freezeBtn') {
    specialHasDragged = false;
    return;
  }
  
  if (!specialIsExpanded) {
    specialNotemove.classList.add('special-expanded');
    specialIsExpanded = true;
    specialRenderWords();
  } else {
    if (!specialIsFrozen) {
      specialCloseMenu();
    }
  }
});

// Gestion du bouton freeze
specialFreezeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  
  specialIsFrozen = !specialIsFrozen;
  specialFreezeBtn.classList.toggle('special-active');
  
  if (specialIsFrozen) {
    specialNotemove.classList.add('special-frozen');
  } else {
    specialNotemove.classList.remove('special-frozen');
  }
});

// Fonction pour fermer le menu
function specialCloseMenu() {
  specialNoteContain.classList.add('special-closing');
  
  setTimeout(() => {
    specialNotemove.classList.remove('special-expanded');
    specialIsExpanded = false;
    specialIsFrozen = false;
    specialFreezeBtn.classList.remove('special-active');
    specialNotemove.classList.remove('special-frozen');
    specialRenderWords();
    
    setTimeout(() => {
      specialNoteContain.classList.remove('special-closing');
    }, 500);
  }, 50);
}

// Fermer le menu quand on clique en dehors
document.addEventListener('click', (e) => {
  if (specialIsExpanded && !specialIsFrozen && !specialNotemove.contains(e.target) && e.target !== specialInputnote && !specialInputnote.contains(e.target)) {
    specialCloseMenu();
  }
});

// Gestion de la saisie
specialWordInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && specialWordInput.value.trim() !== '') {
    specialSavedWords.push(specialWordInput.value.trim());
    specialWordInput.value = '';
    specialSaveAndRender();
  }
});

function specialSaveAndRender() {
  localStorage.setItem('specialProtocolWords', JSON.stringify(specialSavedWords));
  specialRenderWords();
}

function specialRenderWords() {
  if (specialIsExpanded) {
    specialContentArea.innerHTML = specialSavedWords.map(w => `• ${w}`).join('<br>');
  } else {
    specialContentArea.innerHTML = '';
  }
  
  document.getElementById('special-resetBtn').onclick = (e) => {
    e.stopPropagation();
    specialSavedWords = [];
    specialSaveAndRender();
  };
}

// Système de déplacement
let specialDragStartFrozenState = false;

function specialStartDrag(e) {
  if (!specialIsExpanded || (specialIsExpanded && specialIsFrozen)) {
    if (e.target === specialWordInput) {
      return;
    }
    
    specialDragStartFrozenState = specialIsFrozen;
    specialHasDragged = false;
    specialIsDragging = true;
    
    const rect = specialNoteContain.getBoundingClientRect();
    specialDragOffset.x = e.clientX - rect.left;
    specialDragOffset.y = e.clientY - rect.top;
    
    specialNoteContain.classList.add('special-dragging');
    document.addEventListener('mousemove', specialDoDrag);
    document.addEventListener('mouseup', specialStopDrag);
    
    e.preventDefault();
  }
}

function specialDoDrag(e) {
  if (!specialIsDragging) return;
  
  specialNoteContain.style.left = (e.clientX - specialDragOffset.x) + 'px';
  specialNoteContain.style.top = (e.clientY - specialDragOffset.y) + 'px';
  specialNoteContain.style.marginLeft = '0';
  specialNoteContain.style.bottom = 'auto';
  
  if (Math.abs(e.movementX) > 3 || Math.abs(e.movementY) > 3) {
    specialHasDragged = true;
  }
}

function specialStopDrag(e) {
  if (!specialIsDragging) return;
  
  specialIsDragging = false;
  specialNoteContain.classList.remove('special-dragging');
  document.removeEventListener('mousemove', specialDoDrag);
  document.removeEventListener('mouseup', specialStopDrag);
  
  if (specialIsExpanded && !specialDragStartFrozenState && !specialIsFrozen) {
    if (!specialNotemove.contains(e.target) && e.target !== specialInputnote && !specialInputnote.contains(e.target)) {
      specialCloseMenu();
    }
  }
}

// Événements de déplacement
specialNotemove.addEventListener('mousedown', specialStartDrag);
specialContentArea.addEventListener('mousedown', specialStartDrag);

// Empêcher le déplacement sur l'input et boutons
specialWordInput.addEventListener('mousedown', (e) => e.stopPropagation());
document.getElementById('special-resetBtn').addEventListener('mousedown', (e) => e.stopPropagation());
specialFreezeBtn.addEventListener('mousedown', (e) => e.stopPropagation());
