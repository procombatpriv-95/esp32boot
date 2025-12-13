        const correctPass = "Codeurm95";
        let inactivityTimer;
        let isLockModeActive = false;
        const lockScreen = document.getElementById("lock-screen");
        const lockCheckbox = document.getElementById("inpLock");
        
        // Sauvegarde l'état du verrouillage
        function saveLockState(isLocked) {
            localStorage.setItem('screenLocked', isLocked.toString());
        }
        
        // Récupère l'état du verrouillage
        function getLockState() {
            return localStorage.getItem('screenLocked') === 'true';
        }
        
        // Affiche le verrouillage
        function showLockScreen() {
            lockScreen.classList.add("active");
            saveLockState(true);
            isLockModeActive = true;
        }
        
        // Cache le verrouillage
        function hideLockScreen() {
            lockScreen.classList.remove("active");
            saveLockState(false);
            document.getElementById("error-message").textContent = "";
            document.getElementById("password").value = "";
            isLockModeActive = false;
            
            // Si le bouton est en mode verrouillé (vert), on redémarre le timer
            if (lockCheckbox.checked) {
                startInactivityTimer();
            }
        }
        
        // Démarre le compte à rebours d'inactivité
        function startInactivityTimer() {
            clearTimeout(inactivityTimer);
            if (lockCheckbox.checked && !isLockModeActive) {
                inactivityTimer = setTimeout(showLockScreen, 500000);
            }
        }
        
        // Réinitialise le timer d'inactivité
        function resetInactivityTimer() {
            if (lockCheckbox.checked && !isLockModeActive) {
                startInactivityTimer();
            }
        }
        
        // Vérifie le mot de passe
        document.getElementById("unlock-btn").addEventListener("click", () => {
            const pass = document.getElementById("password").value.trim();
            const error = document.getElementById("error-message");
            
            if (pass === correctPass) {
                hideLockScreen();
            } else {
                error.textContent = "Mot de passe incorrect";
            }
        });
        
        // Permettre de déverrouiller avec la touche Entrée
        document.getElementById("password").addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                document.getElementById("unlock-btn").click();
            }
        });
        
        // Gestion du changement d'état du bouton lock
        lockCheckbox.addEventListener("change", () => {
            if (lockCheckbox.checked) {
                // Le bouton est en mode verrouillé (vert) - activer le mode lock
                startInactivityTimer();
            } else {
                // Le bouton est en mode déverrouillé (rouge) - désactiver le mode lock
                clearTimeout(inactivityTimer);
            }
        });
        
        // Vérifier l'état au chargement de la page
        window.addEventListener('load', () => {
            // Si l'écran était verrouillé avant le rechargement, on l'affiche
            if (getLockState()) {
                showLockScreen();
                lockCheckbox.checked = true;
            } else {
                // Sinon on démarre le timer d'inactivité seulement si le bouton est vert
                if (lockCheckbox.checked) {
                    startInactivityTimer();
                }
            }
        });
        
        // Détecte toute activité pour réinitialiser le timer
        ["mousemove", "keydown", "scroll", "click", "touchstart"].forEach(event => {
            document.addEventListener(event, () => {
                if (lockCheckbox.checked && !isLockModeActive) {
                    resetInactivityTimer();
                }
            });
        });
