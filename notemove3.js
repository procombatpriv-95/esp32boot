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

// ===== FONCTIONS POUR COMMUNIQUER AVEC L'ESP32 =====
async function saveRappelsToESP32(rappels) {
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
        const response = await fetch('/loadRappels');
        if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        }
        return [];
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
    rappelmove.classList.toggle('frozen', isFrozenRappel);
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

rappelmove.addEventListener('mousedown', startDragRappel);
contentAreaRappel.addEventListener('mousedown', startDragRappel);
wordInputRappel.addEventListener('mousedown', (e) => e.stopPropagation());
document.getElementById('resetRappelBtn').addEventListener('mousedown', (e) => e.stopPropagation());
freezerappel.addEventListener('mousedown', (e) => e.stopPropagation());

// ===== NOUVEAU : Gestion du redimensionnement =====
window.addEventListener('resize', () => {
    const rect = rappelContain.getBoundingClientRect();
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    let newLeft = parseInt(rappelContain.style.left, 10);
    let newTop = parseInt(rappelContain.style.top, 10);

    // Si les coordonnées ne sont pas définies, on garde les valeurs par défaut (20,800)
    if (isNaN(newLeft)) newLeft = 800;
    if (isNaN(newTop)) newTop = 20;

    // Empêcher de sortir à droite
    if (newLeft + rect.width > winWidth) {
        newLeft = winWidth - rect.width;
    }
    // Empêcher de sortir à gauche
    if (newLeft < 0) {
        newLeft = 0;
    }
    // Empêcher de sortir en bas
    if (newTop + rect.height > winHeight) {
        newTop = winHeight - rect.height;
    }
    // Empêcher de sortir en haut
    if (newTop < 0) {
        newTop = 0;
    }

    rappelContain.style.left = newLeft + 'px';
    rappelContain.style.top = newTop + 'px';
});

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    initRappels();
    setInterval(enforceZIndexRappel, 100);
});
