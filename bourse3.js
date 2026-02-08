// ============================================
// TRADINGVIEW, CAROUSEL ET SELECTED VIEW
// ============================================

document.addEventListener('DOMContentLoaded', function() {
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
    let tvWidgets = {};
    let selectedTVWidget = null;
    let chartStates = {};
    let isInSelectedView = false;
    let wasInSelectedView = false;
    
    // Éléments DOM TradingView
    const carousel = document.getElementById('mainCarousel');
    const carouselScene = document.getElementById('carouselScene');
    const selectedView = document.getElementById('selectedView');
    const backBtn = document.getElementById('backBtn');
    const loader = document.getElementById('loader');
    const menuSections = document.querySelectorAll('.menu-section');
    const sideMenu = document.getElementById('sideMenu');

    // === FONCTIONS UTILITAIRES ===
    function removeAllTooltips() {
        const elements = document.querySelectorAll('[title]');
        elements.forEach(el => {
            if (el.title && el.title !== '') {
                el.setAttribute('data-original-title', el.title);
                el.removeAttribute('title');
            }
        });
    }

    // === TRADINGVIEW WIDGETS ===
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

        try {
            return new TradingView.widget(widgetConfig);
        } catch (error) {
            return null;
        }
    }

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
        // Important: Stocker l'actif sélectionné dans window pour qu'il soit accessible
        window.selectedAsset = currentAssets.find(c => c.id === assetId);
        if (!window.selectedAsset) return;

        isInSelectedView = true;
        wasInSelectedView = true;
        carousel.classList.add('carousel-paused');
        carouselScene.classList.add('hidden');
        sideMenu.classList.add('hidden');
        selectedView.classList.add('active');
        backBtn.classList.remove('hidden');
        loader.classList.remove('hidden');

        // Notifier le système de menus que nous sommes en selected view
        if (window.updatePanelInfo) {
            window.updatePanelInfo();
        }

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
                window.selectedAsset.tradingViewSymbol,
                window.selectedAsset.id,
                false
            );
            
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 1500);
        }, 500);
    }

    // === ÉVÉNEMENTS TRADINGVIEW ===
    backBtn.addEventListener('click', function() {
        isInSelectedView = false;
        wasInSelectedView = false;
        window.selectedAsset = null; // Réinitialiser l'actif sélectionné
        selectedView.classList.remove('active');
        carouselScene.classList.remove('hidden');
        backBtn.classList.add('hidden');
        sideMenu.classList.remove('hidden');
        carousel.classList.remove('carousel-paused');
        
        // Notifier le système de menus que nous quittons selected view
        if (window.updatePanelInfo) {
            window.updatePanelInfo();
        }
    });

    // === INITIALISATION TRADINGVIEW ===
    function initTradingView() {
        const saved = localStorage.getItem('chartStates');
        if (saved) {
            try {
                chartStates = JSON.parse(saved);
            } catch (e) {
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
        setTimeout(removeAllTooltips, 1000);
        
        // Initialiser la variable globale selectedAsset
        window.selectedAsset = null;
    }

    // DÉMARRAGE
    initTradingView();

    // Variables globales pour communication avec l'autre bloc
    window.tvWidgets = tvWidgets;
    window.selectedTVWidget = selectedTVWidget;
    window.isInSelectedView = isInSelectedView;
    window.wasInSelectedView = wasInSelectedView;
    // Note: window.selectedAsset est déjà défini dans la fonction selectAsset
});

// ============================================
// GÉOLOCALISATION (pour fuseau horaire TradingView)
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

    document.getElementById("output").textContent = `Around: ${suburb}, ${borough}, ${city}`;
  } catch (e) {
    document.getElementById("output").textContent = "Erreur adresse : " + e;
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
  document.getElementById("output").textContent = `Erreur (${err.code}): ${err.message}`;
  window.appTimezone = "Europe/London";
}

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(success, error, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  });
} else {
  document.getElementById("output").textContent = "❌ Géolocalisation non supportée par ce navigateur.";
  window.appTimezone = "Europe/London";
}
