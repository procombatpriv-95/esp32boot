        window.addEventListener("load", () => {
            const canvas = document.getElementById("bourse");
            
            // Références aux éléments des statistiques
            const todayAvgEl = document.getElementById("todayAvg");
            const todayChangeEl = document.getElementById("todayChange");
            const weekAvgEl = document.getElementById("weekAvg");
            const weekChangeEl = document.getElementById("weekChange");
            const monthAvgEl = document.getElementById("monthAvg");
            const monthChangeEl = document.getElementById("monthChange");
            const sixMonthsAvgEl = document.getElementById("sixMonthsAvg");
            const sixMonthsChangeEl = document.getElementById("sixMonthsChange");

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
            let currentPrice = 50000;
            let countdown = 2;
            let countdownInterval;

            // === VARIABLES POUR LES FONCTIONNALITÉS ===
            let isFrozen = false;
            let scrollOffset = 0; // 0 = temps réel, >0 = défilé vers la gauche

            // === CORRECTION : Variables pour stocker les moyennes fixes ===
            let fixedWeekAvg = null;
            let fixedMonthAvg = null;
            let fixedSixMonthsAvg = null;

            // === FONCTIONS POUR LES BOUTONS ===
            function initControls() {
                const freezeBtn = document.getElementById('freezeBtn');
                const scrollLeftBtn = document.getElementById('scrollLeftBtn');
                const scrollRightBtn = document.getElementById('scrollRightBtn');
                
                // Mettre à jour l'état des boutons
                updateScrollButtons();
                
                // Bouton Freeze
                freezeBtn.addEventListener('click', function() {
                    isFrozen = !isFrozen;
                    this.classList.toggle('active', isFrozen);
                    
                    if (isFrozen) {
                        clearInterval(countdownInterval);
                        countdownInterval = null;
                    } else {
                        startCountdown();
                    }
                });
                
                // Bouton Défilement gauche - VERS LES DONNÉES ANCIENNES
                scrollLeftBtn.addEventListener('click', function() {
                    // Augmenter le décalage (aller vers la gauche)
                    scrollOffset += 10;
                    updateScrollButtons();
                    drawChart();
                });
                
                // Bouton Retour temps réel
                scrollRightBtn.addEventListener('click', function() {
                    // Remettre à zéro (retour au temps réel)
                    scrollOffset = 0;
                    updateScrollButtons();
                    drawChart();
                });
            }
            
            function updateScrollButtons() {
                const scrollLeftBtn = document.getElementById('scrollLeftBtn');
                const scrollRightBtn = document.getElementById('scrollRightBtn');
                
                if (scrollLeftBtn && scrollRightBtn) {
                    // Bouton gauche désactivé si on ne peut plus défiler vers la gauche
                    const maxScroll = Math.max(0, historicalData.length - visibleCandles);
                    scrollLeftBtn.disabled = scrollOffset >= maxScroll;
                    
                    // Bouton droit désactivé si on est déjà en temps réel
                    scrollRightBtn.disabled = scrollOffset === 0;
                }
            }

            // === FONCTIONS POUR LES STATISTIQUES ===
            function calculateAverages() {
                if (historicalData.length === 0) return;
                
                const now = Date.now();
                const oneDayAgo = now - (24 * 60 * 60 * 1000);
                const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
                const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
                const sixMonthsAgo = now - (180 * 24 * 60 * 60 * 1000);
                
                // === CORRECTION : Calcul de la moyenne d'aujourd'hui (changeante) ===
                const todayData = historicalData.filter(d => d.timestamp >= oneDayAgo);
                const todayAvg = calculatePeriodAverage(todayData);
                
                // === CORRECTION : Calcul des moyennes fixes une seule fois ===
                if (fixedWeekAvg === null) {
                    const weekData = historicalData.filter(d => 
                        d.timestamp >= oneWeekAgo && d.timestamp < oneDayAgo
                    );
                    fixedWeekAvg = calculatePeriodAverage(weekData);
                }
                
                if (fixedMonthAvg === null) {
                    const monthData = historicalData.filter(d => 
                        d.timestamp >= oneMonthAgo && d.timestamp < oneWeekAgo
                    );
                    fixedMonthAvg = calculatePeriodAverage(monthData);
                }
                
                if (fixedSixMonthsAvg === null) {
                    const sixMonthsData = historicalData.filter(d => 
                        d.timestamp >= sixMonthsAgo && d.timestamp < oneMonthAgo
                    );
                    fixedSixMonthsAvg = calculatePeriodAverage(sixMonthsData);
                }
                
                // Mettre à jour l'interface
                updateStatDisplay(todayAvgEl, todayChangeEl, todayAvg, "Aujourd'hui");
                updateStatDisplay(weekAvgEl, weekChangeEl, fixedWeekAvg, "1 semaine");
                updateStatDisplay(monthAvgEl, monthChangeEl, fixedMonthAvg, "1 mois");
                updateStatDisplay(sixMonthsAvgEl, sixMonthsChangeEl, fixedSixMonthsAvg, "6 mois");
            }
            
            function calculatePeriodAverage(data) {
                if (data.length === 0) return { avg: 0, change: 0 };
                
                const closes = data.map(d => d.close);
                const avg = closes.reduce((a, b) => a + b, 0) / closes.length;
                
                // Calculer le changement par rapport au prix actuel
                const currentPrice = historicalData[historicalData.length - 1].close;
                const change = ((currentPrice - avg) / avg) * 100;
                
                return { avg, change };
            }
            
            function updateStatDisplay(valueEl, changeEl, data, period) {
                if (!data || data.avg === 0) {
                    valueEl.textContent = "--";
                    changeEl.textContent = "--";
                    return;
                }
                
                valueEl.textContent = "$" + data.avg.toFixed(2);
                changeEl.textContent = (data.change >= 0 ? "+" : "") + data.change.toFixed(2) + "%";
                changeEl.className = `stat-change ${data.change >= 0 ? 'positive' : 'negative'}`;
                
                // Ajouter un indicateur visuel
                valueEl.style.color = data.change >= 0 ? '#39d353' : '#ff6b6b';
            }

            // Formules de calcul Heikin-Ashi 
            function calculateHeikinAshi(previousHA, currentRegular) {
                if (!previousHA) {
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
                
                // Générer 200 points de données pour avoir plus de données à défiler
                for (let i = 0; i < 200; i++) {
                    const volatility = Math.random() * 800 - 400;
                    const open = price;
                    const close = price + volatility;
                    const high = Math.max(open, close) + Math.random() * 300;
                    const low = Math.min(open, close) - Math.random() * 300;
                    
                    // Chaque point représente 1 jour (24h * 60min * 60sec * 1000ms)
                    const timestamp = now - (200 - i) * (24 * 60 * 60 * 1000);
                    
                    sampleData.push({
                        open: open,
                        high: high,
                        low: low,
                        close: close,
                        timestamp: timestamp
                    });
                    
                    price = close;
                }

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
                if (isFrozen) return; // Ne pas ajouter de nouvelles bougies si gelé
                
                const lastCandle = historicalData[historicalData.length - 1];
                const volatility = (Math.random() - 0.5) * 1000;
                const newClose = lastCandle.close + volatility;
                
                const newCandle = {
                    open: lastCandle.close,
                    high: Math.max(lastCandle.close, newClose) + Math.random() * 200,
                    low: Math.min(lastCandle.close, newClose) - Math.random() * 200,
                    close: newClose,
                    timestamp: Date.now()
                };
                
                const newHA = calculateHeikinAshi(lastCandle, newCandle);
                historicalData.push(newHA);
                currentPrice = newClose;
                
                // Mettre à jour les boutons de défilement
                updateScrollButtons();
                
                // === Mettre à jour les statistiques (seulement aujourd'hui changera) ===
                calculateAverages();
                
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
                
                const verticalLines = 8;
                for (let i = 0; i <= verticalLines; i++) {
                    const x = margin.left + (i * graphWidth / verticalLines);
                    ctx.beginPath();
                    ctx.moveTo(x, margin.top);
                    ctx.lineTo(x, margin.top + graphHeight);
                    ctx.stroke();
                }
                
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
                
                let startIndex, endIndex;
                
                if (scrollOffset > 0) {
                    // Mode défilement : afficher les données à partir du décalage
                    startIndex = Math.max(0, historicalData.length - visibleCandles - scrollOffset);
                    endIndex = startIndex + visibleCandles;
                } else {
                    // Mode normal : afficher les dernières bougies
                    startIndex = Math.max(0, historicalData.length - visibleCandles);
                    endIndex = historicalData.length;
                }
                
                // Assurer que les index sont valides
                startIndex = Math.max(0, startIndex);
                endIndex = Math.min(historicalData.length, endIndex);
                
                const visibleData = historicalData.slice(startIndex, endIndex);
                
                if (visibleData.length === 0) return;
                
                const prices = visibleData.flatMap(d => [d.high, d.low, d.open, d.close]);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const priceRange = maxPrice - minPrice || 1;
                
                const scaleY = graphHeight / priceRange;
                
                visibleData.forEach((candle, index) => {
                    const x = margin.left + (index * (candleWidth + 2));
                    
                    const highY = margin.top + graphHeight - ((candle.high - minPrice) * scaleY);
                    const lowY = margin.top + graphHeight - ((candle.low - minPrice) * scaleY);
                    const openY = margin.top + graphHeight - ((candle.open - minPrice) * scaleY);
                    const closeY = margin.top + graphHeight - ((candle.close - minPrice) * scaleY);
                    
                    const isBullish = candle.close >= candle.open;
                    ctx.fillStyle = isBullish ? '#39d353' : '#ff6b6b';
                    ctx.strokeStyle = isBullish ? '#39d353' : '#ff6b6b';
                    
                    ctx.beginPath();
                    ctx.moveTo(x + candleWidth/2, highY);
                    ctx.lineTo(x + candleWidth/2, lowY);
                    ctx.stroke();
                    
                    const bodyTop = Math.min(openY, closeY);
                    const bodyHeight = Math.abs(openY - closeY);
                    const bodyHeightMin = 1;
                    
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

                let visibleData;
                if (scrollOffset > 0) {
                    const startIndex = Math.max(0, historicalData.length - visibleCandles - scrollOffset);
                    const endIndex = Math.min(historicalData.length, startIndex + visibleCandles);
                    visibleData = historicalData.slice(startIndex, endIndex);
                } else {
                    visibleData = historicalData.slice(-visibleCandles);
                }
                
                if (visibleData.length === 0) return;
                
                const prices = visibleData.flatMap(d => [d.high, d.low, d.open, d.close]);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const priceRange = maxPrice - minPrice || 1;

                const yTicks = 5;
                for (let i = 0; i <= yTicks; i++) {
                    const value = minPrice + (i * priceRange / yTicks);
                    const y = margin.top + graphHeight - (i * graphHeight / yTicks);
                    
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('$' + value.toFixed(0), margin.left - 10, y);
                }
                
                ctx.textAlign = 'center';
                ctx.fillText('Bitcoin Graph', margin.left + graphWidth / 2, CSS_H - 20);
            }

            function drawWaitingMessage() {
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Chargement des données...', CSS_W / 2, CSS_H / 2);
            }

            // Connexion WebSocket pour les vraies données
            function connectWebSocket() {
                const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
                
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    const price = parseFloat(data.p);
                    currentPrice = price;
                };
                
                ws.onerror = (error) => {
                    console.error("Erreur WebSocket, utilisation des données simulées");
                };
            }

            // Initialisation
            historicalData.push(...generateInitialData());
            calculateAverages();
            drawChart();
            connectWebSocket();
            startCountdown();
            initControls(); // Initialiser les boutons
        });
