// ============================================
// FONCTIONS ET VARIABLES SPÉCIFIQUES AUX MENUS
// ============================================


let menu1WidgetsInterval = null;
let currentBottomLeftWidget = 'eurusd';
let currentBottomRightWidget = 'apple';

// === WIDGETS MENU-1 ===
function loadMenu1Widgets() {
    const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
    if (!kinfopaneltousContent) return;
    
    // Vider le conteneur
    kinfopaneltousContent.innerHTML = '';
    
    // Créer le conteneur du ticker tape
    const tickerContainer = document.createElement('div');
    tickerContainer.id = 'ticker-container-1';
    tickerContainer.className = 'ticker-container';
    
    // Créer l'élément tv-ticker-tape avec les symboles requis
    const tickerTape = document.createElement('tv-ticker-tape');
    tickerTape.setAttribute('symbols', 'FOREXCOM:SPXUSD,FX:EURUSD,CMCMARKETS:GOLD,OANDA:NZDUSD,OANDA:GBPUSD,FX_IDC:JPYUSD,FX_IDC:CADUSD,OANDA:AUDUSD');
    tickerTape.setAttribute('direction', 'vertical');
    tickerTape.setAttribute('theme', 'dark');
    
    // Assembler et insérer
    tickerContainer.appendChild(tickerTape);
    kinfopaneltousContent.appendChild(tickerContainer);
    
    // Supprimer l'ancien intervalle (plus nécessaire)
    if (menu1WidgetsInterval) {
        clearInterval(menu1WidgetsInterval);
        menu1WidgetsInterval = null;
    }
}

function loadSP500Widget() {
    const topWidget = document.getElementById('topWidget');
    if (!topWidget) return;
    
    topWidget.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.tradingview.com/embed-widget/single-quote/?locale=fr&symbol=Vantage:SP500&width=250&height=90&colorTheme=dark&isTransparent=true`;
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.allowtransparency = 'true';
    iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        display: block;
        border-radius: 15px 15px 0 0;
        transform: scale(0.8);
        transform-origin: top left;
        width: 125%;
        height: 125%;
    `;
    topWidget.appendChild(iframe);
}

function loadRandomBottomWidgets() {
    const forexSymbols = [
        { id: 'eurusd', symbol: 'FX_IDC:EURUSD', name: 'EUR/USD' },
        { id: 'gbpusd', symbol: 'FX_IDC:GBPUSD', name: 'GBP/USD' },
        { id: 'nzdusd', symbol: 'FX_IDC:NZDUSD', name: 'NZD/USD' },
        { id: 'audusd', symbol: 'FX_IDC:AUDUSD', name: 'AUD/USD' },
        { id: 'jpyusd', symbol: 'FX_IDC:JPYUSD', name: 'JPY/USD' }
    ];
    
    const stockCryptoSymbols = [
        { id: 'apple', symbol: 'NASDAQ:AAPL', name: 'Apple' },
        { id: 'tesla', symbol: 'NASDAQ:TSLA', name: 'Tesla' },
        { id: 'bitcoin', symbol: 'BITSTAMP:BTCUSD', name: 'Bitcoin' },
        { id: 'gold', symbol: 'OANDA:XAUUSD', name: 'XAUUSD' },
        { id: 'nasdaq', symbol: 'NYSE:GME', name: 'NASDAQ' }
    ];
    
    const randomForex = forexSymbols[Math.floor(Math.random() * forexSymbols.length)];
    const randomStockCrypto = stockCryptoSymbols[Math.floor(Math.random() * stockCryptoSymbols.length)];
    
    currentBottomLeftWidget = randomForex.id;
    currentBottomRightWidget = randomStockCrypto.id;
    
    // Widget gauche (FOREX)
    const bottomLeftWidget = document.getElementById('bottomLeftWidget');
    if (bottomLeftWidget) {
        bottomLeftWidget.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.tradingview.com/embed-widget/single-quote/?locale=fr&symbol=${randomForex.symbol}&width=125&height=90&colorTheme=dark&isTransparent=true`;
        iframe.frameBorder = '0';
        iframe.scrolling = 'no';
        iframe.allowtransparency = 'true';
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            display: block;
            border-radius: 0 0 0 15px;
            transform: scale(0.8);
            transform-origin: top left;
            width: 125%;
            height: 125%;
        `;
        bottomLeftWidget.appendChild(iframe);
    }
    
    // Widget droit (Action/Crypto)
    const bottomRightWidget = document.getElementById('bottomRightWidget');
    if (bottomRightWidget) {
        bottomRightWidget.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.tradingview.com/embed-widget/single-quote/?locale=fr&symbol=${randomStockCrypto.symbol}&width=125&height=90&colorTheme=dark&isTransparent=true`;
        iframe.frameBorder = '0';
        iframe.scrolling = 'no';
        iframe.allowtransparency = 'true';
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            display: block;
            border-radius: 0 0 15px 0;
            transform: scale(0.8);
            transform-origin: top left;
            width: 125%;
            height: 125%;
        `;
        bottomRightWidget.appendChild(iframe);
    }
}

// ============================================
// GESTION DES MENUS ET PANELINFO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Cette fonction s'assure que le panelinfo affiche le bon contenu pour chaque menu
    function updateMenuPanelInfo() {
        const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
        const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
        
        if (!kinfopaneltousContainer || !kinfopaneltousContent) return;
        
        // Activer le conteneur
        kinfopaneltousContainer.classList.add('active');
        
        // Vérifier si on est en selected view avec menu-2 (géré par le bloc 1)
        if (window.isInSelectedView && window.currentMenuPage === 'menu-2') {
            return; // Les news sont gérées par le bloc 1
        }
        
        // Gérer les autres menus
        switch(window.currentMenuPage) {
            case 'menu-1':
                loadMenu1Widgets();
                break;
                
            case 'menu-3':
                kinfopaneltousContent.innerHTML = '<div class="info-message">Menu 3 - Contenu à définir</div>';
                break;
                
            case 'menu-4':
                window.getMoneyManagementData();
                window.showResultPanel();
                break;
                
            case 'menu-5':
                kinfopaneltousContent.innerHTML = '<div class="info-message">Menu 5 - Contenu à définir</div>';
                break;
                
            default:
                kinfopaneltousContainer.classList.remove('active');
                break;
        }
    }
    
    
    const megaBox = document.getElementById('megaBox');
    if (megaBox) {
        const observerMenuChange = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                  
                    const classes = megaBox.classList;
                    if (classes.contains('menu-1')) window.currentMenuPage = 'menu-1';
                    else if (classes.contains('menu-2')) window.currentMenuPage = 'menu-2';
                    else if (classes.contains('menu-3')) window.currentMenuPage = 'menu-3';
                    else if (classes.contains('menu-4')) window.currentMenuPage = 'menu-4';
                    else if (classes.contains('menu-5')) window.currentMenuPage = 'menu-5';
                    
                    // Mettre à jour le panelinfo
                    updateMenuPanelInfo();
                }
            });
        });
        
        observerMenuChange.observe(megaBox, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
    
    // Initialiser
    setTimeout(() => {
        updateMenuPanelInfo();
    }, 300);
});

// Polling pour menu-4
setInterval(() => {
  if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
    if (window.getMoneyManagementData && window.showResultPanel) {
      window.getMoneyManagementData();
      window.showResultPanel();
    }
  }
}, 300);

window.addEventListener('load', function() {
  setTimeout(() => {
    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
      if (window.getMoneyManagementData && window.showResultPanel) {
        window.getMoneyManagementData();
        window.showResultPanel();
      }
    }
  }, 300);
});

