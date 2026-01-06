async function getAddress(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=fr`,
      {
        headers: {
          "User-Agent": "around-app/1.0 (test)",
          "Accept-Language": "fr"
        }
      }
    );
    if (!res.ok) throw new Error("Réponse HTTP invalide");
    const data = await res.json();

    // Quartier
    let suburb =
      data.address.suburb ||
      data.address.neighbourhood ||
      data.address.quarter ||
      "Quartier inconnu";

    // Borough / District
    let borough =
      data.address.borough ||
      data.address.city_district ||
      "Borough inconnu";

    // Ville
    let city =
      data.address.city ||
      data.address.town ||
      data.address.municipality ||
      data.address.county ||
      "Ville inconnue";

    document.getElementById("output").textContent =
      `Around: ${suburb}, ${borough}, ${city}`;
  } catch (e) {
    document.getElementById("output").textContent = "Erreur adresse : " + e;
  }
}

// Fonction pour déterminer le fuseau horaire basé sur la géolocalisation
async function getTimezoneFromCoords(lat, lon) {
  try {
    const res = await fetch(
      `https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_API_KEY&format=json&by=position&lat=${lat}&lng=${lon}`
    );
    if (!res.ok) throw new Error("Erreur API fuseau horaire");
    const data = await res.json();
    return data.zoneName; // Retourne le nom du fuseau horaire (ex: "Europe/Paris")
  } catch (e) {
    console.error("Erreur fuseau horaire:", e);
    return "Europe/London"; // Par défaut London en cas d'erreur
  }
}

function success(pos) {
  const crd = pos.coords;
  getAddress(crd.latitude, crd.longitude);
  
  // Obtenir le fuseau horaire
  getTimezoneFromCoords(crd.latitude, crd.longitude).then(timezone => {
    // Stocker le fuseau horaire pour l'utiliser dans les graphiques
    window.appTimezone = timezone;
    
    // Si les graphiques sont déjà créés, les mettre à jour
    if (window.tvWidgets) {
      Object.values(window.tvWidgets).forEach(widget => {
        if (widget && widget.chart) {
          widget.chart().setTimezone(timezone);
        }
      });
    }
    if (window.selectedTVWidget && window.selectedTVWidget.chart) {
      window.selectedTVWidget.chart().setTimezone(timezone);
    }
  });
}

function error(err) {
  document.getElementById("output").textContent =
    `Erreur (${err.code}): ${err.message}`;
  
  // En cas d'erreur, utiliser London comme fuseau horaire par défaut
  window.appTimezone = "Europe/London";
}

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(success, error, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  });
} else {
  document.getElementById("output").textContent =
    "❌ Géolocalisation non supportée par ce navigateur.";
  // Par défaut en cas de non support
  window.appTimezone = "Europe/London";
}

document.addEventListener('DOMContentLoaded', function() {
    // Configuration des actifs avec symboles TradingView
    const assetTypes = {
        crypto: [
            {
                id: 'bitcoin',
                name: 'Bitcoin (BTC)',
                symbol: 'BTC',
                tradingViewSymbol: 'BITSTAMP:BTCUSD',
                displayName: 'Bitcoin',
                kinfopaneltousSymbol: 'BTCUSD'
            },
            {
                id: 'litecoin',
                name: 'Litecoin (LTC)',
                symbol: 'LTC',
                tradingViewSymbol: 'BITSTAMP:LTCUSD',
                displayName: 'Litecoin',
                kinfopaneltousSymbol: 'LTCUSD'
            },
            {
                id: 'ethereum',
                name: 'Ethereum (ETH)',
                symbol: 'ETH',
                tradingViewSymbol: 'BITSTAMP:ETHUSD',
                displayName: 'Ethereum',
                kinfopaneltousSymbol: 'ETHUSD'
            },
            {
                id: 'xrp',
                name: 'XRP',
                symbol: 'XRP',
                tradingViewSymbol: 'BITSTAMP:XRPUSD',
                displayName: 'XRP',
                kinfopaneltousSymbol: 'XRPUSD'
            }
        ],
        shares: [
            {
               id: 'nasdaq',
               name: 'NASDAQ Composite',
               symbol: 'NASDAQ',
               tradingViewSymbol: 'NASDAQ:IXIC',
               displayName: 'NASDAQ',
               kinfopaneltousSymbol: 'NASDAQ:IXIC'
            },
            {
                id: 'apple',
                name: 'Apple (AAPL)',
                symbol: 'AAPL',
                tradingViewSymbol: 'NASDAQ:AAPL',
                displayName: 'Apple',
                kinfopaneltousSymbol: 'NASDAQ:AAPL'
            },
            {
                id: 'tesla',
                name: 'Tesla (TSLA)',
                symbol: 'TSLA',
                tradingViewSymbol: 'NASDAQ:TSLA',
                displayName: 'Tesla',
                kinfopaneltousSymbol: 'NASDAQ:TSLA'
            },
            {
                id: 'microsoft',
                name: 'Microsoft (MSFT)',
                symbol: 'MSFT',
                tradingViewSymbol: 'NASDAQ:MSFT',
                displayName: 'Microsoft',
                kinfopaneltousSymbol: 'NASDAQ:MSFT'
            }
        ],
        commodities: [
            {
                id: 'gold',
                name: 'Gold (XAUUSD)',
                symbol: 'XAU',
                tradingViewSymbol: 'OANDA:XAUUSD',
                displayName: 'Gold',
                kinfopaneltousSymbol: 'XAUUSD'
            },
            {
                id: 'silver',
                name: 'Silver (XAGUSD)',
                symbol: 'XAG',
                tradingViewSymbol: 'OANDA:XAGUSD',
                displayName: 'Silver',
                kinfopaneltousSymbol: 'XAGUSD'
            },
            {
                id: 'platinum',
                name: 'Platinum (XPTUSD)',
                symbol: 'XPT',
                tradingViewSymbol: 'TVC:PLATINUM',
                displayName: 'Platinum',
                kinfopaneltousSymbol: 'PLATINUM'
            },
            {
                id: 'oil',
                name: 'Crude Oil (WTI)',
                symbol: 'OIL',
                tradingViewSymbol: 'TVC:USOIL',
                displayName: 'Crude Oil',
                kinfopaneltousSymbol: 'USOIL'
            }
        ],
        forex: [
            {
                id: 'eurusd',
                name: 'EUR/USD',
                symbol: 'EUR',
                tradingViewSymbol: 'FX_IDC:EURUSD',
                displayName: 'EUR/USD',
                kinfopaneltousSymbol: 'EURUSD'
            },
            {
                id: 'gbpusd',
                name: 'GBP/USD',
                symbol: 'GBP',
                tradingViewSymbol: 'FX_IDC:GBPUSD',
                displayName: 'GBP/USD',
                kinfopaneltousSymbol: 'GBPUSD'
            },
            {
                id: 'audusd',
                name: 'AUD/USD',
                symbol: 'AUD',
                tradingViewSymbol: 'FX_IDC:AUDUSD',
                displayName: 'AUD/USD',
                kinfopaneltousSymbol: 'AUDUSD'
            },
            {
                id: 'nzdusd',
                name: 'NZD/USD',
                symbol: 'NZD',
                tradingViewSymbol: 'FX_IDC:NZDUSD',
                displayName: 'NZD/USD',
                kinfopaneltousSymbol: 'NZDUSD'
            }
        ]
    };

    let currentAssetType = 'crypto';
    let currentAssets = assetTypes.crypto;
    let selectedAsset = null;
    let tvWidgets = {};
    let selectedTVWidget = null;
    let chartStates = {};
    let currentKinfopaneltousWidget = null;
    let isInSelectedView = false;
    let currentMenuPage = 'menu-1';
    
    // Fuseau horaire par défaut (sera mis à jour par géolocalisation)
    if (!window.appTimezone) {
        window.appTimezone = "Europe/London";
    }

    // Éléments du DOM
    const carousel = document.getElementById('mainCarousel');
    const carouselScene = document.getElementById('carouselScene');
    const selectedView = document.getElementById('selectedView');
    const backBtn = document.getElementById('backBtn');
    const loader = document.getElementById('loader');
    const menuSections = document.querySelectorAll('.menu-section');
    const sideMenu = document.getElementById('sideMenu');
    const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
    const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
    const megaBox = document.getElementById('megaBox');

    // === SUPPRESSION DES TOOLTIPS ===
    function removeAllTooltips() {
        const elements = document.querySelectorAll('[title]');
        elements.forEach(el => {
            if (el.title && el.title !== '') {
                el.setAttribute('data-original-title', el.title);
                el.removeAttribute('title');
            }
        });
        
        const ariaElements = document.querySelectorAll('[aria-label]');
        ariaElements.forEach(el => {
            el.setAttribute('data-original-aria-label', el.getAttribute('aria-label'));
            el.removeAttribute('aria-label');
        });
        
        document.addEventListener('mouseover', function(e) {
            if (e.target.hasAttribute('title') || e.target.hasAttribute('aria-label')) {
                e.stopPropagation();
            }
        }, true);
    }

    // === AFFICHER LE MESSAGE PAR DÉFAUT (Menu 1) ===
    function showDefaultMessage() {
        kinfopaneltousContent.innerHTML = '';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'kinfopaneltous-default';
        messageDiv.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
        `;
        messageDiv.textContent = 'Bonjour Mohamed';
        
        kinfopaneltousContent.appendChild(messageDiv);
    }

    // === AFFICHER LE PANEL RESULTAT (Menu 4) ===
    function showResultPanel() {
        kinfopaneltousContent.innerHTML = '';
        
        const resultPanel = document.createElement('div');
        resultPanel.className = 'result-panel';
        
        // Récupérer les données du localStorage
        const transactions = JSON.parse(localStorage.getItem('moneyManagerTransactions') || '[]');
        const monthlyGoals = JSON.parse(localStorage.getItem('moneyManagerGoals') || '{}');
        const yearlyGoal = parseFloat(localStorage.getItem('moneyManagerYearlyGoal') || '0');
        
        // Calculer les données pour l'affichage
        const now = new Date();
        const currentYear = now.getFullYear();
        const yearTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === currentYear;
        });
        
        const totalIncome = yearTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const goal = yearlyGoal || 0;
        const percentage = goal > 0 ? Math.min((totalIncome / goal) * 100, 100) : 0;
        
        // Trouver la transaction la plus haute et la plus basse
        let highestTransaction = { amount: 0 };
        let lowestTransaction = { amount: 0 };
        
        if (yearTransactions.length > 0) {
            const incomeTransactions = yearTransactions.filter(t => t.type === 'income');
            const expenseTransactions = yearTransactions.filter(t => t.type === 'expense');
            
            if (incomeTransactions.length > 0) {
                highestTransaction = incomeTransactions.reduce((max, t) => 
                    t.amount > max.amount ? t : max
                );
            }
            
            if (expenseTransactions.length > 0) {
                lowestTransaction = expenseTransactions.reduce((min, t) => 
                    t.amount < min.amount ? t : min
                );
            }
        }
        
        resultPanel.innerHTML = `
            <div class="progress-section">
                <div class="progress-header">
                    <span class="period-label">Yearly</span>
                    <span class="percentage-label">${percentage.toFixed(1)}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-filled" style="width: ${percentage}%">
                            ${percentage > 10 ? `£${totalIncome.toFixed(0)}` : ''}
                        </div>
                        <div class="progress-remaining">
                            ${percentage < 90 ? `£${Math.max(0, goal - totalIncome).toFixed(0)}` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="indicators-container">
                    <div class="indicator-box indicator-highest">
                        <div class="indicator-label">
                            <i class="fas fa-arrow-up"></i> Highest
                        </div>
                        <div class="indicator-value">
                            £${highestTransaction.amount.toFixed(2)}
                        </div>
                    </div>
                    <div class="indicator-box indicator-lowest">
                        <div class="indicator-label">
                            <i class="fas fa-arrow-down"></i> Lowest
                        </div>
                        <div class="indicator-value">
                            £${lowestTransaction.amount.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="result-filter-buttons">
                <button class="result-filter-btn active" data-period="today">Today</button>
                <button class="result-filter-btn" data-period="week">Week</button>
                <button class="result-filter-btn" data-period="month">Month</button>
                <button class="result-filter-btn" data-period="year">Year</button>
                <button class="result-filter-btn" data-period="all">All</button>
            </div>
        `;
        
        kinfopaneltousContent.appendChild(resultPanel);
        
        // Ajouter les événements aux boutons de filtre
        const filterBtns = resultPanel.querySelectorAll('.result-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                updateResultPanel(this.dataset.period);
            });
        });
    }
    
    // === METTRE À JOUR LE PANEL RESULTAT SELON LA PÉRIODE ===
    function updateResultPanel(period) {
        const resultPanel = document.querySelector('.result-panel');
        if (!resultPanel) return;
        
        const transactions = JSON.parse(localStorage.getItem('moneyManagerTransactions') || '[]');
        const monthlyGoals = JSON.parse(localStorage.getItem('moneyManagerGoals') || '{}');
        const yearlyGoal = parseFloat(localStorage.getItem('moneyManagerYearlyGoal') || '0');
        
        const now = new Date();
        let filteredTransactions = [];
        let goal = 0;
        let periodLabel = '';
        
        // Filtrer les transactions selon la période
        switch(period) {
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredTransactions = transactions.filter(t => t.date === today);
                periodLabel = 'Today';
                goal = 0; // Pas de goal pour today
                break;
            case 'week':
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredTransactions = transactions.filter(t => new Date(t.date) >= oneWeekAgo);
                periodLabel = 'Weekly';
                goal = 0; // Pas de goal pour week
                break;
            case 'month':
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                filteredTransactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
                });
                periodLabel = 'Monthly';
                const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
                goal = monthlyGoals[monthKey] || 0;
                break;
            case 'year':
                const year = now.getFullYear();
                filteredTransactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getFullYear() === year;
                });
                periodLabel = 'Yearly';
                goal = yearlyGoal || 0;
                break;
            case 'all':
                filteredTransactions = transactions;
                periodLabel = 'All Time';
                goal = Object.values(monthlyGoals).reduce((sum, g) => sum + g, 0);
                break;
        }
        
        // Calculer les totaux
        const totalIncome = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const percentage = goal > 0 ? Math.min((totalIncome / goal) * 100, 100) : 0;
        
        // Trouver la transaction la plus haute et la plus basse
        let highestTransaction = { amount: 0 };
        let lowestTransaction = { amount: 0 };
        
        if (filteredTransactions.length > 0) {
            const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
            const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
            
            if (incomeTransactions.length > 0) {
                highestTransaction = incomeTransactions.reduce((max, t) => 
                    t.amount > max.amount ? t : max
                );
            }
            
            if (expenseTransactions.length > 0) {
                lowestTransaction = expenseTransactions.reduce((min, t) => 
                    t.amount < min.amount ? t : min
                );
            }
        }
        
        // Mettre à jour l'affichage
        const progressHeader = resultPanel.querySelector('.progress-header');
        const progressFilled = resultPanel.querySelector('.progress-filled');
        const progressRemaining = resultPanel.querySelector('.progress-remaining');
        const highestValue = resultPanel.querySelector('.indicator-highest .indicator-value');
        const lowestValue = resultPanel.querySelector('.indicator-lowest .indicator-value');
        
        if (progressHeader) {
            progressHeader.innerHTML = `
                <span class="period-label">${periodLabel}</span>
                <span class="percentage-label">${percentage.toFixed(1)}%</span>
            `;
        }
        
        if (progressFilled) {
            progressFilled.style.width = `${percentage}%`;
            progressFilled.innerHTML = percentage > 10 ? `£${totalIncome.toFixed(0)}` : '';
        }
        
        if (progressRemaining) {
            const remaining = Math.max(0, goal - totalIncome);
            progressRemaining.innerHTML = percentage < 90 ? `£${remaining.toFixed(0)}` : '';
        }
        
        if (highestValue) {
            highestValue.textContent = `£${highestTransaction.amount.toFixed(2)}`;
        }
        
        if (lowestValue) {
            lowestValue.textContent = `£${lowestTransaction.amount.toFixed(2)}`;
        }
    }

    // === CHARGEMENT DES KINFOPANELTOUS POUR LES ACTUALITÉS ===
    function loadKinfopaneltousNews(asset) {
        kinfopaneltousContent.innerHTML = '';
        
        const loaderDiv = document.createElement('div');
        loaderDiv.className = 'kinfopaneltous-loader';
        loaderDiv.textContent = 'Loading...';
        kinfopaneltousContent.appendChild(loaderDiv);
        
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-kinfopaneltous-news';
        widgetDiv.id = 'tradingview_kinfopaneltous_news';
        
        setTimeout(() => {
            kinfopaneltousContent.removeChild(loaderDiv);
            kinfopaneltousContent.appendChild(widgetDiv);
            
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
            script.async = true;
            
            script.textContent = JSON.stringify({
                "feedMode": "symbol",
                "symbol": asset.tradingViewSymbol,
                "isTransparent": true,
                "displayMode": "compact",
                "width": "250",
                "height": "400",
                "colorTheme": "dark",
                "locale": "fr",
                "utm_source": "tradingview.com",
                "utm_medium": "widget",
                "utm_campaign": "timeline",
                "noReferrer": true,
                "showSymbolLogo": false,
                "fontSize": "small",
                "textColor": "#ffffff"
            });
            
            widgetDiv.appendChild(script);
            
            currentKinfopaneltousWidget = widgetDiv;
            
            setTimeout(removeAllTooltips, 1500);
        }, 500);
    }

    // === GESTION DU PANEL INFO EN FONCTION DE L'ÉTAT ===
    function updatePanelInfo() {
        kinfopaneltousContainer.classList.add('active');
        
        // PRIORITÉ 1: Si Selected View est ouvert, TOUJOURS afficher les news
        if (isInSelectedView && selectedAsset) {
            loadKinfopaneltousNews(selectedAsset);
        } 
        // PRIORITÉ 2: Sinon, afficher selon la page active
        else {
            if (currentMenuPage === 'menu-1') {
                showDefaultMessage();
            } else if (currentMenuPage === 'menu-4') {
                showResultPanel();
            } else {
                // Pour les autres pages
                showDefaultMessage();
            }
        }
    }

    // === DÉTECTION DE LA PAGE ACTIVE ===
    function updateCurrentMenuPage() {
        const classes = megaBox.classList;
        if (classes.contains('menu-1')) currentMenuPage = 'menu-1';
        else if (classes.contains('menu-2')) currentMenuPage = 'menu-2';
        else if (classes.contains('menu-3')) currentMenuPage = 'menu-3';
        else if (classes.contains('menu-4')) currentMenuPage = 'menu-4';
        else if (classes.contains('menu-5')) currentMenuPage = 'menu-5';
    }

    // === INITIALISATION ===
    function init() {
        const saved = localStorage.getItem('chartStates');
        if (saved) {
            try {
                chartStates = JSON.parse(saved);
            } catch (e) {
                console.error('Erreur lors du chargement des états:', e);
                chartStates = {};
            }
        }
        
        menuSections.forEach(section => {
            section.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                
                menuSections.forEach(s => s.classList.remove('active'));
                this.classList.add('active');
                
                currentAssetType = type;
                currentAssets = assetTypes[type];
                
                updateCarousel();
            });
        });
        
        updateCarousel();
        
        // Détecter la page initiale
        updateCurrentMenuPage();
        updatePanelInfo();
        
        setTimeout(removeAllTooltips, 1000);
        
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    removeAllTooltips();
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // === CRÉATION DES WIDGETS TRADINGVIEW ===
    function createTradingViewWidget(containerId, symbol, assetId, isCarousel = false) {
        if (!window.TradingView) {
            console.error('Bibliothèque TradingView non chargée');
            setTimeout(() => createTradingViewWidget(containerId, symbol, assetId, isCarousel), 100);
            return null;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Conteneur non trouvé:', containerId);
            return null;
        }

        const widgetConfig = {
            width: isCarousel ? '400' : '1000',
            height: isCarousel ? '200' : '500',
            symbol: symbol,
            interval: '5',
            timezone: window.appTimezone,
            theme: "dark",
            style: "1",
            locale: "fr",
            enable_publishing: false,
            allow_symbol_change: false,
            save_image: false,
            container_id: containerId,
            time_frames: [
                { text: "5min", resolution: "5", description: "5 Minutes", title: "5min" },
                { text: "15min", resolution: "15", description: "15 Minutes", title: "15min" },
                { text: "2h", resolution: "120", description: "2 Hours", title: "2h" },
                { text: "1D", resolution: "1D", description: "1 Day", title: "1D" }
            ]
        };

        if (isCarousel) {
            widgetConfig.toolbar_bg = "#111216";
            widgetConfig.hide_legend = true;
            widgetConfig.hide_side_toolbar = true;
            widgetConfig.hide_top_toolbar = true;
            widgetConfig.details = false;
            widgetConfig.hotlist = false;
            widgetConfig.calendar = false;
            widgetConfig.show_popup_button = false;
            widgetConfig.disabled_features = [
                "header_widget", "left_toolbar", "timeframes_toolbar",
                "edit_buttons_in_legend", "legend_context_menu", "control_bar",
                "border_around_the_chart", "countdown", "header_compare",
                "header_screenshot", "header_undo_redo", "header_saveload",
                "header_settings", "header_chart_type", "header_indicators",
                "volume_force_overlay", "study_templates", "symbol_info"
            ];
            widgetConfig.enabled_features = [
                "hide_volume", "move_logo_to_main_pane"
            ];
        } else {
            widgetConfig.toolbar_bg = "#f1f3f6";
            widgetConfig.hide_side_toolbar = false;
            widgetConfig.hide_legend = false;
            widgetConfig.details = true;
            widgetConfig.hotlist = true;
            widgetConfig.calendar = true;
            
            const chartKey = `chart_${assetId}`;
            const savedState = chartStates[chartKey];
            
            if (savedState && savedState.symbol === symbol) {
                widgetConfig.studies_overrides = savedState.studies;
            } else {
                widgetConfig.studies = ["RSI@tv-basicstudies", "EMA@tv-basicstudies"];
                widgetConfig.studies_overrides = {
                    "volume.volume.color.0": "rgba(0, 0, 0, 0)",
                    "volume.volume.color.1": "rgba(0, 0, 0, 0)",
                    "RSI.rsi.linewidth": 2,
                    "RSI.rsi.period": 14,
                    "RSI.rsi.plottype": "line",
                    "EMA.ema.color": "#FF6B00",
                    "EMA.ema.linewidth": 2,
                    "EMA.ema.period": 50,
                    "EMA.ema.plottype": "line",
                    "EMA.ema.transparency": 0
                };
            }
        }

        try {
            const widget = new TradingView.widget(widgetConfig);
            
            if (!isCarousel) {
                widget.onChartReady(() => {
                    const chart = widget.chart();
                    setInterval(() => {
                        if (selectedAsset && selectedTVWidget) {
                            try {
                                chart.getSavedStudies((studies) => {
                                    const state = {
                                        studies: studies,
                                        timestamp: Date.now(),
                                        symbol: selectedAsset.tradingViewSymbol
                                    };
                                    chartStates[`chart_${selectedAsset.id}`] = state;
                                    localStorage.setItem('chartStates', JSON.stringify(chartStates));
                                });
                            } catch (e) {
                                console.error('Erreur sauvegarde:', e);
                            }
                        }
                    }, 30000);
                });
            }
            
            return widget;
        } catch (error) {
            console.error('Erreur création widget TradingView:', error);
            return null;
        }
    }

    // === MISE À JOUR DU CAROUSEL ===
    function updateCarousel() {
        carousel.innerHTML = '';
        
        currentAssets.forEach((asset, index) => {
            const carouselItem = document.createElement('div');
            carouselItem.className = 'carousel-item';
            carouselItem.setAttribute('data-crypto', asset.id);
            
            const widgetId = `${asset.id}_carousel_widget`;
            
            carouselItem.innerHTML = `
                <div class="market-name">${asset.displayName}</div>
                <div class="carousel-chart">
                    <div class="tradingview-widget-container" id="${widgetId}"></div>
                </div>
                <div class="carousel-overlay" data-asset-id="${asset.id}"></div>
            `;
            
            carousel.appendChild(carouselItem);
            carouselItem.style.transform = `rotateY(${index * 90}deg) translateZ(280px)`;
        });
        
        setTimeout(() => {
            currentAssets.forEach(asset => {
                const widgetId = `${asset.id}_carousel_widget`;
                tvWidgets[asset.id] = createTradingViewWidget(
                    widgetId,
                    asset.tradingViewSymbol,
                    asset.id,
                    true
                );
            });
            
            setTimeout(removeAllTooltips, 2000);
            initCarouselClicks();
        }, 1000);
    }

    // === INITIALISATION DES CLICS DU CAROUSEL ===
    function initCarouselClicks() {
        document.querySelectorAll('.carousel-overlay').forEach(overlay => {
            overlay.addEventListener('click', function(e) {
                e.stopPropagation();
                const assetId = this.getAttribute('data-asset-id');
                selectAsset(assetId);
            });
        });
    }

    // === SÉLECTION D'ACTIF ===
    function selectAsset(assetId) {
        selectedAsset = currentAssets.find(c => c.id === assetId);
        if (!selectedAsset) return;

        // Activer le mode Selected View
        isInSelectedView = true;
        
        // Animation et transition
        carousel.classList.add('carousel-paused');
        carouselScene.classList.add('hidden');
        sideMenu.classList.add('hidden');
        selectedView.classList.add('active');
        backBtn.classList.remove('hidden');
        loader.classList.remove('hidden');

        // Mettre à jour le panel info (afficher les news)
        updatePanelInfo();

        // Préparer le graphique TradingView
        const tvContainer = document.getElementById('tradingview_selected');
        if (tvContainer) {
            tvContainer.innerHTML = '';
        }

        setTimeout(() => {
            if (selectedTVWidget) {
                window.removeEventListener('beforeunload', () => {});
            }
            
            selectedTVWidget = createTradingViewWidget(
                'tradingview_selected',
                selectedAsset.tradingViewSymbol,
                selectedAsset.id,
                false
            );
            
            setTimeout(() => {
                loader.classList.add('hidden');
                removeAllTooltips();
            }, 1500);
        }, 500);
    }

    // === RETOUR AU CAROUSEL (MANUEL SEULEMENT) ===
    backBtn.addEventListener('click', function() {
        // Désactiver le mode Selected View
        isInSelectedView = false;
        
        selectedView.classList.remove('active');
        carouselScene.classList.remove('hidden');
        backBtn.classList.add('hidden');
        sideMenu.classList.remove('hidden');
        carousel.classList.remove('carousel-paused');
        
        // Mettre à jour le panel info selon la page active
        updatePanelInfo();
        
        removeAllTooltips();
    });

    // === SURVEILLANCE DU CHANGEMENT DE MENU ===
    const observerMenuChange = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                // Mettre à jour la page active
                updateCurrentMenuPage();
                
                // Mettre à jour le panel info seulement si Selected View n'est PAS actif
                if (!isInSelectedView) {
                    updatePanelInfo();
                }
                // Si Selected View est actif, on NE CHANGE RIEN - les news restent
            }
        });
    });
    
    observerMenuChange.observe(megaBox, {
        attributes: true,
        attributeFilter: ['class']
    });

    // DÉMARRER L'APPLICATION
    init();

    window.addEventListener('resize', function() {
        sideMenu.style.top = '50%';
        sideMenu.style.transform = 'translateY(-50%)';
    });
    
    // Stocker les widgets dans l'objet global pour pouvoir les mettre à jour
    window.tvWidgets = tvWidgets;
    window.selectedTVWidget = selectedTVWidget;
});
