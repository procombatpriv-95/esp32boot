// ============================================
// BLOC 1 - TradingView avec Carousel et Marchés
// ============================================

// ============================================
// VARIABLES GLOBALES - TradingView
// ============================================

let currentAssetType = 'crypto';
let currentAssets = [];
let selectedAsset = null;
let tvWidgets = {};
let selectedTVWidget = null;
let chartStates = {};
let isInSelectedView = false;
let wasInSelectedView = false;
let currentMenuPage = 'menu-1';

// Configuration des actifs
const assetTypes = {
    crypto: [
        { id: 'bitcoin', name: 'Bitcoin (BTC)', symbol: 'BTC', tradingViewSymbol: 'BITSTAMP:BTCUSD', displayName: 'Bitcoin', kinfopaneltousSymbol: 'BTCUSD' },
        { id: 'litecoin', name: 'Litecoin (LTC)', symbol: 'LTC', tradingViewSymbol: 'BITSTAMP:LTCUSD', displayName: 'Litecoin', kinfopaneltousSymbol: 'LTCUSD' },
        { id: 'ethereum', name: 'Ethereum (ETH)', symbol: 'ETH', tradingViewSymbol: 'BITSTAMP:ETHUSD', displayName: 'Ethereum', kinfopaneltousSymbol: 'ETHUSD' },
        { id: 'xrp', name: 'XRP', symbol: 'XRP', tradingViewSymbol: 'BITSTAMP:XRPUSD', displayName: 'XRP', kinfopaneltousSymbol: 'XRPUSD' }
    ],
    shares: [
        { id: 'S&P 500', name: 'S&P 500 (SP500)', symbol: 'S&P 500', tradingViewSymbol: 'Vantage:SP500', displayName: 'S&P 500', kinfopaneltousSymbol: 'Vantage:SP500' },
        { id: 'nasdaq', name: 'NASDAQ Composite', symbol: 'NASDAQ', tradingViewSymbol: 'NASDAQ:IXIC', displayName: 'NASDAQ', kinfopaneltousSymbol: 'NASDAQ:IXIC' },
        { id: 'apple', name: 'Apple (AAPL)', symbol: 'AAPL', tradingViewSymbol: 'NASDAQ:AAPL', displayName: 'Apple', kinfopaneltousSymbol: 'NASDAQ:AAPL' },
        { id: 'GameStop', name: 'GameStop (GME)', symbol: 'GME', tradingViewSymbol: 'NYSE:GME', displayName: 'GameStop', kinfopaneltousSymbol: 'NYSE:GME' }
    ],
    commodities: [
        { id: 'gold', name: 'Gold (XAUUSD)', symbol: 'XAU', tradingViewSymbol: 'OANDA:XAUUSD', displayName: 'Gold', kinfopaneltousSymbol: 'XAUUSD' },
        { id: 'silver', name: 'Silver (XAGUSD)', symbol: 'XAG', tradingViewSymbol: 'OANDA:XAGUSD', displayName: 'Silver', kinfopaneltousSymbol: 'XAGUSD' },
        { id: 'platinum', name: 'Platinum (XPTUSD)', symbol: 'XPT', tradingViewSymbol: 'TVC:PLATINUM', displayName: 'Platinum', kinfopaneltousSymbol: 'PLATINUM' },
        { id: 'oil', name: 'Crude Oil (WTI)', symbol: 'OIL', tradingViewSymbol: 'TVC:USOIL', displayName: 'Crude Oil', kinfopaneltousSymbol: 'USOIL' }
    ],
    forex: [
        { id: 'eurusd', name: 'EUR/USD', symbol: 'EUR', tradingViewSymbol: 'FX_IDC:EURUSD', displayName: 'EUR/USD', kinfopaneltousSymbol: 'EURUSD' },
        { id: 'gbpusd', name: 'GBP/USD', symbol: 'GBP', tradingViewSymbol: 'FX_IDC:GBPUSD', displayName: 'GBP/USD', kinfopaneltousSymbol: 'GBPUSD' },
        { id: 'audusd', name: 'AUD/USD', symbol: 'AUD', tradingViewSymbol: 'FX_IDC:AUDUSD', displayName: 'AUD/USD', kinfopaneltousSymbol: 'AUDUSD' },
        { id: 'nzdusd', name: 'NZD/USD', symbol: 'NZD', tradingViewSymbol: 'FX_IDC:NZDUSD', displayName: 'NZD/USD', kinfopaneltousSymbol: 'NZDUSD' }
    ]
};

