// ===== CONFIGURATION =====
 // REMPLACER par l'IP de votre Mac
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

// ===== CONFIGURATION SERVEUR MAC =====
// IMPORTANT : Remplacez 192.168.1.XXX par l'IP de votre Mac
const MAC_SERVER_URL = "http://172.20.10.13:5000/api";
const ESP32_SERVER_URL = window.location.origin;

// ===== FONCTIONS COMMUNICATION =====
async function saveRappelsToServer(rappels) {
    console.log(`💾 Tentative sauvegarde de ${rappels.length} rappels`);
    
    // Essayer d'abord le serveur Mac
    try {
        const response = await fetch(`${MAC_SERVER_URL}/saveRappels`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rappels)
        });
        
        if (response.ok) {
            console.log('✅ Données sauvegardées sur Mac');
            const result = await response.json();
            return result;
        }
    } catch (error) {
        console.log('❌ Serveur Mac injoignable, tentative ESP32...');
    }
    
    // Fallback : sauvegarder sur ESP32
    try {
        const response = await fetch(`${ESP32_SERVER_URL}/saveRappels?data=` + 
                                   encodeURIComponent(JSON.stringify(rappels)), {
            method: 'GET'
        });
        
        if (response.ok) {
            console.log('✅ Données sauvegardées sur ESP32 (fallback)');
            return await response.json();
        }
    } catch (error) {
        console.error('❌ Erreur sauvegarde ESP32:', error);
    }
    
    return {success: false, error: "Aucun serveur disponible"};
}

async function loadRappelsFromServer() {
    console.log('📥 Tentative chargement des rappels...');
    
    // Essayer d'abord le serveur Mac
    try {
        const response = await fetch(`${MAC_SERVER_URL}/loadRappels`);
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${data.length} rappels chargés depuis Mac`);
            return Array.isArray(data) ? data : [];
        }
    } catch (error) {
        console.log('❌ Serveur Mac injoignable, chargement ESP32...');
    }
    
    // Fallback : charger depuis ESP32
    try {
        const response = await fetch(`${ESP32_SERVER_URL}/loadRappels`);
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${data.length} rappels chargés depuis ESP32 (fallback)`);
            return Array.isArray(data) ? data : [];
        }
    } catch (error) {
        console.error('❌ Erreur chargement ESP32:', error);
    }
    
    console.log('⚠️ Aucune donnée trouvée, retour tableau vide');
    return [];
}

// ===== FONCTIONS RAPPELS =====
async function initRappels() {
    console.log('🔄 Initialisation des rappels...');
    savedRappels = await loadRappelsFromServer();
    renderRappels();
    enforceZIndexRappel();
}

function enforceZIndexRappel() {
    rappelContain.style.zIndex = '7000';
    rappelmove.style.zIndex = '7000';
    if (inputrappel) inputrappel.style.zIndex = '7000';
    if (contentAreaRappel) contentAreaRappel.style.zIndex = '7000';
}

async function renderRappels() {
    if (!contentAreaRappel) return;
    
    if (isExpandedRappel) {
        contentAreaRappel.innerHTML = savedRappels.map((rappel, index) => 
            `<div class="rappel-item" style="
                margin-bottom: 8px; 
                padding: 8px;
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
                border-left: 3px solid #4CAF50;
                line-height: 1.4;
                word-break: break-word;
            ">
                <span style="margin-right: 5px;">•</span> ${rappel}
            </div>`
        ).join('');
        
        if (savedRappels.length === 0) {
            contentAreaRappel.innerHTML = `
                <div style="
                    text-align: center; 
                    padding: 20px; 
                    color: rgba(255,255,255,0.5);
                    font-style: italic;
                ">
                    Aucun rappel pour le moment
                </div>`;
        }
    } else {
        contentAreaRappel.innerHTML = '';
    }
}

async function saveAndRenderRappel() {
    await saveRappelsToServer(savedRappels);
    await renderRappels();
}

// ===== ÉVÉNEMENTS RAPPELS =====
if (rappelmove) {
    rappelmove.addEventListener('click', (e) => {
        if (hasDraggedRappel || 
            e.target.id === 'resetRappelBtn' || 
            e.target.id === 'freezerappel') {
            hasDraggedRappel = false;
            return;
        }
        
        if (!isExpandedRappel) {
            // Ouvrir le menu
            rappelmove.classList.add('expanded');
            isExpandedRappel = true;
            
            // S'assurer que l'input est visible
            if (inputrappel) {
                inputrappel.style.display = 'block';
                setTimeout(() => {
                    inputrappel.style.opacity = '1';
                    inputrappel.style.transform = 'translateY(0) scale(1)';
                }, 10);
            }
            
            renderRappels();
            enforceZIndexRappel();
            
            // Focus sur l'input après un court délai
            setTimeout(() => {
                if (wordInputRappel) wordInputRappel.focus();
            }, 300);
            
        } else {
            if (!isFrozenRappel) {
                closeMenuRappel();
            }
        }
    });
}

if (freezerappel) {
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
}

