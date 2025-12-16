    document.addEventListener('DOMContentLoaded', function() {
        // Configuration des actifs avec symboles TradingView
        const assetTypes = {
            crypto: [
                {
                    id: 'bitcoin',
                    name: 'Bitcoin (BTC)',
                    symbol: 'BTC',
                    tradingViewSymbol: 'BITSTAMP:BTCUSD',
                    displayName: 'Bitcoin'
                },
                {
                    id: 'litecoin',
                    name: 'Litecoin (LTC)',
                    symbol: 'LTC',
                    tradingViewSymbol: 'BITSTAMP:LTCUSD',
                    displayName: 'Litecoin'
                },
                {
                    id: 'ethereum',
                    name: 'Ethereum (ETH)',
                    symbol: 'ETH',
                    tradingViewSymbol: 'BITSTAMP:ETHUSD',
                    displayName: 'Ethereum'
                },
                {
                    id: 'xrp',
                    name: 'XRP',
                    symbol: 'XRP',
                    tradingViewSymbol: 'BITSTAMP:XRPUSD',
                    displayName: 'XRP'
                }
            ],
            shares: [
                {
                   id: 'nasdaq',
                   name: 'NASDAQ Composite',
                   symbol: 'NASDAQ',
                   tradingViewSymbol: 'NASDAQ:IXIC',
                   displayName: 'NASDAQ'
                },
                {
                    id: 'apple',
                    name: 'Apple (AAPL)',
                    symbol: 'AAPL',
                    tradingViewSymbol: 'NASDAQ:AAPL',
                    displayName: 'Apple'
                },
                {
                    id: 'tesla',
                    name: 'Tesla (TSLA)',
                    symbol: 'TSLA',
                    tradingViewSymbol: 'NASDAQ:TSLA',
                    displayName: 'Tesla'
                },
                {
                    id: 'microsoft',
                    name: 'Microsoft (MSFT)',
                    symbol: 'MSFT',
                    tradingViewSymbol: 'NASDAQ:MSFT',
                    displayName: 'Microsoft'
                }
            ],
            commodities: [
                {
                    id: 'gold',
                    name: 'Gold (XAUUSD)',
                    symbol: 'XAU',
                    tradingViewSymbol: 'OANDA:XAUUSD',
                    displayName: 'Gold'
                },
                {
                    id: 'silver',
                    name: 'Silver (XAGUSD)',
                    symbol: 'XAG',
                    tradingViewSymbol: 'OANDA:XAGUSD',
                    displayName: 'Silver'
                },
                {
                    id: 'platinum',
                    name: 'Platinum (XPTUSD)',
                    symbol: 'XPT',
                    tradingViewSymbol: 'TVC:PLATINUM',
                    displayName: 'Platinum'
                },
                {
                    id: 'oil',
                    name: 'Crude Oil (WTI)',
                    symbol: 'OIL',
                    tradingViewSymbol: 'TVC:USOIL',
                    displayName: 'Crude Oil'
                }
            ],
            forex: [
                {
                    id: 'eurusd',
                    name: 'EUR/USD',
                    symbol: 'EUR',
                    tradingViewSymbol: 'FX_IDC:EURUSD',
                    displayName: 'EUR/USD'
                },
                {
                    id: 'gbpusd',
                    name: 'GBP/USD',
                    symbol: 'GBP',
                    tradingViewSymbol: 'FX_IDC:GBPUSD',
                    displayName: 'GBP/USD'
                },
                {
                    id: 'audusd',
                    name: 'AUD/USD',
                    symbol: 'AUD',
                    tradingViewSymbol: 'FX_IDC:AUDUSD',
                    displayName: 'AUD/USD'
                },
                {
                    id: 'nzdusd',
                    name: 'NZD/USD',
                    symbol: 'NZD',
                    tradingViewSymbol: 'FX_IDC:NZDUSD',
                    displayName: 'NZD/USD'
                }
            ]
        };

        let currentAssetType = 'crypto';
        let currentAssets = assetTypes.crypto;
        let selectedAsset = null;
        let tvWidgets = {};
        let selectedTVWidget = null;
        let chartStates = {}; // Stockage des états des graphiques

        // Éléments du DOM
        const carousel = document.getElementById('mainCarousel');
        const carouselScene = document.getElementById('carouselScene');
        const selectedView = document.getElementById('selectedView');
        const backBtn = document.getElementById('backBtn');
        const loader = document.getElementById('loader');
        const menuSections = document.querySelectorAll('.menu-section');
        const sideMenu = document.getElementById('sideMenu');

        // Charger les états des graphiques depuis localStorage
        function loadChartStates() {
            const saved = localStorage.getItem('chartStates');
            if (saved) {
                try {
                    chartStates = JSON.parse(saved);
                } catch (e) {
                    console.error('Erreur lors du chargement des états:', e);
                    chartStates = {};
                }
            }
        }

        // Sauvegarder les états des graphiques dans localStorage
        function saveChartStates() {
            try {
                localStorage.setItem('chartStates', JSON.stringify(chartStates));
            } catch (e) {
                console.error('Erreur lors de la sauvegarde des états:', e);
            }
        }

        // Obtenir la clé de stockage pour un actif
        function getChartKey(assetId) {
            return `chart_${assetId}`;
        }

        // Sauvegarder l'état actuel du graphique
        function saveCurrentChartState() {
            if (!selectedAsset || !selectedTVWidget) return;
            
            try {
                const chart = selectedTVWidget.chart();
                if (chart) {
                    // Récupérer l'état du graphique
                    chart.getSavedStudies((studies) => {
                        const state = {
                            studies: studies,
                            timestamp: Date.now(),
                            symbol: selectedAsset.tradingViewSymbol
                        };
                        
                        chartStates[getChartKey(selectedAsset.id)] = state;
                        saveChartStates();
                        console.log('État du graphique sauvegardé pour:', selectedAsset.id);
                    });
                }
            } catch (e) {
                console.error('Erreur lors de la sauvegarde de l\'état:', e);
            }
        }

        // === GESTION DU MENU LATÉRAL ===
        function initMenu() {
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

            // Configuration du widget
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

            // Configuration différente pour carousel vs vue sélectionnée
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
                
                // Charger l'état sauvegardé si disponible
                const chartKey = getChartKey(assetId);
                const savedState = chartStates[chartKey];
                
                if (savedState && savedState.symbol === symbol) {
                    widgetConfig.studies_overrides = savedState.studies;
                } else {
                    // Indicateurs par défaut : RSI(14) et MAWeighted(50)
                    widgetConfig.studies = ["RSI@tv-basicstudies", "MAWeighted@tv-basicstudies"];
                    widgetConfig.studies_overrides = {
                        "volume.volume.color.0": "rgba(0, 0, 0, 0)",
                        "volume.volume.color.1": "rgba(0, 0, 0, 0)",
                        // Configuration RSI
                        "RSI.rsi.linewidth": 2,
                        "RSI.rsi.period": 14,
                        "RSI.rsi.plottype": "line",
                        // Configuration MAWeighted (Moyenne Mobile Pondérée) - Taille 50
                        "MAWeighted.ma.color": "#FF6B00",
                        "MAWeighted.ma.linewidth": 50,
                        "MAWeighted.ma.period": 50, // CORRIGÉ : 50 au lieu de 9
                        "MAWeighted.ma.plottype": "line",
                        "MAWeighted.ma.transparency": 0
                    };
                }
            }

            try {
                const widget = new TradingView.widget(widgetConfig);
                
                // Pour la vue sélectionnée, sauvegarder périodiquement
                if (!isCarousel) {
                    widget.onChartReady(() => {
                        const chart = widget.chart();
                        
                        // Sauvegarder toutes les 30 secondes
                        setInterval(saveCurrentChartState, 30000);
                        
                        // Sauvegarder quand l'utilisateur quitte la page
                        window.addEventListener('beforeunload', saveCurrentChartState);
                        
                        // Sauvegarder quand l'utilisateur change de graphique
                        chart.onIntervalChanged().subscribe(null, saveCurrentChartState);
                        chart.onSymbolChanged().subscribe(null, saveCurrentChartState);
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
            }, 1000);
           
            initCarouselClicks();
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

            // Sauvegarder l'état actuel avant de changer
            saveCurrentChartState();

            carousel.classList.add('carousel-paused');
            carouselScene.classList.add('hidden');
            sideMenu.classList.add('hidden');
            selectedView.classList.add('active');
            backBtn.classList.remove('hidden');
            loader.classList.remove('hidden');

            const tvContainer = document.getElementById('tradingview_selected');
            if (tvContainer) {
                tvContainer.innerHTML = '';
            }

            setTimeout(() => {
                if (selectedTVWidget) {
                    // Supprimer les écouteurs d'événements avant de détruire
                    window.removeEventListener('beforeunload', saveCurrentChartState);
                }
               
                selectedTVWidget = createTradingViewWidget(
                    'tradingview_selected',
                    selectedAsset.tradingViewSymbol,
                    selectedAsset.id,
                    false
                );
               
                setTimeout(() => {
                    loader.classList.add('hidden');
                }, 1500);
            }, 500);
        }

        // === RETOUR AU CAROUSEL ===
        backBtn.addEventListener('click', function() {
            // Sauvegarder l'état avant de quitter
            saveCurrentChartState();
            
            selectedView.classList.remove('active');
            carouselScene.classList.remove('hidden');
            backBtn.classList.add('hidden');
            sideMenu.classList.remove('hidden');
            carousel.classList.remove('carousel-paused');
        });

        // === INITIALISATION ===
        function init() {
            loadChartStates();
            initMenu();
            updateCarousel();
            
            // Sauvegarder avant que l'utilisateur ne quitte la page
            window.addEventListener('beforeunload', saveCurrentChartState);
        }

        // DÉMARRER L'APPLICATION
        init();

        window.addEventListener('resize', function() {
            sideMenu.style.top = '50%';
            sideMenu.style.transform = 'translateY(-50%)';
        });
    });
