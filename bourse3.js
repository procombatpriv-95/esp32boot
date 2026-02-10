// ============================================
// VARIABLES GLOBALES POUR TRADINGVIEW
// ============================================

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

// Variables d'état TradingView
let currentAssetType = 'crypto';
let currentAssets = assetTypes.crypto;
let selectedAsset = null;
let tvWidgets = {};
let selectedTVWidget = null;
let chartStates = {};
let currentKinfopaneltousWidget = null;

// ============================================
// FONCTIONS TRADINGVIEW
// ============================================

function removeAllTooltips() {
    const elements = document.querySelectorAll('[title]');
    elements.forEach(el => {
        if (el.title && el.title !== '') {
            el.setAttribute('data-original-title', el.title);
            el.removeAttribute('title');
        }
    });
}

function createTradingViewWidget(containerId, symbol, assetId, isCarousel = false) {
    if (!window.TradingView) {
        setTimeout(() => createTradingViewWidget(containerId, symbol, assetId, isCarousel), 100);
        return null;
    }

    const container = document.getElementById(containerId);
    if (!container) return null;

    const widgetConfig = {
        width: isCarousel ? '400' : '1000',
        height: isCarousel ? '200' : '500',
        symbol: symbol,
        interval: '5',
        timezone: window.appTimezone || "Europe/London",
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

    try {
        return new TradingView.widget(widgetConfig);
    } catch (error) {
        return null;
    }
}

function updateCarousel() {
    const carousel = document.getElementById('mainCarousel');
    if (!carousel) return;
    
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
        
        initCarouselClicks();
    }, 1000);
}

function initCarouselClicks() {
    document.querySelectorAll('.carousel-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            e.stopPropagation();
            const assetId = this.getAttribute('data-asset-id');
            selectAsset(assetId);
        });
    });
}

function selectAsset(assetId) {
    selectedAsset = currentAssets.find(c => c.id === assetId);
    if (!selectedAsset) return;

    window.isInSelectedView = true;
    
    const carousel = document.getElementById('mainCarousel');
    const carouselScene = document.getElementById('carouselScene');
    const selectedView = document.getElementById('selectedView');
    const backBtn = document.getElementById('backBtn');
    const loader = document.getElementById('loader');
    const sideMenu = document.getElementById('sideMenu');
    
    if (carousel) carousel.classList.add('carousel-paused');
    if (carouselScene) carouselScene.classList.add('hidden');
    if (sideMenu) sideMenu.classList.add('hidden');
    if (selectedView) selectedView.classList.add('active');
    if (backBtn) backBtn.classList.remove('hidden');
    if (loader) loader.classList.remove('hidden');

    // Afficher les news dans le panelinfo
    loadKinfopaneltousNews(selectedAsset);

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
            if (loader) loader.classList.add('hidden');
        }, 1500);
    }, 500);
}

// ============================================
// ACTUALITÉS SELECTED VIEW
// ============================================

function loadKinfopaneltousNews(asset) {
    const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
    if (!kinfopaneltousContent) return;
    
    kinfopaneltousContent.innerHTML = '';
    
    const loaderDiv = document.createElement('div');
    loaderDiv.className = 'kinfopaneltous-loader';
    loaderDiv.textContent = 'Loading...';
    kinfopaneltousContent.appendChild(loaderDiv);
    
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-kinfopaneltous-news';
    widgetDiv.id = 'tradingview_kinfopaneltous_news';
    widgetDiv.style.cssText = 'width:100%; height:100%;';
    
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
            "displayMode": "regular",
            "width": "250",
            "height": "600",
            "colorTheme": "dark",
            "locale": "fr",
            "utm_source": "tradingview.com",
            "utm_medium": "widget",
            "utm_campaign": "timeline",
            "noReferrer": true,
            "showSymbolLogo": true,
            "fontSize": "12",
            "textColor": "#ffffff",
            "backgroundColor": "rgba(0, 0, 0, 0.3)"
        });
        
        widgetDiv.appendChild(script);
        currentKinfopaneltousWidget = widgetDiv;
        
        // Activer le conteneur
        const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
        if (kinfopaneltousContainer) {
            kinfopaneltousContainer.classList.add('active');
        }
        
        // Supprimer le scaling qui rend flou
        setTimeout(() => {
            const iframes = widgetDiv.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                iframe.style.transform = 'none';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
            });
        }, 1000);
    }, 500);
}

// ============================================
// GESTION DU PANELINFO POUR TRADINGVIEW
// ============================================