function closeMenuRappel() {
    if (!rappelmove || !rappelContain) return;
    
    rappelContain.classList.add('closing-rappel');
    
    // Cacher l'input
    if (inputrappel) {
        inputrappel.style.opacity = '0';
        inputrappel.style.transform = 'translateY(20px) scale(0.9)';
        setTimeout(() => {
            inputrappel.style.display = 'none';
        }, 300);
    }
    
    setTimeout(() => {
        rappelmove.classList.remove('expanded');
        isExpandedRappel = false;
        isFrozenRappel = false;
        
        if (freezerappel) freezerappel.classList.remove('active');
        rappelmove.classList.remove('frozen');
        
        renderRappels();
        
        setTimeout(() => {
            rappelContain.classList.remove('closing-rappel');
            enforceZIndexRappel();
        }, 100);
    }, 300);
}

// Fermer le menu quand on clique en dehors
document.addEventListener('click', (e) => {
    if (!isExpandedRappel || isFrozenRappel) return;
    
    const isClickInside = rappelmove && (rappelmove.contains(e.target) || 
                        (inputrappel && inputrappel.contains(e.target)));
    
    if (!isClickInside) {
        closeMenuRappel();
    }
});

// Gestion de la saisie
if (wordInputRappel) {
    wordInputRappel.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && wordInputRappel.value.trim() !== '') {
            const newRappel = wordInputRappel.value.trim();
            
            // Ajouter le rappel
            savedRappels.push(newRappel);
            wordInputRappel.value = '';
            
            // Sauvegarder et afficher
            await saveAndRenderRappel();
            
            // Restaurer le focus pour le prochain rappel
            setTimeout(() => {
                wordInputRappel.focus();
            }, 10);
        }
    });
}

// Reset des rappels
const resetRappelBtn = document.getElementById('resetRappelBtn');
if (resetRappelBtn) {
    resetRappelBtn.onclick = async (e) => {
        e.stopPropagation();
        
        if (confirm('Effacer tous les rappels ?')) {
            savedRappels = [];
            await saveAndRenderRappel();
        }
    };
}

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
    if (!isDraggingRappel || !rappelContain) return;
    
    rappelContain.style.position = 'fixed';
    rappelContain.style.left = (e.clientX - dragOffsetRappel.x) + 'px';
    rappelContain.style.top = (e.clientY - dragOffsetRappel.y) + 'px';
    rappelContain.style.margin = '0';
    
    enforceZIndexRappel();
    
    if (Math.abs(e.movementX) > 3 || Math.abs(e.movementY) > 3) {
        hasDraggedRappel = true;
    }
}

function stopDragRappel(e) {
    if (!isDraggingRappel) return;
    
    isDraggingRappel = false;
    if (rappelContain) {
        rappelContain.classList.remove('dragging-rappel');
    }
    
    document.removeEventListener('mousemove', doDragRappel);
    document.removeEventListener('mouseup', stopDragRappel);
    
    enforceZIndexRappel();
    
    if (isExpandedRappel && !dragStartFrozenStateRappel && !isFrozenRappel) {
        if (!rappelmove.contains(e.target) && 
            e.target !== inputrappel && 
            !inputrappel.contains(e.target)) {
            closeMenuRappel();
        }
    }
}

// Événements de déplacement
if (rappelmove) {
    rappelmove.addEventListener('mousedown', startDragRappel);
}

if (contentAreaRappel) {
    contentAreaRappel.addEventListener('mousedown', startDragRappel);
}

// Empêcher le déplacement sur l'input et boutons
if (wordInputRappel) {
    wordInputRappel.addEventListener('mousedown', (e) => e.stopPropagation());
}

if (resetRappelBtn) {
    resetRappelBtn.addEventListener('mousedown', (e) => e.stopPropagation());
}

if (freezerappel) {
    freezerappel.addEventListener('mousedown', (e) => e.stopPropagation());
}

// ===== INITIALISATION =====
// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📋 DOM chargé, initialisation rappels...');
        initRappels();
        
        // S'assurer que le z-index est appliqué
        setInterval(enforceZIndexRappel, 1000);
    });
} else {
    // DOM déjà chargé
    console.log('📋 DOM déjà chargé, initialisation rappels...');
    initRappels();
    setInterval(enforceZIndexRappel, 1000);
}

// Fonction pour tester la connexion
async function testServerConnection() {
    console.log('🔍 Test de connexion serveurs...');
    
    // Test serveur Mac
    try {
        const macResponse = await fetch(`${MAC_SERVER_URL.replace('/api', '')}/health`);
        console.log(`Mac: ${macResponse.ok ? '✅ Connecté' : '❌ Erreur'}`);
    } catch {
        console.log('Mac: ❌ Hors ligne');
    }
    
    // Test serveur ESP32
    try {
        const espResponse = await fetch(`${ESP32_SERVER_URL}/health`);
        console.log(`ESP32: ${espResponse.ok ? '✅ Connecté' : '❌ Erreur'}`);
    } catch {
        console.log('ESP32: ❌ Hors ligne');
    }
}

// Exécuter le test au démarrage (optionnel)
setTimeout(testServerConnection, 2000);

// Fonction pour forcer le rafraîchissement
window.refreshRappels = async function() {
    console.log('🔄 Rafraîchissement manuel des rappels');
    savedRappels = await loadRappelsFromServer();
    await renderRappels();
};

// Exposer les fonctions globalement pour le débogage
window.rappels = {
    get: () => savedRappels,
    add: async (text) => {
        savedRappels.push(text);
        await saveAndRenderRappel();
    },
    clear: async () => {
        savedRappels = [];
        await saveAndRenderRappel();
    },
    refresh: async () => {
        savedRappels = await loadRappelsFromServer();
        await renderRappels();
    }
};

console.log('✅ Script rappel chargé avec succès');
