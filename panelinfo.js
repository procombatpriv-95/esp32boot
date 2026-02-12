// ============================================
// FONCTIONS ET VARIABLES SPÉCIFIQUES AUX MENUS
// ============================================

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