function updateTradingViewPanelInfo() {
    // Cette fonction ne s'occupe que des news quand on est en selected view
    if (window.isInSelectedView && selectedAsset && window.currentMenuPage === 'menu-2') {
        loadKinfopaneltousNews(selectedAsset);
    } else {
        // Si on n'est pas en selected view avec menu-2, on désactive le conteneur
        const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
        if (kinfopaneltousContainer) {
            kinfopaneltousContainer.classList.remove('active');
        }
    }
}

// ============================================
// INITIALISATION ET ÉVÉNEMENTS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const carousel = document.getElementById('mainCarousel');
    const carouselScene = document.getElementById('carouselScene');
    const selectedView = document.getElementById('selectedView');
    const backBtn = document.getElementById('backBtn');
    const loader = document.getElementById('loader');
    const sideMenu = document.getElementById('sideMenu');
    const megaBox = document.getElementById('megaBox');

    function updateCurrentMenuPage() {
        if (!megaBox) return;
        const classes = megaBox.classList;
        if (classes.contains('menu-1')) window.currentMenuPage = 'menu-1';
        else if (classes.contains('menu-2')) window.currentMenuPage = 'menu-2';
        else if (classes.contains('menu-3')) window.currentMenuPage = 'menu-3';
        else if (classes.contains('menu-4')) window.currentMenuPage = 'menu-4';
        else if (classes.contains('menu-5')) window.currentMenuPage = 'menu-5';
    }

    function init() {
        const saved = localStorage.getItem('chartStates');
        if (saved) {
            try {
                chartStates = JSON.parse(saved);
            } catch (e) {
                chartStates = {};
            }
        }
        
        // Initialiser les sections de menu pour le carousel uniquement
        const menuSections = document.querySelectorAll('.menu-section[data-type]');
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
        
        updateCarousel();
        updateCurrentMenuPage();
        
        setTimeout(removeAllTooltips, 1000);
    }

    // Événement back button
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.isInSelectedView = false;
            
            if (selectedView) selectedView.classList.remove('active');
            if (carouselScene) carouselScene.classList.remove('hidden');
            if (backBtn) backBtn.classList.add('hidden');
            if (sideMenu) sideMenu.classList.remove('hidden');
            if (carousel) carousel.classList.remove('carousel-paused');
            
            // Désactiver le panelinfo
            const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
            if (kinfopaneltousContainer) {
                kinfopaneltousContainer.classList.remove('active');
            }
        });
    }

    // DÉMARRAGE
    init();

    if (sideMenu) {
        window.addEventListener('resize', function() {
            sideMenu.style.top = '50%';
            sideMenu.style.transform = 'translateY(-50%)';
        });
    }
    
    // Variables globales
    window.tvWidgets = tvWidgets;
    window.selectedTVWidget = selectedTVWidget;
    window.isInSelectedView = window.isInSelectedView || false;
    window.currentMenuPage = window.currentMenuPage || 'menu-1';
});

// ============================================
// GÉOLOCALISATION POUR TRADINGVIEW
// ============================================

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

    let suburb = data.address.suburb || data.address.neighbourhood || data.address.quarter || "Quartier inconnu";
    let borough = data.address.borough || data.address.city_district || "Borough inconnu";
    let city = data.address.city || data.address.town || data.address.municipality || data.address.county || "Ville inconnue";

    const output = document.getElementById("output");
    if (output) {
        output.textContent = `Around: ${suburb}, ${borough}, ${city}`;
    }
  } catch (e) {
    const output = document.getElementById("output");
    if (output) {
        output.textContent = "Erreur adresse : " + e;
    }
  }
}

async function getTimezoneFromCoords(lat, lon) {
  try {
    const res = await fetch(
      `https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_API_KEY&format=json&by=position&lat=${lat}&lng=${lon}`
    );
    if (!res.ok) throw new Error("Erreur API fuseau horaire");
    const data = await res.json();
    return data.zoneName;
  } catch (e) {
    console.error("Erreur fuseau horaire:", e);
    return "Europe/London";
  }
}

function success(pos) {
  const crd = pos.coords;
  getAddress(crd.latitude, crd.longitude);
  
  getTimezoneFromCoords(crd.latitude, crd.longitude).then(timezone => {
    window.appTimezone = timezone;
    
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
  const output = document.getElementById("output");
  if (output) {
    output.textContent = `Erreur (${err.code}): ${err.message}`;
  }
  window.appTimezone = "Europe/London";
}

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(success, error, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  });
} else {
  const output = document.getElementById("output");
  if (output) {
    output.textContent = "❌ Géolocalisation non supportée par ce navigateur.";
  }
  window.appTimezone = "Europe/London";
}
