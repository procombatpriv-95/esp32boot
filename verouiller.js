const correctUser = "pw";
const correctPass = "Codeurm95";

let inactivityTimer;
const lockScreen = document.getElementById("lock-screen");

// Fonction pour sauvegarder l'état du verrouillage
function saveLockState(isLocked) {
  localStorage.setItem('screenLocked', isLocked.toString());
}

// Fonction pour récupérer l'état du verrouillage
function getLockState() {
  return localStorage.getItem('screenLocked') === 'true';
}

// Affiche le verrouillage
function showLockScreen() {
  lockScreen.classList.add("active");
  saveLockState(true); // Sauvegarde l'état verrouillé
}

// Cache le verrouillage
function hideLockScreen() {
  lockScreen.classList.remove("active");
  saveLockState(false); // Sauvegarde l'état déverrouillé
  document.getElementById("error-message").textContent = "";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

// Réinitialise le timer d'inactivité
function resetTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(showLockScreen,120000); // 2 minutes
}

// Vérifie les identifiants
document.getElementById("unlock-btn").addEventListener("click", () => {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const error = document.getElementById("error-message");

  if (user === correctUser && pass === correctPass) {
    hideLockScreen();
    resetTimer();
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

// Vérifier l'état au chargement de la page
window.addEventListener('load', () => {
  // Si l'écran était verrouillé avant le rechargement, on l'affiche
  if (getLockState()) {
    showLockScreen();
  } else {
    // Sinon on démarre le timer d'inactivité
    resetTimer();
  }
});

// Détecte toute activité (uniquement si l'écran n'est pas verrouillé)
["mousemove", "keydown", "scroll", "click", "touchstart"].forEach(event => {
  document.addEventListener(event, () => {
    if (!getLockState()) { // Seulement si l'écran n'est pas verrouillé
      resetTimer();
    }
  });
});
