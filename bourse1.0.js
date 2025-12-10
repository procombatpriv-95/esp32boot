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
                       id: 'nasdaq',  // Changer 'netflix' par 'nasdaq'
                       name: 'NASDAQ Composite',  // Nom complet
                       symbol: 'NASDAQ',  // Symbole
                       tradingViewSymbol: 'NASDAQ:IXIC',  // Symbole TradingView pour le NASDAQ
                       displayName: 'NASDAQ'  // Nom affiché
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
                        id: 'oil',  // Changer 'naturalgas' par 'oil'
                        name: 'Crude Oil (WTI)',
                        symbol: 'OIL',
                        tradingViewSymbol: 'TVC:USOIL',  // WTI Oil
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

            // Éléments du DOM
            const carousel = document.getElementById('mainCarousel');
            const carouselScene = document.getElementById('carouselScene');
            const selectedView = document.getElementById('selectedView');
            const backBtn = document.getElementById('backBtn');
            const loader = document.getElementById('loader');
            const menuSections = document.querySelectorAll('.menu-section');
            const sideMenu = document.getElementById('sideMenu');

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
            function createTradingViewWidget(containerId, symbol, isCarousel = false) {
                if (!window.TradingView) {
                    console.error('Bibliothèque TradingView non chargée');
                    setTimeout(() => createTradingViewWidget(containerId, symbol, isCarousel), 100);
                    return null;
                }

                const container = document.getElementById(containerId);
                if (!container) {
                    console.error('Conteneur non trouvé:', containerId);
                    return null;
                }

                // Configuration du widget POUR LE CAROUSEL SEULEMENT
                if (isCarousel) {
                    const widgetConfig = {
                        width: '400',
                        height: '200',
                        symbol: symbol,
                        interval: '5',
                        timezone: "Europe/Paris",
                        theme: "dark",
                        style: "1",
                        locale: "fr",
                        toolbar_bg: "#111216",
                        enable_publishing: false,
                        hide_legend: true,
                        hide_side_toolbar: true,
                        hide_top_toolbar: true,
                        allow_symbol_change: false,
                        save_image: false,
                        details: false,
                        hotlist: false,
                        calendar: false,
                        show_popup_button: false,
                        container_id: containerId,
                        disabled_features: [
                            "header_widget", "left_toolbar", "timeframes_toolbar",
                            "edit_buttons_in_legend", "legend_context_menu", "control_bar",
                            "border_around_the_chart", "countdown", "header_compare",
                            "header_screenshot", "header_undo_redo", "header_saveload",
                            "header_settings", "header_chart_type", "header_indicators",
                            "volume_force_overlay", "study_templates", "symbol_info"
                        ],
                        enabled_features: [
                            "hide_volume", "move_logo_to_main_pane"
                        ]
                    };

                    try {
                        return new TradingView.widget(widgetConfig);
                    } catch (error) {
                        console.error('Erreur création widget TradingView (carousel):', error);
                        return null;
                    }
                } else {
                    const widgetConfig = {
                        width: '1000',
                        height: '200',
                        symbol: symbol,
                        interval: '5',
                        timezone: "Europe/Paris",
                        theme: "dark",
                        style: "1",
                        locale: "fr",
                        toolbar_bg: "#f1f3f6",
                        enable_publishing: false,
                        allow_symbol_change: false,
                        container_id: containerId
                    };

                    widgetConfig.hide_side_toolbar = false;
                    widgetConfig.hide_legend = false;
                    widgetConfig.details = true;
                    widgetConfig.hotlist = true;
                    widgetConfig.calendar = true;
                    widgetConfig.studies = ["MAWeighted@tv-basicstudies"];
                    widgetConfig.disabled_features = [];

                    try {
                        return new TradingView.widget(widgetConfig);
                    } catch (error) {
                        console.error('Erreur création widget TradingView (full):', error);
                        return null;
                    }
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
                   
                    // HTML avec nom au-dessus et overlay qui couvre tout
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
                    if (selectedTVWidget && typeof selectedTVWidget.remove === 'function') {
                        selectedTVWidget.remove();
                    }
                   
                    selectedTVWidget = createTradingViewWidget(
                        'tradingview_selected',
                        selectedAsset.tradingViewSymbol,
                        false
                    );
                   
                    setTimeout(() => {
                        loader.classList.add('hidden');
                    }, 1500);
                }, 500);
            }

            // === RETOUR AU CAROUSEL ===
            backBtn.addEventListener('click', function() {
                selectedView.classList.remove('active');
                carouselScene.classList.remove('hidden');
                backBtn.classList.add('hidden');
                sideMenu.classList.remove('hidden');
                carousel.classList.remove('carousel-paused');

                if (selectedTVWidget && typeof selectedTVWidget.remove === 'function') {
                    selectedTVWidget.remove();
                    selectedTVWidget = null;
                }
            });

            // === INITIALISATION ===
            function init() {
                initMenu();
                updateCarousel();
            }

            // DÉMARRER L'APPLICATION
            init();

            window.addEventListener('resize', function() {
                sideMenu.style.top = '50%';
                sideMenu.style.transform = 'translateY(-50%)';
            });
        });
