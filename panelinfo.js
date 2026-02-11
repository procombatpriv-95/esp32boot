// ============================================
// FONCTIONS ET VARIABLES SPÉCIFIQUES AUX MENUS
// ============================================

// Variables globales pour la gestion des menus
window.currentMenuPage = null;
window.isInSelectedView = false;
window.menu1WidgetsInterval = null; // Gardé pour compatibilité, non utilisé

// === WIDGETS MENU-1 (NOUVELLE VERSION AVEC TICKER TAPE) ===
function loadMenu1Widgets() {
    const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
    if (!kinfopaneltousContent) return;
    
    // Vider le conteneur
    kinfopaneltousContent.innerHTML = '';
    
    // Centrer le widget verticalement/horizontalement
    kinfopaneltousContent.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    // Créer le conteneur du ticker
    const tickerContainer = document.createElement('div');
    tickerContainer.id = 'ticker-container-1';
    tickerContainer.className = 'ticker-container';
    
    // Créer l'élément tv-ticker-tape avec les symboles demandés
    const tickerTape = document.createElement('tv-ticker-tape');
    tickerTape.setAttribute('symbols', 'FOREXCOM:SPXUSD,FX:EURUSD,CMCMARKETS:GOLD,OANDA:NZDUSD,OANDA:GBPUSD,FX_IDC:JPYUSD,FX_IDC:CADUSD,OANDA:AUDUSD');
    tickerTape.setAttribute('direction', 'vertical');
    tickerTape.setAttribute('theme', 'dark');
    
    tickerContainer.appendChild(tickerTape);
    kinfopaneltousContent.appendChild(tickerContainer);
    
    // Charger le script TradingView si ce n'est pas déjà fait
    if (!document.querySelector('script[src*="tv-ticker-tape.js"]')) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';
        document.head.appendChild(script);
    }
    
    // Nettoyer l'ancien intervalle s'il existe (plus nécessaire)
    if (window.menu1WidgetsInterval) {
        clearInterval(window.menu1WidgetsInterval);
        window.menu1WidgetsInterval = null;
    }
}

// Anciennes fonctions supprimées : loadSP500Widget, loadRandomBottomWidgets
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
    
    // Observer les changements de menu
    const megaBox = document.getElementById('megaBox');
    if (megaBox) {
        const observerMenuChange = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    // Mettre à jour la page courante
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

// ============================================
// FONCTIONS POUR LE MENU 4 (RÉSULTATS / MONEY MANAGEMENT)
// ============================================

window.getMoneyManagementData = function() {
    // Simule la récupération des données de gestion financière
    const data = {
        daily: { used: 450, total: 1000, highest: 120, lowest: 15 },
        weekly: { used: 2800, total: 7000, highest: 750, lowest: 80 },
        monthly: { used: 11500, total: 30000, highest: 2300, lowest: 200 },
        yearly: { used: 145000, total: 365000, highest: 28000, lowest: 500 }
    };
    window.moneyManagementData = data;
    return data;
};

window.showResultPanel = function(period = 'daily') {
    const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
    if (!kinfopaneltousContent) return;
    
    const data = window.moneyManagementData || window.getMoneyManagementData();
    const periodData = data[period];
    
    const percentage = ((periodData.used / periodData.total) * 100).toFixed(1);
    const remaining = periodData.total - periodData.used;
    
    const periodNames = {
        daily: 'Jour',
        weekly: 'Semaine',
        monthly: 'Mois',
        yearly: 'Année'
    };
    
    const html = `
        <div class="result-panel">
            <div class="period-selector">
                <button class="period-btn ${period === 'daily' ? 'active' : ''}" data-period="daily">Jour</button>
                <button class="period-btn ${period === 'weekly' ? 'active' : ''}" data-period="weekly">Semaine</button>
                <button class="period-btn ${period === 'monthly' ? 'active' : ''}" data-period="monthly">Mois</button>
                <button class="period-btn ${period === 'yearly' ? 'active' : ''}" data-period="yearly">Année</button>
            </div>
            
            <div class="progress-section">
                <div class="progress-header">
                    <span class="period-label">${periodNames[period]}</span>
                    <span class="percentage-label">${percentage}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-filled" style="width: ${percentage}%;">${periodData.used}€</div>
                        <div class="progress-remaining">${remaining}€</div>
                    </div>
                </div>
            </div>
            
            <div class="indicators-container">
                <div class="indicator-box indicator-highest">
                    <div class="indicator-label">
                        <i class="fas fa-arrow-up"></i> Plus haut
                    </div>
                    <div class="indicator-value">${periodData.highest}€</div>
                </div>
                <div class="indicator-box indicator-lowest">
                    <div class="indicator-label">
                        <i class="fas fa-arrow-down"></i> Plus bas
                    </div>
                    <div class="indicator-value">${periodData.lowest}€</div>
                </div>
            </div>
            
            <div class="savings-container">
                <div class="saving-item">
                    <span class="saving-label">Économies réalisées</span>
                    <span class="saving-amount" id="savingsAmount">0€</span>
                    <button class="saving-add-btn" id="addSavingsBtn">+ Ajouter</button>
                </div>
            </div>
        </div>
    `;
    
    kinfopaneltousContent.innerHTML = html;
    
    // Ajouter les événements aux boutons de période
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const period = this.dataset.period;
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            window.showResultPanel(period);
        });
    });
    
    // Initialiser le compteur d'économies
    let savings = 0;
    const savingsAmount = document.getElementById('savingsAmount');
    const addBtn = document.getElementById('addSavingsBtn');
    
    if (addBtn) {
        addBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            savings += 10;
            if (savingsAmount) savingsAmount.textContent = savings + '€';
            if (savings >= 50) this.disabled = true;
        });
    }
};

window.addToSavings = function(amount = 10) {
    // Fonction utilitaire pour ajouter des économies depuis d'autres parties
    const savingsAmount = document.getElementById('savingsAmount');
    if (savingsAmount) {
        let current = parseInt(savingsAmount.textContent) || 0;
        current += amount;
        savingsAmount.textContent = current + '€';
        if (current >= 50) {
            const addBtn = document.getElementById('addSavingsBtn');
            if (addBtn) addBtn.disabled = true;
        }
    }
};

// ============================================
// FONCTIONS ANNEXES (STATUT FAHIM, ETC.)
// ============================================