if (!window.appTimezone) {
    window.appTimezone = "Europe/London";
}

// ============================================
// FONCTIONS PRINCIPALES - TradingView
// ============================================

function initializeTradingView() {
    console.log("Initialisation du TradingView...");
    
    // Vérifier si les éléments DOM existent
    const carousel = document.getElementById('mainCarousel');
    const carouselScene = document.getElementById('carouselScene');
    const selectedView = document.getElementById('selectedView');
    const backBtn = document.getElementById('backBtn');
    const loader = document.getElementById('loader');
    const menuSections = document.querySelectorAll('.menu-section');
    const sideMenu = document.getElementById('sideMenu');
    const megaBox = document.getElementById('megaBox');
    
    if (!carousel) {
        console.error("❌ ERREUR: Élément 'mainCarousel' non trouvé!");
        return;
    }
    
    console.log("Éléments DOM trouvés, initialisation en cours...");
    
    // Initialiser les sections de menu
    if (menuSections.length > 0) {
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
    
    // Initialiser avec crypto par défaut
    currentAssets = assetTypes.crypto;
    updateCarousel();
    
    // Gestion du bouton retour
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            exitSelectedView();
        });
    }
    
    // Observateur pour les changements de menu
    if (megaBox) {
        const observerMenuChange = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    updateCurrentMenuPage();
                    
                    // Si on quitte le menu 2 (selected view), on sort de la vue détaillée
                    if (currentMenuPage !== 'menu-2' && isInSelectedView) {
                        exitSelectedView();
                    }
                }
            });
        });
        
        observerMenuChange.observe(megaBox, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
    
    console.log("✅ TradingView initialisé avec succès!");
}

function updateCarousel() {
    const carousel = document.getElementById('mainCarousel');
    if (!carousel) return;
    
    console.log("Mise à jour du carousel avec", currentAssets.length, "actifs");
    
    // Vider le carousel
    carousel.innerHTML = '';
    
    // Créer les éléments du carousel
    currentAssets.forEach((asset, index) => {
        const carouselItem = document.createElement('div');
        carouselItem.className = 'carousel-item';
        carouselItem.setAttribute('data-asset', asset.id);
        
        const widgetId = `tv_${asset.id}_${Date.now()}`;
        
        carouselItem.innerHTML = `
            <div class="market-name">${asset.displayName}</div>
            <div class="carousel-chart">
                <div class="tradingview-widget-container" id="${widgetId}"></div>
            </div>
            <div class="carousel-overlay" data-asset-id="${asset.id}"></div>
        `;
        
        carousel.appendChild(carouselItem);
        
        // Positionner l'élément dans le carousel 3D
        const angle = index * 90;
        carouselItem.style.transform = `rotateY(${angle}deg) translateZ(280px)`;
        
        // Créer le widget TradingView après un délai
        setTimeout(() => {
            createTradingViewWidget(widgetId, asset.tradingViewSymbol, true);
        }, 100 * index);
    });
    
    // Initialiser les clics après création
    setTimeout(initCarouselClicks, 500);
}

function initCarouselClicks() {
    const overlays = document.querySelectorAll('.carousel-overlay');
    console.log("Initialisation des clics pour", overlays.length, "éléments");
    
    overlays.forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            e.stopPropagation();
            const assetId = this.getAttribute('data-asset-id');
            console.log("Clic sur l'actif:", assetId);
            selectAsset(assetId);
        });
    });
}

