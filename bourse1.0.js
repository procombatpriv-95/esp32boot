        document.addEventListener('DOMContentLoaded', function() {
            // Configuration des cryptomonnaies avec leurs symboles Binance
            const cryptos = [
                { 
                    id: 'bitcoin', 
                    name: 'Bitcoin (BTC)', 
                    color: 'white',
                    symbol: 'BTCUSDT',
                    priceElement: 'btcPrice',
                    size: '10px',
                    position: '20px'
                },
                { 
                    id: 'ethereum', 
                    name: 'Ethereum (ETH)', 
                    color: 'white',
                    symbol: 'ETHUSDT',
                    priceElement: 'ethPrice',
                    size: '10px',
                    position: '20px'
                },
                { 
                    id: 'xrp', 
                    name: 'XRP', 
                    color: 'white',
                    symbol: 'XRPUSDT',
                    priceElement: 'xrpPrice',
                    size: '10px',
                    position: '20px'
                },
                { 
                    id: 'litecoin', 
                    name: 'Litecoin (LTC)', 
                    color: 'white',
                    symbol: 'LTCUSDT',
                    priceElement: 'ltcPrice',
                    size: '10px',
                    position: '20px'
                }
            ];
            
            // Éléments du DOM
            const carousel = document.getElementById('mainCarousel');
            const carouselScene = document.getElementById('carouselScene');
            const selectedView = document.getElementById('selectedView');
            const selectedCanvas = document.getElementById('selectedCanvas');
            const selectedCryptoName = document.getElementById('selectedCryptoName');
            const backBtn = document.getElementById('backBtn');
            const connectionStatus = document.getElementById('connectionStatus');
            
            // Variables d'état
            let graphInstances = {};
            let selectedCrypto = null;
            let carouselUpdateInterval;
            let apiUpdateInterval;
            
            // === API BINANCE AVEC INTERVALLE DE 2 SECONDES ===
            function startApiUpdates() {
                // Mettre à jour immédiatement au démarrage
                fetchAllPrices();
                
                // Puis toutes les 2 secondes
                apiUpdateInterval = setInterval(fetchAllPrices, 2000);
            }
            
            function fetchAllPrices() {
                cryptos.forEach(crypto => {
                    fetchCryptoPrice(crypto);
                });
            }
            
            function fetchCryptoPrice(crypto) {
                const url = `https://api.binance.com/api/v3/ticker/price?symbol=${crypto.symbol}`;
                
                fetch(url)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erreur réseau');
                        }
                        return response.json();
                    })
                    .then(data => {
                        const price = parseFloat(data.price);
                        updateCryptoPrice(crypto.id, price);
                        connectionStatus.textContent = 'Connecté';
                        connectionStatus.className = 'connection-status connected';
                    })
                    .catch(error => {
                        console.error(`Erreur pour ${crypto.symbol}:`, error);
                        connectionStatus.textContent = 'Erreur de connexion';
                        connectionStatus.className = 'connection-status disconnected';
                    });
            }
            
            // Mettre à jour le prix d'une cryptomonnaie
            function updateCryptoPrice(cryptoId, price) {
                const instance = graphInstances[cryptoId];
                if (!instance) return;
                
                // Mettre à jour le prix actuel
                instance.currentPrice = price;
                
                // Mettre à jour l'affichage du prix DANS LE CAROUSEL SEULEMENT
                const priceElement = document.getElementById(cryptos.find(c => c.id === cryptoId).priceElement);
                if (priceElement) {
                    priceElement.textContent = `$${price.toFixed(2)}`;
                    priceElement.style.color = price > (instance.lastPrice || 0) ? '#39d353' : '#ff6b6b';
                }
                
                // NE PAS METTRE À JOUR L'AFFICHAGE DU PRIX DANS LA VUE SÉLECTIONNÉE
                // (supprimé pour cacher le prix dans la vue sélectionnée)
                
                // Ajouter une nouvelle bougie si pas gelé et pas en défilement
                if (!instance.isFrozen && instance.scrollOffset === 0) {
                    addNewCandle(instance, price);
                    drawHeikinAshiChart(instance);
                }
                
                instance.lastPrice = price;
            }
            
            // === FONCTIONS POUR LE DRAG AND DROP ===
            function initDragForElement(element) {
                let isDragging = false;
                let startX, startY;
                let startLeft, startTop;
                
                element.addEventListener('mousedown', startDrag);
                element.addEventListener('touchstart', startDragTouch);
                
                function startDrag(e) {
                    if (e.target.classList.contains('canvas-btn')) {
                        return;
                    }
                    
                    isDragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    
                    const rect = element.getBoundingClientRect();
                    startLeft = parseInt(element.style.left) || 0;
                    startTop = parseInt(element.style.top) || 0;
                    
                    element.classList.add('dragging');
                    document.addEventListener('mousemove', onDrag);
                    document.addEventListener('mouseup', stopDrag);
                    e.preventDefault();
                }
                
                function startDragTouch(e) {
                    if (e.touches.length === 1) {
                        const touch = e.touches[0];
                        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
                        if (targetElement && targetElement.classList.contains('canvas-btn')) {
                            return;
                        }
                        
                        isDragging = true;
                        startX = touch.clientX;
                        startY = touch.clientY;
                        
                        const rect = element.getBoundingClientRect();
                        startLeft = parseInt(element.style.left) || 0;
                        startTop = parseInt(element.style.top) || 0;
                        
                        element.classList.add('dragging');
                        document.addEventListener('touchmove', onDragTouch);
                        document.addEventListener('touchend', stopDrag);
                        e.preventDefault();
                    }
                }
                
                function onDrag(e) {
                    if (!isDragging) return;
                    
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;
                    
                    element.style.position = 'relative';
                    element.style.left = (startLeft + dx) + 'px';
                    element.style.top = (startTop + dy) + 'px';
                }
                
                function onDragTouch(e) {
                    if (!isDragging || e.touches.length !== 1) return;
                    
                    const dx = e.touches[0].clientX - startX;
                    const dy = e.touches[0].clientY - startY;
                    
                    element.style.position = 'relative';
                    element.style.left = (startLeft + dx) + 'px';
                    element.style.top = (startTop + dy) + 'px';
                }
                
                function stopDrag() {
                    isDragging = false;
                    element.classList.remove('dragging');
                    document.removeEventListener('mousemove', onDrag);
                    document.removeEventListener('touchmove', onDragTouch);
                    document.removeEventListener('mouseup', stopDrag);
                    document.removeEventListener('touchend', stopDrag);
                }
            }

            function initAllDraggableElements() {
                initDragForElement(selectedView);
            }
            
            // Initialiser les graphiques du carousel
            function initCarouselGraphs() {
                cryptos.forEach(crypto => {
                    const canvas = document.getElementById(`${crypto.id}Canvas`);
                    initGraph(canvas, crypto, true);
                });
            }
            
            // Initialiser un graphique
            function initGraph(canvas, crypto, isCarousel = false) {
                const DPR = window.devicePixelRatio || 1;
                
                let CSS_W, CSS_H;
                
                if (isCarousel) {
                    CSS_W = 400;
                    CSS_H = 160;
                } else {
                    CSS_W = 700;
                    CSS_H = 340;
                }
                
                canvas.style.width = CSS_W + "px";
                canvas.style.height = CSS_H + "px";
                canvas.width = CSS_W * DPR;
                canvas.height = CSS_H * DPR;
                
                const ctx = canvas.getContext('2d');
                ctx.scale(DPR, DPR);
                
                // Générer des données initiales basées sur le prix actuel
                const basePrice = getBasePrice(crypto.id);
                const historicalData = generateInitialData(basePrice);
                const currentPrice = basePrice;
                
                graphInstances[crypto.id] = {
                    canvas: canvas,
                    ctx: ctx,
                    crypto: crypto,
                    historicalData: historicalData,
                    currentPrice: currentPrice,
                    isFrozen: false,
                    CSS_W: CSS_W,
                    CSS_H: CSS_H,
                    scrollOffset: 0,
                    lastPrice: basePrice
                };
                
                drawHeikinAshiChart(graphInstances[crypto.id]);
                
                if (isCarousel) {
                    initCarouselControls(crypto.id);
                }
                
                return graphInstances[crypto.id];
            }
            
            // Obtenir le prix de base selon la crypto
            function getBasePrice(cryptoId) {
                switch(cryptoId) {
                    case 'bitcoin': return 50000;
                    case 'ethereum': return 3000;
                    case 'xrp': return 0.5;
                    case 'litecoin': return 70;
                    default: return 100;
                }
            }
            
            // Générer des données initiales pour Heikin-Ashi
            function generateInitialData(basePrice) {
                const data = [];
                let price = basePrice;
                
                for (let i = 0; i < 200; i++) {
                    const volatility = (Math.random() - 0.5) * basePrice * 0.03;
                    const open = price;
                    const close = price + volatility;
                    const high = Math.max(open, close) + Math.random() * basePrice * 0.015;
                    const low = Math.min(open, close) - Math.random() * basePrice * 0.015;
                    
                    data.push({
                        open: open,
                        high: high,
                        low: low,
                        close: close,
                        timestamp: Date.now() - (200 - i) * 24 * 60 * 60 * 1000
                    });
                    
                    price = close;
                }
                
                return data;
            }

            // Dessiner le graphique Heikin-Ashi
           function drawHeikinAshiChart(instance) {
                const { ctx, historicalData, CSS_W, CSS_H, scrollOffset } = instance;
                
                ctx.clearRect(0, 0, CSS_W, CSS_H);
                
                if (historicalData.length === 0) return;
                
                // ⭐⭐ POSITION ORIGINALE POUR LE CAROUSEL ⭐⭐
                let margin;
                if (selectedCrypto && instance.crypto.id === selectedCrypto.id) {
                    // Canvas sélectionné - position personnalisée
                    switch(instance.crypto.id) {
                        case 'bitcoin':
                            margin = { top: 40, right: 20, bottom: 10, left: 60 };
                            break;
                        case 'ethereum':
                            margin = { top: 40, right: 20, bottom: 10, left: 60 };
                            break;
                        case 'xrp':
                            margin = { top: 40, right: 20, bottom: 10, left: 60 };
                            break;
                        case 'litecoin':
                            margin = { top: 40, right: 20, bottom: 10, left: 60 };
                            break;
                        default:
                            margin = { top: 40, right: 20, bottom: 10, left: 60 };
                    }
                } else {
                    // ⭐⭐ CAROUSEL - POSITION ORIGINALE ⭐⭐
                    margin = { top: 20, right: 20, bottom: 10, left: 60 };
                }
                
                const graphWidth = CSS_W - margin.left - margin.right;
                const graphHeight = CSS_H - margin.top - margin.bottom;
                
                // Déterminer les données visibles en fonction du défilement
                let visibleData;
                if (scrollOffset > 0) {
                    const startIndex = Math.max(0, historicalData.length - 100 - scrollOffset);
                    const endIndex = Math.min(historicalData.length, startIndex + 100);
                    visibleData = historicalData.slice(startIndex, endIndex);
                } else {
                    visibleData = historicalData.slice(-100);
                }
                
                if (visibleData.length === 0) return;
                
                const prices = visibleData.flatMap(d => [d.high, d.low]);
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const priceRange = maxPrice - minPrice || 1;
                
                // Dessiner la grille
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
                
                // Dessiner les bougies Heikin-Ashi
                const candleWidth = CSS_W > 600 ? 8 : 6;
                const visibleCandles = Math.min(visibleData.length, Math.floor(graphWidth / (candleWidth + 2)));
                
                for (let i = 0; i < visibleCandles; i++) {
                    const candle = visibleData[i];
                    const x = margin.left + (i * (candleWidth + 2));
                    
                    const highY = margin.top + ((maxPrice - candle.high) / priceRange * graphHeight);
                    const lowY = margin.top + ((maxPrice - candle.low) / priceRange * graphHeight);
                    const openY = margin.top + ((maxPrice - candle.open) / priceRange * graphHeight);
                    const closeY = margin.top + ((maxPrice - candle.close) / priceRange * graphHeight);
                    
                    const isBullish = candle.close >= candle.open;
                    ctx.strokeStyle = isBullish ? '#39d353' : '#ff6b6b';
                    ctx.fillStyle = isBullish ? '#39d353' : '#ff6b6b';
                    
                    // Dessiner la mèche
                    ctx.beginPath();
                    ctx.moveTo(x + candleWidth/2, highY);
                    ctx.lineTo(x + candleWidth/2, lowY);
                    ctx.stroke();
                    
                    // Dessiner le corps
                    const bodyTop = Math.min(openY, closeY);
                    const bodyHeight = Math.abs(openY - closeY);
                    const bodyHeightMin = 1;
                    
                    ctx.fillRect(
                        x, 
                        bodyTop, 
                        candleWidth, 
                        Math.max(bodyHeight, bodyHeightMin)
                    );
                }
                
                // Dessiner les axes
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1;
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.font = CSS_W > 600 ? '14px Arial' : '10px Arial';
                
                // Axe Y
                ctx.beginPath();
                ctx.moveTo(margin.left, margin.top);
                ctx.lineTo(margin.left, margin.top + graphHeight);
                ctx.stroke();
                
                // Axe X
                ctx.beginPath();
                ctx.moveTo(margin.left, margin.top + graphHeight);
                ctx.lineTo(margin.left + graphWidth, margin.top + graphHeight);
                ctx.stroke();
                
                // Étiquettes Y
                const yTicks = 4;
                for (let i = 0; i <= yTicks; i++) {
                    const value = minPrice + (i * priceRange / yTicks);
                    const y = margin.top + graphHeight - (i * graphHeight / yTicks);
                    
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('$' + value.toFixed(0), margin.left - 5, y);
                }
            }

            // === FONCTIONS POUR LES BOUTONS ===
            function initCarouselControls(cryptoId) {
                const carouselItem = document.querySelector(`[data-crypto="${cryptoId}"]`);
                const freezeBtn = carouselItem.querySelector('.freeze-btn');
                const scrollLeftBtn = carouselItem.querySelector('.scroll-left-btn');
                const scrollRightBtn = carouselItem.querySelector('.scroll-right-btn');
                
                updateScrollButtons(cryptoId);
                
                freezeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const instance = graphInstances[cryptoId];
                    if (instance) {
                        instance.isFrozen = !instance.isFrozen;
                        freezeBtn.classList.toggle('active', instance.isFrozen);
                    }
                });
                
                scrollLeftBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const instance = graphInstances[cryptoId];
                    if (instance) {
                        instance.scrollOffset += 10;
                        updateScrollButtons(cryptoId);
                        drawHeikinAshiChart(instance);
                    }
                });
                
                scrollRightBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const instance = graphInstances[cryptoId];
                    if (instance) {
                        instance.scrollOffset = 0;
                        updateScrollButtons(cryptoId);
                        drawHeikinAshiChart(instance);
                    }
                });
                
                const canvas = document.getElementById(`${cryptoId}Canvas`);
                canvas.addEventListener('click', function(e) {
                    selectCrypto(cryptoId);
                });
            }
            
            function updateScrollButtons(cryptoId) {
                const carouselItem = document.querySelector(`[data-crypto="${cryptoId}"]`);
                const scrollLeftBtn = carouselItem.querySelector('.scroll-left-btn');
                const scrollRightBtn = carouselItem.querySelector('.scroll-right-btn');
                const instance = graphInstances[cryptoId];
                
                if (scrollLeftBtn && scrollRightBtn && instance) {
                    const maxScroll = Math.max(0, instance.historicalData.length - 100);
                    scrollLeftBtn.disabled = instance.scrollOffset >= maxScroll;
                    scrollRightBtn.disabled = instance.scrollOffset === 0;
                }
            }
            
            // Initialiser les contrôles de la vue sélectionnée
            function initSelectedViewControls() {
                const freezeBtn = document.getElementById('selectedFreezeBtn');
                const scrollLeftBtn = selectedView.querySelector('.scroll-left-btn');
                const scrollRightBtn = selectedView.querySelector('.scroll-right-btn');
                
                if (!selectedCrypto) return;
                
                const instance = graphInstances[selectedCrypto.id];
                if (!instance) return;
                
                updateSelectedViewButtons();
                
                freezeBtn.addEventListener('click', function() {
                    instance.isFrozen = !instance.isFrozen;
                    freezeBtn.classList.toggle('active', instance.isFrozen);
                });
                
                scrollLeftBtn.addEventListener('click', function() {
                    instance.scrollOffset += 10;
                    updateSelectedViewButtons();
                    drawHeikinAshiChart(instance);
                });
                
                scrollRightBtn.addEventListener('click', function() {
                    instance.scrollOffset = 0;
                    updateSelectedViewButtons();
                    drawHeikinAshiChart(instance);
                });
            }
            
            function updateSelectedViewButtons() {
                if (!selectedCrypto) return;
                
                const instance = graphInstances[selectedCrypto.id];
                const scrollLeftBtn = selectedView.querySelector('.scroll-left-btn');
                const scrollRightBtn = selectedView.querySelector('.scroll-right-btn');
                
                if (scrollLeftBtn && scrollRightBtn && instance) {
                    const maxScroll = Math.max(0, instance.historicalData.length - 100);
                    scrollLeftBtn.disabled = instance.scrollOffset >= maxScroll;
                    scrollRightBtn.disabled = instance.scrollOffset === 0;
                }
            }
            
            // Sélectionner une cryptomonnaie
            function selectCrypto(cryptoId) {
                selectedCrypto = cryptos.find(c => c.id === cryptoId);
                
                carousel.classList.add('carousel-paused');
                clearInterval(carouselUpdateInterval);
                
                carouselScene.classList.add('hidden');
                
                selectedCryptoName.textContent = selectedCrypto.name;
                selectedCryptoName.style.fontSize = selectedCrypto.size;
                selectedCryptoName.style.color = selectedCrypto.color;
                selectedCryptoName.style.position = 'absolute';
                selectedCryptoName.style.bottom = selectedCrypto.position;
                selectedCryptoName.style.left = '0';
                selectedCryptoName.style.width = '100%';
                selectedCryptoName.style.textAlign = 'center';
                selectedCryptoName.style.top = 'auto';
                
                // NE PAS METTRE À JOUR LE PRIX DANS LA VUE SÉLECTIONNÉE
                // (supprimé pour cacher le prix dans la vue sélectionnée)
                
                selectedView.classList.add('active');
                
                if (cryptoId === 'bitcoin') {
                    selectedView.classList.add('bitcoin-selected');
                } else {
                    selectedView.classList.remove('bitcoin-selected');
                }
                
                initGraph(selectedCanvas, selectedCrypto, false);
                initSelectedViewControls();
                
                backBtn.classList.remove('hidden');
            }
            
            // Ajouter une nouvelle bougie avec les données réelles
            function addNewCandle(instance, price) {
                const lastCandle = instance.historicalData[instance.historicalData.length - 1];
                
                const newCandle = {
                    open: lastCandle.close,
                    high: Math.max(lastCandle.close, price),
                    low: Math.min(lastCandle.close, price),
                    close: price,
                    timestamp: Date.now()
                };
                
                instance.historicalData.push(newCandle);
                instance.currentPrice = price;
                
                if (instance.historicalData.length > 200) {
                    instance.historicalData.shift();
                }
            }
            
            // Retour au carousel
            backBtn.addEventListener('click', function() {
                selectedView.classList.remove('active');
                selectedView.classList.remove('bitcoin-selected');
                carouselScene.classList.remove('hidden');
                backBtn.classList.add('hidden');
                selectedCrypto = null;
                
                selectedView.style.position = 'relative';
                selectedView.style.left = '0px';
                selectedView.style.top = '0px';
                
                carousel.classList.remove('carousel-paused');
                startCarouselUpdate();
            });
            
            // Démarrer la mise à jour automatique du carousel
            function startCarouselUpdate() {
                // Pas besoin de mise à jour automatique car les données viennent de l'API
                // Cette fonction est conservée pour la compatibilité mais ne fait rien
            }
            
            // Initialiser l'application
            initCarouselGraphs();
            initAllDraggableElements();
            startApiUpdates(); // Démarrer les mises à jour de l'API toutes les 2 secondes
        });
