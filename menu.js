function switchMenu(n) {
  const mega = document.getElementById("megaBox");
  const switcher = document.getElementById("menuSwitch");
  const highlight = switcher.querySelector(".menu-highlight");
  const buttons = switcher.querySelectorAll(".menu-btn");
  const btn = buttons[n - 1]; // bouton cliqué

  // Retire anciennes classes
  mega.classList.remove("menu-1", "menu-2", "menu-3", "menu-4", "menu-5", "menu-6","menu-7");
  switcher.classList.remove("menu-1", "menu-2", "menu-3", "menu-4", "menu-5", "menu-6","menu-7");

  // Ajoute la nouvelle
  mega.classList.add("menu-" + n);
  switcher.classList.add("menu-" + n);

  // Déplace dynamiquement le highlight
  highlight.style.width = btn.offsetWidth + "px";
  highlight.style.transform = `translateX(${btn.offsetLeft}px)`;

  // Met à jour les points actifs
  document.getElementById("dot1").classList.toggle("active", n === 1);
  document.getElementById("dot2").classList.toggle("active", n === 2);
  document.getElementById("dot3").classList.toggle("active", n === 3);
  document.getElementById("dot4").classList.toggle("active", n === 4);
  document.getElementById("dot5").classList.toggle("active", n === 5);
  document.getElementById("dot6").classList.toggle("active", n === 6);
  document.getElementById("dot7").classList.toggle("active", n === 7);

  // --- Gestion de l'affichage des points (menu 6) ---
  const dotsContainer = document.querySelector('.menu-dots');
  if (n === 6) {
    dotsContainer.style.display = 'none';   // disparition totale
  } else {
    dotsContainer.style.display = 'flex';   // réapparition (valeur d'origine)
  }
}
