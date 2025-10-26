document.addEventListener('DOMContentLoaded', function() {
    // Configuration des actifs
    const assetTypes = {
        crypto: [
            { 
                id: 'bitcoin', 
                name: 'Bitcoin (BTC)', 
                color: 'white',
                symbol: 'BTCUSDT',
                priceElement: 'btcPrice',
                displayName: 'Bitcoin (BTC)'
            },
            { 
                id: 'litecoin', 
                name: 'Litecoin (LTC)', 
                color: 'white',
                symbol: 'LTCUSDT',
                priceElement: 'ltcPrice',
                displayName: 'Litecoin (LTC)'
            },
            { 
                id: 'ethereum', 
                name: 'Ethereum (ETH)', 
                color: 'white',
                symbol: 'ETHUSDT',
                priceElement: 'ethPrice',
                displayName: 'Ethereum (ETH)'
            },
            { 
                id: 'xrp', 
                name: 'XRP', 
                color: 'white',
                symbol: 'XRPUSDT',
                priceElement: 'xrpPrice',
                displayName: 'XRP'
            }
        ],
        shares: [
            { 
                id: 'netflix', 
                name: 'Netflix (NFLX)', 
                color: 'white',
                symbol: 'NFLX',
                priceElement: 'nflxPrice',
                displayName: 'Netflix (NFLX)'
            },
            { 
                id: 'apple', 
                name: 'Apple (AAPL)', 
                color: 'white',
                symbol: 'AAPL',
                priceElement: 'aaplPrice',
                displayName: 'Apple (AAPL)'
            },
            { 
                id: 'tesla', 
                name: 'Tesla (TSLA)', 
                color: 'white',
                symbol: 'TSLA',
                priceElement: 'tslaPrice',
                displayName: 'Tesla (TSLA)'
            },
            { 
                id: 'intel', 
                name: 'Intel (INTC)', 
                color: 'white',
                symbol: 'INTC',
                priceElement: 'intcPrice',
                displayName: 'Intel (INTC)'
            }
        ],
        commodities: [
            { 
                id: 'gold', 
                name: 'Gold (XAUUSD)', 
                color: 'white',
                symbol: 'XAUUSD',
                priceElement: 'goldPrice',
                displayName: 'Gold (XAUUSD)'
            },
            { 
                id: 'silver', 
                name: 'Silver (XAGUSD)', 
                color: 'white',
                symbol: 'XAGUSD',
                priceElement: 'silverPrice',
                displayName: 'Silver (XAGUSD)'
            },
            { 
                id: 'platinum', 
                name: 'Platinum (XPTUSD)', 
                color: 'white',
                symbol: 'XPTUSD',
                priceElement: 'platinumPrice',
                displayName: 'Platinum (XPTUSD)'
            },
            { 
                id: 'naturalgas', 
                name: 'Natural Gas (NATGAS)', 
                color: 'white',
                symbol: 'NATGAS',
                priceElement: 'gasPrice',
                displayName: 'Natural Gas (NATGAS)'
            }
        ],
        forex: [
            { 
                id: 'eurusd', 
                name: 'EUR/USD', 
                color: 'white',
                symbol: 'EURUSD',
                priceElement: 'eurPrice',
                displayName: 'EUR/USD'
            },
            { 
                id: 'gbpusd', 
                name: 'GBP/USD', 
                color: 'white',
                symbol: 'GBPUSD',
                priceElement: 'gbpPrice',
                displayName: 'GBP/USD'
            },
            { 
                id: 'audcad', 
                name: 'AUD/CAD', 
                color: 'white',
                symbol: 'AUDCAD',
                priceElement: 'audPrice',
                displayName: 'AUD/CAD'
            },
            { 
                id: 'nzdusd', 
                name: 'NZD/USD', 
                color: 'white',
                symbol: 'NZDUSD',
                priceElement: 'nzdPrice',
                displayName: 'NZD/USD'
            }
        ]
    };

    let currentAssetType = 'crypto';
    let currentAssets = assetTypes.crypto;
    
    // Éléments du DOM
    const carousel = document.getElementById('mainCarousel');
    const carouselScene = document.getElementById('carouselScene');
    const selectedView = document.getElementById('selectedView');
    const selectedCanvas = document.getElementById('selectedCanvas');
    const selectedCryptoName = document.getElementById('selectedCryptoName');
    const backBtn = document.getElementById('backBtn');
    const loader = document.getElementById('loader');
    const cryptoInfoPanel = document.getElementById('cryptoInfoPanel');
    const lineChartBtn = document.getElementById('lineChartBtn');
    const candleChartBtn = document.getElementById('candleChartBtn');
    const pcChartBtn = document.getElementById('pcChartBtn');
    const menuSections = document.querySelectorAll('.menu-section');
    const sideMenu = document.getElementById('sideMenu');
    
    // Variables d'état
    let graphInstances = {};
    let selectedAsset = null;
    let apiUpdateInterval;
    let selectedChartType = 'candle';
    
    // Stocker le type de graphique pour chaque actif dans le carousel
    let carouselChartTypes = {};
    
    // Initialiser les types de graphiques
    function initChartTypes() {
        Object.keys(assetTypes).forEach(type => {
            assetTypes[type].forEach(asset => {
                carouselChartTypes[asset.id] = 'candle';
            });
        });
    }

    // Stocker les données 24h pour chaque actif
    let asset24hData = {};
    
    // === GESTION DU MENU LATÉRAL ===
    function initMenu() {
        menuSections.forEach(section => {
            section.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                
                // Mettre à jour les sections actives
                menuSections.forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                
                // Changer le type d'actif
                currentAssetType = type;
                currentAssets = assetTypes[type];
                
                // Mettre à jour le carousel
                updateCarousel();
                
                // Redémarrer les mises à jour API
                startApiUpdates();
            });
        });
    }
    
    // === MISE À JOUR DU CAROUSEL ===
    function updateCarousel() {
        // Vider le carousel
        carousel.innerHTML = '';
        
        // Recréer les éléments du carousel
        currentAssets.forEach((asset, index) => {
            const carouselItem = document.createElement('div');
            carouselItem.className = 'carousel-item';
            carouselItem.setAttribute('data-crypto', asset.id);
            
            carouselItem.innerHTML = `
                <div class="crypto-name">${asset.displayName}</div>
                <div class="price-display" id="${asset.priceElement}">Chargement...</div>
                <canvas id="${asset.id}Canvas"></canvas>
                <div class="carousel-item-controls">
                    <button class="carousel-item-btn active" data-crypto="${asset.id}" data-type="candle" title="Graphique en bougies">B</button>
                    <button class="carousel-item-btn" data-crypto="${asset.id}" data-type="pc" title="Graphique PC">L</button>
                    <button class="carousel-item-btn" data-crypto="${asset.id}" data-type="line" title="Graphique en ligne">F</button>
                </div>
            `;
            
            carousel.appendChild(carouselItem);
            
            // Positionner l'élément dans le carousel 3D
            carouselItem.style.transform = `rotateY(${index * 90}deg) translateZ(280px)`;
            
            // Initialiser le graphique
            initGraph(document.getElementById(`${asset.id}Canvas`), asset, true);
            
            // Ajouter l'événement de clic
            const canvasElement = document.getElementById(`${asset.id}Canvas`);
            canvasElement.addEventListener('click', function(e) {
                selectAsset(asset.id);
            });
        });
        
        // Réinitialiser les boutons du carousel
        initCarouselButtons();
        
        // Charger les données historiques
        currentAssets.forEach(asset => {
            fetchHistoricalData(asset.id, true);
        });
    }
    
    // === API BINANCE ET YAHOO FINANCE ===
    function startApiUpdates() {
        fetchAllPrices();
        fetchAll24hData();
        clearInterval(apiUpdateInterval);
        apiUpdateInterval = setInterval(() => {
            fetchAllPrices();
            fetchAll24hData();
        }, 2000);
    }
    
    function fetchAllPrices() {
        currentAssets.forEach(asset => {
            fetchAssetPrice(asset);
        });
    }

    function fetchAll24hData() {
        currentAssets.forEach(asset => {
            fetch24hData(asset);
        });
    }

    function fetch24hData(asset) {
        if (currentAssetType === 'crypto') {
            // API Binance pour les cryptos
            const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${asset.symbol}`;
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erreur réseau');
                    }
                    return response.json();
                })
                .then(data => {
                    asset24hData[asset.id] = {
                        highPrice: parseFloat(data.highPrice),
                        lowPrice: parseFloat(data.lowPrice),
                        volume: parseFloat(data.volume),
                        priceChange: parseFloat(data.priceChange),
                        priceChangePercent: parseFloat(data.priceChangePercent)
                    };
                    
                    if (selectedAsset && selectedAsset.id === asset.id) {
                        updateAssetInfoPanel(graphInstances[asset.id]);
                    }
                })
                .catch(error => {
                    console.error(`Erreur données 24h pour ${asset.symbol}:`, error);
                });
        } else {
            // Pour les actions, commodities et forex, on utilise des données simulées
            asset24hData[asset.id] = {
                highPrice: Math.random() * 100 + 100,
                lowPrice: Math.random() * 50 + 50,
                volume: Math.random() * 1000000,
                priceChange: (Math.random() - 0.5) * 10,
                priceChangePercent: (Math.random() - 0.5) * 5
            };
            
            if (selectedAsset && selectedAsset.id === asset.id) {
                updateAssetInfoPanel(graphInstances[asset.id]);
            }
        }
    }
    
    function fetchAssetPrice(asset) {
        if (currentAssetType === 'crypto') {
            // API Binance pour les cryptos
            const url = `https://api.binance.com/api/v3/ticker/price?symbol=${asset.symbol}`;
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erreur réseau');
                    }
                    return response.json();
                })
                .then(data => {
                    const price = parseFloat(data.price);
                    updateAssetPrice(asset.id, price);
                })
                .catch(error => {
                    console.error(`Erreur pour ${asset.symbol}:`, error);
                });
        } else {
            // Pour les actions, commodities et forex, simulation de prix
            const price = Math.random() * 100 + 100;
            updateAssetPrice(asset.id, price);
        }
    }

    function fetchHistoricalData(assetId, isCarousel = false) {
        const asset = currentAssets.find(c => c.id === assetId);
        
        if (!isCarousel) {
            loader.classList.remove('hidden');
        }
        
        if (currentAssetType === 'crypto') {
            // API Binance pour les cryptos
            const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
            const url = `https://api.binance.com/api/v3/klines?symbol=${asset.symbol}&interval=1d&limit=180&startTime=${sixMonthsAgo}`;
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erreur réseau');
                    }
                    return response.json();
                })
                .then(data => {
                    const candles = data.map(kline => ({
                        open: parseFloat(kline[1]),
                        high: parseFloat(kline[2]),
                        low: parseFloat(kline[3]),
                        close: parseFloat(kline[4]),
                        volume: parseFloat(kline[5]),
                        timestamp: kline[0]
                    }));
                    
                    processHistoricalData(assetId, candles, isCarousel);
                })
                .catch(error => {
                    console.error(`Erreur historique pour ${asset.symbol}:`, error);
                    if (!isCarousel) {
                        loader.classList.add('hidden');
                    }
                });
        } else {
            // Pour les actions, commodities et forex, génération de données simulées
            const candles = generateMockData(180);
            processHistoricalData(assetId, candles, isCarousel);
        }
    }

    function generateMockData(days) {
        const candles = [];
        let price = 100 + Math.random() * 50;
        const baseTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        
        for (let i = 0; i < days; i++) {
            const change = (Math.random() - 0.5) * 10;
            const open = price;
            const close = price + change;
            const high = Math.max(open, close) + Math.random() * 5;
            const low = Math.min(open, close) - Math.random() * 5;
            const volume = Math.random() * 1000000;
            
            candles.push({
                open: open,
                high: high,
                low: low,
                close: close,
                volume: volume,
                timestamp: baseTime + (i * 24 * 60 * 60 * 1000)
            });
            
            price = close;
        }
        
        return candles;
    }

    function processHistoricalData(assetId, candles, isCarousel) {
        const instance = graphInstances[assetId];
        if (instance) {
            instance.candles = candles;
            calculateMonthlyChange(instance);
            calculatePerformanceChanges(instance);
            
            if (isCarousel) {
                const chartType = carouselChartTypes[assetId];
                redrawCarouselGraph(instance, chartType);
            } else {
                redrawSelectedGraph(instance, selectedChartType);
            }
        }
        if (!isCarousel) {
            loader.classList.add('hidden');
        }
    }

    // === SÉLECTION D'ACTIF ===
    function selectAsset(assetId) {
        selectedAsset = currentAssets.find(c => c.id === assetId);
        selectedView.style.background = '#111216';
        selectedView.style.backgroundColor = 'rgba(17, 18, 22, 0.5)';   
        carousel.classList.add('carousel-paused');
        carouselScene.classList.add('hidden');
        
        // Cacher le menu latéral
        sideMenu.classList.add('hidden');
        
        selectedCryptoName.textContent = selectedAsset.displayName;
        selectedCryptoName.style.position = 'absolute';
        selectedCryptoName.style.bottom = '10px';
        selectedCryptoName.style.left = '0';
        selectedCryptoName.style.width = '100%';
        selectedCryptoName.style.textAlign = 'center';
        selectedCryptoName.style.fontSize = '10px';
        selectedCryptoName.style.color = 'white';
        selectedCryptoName.style.zIndex = '10';
        
        selectedView.classList.add('active');
        backBtn.classList.remove('hidden');
        
        selectedView.style.width = '700px';
        selectedView.style.height = '400px';

        initGraph(selectedCanvas, selectedAsset, false);
        
        cryptoInfoPanel.style.position = 'relative';
        cryptoInfoPanel.style.width = '700px';
        cryptoInfoPanel.style.height = '120px';
        cryptoInfoPanel.style.left = 'auto';
        cryptoInfoPanel.style.top = 'auto';
        
        const originalInstance = graphInstances[selectedAsset.id];
        const newInstance = graphInstances[selectedAsset.id];
        if (originalInstance && newInstance) {
            newInstance.candles = [...originalInstance.candles];
            newInstance.currentPrice = originalInstance.currentPrice;
            newInstance.lastPrice = originalInstance.lastPrice;
            newInstance.monthlyChange = originalInstance.monthlyChange;
            newInstance.performanceChanges = originalInstance.performanceChanges;
            
            redrawSelectedGraph(newInstance, selectedChartType);
            updateAssetInfoPanel(newInstance);
            updatePerformanceIndicators(newInstance);
        }
        
        if (!originalInstance || originalInstance.candles.length === 0) {
            fetchHistoricalData(assetId);
        }
    }

    // === INITIALISATION ===
    function init() {
        initChartTypes();
        initMenu();
        updateCarousel();
        initAllDraggableElements();
        initPanelDrag();
        initGraphToggleButtons();
        initCarouselButtons();
        startApiUpdates();
    }

    // Démarrer l'application
    init();

    // === FONCTIONS EXISTANTES - À COPIER DEPUIS LE CODE ORIGINAL ===
    // Les fonctions suivantes doivent être copiées depuis le code original :
    
    function createResizeCornerForPanel(element) {
        const corner = document.createElement('div');
        corner.className = 'resize-corner';
        corner.style.position = 'absolute';
        corner.style.bottom = '0px';
        corner.style.right = '0px';
        corner.style.width = '20px';
        corner.style.height = '20px';
        corner.style.cursor = 'nwse-resize';
        corner.style.zIndex = '1000';
        
        const canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 20;
        canvas.style.width = '20px';
        canvas.style.height = '20px';
        const ctx = canvas.getContext('2d');
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(20, 20, 15, Math.PI, Math.PI * 1.5, false);
        ctx.stroke();
        
        corner.appendChild(canvas);
        element.appendChild(corner);
        
        let isResizing = false;
        let startX, startY;
        let startWidth, startHeight;
        
        corner.addEventListener('mousedown', startResize);
        
        function startResize(e) {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
            e.preventDefault();
        }
        
        function resize(e) {
            if (!isResizing) return;
            
            const dx = e.clientX - startX;
            const newWidth = Math.max(400, startWidth + dx);
            const newHeight = 120;
            
            element.style.width = newWidth + 'px';
            element.style.height = newHeight + 'px';
        }
        
        function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
        
        return corner;
    }
    
    function initPanelDrag() {
        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;
        
        cryptoInfoPanel.addEventListener('mousedown', startDrag);
        
        function startDrag(e) {
            if (e.target.classList.contains('resize-corner')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = cryptoInfoPanel.offsetLeft;
            startTop = cryptoInfoPanel.offsetTop;
            
            cryptoInfoPanel.classList.add('dragging');
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            e.preventDefault();
        }
        
        function onDrag(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            cryptoInfoPanel.style.position = 'absolute';
            cryptoInfoPanel.style.left = (startLeft + dx) + 'px';
            cryptoInfoPanel.style.top = (startTop + dy) + 'px';
            cryptoInfoPanel.style.width = cryptoInfoPanel.style.width || '700px';
            cryptoInfoPanel.style.height = '120px';
        }
        
        function stopDrag() {
            isDragging = false;
            cryptoInfoPanel.classList.remove('dragging');
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
        }
    }
    
    function calculatePerformanceChanges(instance) {
        if (!instance.candles || instance.candles.length === 0) return;
        
        const currentPrice = instance.candles[instance.candles.length - 1].close;
        
        const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        const threeMonthCandle = instance.candles.find(c => c.timestamp >= threeMonthsAgo);
        const threeMonthChange = threeMonthCandle ? 
            ((currentPrice - threeMonthCandle.close) / threeMonthCandle.close) * 100 : 0;
        
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const oneMonthCandle = instance.candles.find(c => c.timestamp >= oneMonthAgo);
        const oneMonthChange = oneMonthCandle ? 
            ((currentPrice - oneMonthCandle.close) / oneMonthCandle.close) * 100 : 0;
        
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const oneWeekCandle = instance.candles.find(c => c.timestamp >= oneWeekAgo);
        const oneWeekChange = oneWeekCandle ? 
            ((currentPrice - oneWeekCandle.close) / oneWeekCandle.close) * 100 : 0;
        
        instance.performanceChanges = {
            threeMonth: threeMonthChange,
            oneMonth: oneMonthChange,
            oneWeek: oneWeekChange
        };
        
        updatePerformanceIndicators(instance);
    }
    
    function updatePerformanceIndicators(instance) {
        if (!instance.performanceChanges) return;
        
        const { threeMonth, oneMonth, oneWeek } = instance.performanceChanges;
        
        updateSingleIndicator('indicator3M', 'value3M', threeMonth);
        updateSingleIndicator('indicator1M', 'value1M', oneMonth);
        updateSingleIndicator('indicator1W', 'value1W', oneWeek);
    }
    
    function updateSingleIndicator(indicatorId, valueId, change) {
        const indicator = document.getElementById(indicatorId);
        const valueElement = document.getElementById(valueId);
        
        if (!indicator || !valueElement) return;
        
        const sign = change >= 0 ? '+' : '';
        valueElement.textContent = `${sign}${change.toFixed(2)}%`;
        
        if (change > 0) {
            indicator.className = 'performance-indicator performance-positive';
            valueElement.style.color = '#39d353';
        } else if (change < 0) {
            indicator.className = 'performance-indicator performance-negative';
            valueElement.style.color = '#ff6b6b';
        } else {
            indicator.className = 'performance-indicator performance-neutral';
            valueElement.style.color = 'white';
        }
    }
    
    function drawMonthMarkers(instance) {
        const { ctx, candles, CSS_W, CSS_H } = instance;
        
        if (candles.length === 0) return;
        
        const margin = { top: 10, right: 10, bottom: 25, left: 50 };
        const graphWidth = CSS_W - margin.left - margin.right;
        const graphHeight = CSS_H - margin.top - margin.bottom;
        
        const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        const recentCandles = candles.filter(candle => candle.timestamp >= threeMonthsAgo);
        
        if (recentCandles.length === 0) return;
        
        const startDate = new Date(recentCandles[0].timestamp);
        const endDate = new Date(recentCandles[recentCandles.length - 1].timestamp);
        const totalTimeRange = endDate - startDate;
        
        const monthPositions = getRealMonthPositions(startDate, endDate, graphWidth, margin.left, totalTimeRange);
        
        monthPositions.forEach(({ x, monthName }) => {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(x, margin.top);
            ctx.lineTo(x, margin.top + graphHeight);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(monthName, x, margin.top + graphHeight + 5);
        });
    }
    
    function getRealMonthPositions(startDate, endDate, graphWidth, leftMargin, totalTimeRange) {
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const positions = [];
        
        const currentMonth = new Date(startDate);
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        
        while (currentMonth <= endDate) {
            const monthTimestamp = currentMonth.getTime();
            const timePosition = (monthTimestamp - startDate) / totalTimeRange;
            const x = leftMargin + (timePosition * graphWidth);
            
            if (x >= leftMargin && x <= leftMargin + graphWidth) {
                const monthName = monthNames[currentMonth.getMonth()];
                const year = currentMonth.getFullYear();
                const displayName = currentMonth.getMonth() === 0 || positions.length === 0 
                    ? `${monthName} ${year}` 
                    : monthName;
                
                positions.push({
                    x: x,
                    monthName: displayName
                });
            }
            
            currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
        
        return positions;
    }
    
    function calculateMonthlyChange(instance) {
        if (!instance.candles || instance.candles.length < 30) return;
        
        const monthlyCandles = instance.candles.slice(-30);
        const firstPrice = monthlyCandles[0].close;
        const lastPrice = monthlyCandles[monthlyCandles.length - 1].close;
        const change = ((lastPrice - firstPrice) / firstPrice) * 100;
        
        instance.monthlyChange = change;
        
        if (selectedAsset && selectedAsset.id === instance.crypto.id) {
            updateAssetInfoPanel(instance);
        }
    }
    
    function updateAssetInfoPanel(instance) {
        if (!instance.candles || instance.candles.length === 0) return;
        
        const currentCandle = instance.candles[instance.candles.length - 1];
        const symbol = instance.crypto.symbol.replace('USDT', '');
        const assetData24h = asset24hData[instance.crypto.id];
        
        document.getElementById('infoSymbol').textContent = symbol;
        document.getElementById('infoPrice').textContent = `$${currentCandle.close.toFixed(2)}`;
        
        const changeElement = document.getElementById('infoChange');
        if (instance.monthlyChange !== undefined) {
            const sign = instance.monthlyChange >= 0 ? '+' : '';
            changeElement.textContent = `${sign}${instance.monthlyChange.toFixed(2)}% `;
            
            if (instance.monthlyChange >= 0) {
                changeElement.className = 'crypto-change positive';
            } else {
                changeElement.className = 'crypto-change negative';
            }
        }
        
        if (assetData24h) {
            document.getElementById('infoHigh').textContent = `$${assetData24h.highPrice.toFixed(2)}`;
            document.getElementById('infoLow').textContent = `$${assetData24h.lowPrice.toFixed(2)}`;
            
            let formattedVolume;
            if (assetData24h.volume >= 1000000) {
                formattedVolume = `${(assetData24h.volume / 1000000).toFixed(2)}M`;
            } else if (assetData24h.volume >= 1000) {
                formattedVolume = `${(assetData24h.volume / 1000).toFixed(2)}K`;
            } else {
                formattedVolume = assetData24h.volume.toFixed(2);
            }
            document.getElementById('infoVolume').textContent = formattedVolume;
        } else {
            document.getElementById('infoHigh').textContent = '$0.00';
            document.getElementById('infoLow').textContent = '$0.00';
            document.getElementById('infoVolume').textContent = '0';
        }
        
        cryptoInfoPanel.classList.remove('hidden');
    }
    
    function updateAssetPrice(assetId, price) {
        const instance = graphInstances[assetId];
        if (!instance) return;
        
        instance.currentPrice = price;
        
        const priceElement = document.getElementById(currentAssets.find(c => c.id === assetId).priceElement);
        if (priceElement) {
            priceElement.textContent = `$${price.toFixed(2)}`;
            priceElement.style.color = price > (instance.lastPrice || 0) ? '#39d353' : '#ff6b6b';
        }
        
        instance.lastPrice = price;
        
        if (selectedAsset && selectedAsset.id === assetId) {
            updateAssetInfoPanel(instance);
        }
    }
    
    function initGraph(canvas, crypto, isCarousel = false) {
        const DPR = window.devicePixelRatio || 1;
        
        let CSS_W, CSS_H;
        
        if (isCarousel) {
            CSS_W = 400;
            CSS_H = 160;
        } else {
            CSS_W = 680;
            CSS_H = 350;
            
            canvas.style.position = 'absolute';
            canvas.style.left = '10px';
            canvas.style.top = '10px';
            canvas.style.zIndex = '1000';
        }
        
        canvas.style.width = CSS_W + "px";
        canvas.style.height = CSS_H + "px";
        canvas.width = CSS_W * DPR;
        canvas.height = CSS_H * DPR;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(DPR, DPR);
        
        graphInstances[crypto.id] = {
            canvas: canvas,
            ctx: ctx,
            crypto: crypto,
            candles: [],
            currentPrice: 0,
            CSS_W: CSS_W,
            CSS_H: CSS_H,
            scrollOffset: 0,
            lastPrice: 0,
            monthlyChange: 0,
            performanceChanges: null,
            position: { x: 50, y: 50 }
        };
        
        return graphInstances[crypto.id];
    }
    
    function drawLineChart(instance) {
        const { ctx, candles, CSS_W, CSS_H } = instance;
        
        ctx.clearRect(0, 0, CSS_W, CSS_H);
        
        if (candles.length === 0) return;
        
        const margin = { top: 10, right: 10, bottom: 25, left: 50 };
        const graphWidth = CSS_W - margin.left - margin.right;
        const graphHeight = CSS_H - margin.top - margin.bottom;
        
        const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        const recentCandles = candles.filter(candle => candle.timestamp >= threeMonthsAgo);
        
        if (recentCandles.length === 0) return;
        
        const closes = recentCandles.map(c => c.close);
        let minPrice = Math.min(...closes);
        let maxPrice = Math.max(...closes);
        
        const priceRange = maxPrice - minPrice;
        minPrice = minPrice - (priceRange * 0.02);
        maxPrice = maxPrice + (priceRange * 0.02);
        const adjustedPriceRange = maxPrice - minPrice;
        
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 4; i++) {
            const y = margin.top + (i * graphHeight / 4);
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + graphWidth, y);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#39d353';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const startDate = new Date(recentCandles[0].timestamp);
        const endDate = new Date(recentCandles[recentCandles.length - 1].timestamp);
        const totalTimeRange = endDate - startDate;
        
        for (let i = 0; i < recentCandles.length; i++) {
            const candle = recentCandles[i];
            const timePosition = (candle.timestamp - startDate) / totalTimeRange;
            const x = margin.left + (timePosition * graphWidth);
            const y = margin.top + ((maxPrice - candle.close) / adjustedPriceRange * graphHeight);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(57, 211, 83, 0.1)';
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + graphHeight);
        
        for (let i = 0; i < recentCandles.length; i++) {
            const candle = recentCandles[i];
            const timePosition = (candle.timestamp - startDate) / totalTimeRange;
            const x = margin.left + (timePosition * graphWidth);
            const y = margin.top + ((maxPrice - candle.close) / adjustedPriceRange * graphHeight);
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(margin.left + graphWidth, margin.top + graphHeight);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + graphHeight);
        ctx.stroke();
        
        for (let i = 0; i <= 4; i++) {
            const value = minPrice + (i * adjustedPriceRange / 4);
            const y = margin.top + (i * graphHeight / 4);
            
            let formattedValue;
            if (value >= 1000) {
                formattedValue = `$${(value/1000).toFixed(1)}K`;
            } else if (value >= 1) {
                formattedValue = `$${value.toFixed(2)}`;
            } else {
                formattedValue = `$${value.toFixed(4)}`;
            }
            
            ctx.fillText(formattedValue, margin.left - 5, y);
        }
    }
    
    function drawCandlestickChart(instance) {
        const { ctx, candles, CSS_W, CSS_H } = instance;
        
        ctx.clearRect(0, 0, CSS_W, CSS_H);
        
        if (candles.length === 0) return;
        
        const margin = { top: 10, right: 10, bottom: 25, left: 50 };
        const graphWidth = CSS_W - margin.left - margin.right;
        const graphHeight = CSS_H - margin.top - margin.bottom;
        
        const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        const recentCandles = candles.filter(candle => candle.timestamp >= threeMonthsAgo);
        
        if (recentCandles.length === 0) return;
        
        const highs = recentCandles.map(c => c.high);
        const lows = recentCandles.map(c => c.low);
        let minPrice = Math.min(...lows);
        let maxPrice = Math.max(...highs);
        
        const priceRange = maxPrice - minPrice;
        minPrice = minPrice - (priceRange * 0.02);
        maxPrice = maxPrice + (priceRange * 0.02);
        const adjustedPriceRange = maxPrice - minPrice;
        
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 4; i++) {
            const y = margin.top + (i * graphHeight / 4);
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + graphWidth, y);
            ctx.stroke();
        }
        
        const startDate = new Date(recentCandles[0].timestamp);
        const endDate = new Date(recentCandles[recentCandles.length - 1].timestamp);
        const totalTimeRange = endDate - startDate;
        
        const candleWidth = Math.max(2, (graphWidth / recentCandles.length) * 0.8);
        
        for (let i = 0; i < recentCandles.length; i++) {
            const candle = recentCandles[i];
            const timePosition = (candle.timestamp - startDate) / totalTimeRange;
            const x = margin.left + (timePosition * graphWidth) - (candleWidth / 2);
            
            const highY = margin.top + ((maxPrice - candle.high) / adjustedPriceRange * graphHeight);
            const lowY = margin.top + ((maxPrice - candle.low) / adjustedPriceRange * graphHeight);
            const openY = margin.top + ((maxPrice - candle.open) / adjustedPriceRange * graphHeight);
            const closeY = margin.top + ((maxPrice - candle.close) / adjustedPriceRange * graphHeight);
            
            const isBullish = candle.close >= candle.open;
            
            ctx.strokeStyle = isBullish ? '#39d353' : '#ff6b6b';
            ctx.fillStyle = isBullish ? '#39d353' : '#ff6b6b';
            
            ctx.beginPath();
            ctx.moveTo(x + candleWidth/2, highY);
            ctx.lineTo(x + candleWidth/2, lowY);
            ctx.stroke();
            
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1, Math.abs(openY - closeY));
            
            if (isBullish) {
                ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
            } else {
                ctx.strokeRect(x, bodyTop, candleWidth, bodyHeight);
            }
        }
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + graphHeight);
        ctx.stroke();
        
        for (let i = 0; i <= 4; i++) {
            const value = minPrice + (i * adjustedPriceRange / 4);
            const y = margin.top + (i * graphHeight / 4);
            
            let formattedValue;
            if (value >= 1000) {
                formattedValue = `$${(value/1000).toFixed(1)}K`;
            } else if (value >= 1) {
                formattedValue = `$${value.toFixed(2)}`;
            } else {
                formattedValue = `$${value.toFixed(4)}`;
            }
            
            ctx.fillText(formattedValue, margin.left - 5, y);
        }
    }

    function drawPcChart(instance) {
        const { ctx, candles, CSS_W, CSS_H } = instance;
        
        ctx.clearRect(0, 0, CSS_W, CSS_H);
        
        if (candles.length === 0) return;
        
        const margin = { top: 10, right: 10, bottom: 25, left: 50 };
        const graphWidth = CSS_W - margin.left - margin.right;
        const graphHeight = CSS_H - margin.top - margin.bottom;
        
        const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        const recentCandles = candles.filter(candle => candle.timestamp >= threeMonthsAgo);
        
        if (recentCandles.length === 0) return;
        
        const closes = recentCandles.map(c => c.close);
        let minPrice = Math.min(...closes);
        let maxPrice = Math.max(...closes);
        
        const priceRange = maxPrice - minPrice;
        minPrice = minPrice - (priceRange * 0.02);
        maxPrice = maxPrice + (priceRange * 0.02);
        const adjustedPriceRange = maxPrice - minPrice;
        
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 4; i++) {
            const y = margin.top + (i * graphHeight / 4);
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + graphWidth, y);
            ctx.stroke();
        }
        
        ctx.strokeStyle = 'lightblue';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const startDate = new Date(recentCandles[0].timestamp);
        const endDate = new Date(recentCandles[recentCandles.length - 1].timestamp);
        const totalTimeRange = endDate - startDate;
        
        for (let i = 0; i < recentCandles.length; i++) {
            const candle = recentCandles[i];
            const timePosition = (candle.timestamp - startDate) / totalTimeRange;
            const x = margin.left + (timePosition * graphWidth);
            const y = margin.top + ((maxPrice - candle.close) / adjustedPriceRange * graphHeight);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + graphHeight);
        ctx.stroke();
        
        for (let i = 0; i <= 4; i++) {
            const value = minPrice + (i * adjustedPriceRange / 4);
            const y = margin.top + (i * graphHeight / 4);
            
            let formattedValue;
            if (value >= 1000) {
                formattedValue = `$${(value/1000).toFixed(1)}K`;
            } else if (value >= 1) {
                formattedValue = `$${value.toFixed(2)}`;
            } else {
                formattedValue = `$${value.toFixed(4)}`;
            }
            
            ctx.fillText(formattedValue, margin.left - 5, y);
        }
    }
    
    function redrawCarouselGraph(instance, chartType) {
        if (chartType === 'line') {
            drawLineChart(instance);
        } else if (chartType === 'pc') {
            drawPcChart(instance);
        } else {
            drawCandlestickChart(instance);
        }
        drawMonthMarkers(instance);
    }

    function redrawSelectedGraph(instance, chartType) {
        if (chartType === 'line') {
            drawLineChart(instance);
        } else if (chartType === 'pc') {
            drawPcChart(instance);
        } else {
            drawCandlestickChart(instance);
        }
        drawMonthMarkers(instance);
    }

    function initGraphToggleButtons() {
        lineChartBtn.addEventListener('click', function() {
            selectedChartType = 'line';
            lineChartBtn.classList.add('active');
            candleChartBtn.classList.remove('active');
            pcChartBtn.classList.remove('active');
            
            if (selectedAsset) {
                const instance = graphInstances[selectedAsset.id];
                if (instance) {
                    redrawSelectedGraph(instance, selectedChartType);
                }
            }
        });
        
        candleChartBtn.addEventListener('click', function() {
            selectedChartType = 'candle';
            candleChartBtn.classList.add('active');
            lineChartBtn.classList.remove('active');
            pcChartBtn.classList.remove('active');
            
            if (selectedAsset) {
                const instance = graphInstances[selectedAsset.id];
                if (instance) {
                    redrawSelectedGraph(instance, selectedChartType);
                }
            }
        });

        pcChartBtn.addEventListener('click', function() {
            selectedChartType = 'pc';
            pcChartBtn.classList.add('active');
            lineChartBtn.classList.remove('active');
            candleChartBtn.classList.remove('active');
            
            if (selectedAsset) {
                const instance = graphInstances[selectedAsset.id];
                if (instance) {
                    redrawSelectedGraph(instance, selectedChartType);
                }
            }
        });
    }

    function initCarouselButtons() {
        document.querySelectorAll('.carousel-item-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });

        document.querySelectorAll('.carousel-item-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const cryptoId = this.getAttribute('data-crypto');
                const chartType = this.getAttribute('data-type');
                
                carouselChartTypes[cryptoId] = chartType;
                
                const parentControls = this.parentElement;
                parentControls.querySelectorAll('.carousel-item-btn').forEach(b => {
                    b.classList.remove('active');
                });
                this.classList.add('active');
                
                const instance = graphInstances[cryptoId];
                if (instance) {
                    redrawCarouselGraph(instance, chartType);
                }
            });
        });
    }
    
    function initDragForElement(element) {
        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;
        
        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDragTouch);
        
        function startDrag(e) {
            if (e.target.classList.contains('graph-toggle-btn') || e.target.classList.contains('resize-corner')) {
                return;
            }
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
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
                if (targetElement && (targetElement.classList.contains('graph-toggle-btn') || targetElement.classList.contains('resize-corner'))) {
                    return;
                }
                
                isDragging = true;
                startX = touch.clientX;
                startY = touch.clientY;
                
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
    
    // Retour au carousel
    backBtn.addEventListener('click', function() {
        selectedView.classList.remove('active');
        carouselScene.classList.remove('hidden');
        backBtn.classList.add('hidden');
        cryptoInfoPanel.classList.add('hidden');
        selectedAsset = null;
        
        // Réafficher le menu latéral
        sideMenu.classList.remove('hidden');
        
        selectedView.style.position = 'relative';
        selectedView.style.left = '0px';
        selectedView.style.top = '0px';
        
        carousel.classList.remove('carousel-paused');
        
        currentAssets.forEach(asset => {
            const instance = graphInstances[asset.id];
            if (instance && instance.candles && instance.candles.length > 0) {
                const chartType = carouselChartTypes[asset.id];
                redrawCarouselGraph(instance, chartType);
            }
        });
        
        initCarouselButtons();
    });
});