function createTradingViewWidget(containerId, symbol, isCarousel = false) {
    if (!window.TradingView) {
        console.warn("TradingView SDK non chargé, nouvelle tentative...");
        setTimeout(() => createTradingViewWidget(containerId, symbol, isCarousel), 500);
        return null;
    }
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error("Conteneur non trouvé:", containerId);
        return null;
    }
    
    try {
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
        } else {
            widgetConfig.toolbar_bg = "#f1f3f6";
            widgetConfig.hide_side_toolbar = false;
            widgetConfig.hide_legend = false;
            widgetConfig.details = true;
            widgetConfig.hotlist = true;
            widgetConfig.calendar = true;
        }
        
        console.log("Création du widget TradingView pour:", symbol);
        return new TradingView.widget(widgetConfig);
    } catch (error) {
        console.error("Erreur création widget TradingView:", error);
        return null;
    }
}

function selectAsset(assetId) {
    selectedAsset = currentAssets.find(c => c.id === assetId);
    if (!selectedAsset) {
        console.error("Actif non trouvé:", assetId);
        return;
    }
    
    console.log("Sélection de l'actif:", selectedAsset.displayName);
    
    isInSelectedView = true;
    wasInSelectedView = true;
    
    // Afficher la vue détaillée
    const carousel = document.getElementById('mainCarousel');
    const carouselScene = document.getElementById('carouselScene');
    const sideMenu = document.getElementById('sideMenu');
    const selectedView = document.getElementById('selectedView');
    const backBtn = document.getElementById('backBtn');
    const loader = document.getElementById('loader');
    
    if (carousel) carousel.classList.add('carousel-paused');
    if (carouselScene) carouselScene.classList.add('hidden');
    if (sideMenu) sideMenu.classList.add('hidden');
    if (selectedView) selectedView.classList.add('active');
    if (backBtn) backBtn.classList.remove('hidden');
    if (loader) loader.classList.remove('hidden');
    
    // Préparer le conteneur pour le graphique détaillé
    const tvContainer = document.getElementById('tradingview_selected');
    if (tvContainer) {
        tvContainer.innerHTML = '';
        
        // Créer le widget détaillé après un délai
        setTimeout(() => {
            if (selectedTVWidget) {
                try {
                    selectedTVWidget.remove();
                } catch (e) {
                    console.warn("Impossible de supprimer l'ancien widget:", e);
                }
            }
            
            selectedTVWidget = createTradingViewWidget(
                'tradingview_selected',
                selectedAsset.tradingViewSymbol,
                false
            );
            
            // Masquer le loader après 1.5 secondes
            setTimeout(() => {
                if (loader) loader.classList.add('hidden');
            }, 1500);
        }, 500);
    }
}

function exitSelectedView() {
    isInSelectedView = false;
    wasInSelectedView = false;
    
    const selectedView = document.getElementById('selectedView');
    const carouselScene = document.getElementById('carouselScene');
    const backBtn = document.getElementById('backBtn');
    const sideMenu = document.getElementById('sideMenu');
    const carousel = document.getElementById('mainCarousel');
    
    if (selectedView) selectedView.classList.remove('active');
    if (carouselScene) carouselScene.classList.remove('hidden');
    if (backBtn) backBtn.classList.add('hidden');
    if (sideMenu) sideMenu.classList.remove('hidden');
    if (carousel) carousel.classList.remove('carousel-paused');
    
    // Nettoyer le widget détaillé
    if (selectedTVWidget) {
        try {
            selectedTVWidget.remove();
        } catch (e) {
            console.warn("Erreur nettoyage widget:", e);
        }
        selectedTVWidget = null;
    }
}

