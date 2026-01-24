// ===== CONFIGURATION =====
const MAC_SERVER = "172.20.10.13"; // REMPLACER par l'IP de votre Mac
const ESP32_SERVER = window.location.origin; // URL actuelle de l'ESP32

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

// ===== FONCTIONS POUR LE SERVEUR MAC =====
async function saveRappelsToMac(rappels) {
    try {
        // Essayer d'abord le Mac
        const response = await fetch(`${MAC_SERVER}/api/saveRappels`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rappels)
        });
        
        if (response.ok) {
            console.log('✅ Sauvegardé sur Mac');
            return await response.json();
        }
    } catch (error) {
        console.log('❌ Mac hors ligne, sauvegarde locale');
    }
    
    // Si le Mac échoue, sauvegarder sur ESP32
    try {
        const response = await fetch('/saveRappels?data=' + encodeURIComponent(JSON.stringify(rappels)), {
            method: 'GET'
        });
        return response.ok ? await response.json() : {success: false};
    } catch (error) {
        console.error('Erreur sauvegarde locale:', error);
        return {success: false};
    }
}

async function loadRappelsFromMac() {
    try {
        // Essayer d'abord le Mac
        const response = await fetch(`${MAC_SERVER}/api/loadRappels`);
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${data.length} rappels chargés depuis Mac`);
            return Array.isArray(data) ? data : [];
        }
    } catch (error) {
        console.log('❌ Mac hors ligne, chargement local');
    }
    
    // Si le Mac échoue, charger depuis ESP32
    try {
        const response = await fetch('/loadRappels');
        if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        }
    } catch (error) {
        console.error('Erreur chargement local:', error);
        return [];
    }
}

// ===== FONCTIONS RAPPELS =====
async function initRappels() {
    savedRappels = await loadRappelsFromMac();
    renderRappels();
    enforceZIndexRappel();
}

function enforceZIndexRappel() {
    rappelContain.style.zIndex = '7000';
    rappelmove.style.zIndex = '7000';
}

async function renderRappels() {
    if (isExpandedRappel && contentAreaRappel) {
        contentAreaRappel.innerHTML = savedRappels.map(rappel => 
            `<div style="margin-bottom: 8px; line-height: 1.4;">• ${rappel}</div>`
        ).join('');
    } else if (contentAreaRappel) {
        contentAreaRappel.innerHTML = '';
    }
}

async function saveAndRenderRappel() {
    await saveRappelsToMac(savedRappels);
    await renderRappels();
}

// ===== ÉVÉNEMENTS RAPPELS =====
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

document.addEventListener('click', (e) => {
    if (isExpandedRappel && !isFrozenRappel && !rappelmove.contains(e.target) && e.target !== inputrappel && !inputrappel.contains(e.target)) {
        closeMenuRappel();
    }
});

wordInputRappel.addEventListener('keydown', async e => {
    if (e.key === 'Enter' && wordInputRappel.value.trim() !== '') {
        savedRappels.push(wordInputRappel.value.trim());
        wordInputRappel.value = '';
        await saveAndRenderRappel();
        wordInputRappel.focus();
    }
});

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

wordInputRappel.addEventListener('mousedown', (e) => e.stopPropagation());
document.getElementById('resetRappelBtn').addEventListener('mousedown', (e) => e.stopPropagation());
freezerappel.addEventListener('mousedown', (e) => e.stopPropagation());

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    initRappels();
    setInterval(enforceZIndexRappel, 100);
});
