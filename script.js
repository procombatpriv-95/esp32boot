window.addEventListener('DOMContentLoaded', ()=>{
    // Attente du chargement complet du script externe
    const s = document.createElement('script');
    s.src = "https://username.github.io/esp32boot/script.js";
    s.onload = () => {
        console.log("Script externe chargé et prêt");
        // Ici le JS attachera correctement tous les événements
    };
    document.body.appendChild(s);
});

