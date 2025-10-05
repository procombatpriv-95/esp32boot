        window.addEventListener("load", () => {
            const canvas = document.getElementById("bourse");

            // Configuration du canvas pour haute résolution
            const DPR = window.devicePixelRatio || 1;
            const CSS_W = 700;
            const CSS_H = 400;
            canvas.style.width = CSS_W + "px";
            canvas.style.height = CSS_H + "px";
            canvas.width = CSS_W * DPR;
            canvas.height = CSS_H * DPR;
            
            const ctx = canvas.getContext("2d");
            ctx.scale(DPR, DPR);

            // Données historiques pour Heikin-Ashi
            const historicalData = [];
            let currentPrice = 50000; // Prix de départ
            let countdown = 2;
            let countdownInterval;

            // Formules de calcul Heikin-Ashi 
            function calculateHeikinAshi(previousHA, currentRegular) {
                if (!previousHA) {
                    // Première bougie : utilisation des prix réguliers
                    return {
                        open: (currentRegular.open + currentRegular.close) / 2,
                        high: currentRegular.high,
                        low: currentRegular.low,
                        close: (currentRegular.open + currentRegular.high + currentRegular.low + currentRegular.close) / 4,
                        timestamp: currentRegular.timestamp
                    };
                }

                return {
                    open: (previousHA.open + previousHA.close) / 2,
                    high: Math.max(currentRegular.high, previousHA.open, previousHA.close),
                    low: Math.min(currentRegular.low, previousHA.open, previousHA.close),
                    close: (currentRegular.open + currentRegular.high + currentRegular.low + currentRegular.close) / 4,
                    timestamp: currentRegular.timestamp
                };
            }

            // Génération de données initiales
            function generateInitialData() {
                const sampleData = [];
                let price = 50000;
                const now = Date.now();
                
                for (let i = 0; i < 50; i++) {
                    const volatility = Math.random() * 800 - 400;
                    const open = price;
                    const close = price + volatility;
                    const high = Math.max(open, close) + Math.random() * 300;
                    const low = Math.min(open, close) - Math.random() * 300;
                    
                    sampleData.push({
                        open: open,
                        high: high,
                        low: low,
                        close: close,
                        timestamp: now - (50 - i) * 2000 // 2 secondes d'intervalle
                    });
                    
                    price = close;
                }

                // Conversion en Heikin-Ashi
                const haData = [];
                sampleData.forEach((candle, index) => {
                    const previousHA = haData[index - 1];
                    haData.push(calculateHeikinAshi(previousHA, candle));
                });
                
                return haData;
            }

            // Démarrer le compte à rebours
            function startCountdown() {
                countdown = 2;
                
                if (countdownInterval) clearInterval(countdownInterval);
                
                countdownInterval = setInterval(() => {
                    countdown--;
                    
                    if (countdown <= 0) {
                        addNewCandle();
                        countdown = 2;
                    }
                }, 1000);
            }

            // Ajouter une nouvelle bougie
            function addNewCandle() {
                // Variation aléatoire basée sur le dernier prix
                const lastCandle = historicalData[historicalData.length - 1];
                const volatility = (Math.random() - 0.5) * 1000;
                const newClose = lastCandle.close + volatility;
                
                const newCandle = {
                    open: lastCandle.close, // L'ouverture est la clôture précédente
                    high: Math.max(lastCandle.close, newClose) + Math.random() * 200,
                    low: Math.min(lastCandle.close, newClose) - Math.random() * 200,
                    close: newClose,
                    timestamp: Date.now()
                };
                
                // Conversion en Heikin-Ashi
                const newHA = calculateHeikinAshi(lastCandle, newCandle);
                historicalData.push(newHA);
                
                // Mettre à jour le prix actuel
                currentPrice = newClose;
                
                // Redessiner le graphique
                drawChart();
            }

            // Configuration du graphique
            const margin = { top: 40, right: 40, bottom: 60, left: 80 };
            const graphWidth = CSS_W - margin.left - margin.right;
            const graphHeight = CSS_H - margin.top - margin.bottom;
            const candleWidth = 8;
            const visibleCandles = Math.floor(graphWidth / (candleWidth + 2));

            function drawChart() {
                ctx.clearRect(0, 0, CSS_W, CSS_H);
                
                if (historicalData.length === 0) {
                    drawWaitingMessage();
                    return;
                }

                drawGrid();
                drawHeikinAshiCandles();
                drawAxes();
            }

            function drawGrid() {
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                
                // Grille verticale
                const verticalLines = 8;
                for (let i = 0; i <= verticalLines; i++) {
                    const x = margin.left + (i * graphWidth / verticalLines);
                    ctx.beginPath();
                    ctx.moveTo(x, margin.top);
                    ctx.lineTo(x, margin.top + graphHeight);
                    ctx.stroke();
                }
                
                // Grille horizontale
                const horizontalLines = 6;
                for (let i = 0; i <= horizontalLines; i++) {
                    const y = margin.top + (i * graphHeight / horizontalLines);
                    ctx.beginPath();
                    ctx.moveTo(margin.left, y);
                    ctx.lineTo(margin.left + graphWidth, y);
                    ctx.stroke();
                }
            }

            function drawHeikinAshiCandles() {
                if (historicalData.length === 0) return;

                // Afficher seulement les dernières bougies visibles
                const startIndex = Math.max(0, historicalData.length - visibleCandles);
                const visibleData = historicalData.slice(startIndex);
                
                // Calcul des prix min/max pour la mise à l'échelle
                const prices = visibleData.flatMap(d => [d.high, d.low, d.open, d.close]);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const priceRange = maxPrice - minPrice || 1;

                const scaleY = graphHeight / priceRange;

                visibleData.forEach((candle, index) => {
                    const x = margin.left + (index * (candleWidth + 2));
                    
                    // Calcul des coordonnées Y
                    const highY = margin.top + graphHeight - ((candle.high - minPrice) * scaleY);
                    const lowY = margin.top + graphHeight - ((candle.low - minPrice) * scaleY);
                    const openY = margin.top + graphHeight - ((candle.open - minPrice) * scaleY);
                    const closeY = margin.top + graphHeight - ((candle.close - minPrice) * scaleY);
                    
                    // Détermination de la couleur (hausse ou baisse)
                    const isBullish = candle.close >= candle.open;
                    ctx.fillStyle = isBullish ? '#39d353' : '#ff6b6b';
                    ctx.strokeStyle = isBullish ? '#39d353' : '#ff6b6b';
                    
                    // Dessin de la mèche
                    ctx.beginPath();
                    ctx.moveTo(x + candleWidth/2, highY);
                    ctx.lineTo(x + candleWidth/2, lowY);
                    ctx.stroke();
                    
                    // Dessin du corps
                    const bodyTop = Math.min(openY, closeY);
                    const bodyHeight = Math.abs(openY - closeY);
                    const bodyHeightMin = 1; // Hauteur minimale pour visibilité
                    
                    ctx.fillRect(
                        x, 
                        bodyTop, 
                        candleWidth, 
                        Math.max(bodyHeight, bodyHeightMin)
                    );
                });
            }

            function drawAxes() {
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 2;
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '12px Arial';

                // Axe des prix (Y)
                const visibleData = historicalData.slice(-visibleCandles);
                const prices = visibleData.flatMap(d => [d.high, d.low, d.open, d.close]);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const priceRange = maxPrice - minPrice || 1;

                // Étiquettes de l'axe Y
                const yTicks = 5;
                for (let i = 0; i <= yTicks; i++) {
                    const value = minPrice + (i * priceRange / yTicks);
                    const y = margin.top + graphHeight - (i * graphHeight / yTicks);
                    
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('$' + value.toFixed(0), margin.left - 10, y);
                }
            }

            function drawWaitingMessage() {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
            }

            // Connexion WebSocket pour les vraies données
            function connectWebSocket() {
                const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
                
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    const price = parseFloat(data.p);
                    currentPrice = price; // Met à jour le prix actuel
                };
                
                ws.onerror = (error) => {
                    console.error("Erreur WebSocket, utilisation des données simulées");
                };
            }

            // Initialisation
            historicalData.push(...generateInitialData());
            drawChart();
            connectWebSocket();
            startCountdown();
        });
