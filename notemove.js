const rappelmove = document.getElementById('rappelmove');
const contentAreaRappel = document.getElementById('contentAreaRappel');
const wordInputRappel = document.getElementById('wordInputRappel');
const freezerappel = document.getElementById('freezerappel');
const inputrappel = document.getElementById('inputrappel');
const rappelContain = document.querySelector('.rappelcontain');
let savedRappels = JSON.parse(localStorage.getItem('protocolRappels') || '[]');
let isExpandedRappel = false;
let isDraggingRappel = false;
let isFrozenRappel = false;
let dragOffsetRappel = { x: 0, y: 0 };
let hasDraggedRappel = false;

// FORCER le z-index au chargement et constamment
function enforceZIndexRappel() {
  rappelContain.style.zIndex = '9500';
  rappelmove.style.zIndex = '9500';
  document.querySelectorAll('.rappelcontain, #rappelmove, #inputrappel, .content-area-rappel').forEach(el => {
    el.style.zIndex = '9500';
  });
}

// Appeler au chargement
document.addEventListener('DOMContentLoaded', enforceZIndexRappel);
// Appeler constamment
setInterval(enforceZIndexRappel, 100);

renderRappels();

// Ouvrir en cliquant sur le bouton R
rappelmove.addEventListener('click', (e) => {
  if (hasDraggedRappel || e.target.id === 'resetRappelBtn' || e.target.id === 'freezerappel') {
    hasDraggedRappel = false;
    return;
  }
  
  if (!isExpandedRappel) {
    rappelmove.classList.add('expanded');
    isExpandedRappel = true;
    renderRappels();
    enforceZIndexRappel();
  } else {
    if (!isFrozenRappel) {
      closeMenuRappel();
    }
  }
});

// Gestion du bouton gelé
freezerappel.addEventListener('click', (e) => {
  e.stopPropagation();
  
  isFrozenRappel = !isFrozenRappel;
  freezerappel.classList.toggle('active');
  
  if (isFrozenRappel) {
    rappelmove.classList.add('frozen');
  } else {
    rappelmove.classList.remove('frozen');
  }
  
  enforceZIndexRappel();
});

// Fonction pour fermer le menu
function closeMenuRappel() {
  rappelContain.classList.add('closing-rappel');
  
  setTimeout(() => {
    rappelmove.classList.remove('expanded');
    isExpandedRappel = false;
    isFrozenRappel = false;
    freezerappel.classList.remove('active');
    rappelmove.classList.remove('frozen');
    renderRappels();
    
    setTimeout(() => {
      rappelContain.classList.remove('closing-rappel');
      enforceZIndexRappel();
    }, 500);
  }, 50);
}

// Fermer le menu quand on clique en dehors
document.addEventListener('click', (e) => {
  if (isExpandedRappel && !isFrozenRappel && !rappelmove.contains(e.target) && e.target !== inputrappel && !inputrappel.contains(e.target)) {
    closeMenuRappel();
  }
});

// Gestion de la saisie
wordInputRappel.addEventListener('keydown', e => {
  if (e.key === 'Enter' && wordInputRappel.value.trim() !== '') {
    savedRappels.push(wordInputRappel.value.trim());
    wordInputRappel.value = '';
    saveAndRenderRappel();
  }
});

function saveAndRenderRappel() {
  localStorage.setItem('protocolRappels', JSON.stringify(savedRappels));
  renderRappels();
}

function renderRappels() {
  if (isExpandedRappel) {
    contentAreaRappel.innerHTML = savedRappels.map(r => `• ${r}`).join('<br>');
  } else {
    contentAreaRappel.innerHTML = '';
  }
  
  document.getElementById('resetRappelBtn').onclick = (e) => {
    e.stopPropagation();
    savedRappels = [];
    saveAndRenderRappel();
  };
}

// Système de déplacement
let dragStartFrozenStateRappel = false;

function startDragRappel(e) {
  if (!isExpandedRappel || (isExpandedRappel && isFrozenRappel)) {
    if (e.target === wordInputRappel) {
      return;
    }
    
    dragStartFrozenStateRappel = isFrozenRappel;
    hasDraggedRappel = false;
    isDraggingRappel = true;
    
    // Forcer z-index au début du drag
    enforceZIndexRappel();
    
    const rect = rappelContain.getBoundingClientRect();
    dragOffsetRappel.x = e.clientX - rect.left;
    dragOffsetRappel.y = e.clientY - rect.top;
    
    rappelContain.classList.add('dragging-rappel');
    document.addEventListener('mousemove', doDragRappel);
    document.addEventListener('mouseup', stopDragRappel);
    
    e.preventDefault();
  }
}

function doDragRappel(e) {
  if (!isDraggingRappel) return;
  
  const rappelContain = document.querySelector('.rappelcontain');
  rappelContain.style.left = (e.clientX - dragOffsetRappel.x) + 'px';
  rappelContain.style.top = (e.clientY - dragOffsetRappel.y) + 'px';
  rappelContain.style.marginLeft = '0';
  rappelContain.style.bottom = 'auto';
  
  // Forcer z-index pendant le drag
  enforceZIndexRappel();
  
  if (Math.abs(e.movementX) > 3 || Math.abs(e.movementY) > 3) {
    hasDraggedRappel = true;
  }
}

function stopDragRappel(e) {
  if (!isDraggingRappel) return;
  
  isDraggingRappel = false;
  const rappelContain = document.querySelector('.rappelcontain');
  rappelContain.classList.remove('dragging-rappel');
  document.removeEventListener('mousemove', doDragRappel);
  document.removeEventListener('mouseup', stopDragRappel);
  
  // Forcer z-index après le drag
  enforceZIndexRappel();
  
  if (isExpandedRappel && !dragStartFrozenStateRappel && !isFrozenRappel) {
    if (!rappelmove.contains(e.target) && e.target !== inputrappel && !inputrappel.contains(e.target)) {
      closeMenuRappel();
    }
  }
}

// Événements de déplacement
rappelmove.addEventListener('mousedown', startDragRappel);
contentAreaRappel.addEventListener('mousedown', startDragRappel);

// Empêcher le déplacement sur l'input et boutons
wordInputRappel.addEventListener('mousedown', (e) => e.stopPropagation());
document.getElementById('resetRappelBtn').addEventListener('mousedown', (e) => e.stopPropagation());
freezerappel.addEventListener('mousedown', (e) => e.stopPropagation());

// Forcer le z-index initial
enforceZIndexRappel();
