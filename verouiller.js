    const correctUser = "pw";
    const correctPass = "Codeurm95";

    let inactivityTimer;
    const lockScreen = document.getElementById("lock-screen");

    // Affiche le verrouillage
    function showLockScreen() {
      lockScreen.classList.add("active");
    }

    // Cache le verrouillage
    function hideLockScreen() {
      lockScreen.classList.remove("active");
      document.getElementById("error-message").textContent = "";
      document.getElementById("username").value = "";
      document.getElementById("password").value = "";
    }

    // Réinitialise le timer d’inactivité
    function resetTimer() {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(showLockScreen, 600000); // 20 min secondes
    }

    // Détecte toute activité
    ["mousemove", "keydown", "scroll", "click"].forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Démarre le timer dès le chargement (mais sans afficher le lock)
    resetTimer();

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
