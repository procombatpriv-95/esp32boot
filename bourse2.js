
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
        let isInSelectedView = false; // Nouvelle variable pour suivre l'état
        let currentPage = 'menu-1'; // Variable pour suivre la page active

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

        // === AFFICHER LE MESSAGE PAR DÉFAUT ===
        function showDefaultMessage() {
            // Vider le contenu
            kinfopaneltousContent.innerHTML = '';
            
            // Créer un message simple
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

        // === AFFICHER LE MESSAGE RESULTAT ===
        function showResultMessage() {
            // Vider le contenu
            kinfopaneltousContent.innerHTML = '';
            
            // Créer un message simple
            const messageDiv = document.createElement('div');
            messageDiv.className = 'kinfopaneltous-result';
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
            messageDiv.textContent = 'resultat';
            
            kinfopaneltousContent.appendChild(messageDiv);
        }

        // === CHARGEMENT DES KINFOPANELTOUS POUR LES ACTUALITÉS ===
        function loadKinfopaneltousNews(asset) {
            // Nettoyer le contenu précédent
            kinfopaneltousContent.innerHTML = '';
            
            // Créer un loader temporaire
            const loaderDiv = document.createElement('div');
            loaderDiv.className = 'kinfopaneltous-loader';
            loaderDiv.textContent = 'Chargement des actualités...';
            kinfopaneltousContent.appendChild(loaderDiv);
            
            // Créer une div directe pour le widget
            const widgetDiv = document.createElement('div');
            widgetDiv.className = 'tradingview-kinfopaneltous-news';
            widgetDiv.id = 'tradingview_kinfopaneltous_news';
            
            // Supprimer le loader et ajouter le widget
            setTimeout(() => {
                kinfopaneltousContent.removeChild(loaderDiv);
                kinfopaneltousContent.appendChild(widgetDiv);
                
                // Créer le script TradingView pour les actualités
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
                script.async = true;
                
                // Configuration optimisée
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
                
                // Stocker la référence au widget
                currentKinfopaneltousWidget = widgetDiv;
                
                // Supprimer les tooltips après chargement
                setTimeout(removeAllTooltips, 1500);
                
            }, 500);
        }

        // === GESTION DU PANEL INFO EN FONCTION DE L'ÉTAT ===
        function updatePanelInfo() {
            // Toujours afficher le container
            kinfopaneltousContainer.classList.add('active');
            
            // Logique de priorité :
            // 1. Si on est en mode Selected View, afficher les news (priorité absolue)
            // 2. Sinon, afficher selon la page
            if (isInSelectedView && selectedAsset) {
                // Mode Selected View : afficher les actualités
                loadKinfopaneltousNews(selectedAsset);
            } else {
                // Pas en Selected View : afficher selon la page
                if (currentPage === 'menu-1') {
                    showDefaultMessage();
                } else if (currentPage === 'menu-3') {
                    showResultMessage();
                } else {
                    // Pour les autres pages (menu-2 hors selected view, menu-4, menu-5)
                    // Afficher le message par défaut
                    showDefaultMessage();
                }
            }
        }

        // === INITIALISATION ===
        function init() {
            // Charger les états des graphiques
            const saved = localStorage.getItem('chartStates');
            if (saved) {
                try {
                    chartStates = JSON.parse(saved);
                } catch (e) {
                    console.error('Erreur lors du chargement des états:', e);
                    chartStates = {};
                }
            }
            
            // Initialiser le menu
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
            
            // Initialiser le panel info
            updatePanelInfo();
            
            // Supprimer les tooltips initialement
            setTimeout(removeAllTooltips, 1000);
            
            // Surveillance des mutations
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
                timezone: "Europe/Paris",
                theme: "dark",
                style: "1",
                locale: "fr",
                enable_publishing: false,
                allow_symbol_change: false,
                save_image: false,
                container_id: containerId
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
                    widgetConfig.studies = ["RSI@tv-basicstudies", "MAWeighted@tv-basicstudies"];
                    widgetConfig.studies_overrides = {
                        "volume.volume.color.0": "rgba(0, 0, 0, 0)",
                        "volume.volume.color.1": "rgba(0, 0, 0, 0)",
                        "RSI.rsi.linewidth": 2,
                        "RSI.rsi.period": 14,
                        "RSI.rsi.plottype": "line",
                        "MAWeighted.ma.color": "#FF6B00",
                        "MAWeighted.ma.linewidth": 50,
                        "MAWeighted.ma.period": 50,
                        "MAWeighted.ma.plottype": "line",
                        "MAWeighted.ma.transparency": 0
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

            // Mettre à jour l'état
            isInSelectedView = true;
            currentPage = 'menu-2'; // On est dans la page Bourse quand on sélectionne un actif
            
            // Animation et transition
            carousel.classList.add('carousel-paused');
            carouselScene.classList.add('hidden');
            sideMenu.classList.add('hidden');
            selectedView.classList.add('active');
            backBtn.classList.remove('hidden');
            loader.classList.remove('hidden');

            // Mettre à jour le panel info (affichera les news)
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

        // === RETOUR AU CAROUSEL ===
        function returnToCarousel() {
            // Mettre à jour l'état
            isInSelectedView = false;
            
            selectedView.classList.remove('active');
            carouselScene.classList.remove('hidden');
            backBtn.classList.add('hidden');
            sideMenu.classList.remove('hidden');
            carousel.classList.remove('carousel-paused');
            
            // Mettre à jour le panel info
            updatePanelInfo();
            
            removeAllTooltips();
        }

        backBtn.addEventListener('click', returnToCarousel);

        // === SURVEILLANCE DU CHANGEMENT DE MENU ===
        // Observer les changements de classe sur megaBox pour détecter le changement de menu
        const observerMenuChange = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    // Détecter quelle page est active
                    const classes = megaBox.classList;
                    if (classes.contains('menu-1')) currentPage = 'menu-1';
                    else if (classes.contains('menu-2')) currentPage = 'menu-2';
                    else if (classes.contains('menu-3')) currentPage = 'menu-3';
                    else if (classes.contains('menu-4')) currentPage = 'menu-4';
                    else if (classes.contains('menu-5')) currentPage = 'menu-5';
                    
                    // Mettre à jour le panel info
                    updatePanelInfo();
                }
            });
        });
        
        observerMenuChange.observe(megaBox, {
            attributes: true,
            attributeFilter: ['class']
        });

        // === FONCTION SWITCHMENU MODIFIÉE ===
        // Surcharge de la fonction switchMenu pour gérer le retour au carousel
        // si on quitte la page Bourse alors qu'on est en mode Selected View
        const originalSwitchMenu = window.switchMenu;
        
        window.switchMenu = function(n) {
            // Si on est en Selected View et qu'on change de page
            if (isInSelectedView) {
                // Si on quitte la page Bourse (menu-2)
                if (n !== 2) {
                    // On retourne d'abord au carousel
                    returnToCarousel();
                }
            }
            
            // Appeler la fonction originale
            originalSwitchMenu(n);
        };

        // DÉMARRER L'APPLICATION
        init();

        window.addEventListener('resize', function() {
            sideMenu.style.top = '50%';
            sideMenu.style.transform = 'translateY(-50%)';
        });
    });