function updateCurrentMenuPage() {
    const megaBox = document.getElementById('megaBox');
    if (!megaBox) return;
    
    const classes = megaBox.classList;
    if (classes.contains('menu-1')) currentMenuPage = 'menu-1';
    else if (classes.contains('menu-2')) currentMenuPage = 'menu-2';
    else if (classes.contains('menu-3')) currentMenuPage = 'menu-3';
    else if (classes.contains('menu-4')) currentMenuPage = 'menu-4';
    else if (classes.contains('menu-5')) currentMenuPage = 'menu-5';
    
    console.log("Menu changé vers:", currentMenuPage);
}

// ============================================
// CHARGEMENT ET INITIALISATION
// ============================================

// S'assurer que TradingView SDK est chargé
function loadTradingViewSDK() {
    return new Promise((resolve) => {
        if (window.TradingView) {
            resolve();
            return;
        }
        
        console.log("Chargement du SDK TradingView...");
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            console.log("✅ SDK TradingView chargé");
            resolve();
        };
        script.onerror = () => {
            console.error("❌ Erreur chargement SDK TradingView");
            // Réessayer après 2 secondes
            setTimeout(() => loadTradingViewSDK().then(resolve), 2000);
        };
        document.head.appendChild(script);
    });
}

// Initialisation principale
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM chargé, initialisation du TradingView...");
    
    // Charger le SDK TradingView d'abord
    loadTradingViewSDK().then(() => {
        // Attendre que tous les éléments soient prêts
        setTimeout(() => {
            initializeTradingView();
            
            // Exposer les variables globales
            window.tvWidgets = tvWidgets;
            window.selectedTVWidget = selectedTVWidget;
            window.isInSelectedView = isInSelectedView;
            window.currentMenuPage = currentMenuPage;
            window.selectedAsset = selectedAsset;
            
            console.log("✅ Système TradingView prêt!");
        }, 1000);
    });
});

// Redimensionnement de la fenêtre
window.addEventListener('resize', function() {
    const sideMenu = document.getElementById('sideMenu');
    if (sideMenu) {
        sideMenu.style.top = '50%';
        sideMenu.style.transform = 'translateY(-50%)';
    }
});

// ============================================
// GÉOLOCALISATION POUR FUSEAU HORAIRE
// ============================================

async function getTimezoneFromCoords(lat, lon) {
    try {
        // Utiliser une API gratuite pour le fuseau horaire
        const res = await fetch(`https://api.ipgeolocation.io/timezone?apiKey=YOUR_API_KEY&lat=${lat}&long=${lon}`);
        if (!res.ok) throw new Error("Erreur API fuseau horaire");
        const data = await res.json();
        return data.timezone || "Europe/London";
    } catch (e) {
        console.error("Erreur fuseau horaire, utilisation du fuseau par défaut:", e);
        return "Europe/London";
    }
}

function setupGeolocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const crd = pos.coords;
                getTimezoneFromCoords(crd.latitude, crd.longitude).then(timezone => {
                    window.appTimezone = timezone;
                    console.log("Fuseau horaire détecté:", timezone);
                    
                    // Mettre à jour les widgets existants
                    if (window.tvWidgets) {
                        Object.values(window.tvWidgets).forEach(widget => {
                            if (widget && widget.chart) {
                                try {
                                    widget.chart().setTimezone(timezone);
                                } catch (e) {
                                    console.warn("Impossible de mettre à jour le fuseau horaire du widget:", e);
                                }
                            }
                        });
                    }
                });
            },
            (err) => {
                console.warn("Géolocalisation non disponible, fuseau horaire par défaut:", err.message);
                window.appTimezone = "Europe/London";
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        window.appTimezone = "Europe/London";
        console.log("Géolocalisation non supportée, fuseau horaire par défaut");
    }
}

// Démarrer la géolocalisation après le chargement
setTimeout(setupGeolocation, 2000);
} else {
  document.getElementById("output").textContent = "❌ Géolocalisation non supportée par ce navigateur.";
  window.appTimezone = "Europe/London";
}
