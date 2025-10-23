document.addEventListener('DOMContentLoaded', function() {
    const cryptos = [
        { 
            id: 'bitcoin', 
            name: 'Bitcoin (BTC)', 
            color: 'white',
            symbol: 'BTCUSDT',
            priceElement: 'btcPrice'
        },
        { 
            id: 'ethereum', 
            name: 'Ethereum (ETH)', 
            color: 'white',
            symbol: 'ETHUSDT',
            priceElement: 'ethPrice'
        },
        { 
            id: 'xrp', 
            name: 'XRP', 
            color: 'white',
            symbol: 'XRPUSDT',
            priceElement: 'xrpPrice'
        },
        { 
            id: 'litecoin', 
            name: 'Litecoin (LTC)', 
            color: 'white',
            symbol: 'LTCUSDT',
            priceElement: 'ltcPrice'
        }
    ];
    
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
    
    // Variables d'état
    let graphInstances = {};
    let selectedCrypto = null;
    let apiUpdateInterval;
    let selectedChartType = 'candle';
    
    // Stocker le type de graphique pour chaque crypto dans le carousel
    let carouselChartTypes = {
        'bitcoin': 'candle',
        'ethereum': 'candle',
        'xrp': 'candle',
        'litecoin': 'candle'
    };

    // Stocker les données 24h pour chaque crypto
    let crypto24hData = {};
    
    // === GESTION DU DRAG DU PANEL - VERSION CORRIGÉE ===
    function initPanelDrag() {
        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;
        
        // Nettoyer les écouteurs existants
        cryptoInfoPanel.replaceWith(cryptoInfoPanel.cloneNode(true));
        const panel = document.getElementById('cryptoInfoPanel');
        
        panel.addEventListener('mousedown', startDrag);
        panel.addEventListener('touchstart', startDragTouch, { passive: false });
        
        function startDrag(e) {
            // Empêcher le drag sur les boutons
            if (e.target.closest('.graph-toggle-btn') || e.target.closest('.canvas-btn')) {
                return;
            }
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            // Récupérer la position actuelle
            const rect = panel.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            panel.classList.add('dragging');
            
            // Ajouter les écouteurs sur document
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            
            e.preventDefault();
            e.stopPropagation();
        }
        
        function startDragTouch(e) {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
                
                // Empêcher le drag sur les boutons
                if (targetElement && (targetElement.closest('.graph-toggle-btn') || targetElement.closest('.canvas-btn'))) {
                    return;
                }
                
                isDragging = true;
                startX = touch.clientX;
                startY = touch.clientY;
                
                const rect = panel.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;
                
                panel.classList.add('dragging');
                document.addEventListener('touchmove', onDragTouch, { passive: false });
                document.addEventListener('touchend', stopDrag);
                
                e.preventDefault();
                e.stopPropagation();
            }
        }
        
        function onDrag(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Appliquer la nouvelle position
            panel.style.position = 'fixed';
            panel.style.left = (startLeft + dx) + 'px';
            panel.style.top = (startTop + dy) + 'px';
            panel.style.width = '700px';
            panel.style.height = '120px';
            panel.style.margin = '0';
            
            e.preventDefault();
        }
        
        function onDragTouch(e) {
            if (!isDragging || e.touches.length !== 1) return;
            
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            
            // Appliquer la nouvelle position
            panel.style.position = 'fixed';
            panel.style.left = (startLeft + dx) + 'px';
            panel.style.top = (startTop + dy) + 'px';
            panel.style.width = '700px';
            panel.style.height = '120px';
            panel.style.margin = '0';
            
            e.preventDefault();
        }
        
        function stopDrag() {
            if (!isDragging) return;
            
            isDragging = false;
            panel.classList.remove('dragging');
            
            // Nettoyer les écouteurs
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('touchmove', onDragTouch);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
        }
    }
    
    // === DRAG POUR LA VUE SÉLECTIONNÉE - VERSION SIMPLIFIÉE ===
    function initSelectedViewDrag() {
        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;
        
        selectedView.addEventListener('mousedown', startDrag);
        selectedView.addEventListener('touchstart', startDragTouch, { passive: false });
        
        function startDrag(e) {
            // Ne dragger que si on clique sur des zones spécifiques (éviter les boutons)
            if (e.target.closest('.graph-toggle-buttons') || 
                e.target.closest('.canvas-btn') ||
                e.target.tagName === 'CANVAS') {
                return;
            }
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = selectedView.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            selectedView.classList.add('dragging');
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            
            e.preventDefault();
            e.stopPropagation();
        }
        
        function startDragTouch(e) {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
                
                if (targetElement && (targetElement.closest('.graph-toggle-buttons') || 
                    targetElement.closest('.canvas-btn') ||
                    targetElement.tagName === 'CANVAS')) {
                    return;
                }
                
                isDragging = true;
                startX = touch.clientX;
                startY = touch.clientY;
                
                const rect = selectedView.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;
                
                selectedView.classList.add('dragging');
                document.addEventListener('touchmove', onDragTouch, { passive: false });
                document.addEventListener('touchend', stopDrag);
                
                e.preventDefault();
                e.stopPropagation();
            }
        }
        
        function onDrag(e) {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            selectedView.style.position = 'fixed';
            selectedView.style.left = (startLeft + dx) + 'px';
            selectedView.style.top = (startTop + dy) + 'px';
            
            e.preventDefault();
        }
        
        function onDragTouch(e) {
            if (!isDragging || e.touches.length !== 1) return;
            
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            
            selectedView.style.position = 'fixed';
            selectedView.style.left = (startLeft + dx) + 'px';
            selectedView.style.top = (startTop + dy) + 'px';
            
            e.preventDefault();
        }
        
        function stopDrag() {
            if (!isDragging) return;
            
            isDragging = false;
            selectedView.classList.remove('dragging');
            
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('touchmove', onDragTouch);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
        }
    }

    // === FONCTIONS POUR CALCULER LES PERFORMANCES ===
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
    
    // === FONCTION POUR DESSINER LES BARRES DES MOIS ===
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
    
    // === API BINANCE ===
    function startApiUpdates() {
        fetchAllPrices();
        fetchAll24hData();
        apiUpdateInterval = setInterval(() => {
            fetchAllPrices();
            fetchAll24hData();
        }, 2000);
    }
    
    function fetchAllPrices() {
        cryptos.forEach(crypto => {
            fetchCryptoPrice(crypto);
        });
    }

    function fetchAll24hData() {
        cryptos.forEach(crypto => {
            fetch24hData(crypto);
        });
    }

    function fetch24hData(crypto) {
        const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${crypto.symbol}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur réseau');
                }
                return response.json();
            })
            .then(data => {
                crypto24hData[crypto.id] = {
                    highPrice: parseFloat(data.highPrice),
                    lowPrice: parseFloat(data.lowPrice),
                    volume: parseFloat(data.volume),
                    priceChange: parseFloat(data.priceChange),
                    priceChangePercent: parseFloat(data.priceChangePercent)
                };
                
                if (selectedCrypto && selectedCrypto.id === crypto.id) {
                    updateCryptoInfoPanel(graphInstances[crypto.id]);
                }
            })
            .catch(error => {
                console.error(`Erreur données 24h pour ${crypto.symbol}:`, error);
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
            })
            .catch(error => {
                console.error(`Erreur pour ${crypto.symbol}:`, error);
            });
    }
    
    function fetchHistoricalData(cryptoId, isCarousel = false) {
        const crypto = cryptos.find(c => c.id === cryptoId);
        const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
        const url = `https://api.binance.com/api/v3/klines?symbol=${crypto.symbol}&interval=1d&limit=180&startTime=${sixMonthsAgo}`;
        
        if (!isCarousel) {
            loader.classList.remove('hidden');
        }
        
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
                
                const instance = graphInstances[cryptoId];
                if (instance) {
                    instance.candles = candles;
                    calculateMonthlyChange(instance);
                    calculatePerformanceChanges(instance);
                    
                    if (isCarousel) {
                        const chartType = carouselChartTypes[cryptoId];
                        redrawCarouselGraph(instance, chartType);
                    } else {
                        redrawSelectedGraph(instance, selectedChartType);
                    }
                }
                if (!isCarousel) {
                    loader.classList.add('hidden');
                }
            })
            .catch(error => {
                console.error(`Erreur historique pour ${crypto.symbol}:`, error);
                if (!isCarousel) {
                    loader.classList.add('hidden');
                }
            });
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

    function calculateMonthlyChange(instance) {
        if (!instance.candles || instance.candles.length < 30) return;
        
        const monthlyCandles = instance.candles.slice(-30);
        const firstPrice = monthlyCandles[0].close;
        const lastPrice = monthlyCandles[monthlyCandles.length - 1].close;
        const change = ((lastPrice - firstPrice) / firstPrice) * 100;
        
        instance.monthlyChange = change;
        
        if (selectedCrypto && selectedCrypto.id === instance.crypto.id) {
            updateCryptoInfoPanel(instance);
        }
    }
    
    function updateCryptoInfoPanel(instance) {
        if (!instance.candles || instance.candles.length === 0) return;
        
        const currentCandle = instance.candles[instance.candles.length - 1];
        const symbol = instance.crypto.symbol.replace('USDT', '');
        const cryptoData24h = crypto24hData[instance.crypto.id];
        
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
        
        if (cryptoData24h) {
            document.getElementById('infoHigh').textContent = `$${cryptoData24h.highPrice.toFixed(2)}`;
            document.getElementById('infoLow').textContent = `$${cryptoData24h.lowPrice.toFixed(2)}`;
            
            let formattedVolume;
            if (cryptoData24h.volume >= 1000000) {
                formattedVolume = `${(cryptoData24h.volume / 1000000).toFixed(2)}M`;
            } else if (cryptoData24h.volume >= 1000) {
                formattedVolume = `${(cryptoData24h.volume / 1000).toFixed(2)}K`;
            } else {
                formattedVolume = cryptoData24h.volume.toFixed(2);
            }
            document.getElementById('infoVolume').textContent = formattedVolume;
        } else {
            document.getElementById('infoHigh').textContent = '$0.00';
            document.getElementById('infoLow').textContent = '$0.00';
            document.getElementById('infoVolume').textContent = '0';
        }
        
        cryptoInfoPanel.classList.remove('hidden');
    }
    
    function updateCryptoPrice(cryptoId, price) {
        const instance = graphInstances[cryptoId];
        if (!instance) return;
        
        instance.currentPrice = price;
        
        const priceElement = document.getElementById(cryptos.find(c => c.id === cryptoId).priceElement);
        if (priceElement) {
            priceElement.textContent = `$${price.toFixed(2)}`;
            priceElement.style.color = price > (instance.lastPrice || 0) ? '#39d353' : '#ff6b6b';
        }
        
        instance.lastPrice = price;
        
        if (selectedCrypto && selectedCrypto.id === cryptoId) {
            updateCryptoInfoPanel(instance);
        }
    }
    
    // === GESTION DES GRAPHIQUES ===
    function initCarouselGraphs() {
        cryptos.forEach(crypto => {
            const canvas = document.getElementById(`${crypto.id}Canvas`);
            initGraph(canvas, crypto, true);
            fetchHistoricalData(crypto.id, true);
        });
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
        
        if (isCarousel) {
            const canvasElement = document.getElementById(`${crypto.id}Canvas`);
            canvasElement.addEventListener('click', function(e) {
                selectCrypto(crypto.id);
            });
        }
        
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
    
    // === SÉLECTION CRYPTO ===
    function selectCrypto(cryptoId) {
        selectedCrypto = cryptos.find(c => c.id === cryptoId);
        selectedView.style.background = '#111216';
        selectedView.style.backgroundColor = 'rgba(17, 18, 22, 0.5)';   
        carousel.classList.add('carousel-paused');
        carouselScene.classList.add('hidden');
        
        selectedCryptoName.textContent = selectedCrypto.name;
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

        initGraph(selectedCanvas, selectedCrypto, false);
        
        cryptoInfoPanel.style.position = 'relative';
        cryptoInfoPanel.style.width = '700px';
        cryptoInfoPanel.style.height = '120px';
        cryptoInfoPanel.style.left = 'auto';
        cryptoInfoPanel.style.top = 'auto';
        
        const originalInstance = graphInstances[selectedCrypto.id];
        const newInstance = graphInstances[selectedCrypto.id];
        if (originalInstance && newInstance) {
            newInstance.candles = [...originalInstance.candles];
            newInstance.currentPrice = originalInstance.currentPrice;
            newInstance.lastPrice = originalInstance.lastPrice;
            newInstance.monthlyChange = originalInstance.monthlyChange;
            newInstance.performanceChanges = originalInstance.performanceChanges;
            
            redrawSelectedGraph(newInstance, selectedChartType);
            updateCryptoInfoPanel(newInstance);
            updatePerformanceIndicators(newInstance);
        }
        
        if (!originalInstance || originalInstance.candles.length === 0) {
            fetchHistoricalData(cryptoId);
        }
    }
    
    // === GESTION DES BOUTONS GRAPHIQUE ===
    function initGraphToggleButtons() {
        lineChartBtn.addEventListener('click', function() {
            selectedChartType = 'line';
            lineChartBtn.classList.add('active');
            candleChartBtn.classList.remove('active');
            pcChartBtn.classList.remove('active');
            
            if (selectedCrypto) {
                const instance = graphInstances[selectedCrypto.id];
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
            
            if (selectedCrypto) {
                const instance = graphInstances[selectedCrypto.id];
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
            
            if (selectedCrypto) {
                const instance = graphInstances[selectedCrypto.id];
                if (instance) {
                    redrawSelectedGraph(instance, selectedChartType);
                }
            }
        });
    }

    // === GESTION DES BOUTONS CAROUSEL ===
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
    
    // Retour au carousel
    backBtn.addEventListener('click', function() {
        selectedView.classList.remove('active');
        carouselScene.classList.remove('hidden');
        backBtn.classList.add('hidden');
        cryptoInfoPanel.classList.add('hidden');
        selectedCrypto = null;
        
        selectedView.style.position = 'relative';
        selectedView.style.left = '0px';
        selectedView.style.top = '0px';
        
        carousel.classList.remove('carousel-paused');
        
        cryptos.forEach(crypto => {
            const instance = graphInstances[crypto.id];
            if (instance && instance.candles && instance.candles.length > 0) {
                const chartType = carouselChartTypes[crypto.id];
                redrawCarouselGraph(instance, chartType);
            }
        });
        
        initCarouselButtons();
    });
    
    // Initialiser l'application
    initCarouselGraphs();
    initPanelDrag();
    initSelectedViewDrag();
    initGraphToggleButtons();
    initCarouselButtons();
    startApiUpdates();
});
