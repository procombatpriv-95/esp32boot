// ===== VARIABLES RAPPELS =====
const rappelmove = document.getElementById('rappelmove');
const contentAreaRappel = document.getElementById('contentAreaRappel');
const wordInputRappel = document.getElementById('wordInputRappel');
const freezerappel = document.getElementById('freezerappel');
const inputrappel = document.getElementById('inputrappel');
const rappelContain = document.querySelector('.rappelcontain');
let savedRappels = [];
let isExpandedRappel = false;
let isDraggingRappel = false;
let isFrozenRappel = false;
let dragOffsetRappel = { x: 0, y: 0 };
let hasDraggedRappel = false;

// ===== FONCTIONS POUR COMMUNIQUER AVEC LE SERVEUR MAC =====
async function saveRappelsToESP32(rappels) {
    try {
        // Essayer d'abord le serveur Mac
        const response = await fetch('http://172.20.10.13:5000/api/saveRappels', { // REMPLACER XXX par l'IP du Mac
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rappels)
        });
        
        if (response.ok) {
            console.log('✅ Données sauvegardées sur Mac');
            return await response.json();
        }
    } catch (error) {
        console.log('❌ Serveur Mac inaccessible, sauvegarde sur ESP32');
    }
    
    // Fallback: sauvegarde sur ESP32
    try {
        const response = await fetch('/saveRappels?data=' + encodeURIComponent(JSON.stringify(rappels)), {
            method: 'GET'
        });
        return response.ok ? await response.json() : {success: false};
    } catch (error) {
        console.error('Erreur sauvegarde rappels:', error);
        return {success: false};
    }
}

async function loadRappelsFromESP32() {
    try {
        // Essayer d'abord le serveur Mac
        const response = await fetch('http://172.20.10.13:5000/api/loadRappels'); // REMPLACER XXX par l'IP du Mac
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Données chargées depuis Mac');
            return Array.isArray(data) ? data : [];
        }
    } catch (error) {
        console.log('❌ Serveur Mac inaccessible, chargement depuis ESP32');
    }
    
    // Fallback: charger depuis ESP32
    try {
        const response = await fetch('/loadRappels');
        if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        }
    } catch (error) {
        console.error('Erreur chargement rappels:', error);
        return [];
    }
}

// ===== FONCTIONS RAPPELS =====
async function initRappels() {
    savedRappels = await loadRappelsFromESP32();
    renderRappels();
    enforceZIndexRappel();
}

// FORCER le z-index au chargement et constamment
function enforceZIndexRappel() {
    rappelContain.style.zIndex = '7000';
    rappelmove.style.zIndex = '7000';
    document.querySelectorAll('.rappelcontain, #rappelmove, #inputrappel, .content-area-rappel').forEach(el => {
        el.style.zIndex = '7000';
    });
}

async function renderRappels() {
    if (isExpandedRappel && contentAreaRappel) {
        // Chaque rappel sur une nouvelle ligne avec saut de ligne
        contentAreaRappel.innerHTML = savedRappels.map(rappel => 
            `<div style="margin-bottom: 8px; line-height: 1.4;">• ${rappel}</div>`
        ).join('');
    } else if (contentAreaRappel) {
        contentAreaRappel.innerHTML = '';
    }
}

async function saveAndRenderRappel() {
    await saveRappelsToESP32(savedRappels);
    await renderRappels();
}

// ===== ÉVÉNEMENTS RAPPELS =====
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

// Gestion de la saisie - CHAQUE RAPPEL SAUTE UNE LIGNE
wordInputRappel.addEventListener('keydown', async e => {
    if (e.key === 'Enter' && wordInputRappel.value.trim() !== '') {
        // Ajouter le rappel avec saut de ligne automatique
        savedRappels.push(wordInputRappel.value.trim());
        wordInputRappel.value = '';
        await saveAndRenderRappel();
        
        // Focus restant sur l'input pour le prochain rappel
        wordInputRappel.focus();
    }
});

// Reset des rappels
document.getElementById('resetRappelBtn').onclick = async (e) => {
    e.stopPropagation();
    savedRappels = [];
    await saveAndRenderRappel();
};

// ===== SYSTÈME DE DÉPLACEMENT =====
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

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    initRappels();
    // Forcer le z-index constamment
    setInterval(enforceZIndexRappel, 100);
});
