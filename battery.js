window.addEventListener("load", async () => {
    const canvas = document.getElementById('afaire');
    const ctx = canvas.getContext('2d');
    let currentBattery = 0;

    function drawBattery(level) {
        // Effacer le canvas en transparence
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Couleurs
        const batteryColor = level > 20 ? '#4CAF50' : (level > 10 ? '#FF9800' : '#f44336');
        const textColor = '#ffffff';
        
        // ===== GAUGE IPHONE EN HAUT À GAUCHE =====
        
        // Position Y commune pour l'alignement
        const baseY = 40;
        const gaugeHeight = 25;
        
        // Texte "iPhone"
        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('iPhone', 30, baseY + gaugeHeight / 2);
        
        // Gauge batterie arrondie
        const gaugeX = 90;
        const gaugeWidth = 60;
        
        // Fond de la gauge
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.roundRect(gaugeX, baseY, gaugeWidth, gaugeHeight, 8);
        ctx.fill();
        
        // Niveau de batterie dans la gauge
        const fillWidth = Math.max(8, (gaugeWidth - 6) * (level / 100));
        ctx.fillStyle = batteryColor;
        ctx.beginPath();
        ctx.roundRect(gaugeX + 3, baseY + 3, fillWidth, gaugeHeight - 6, 5);
        ctx.fill();
        
        // Chiffre du pourcentage dans la gauge
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(level, gaugeX + gaugeWidth / 2, baseY + gaugeHeight / 2);
    }

    function updateBattery() {
        fetch('/data')
            .then(response => response.text())
            .then(data => {
                const level = parseInt(data);
                if (!isNaN(level) && level !== currentBattery) {
                    currentBattery = level;
                    drawBattery(currentBattery);
                }
            })
            .catch(err => console.error('Erreur:', err));
    }

    // Attendre que tout soit chargé avant de démarrer
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mise à jour toutes les 2 secondes
    setInterval(updateBattery, 2000);
    updateBattery();

    // Dessin initial
    drawBattery(0);
});
