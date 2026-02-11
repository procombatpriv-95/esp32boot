// ============================================
// FONCTIONS ET VARIABLES SPÉCIFIQUES AUX MENUS
// ============================================

// Ces variables sont déjà définies dans le bloc 1, mais nous les répétons ici pour le bon fonctionnement
let menu1WidgetsInterval = null;
let currentBottomLeftWidget = 'eurusd';
let currentBottomRightWidget = 'apple';

// === WIDGETS MENU-1 ===
function loadMenu1Widgets() {
    const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
    if (!kinfopaneltousContent) return;
    
    kinfopaneltousContent.innerHTML = '';
    
    // Créer un conteneur principal pour le ticker tape vertical
    const tickerContainer = document.createElement('div');
    tickerContainer.className = 'ticker-container';
    tickerContainer.id = 'ticker-container-1';
    tickerContainer.style.cssText = `
        width: 250px;
        height: 240px;
        border-radius: 30px;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        margin: 20px auto;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.3);
    `;
    
    // Créer l'élément tv-ticker-tape avec les attributs
    const tickerTape = document.createElement('tv-ticker-tape');
    tickerTape.setAttribute('symbols', 'FOREXCOM:SPXUSD,FX:EURUSD,CMCMARKETS:GOLD,OANDA:NZDUSD,OANDA:GBPUSD,FX_IDC:JPYUSD,FX_IDC:CADUSD,OANDA:AUDUSD');
    tickerTape.setAttribute('direction', 'vertical');
    tickerTape.setAttribute('theme', 'dark');
    tickerTape.style.cssText = 'width: 100% !important; height: 120% !important; display: block;';
    
    tickerContainer.appendChild(tickerTape);
    kinfopaneltousContent.appendChild(tickerContainer);
    
    // S'assurer que le conteneur principal est positionné correctement
    kinfopaneltousContent.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    // Charger le script de tradingview pour le ticker tape s'il n'est pas déjà chargé
    if (!document.querySelector('script[src*="tv-ticker-tape.js"]')) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';
        script.async = true;
        document.head.appendChild(script);
    }
    
    // Arrêter l'intervalle des anciens widgets s'il existe
    if (menu1WidgetsInterval) {
        clearInterval(menu1WidgetsInterval);
        menu1WidgetsInterval = null;
    }
}

// ============================================
// FONCTIONS FINANCIÈRES (déjà dans bloc 1 mais répétées pour dépendances)
// ============================================

function calculateSavings() {
  try {
    const transactions = JSON.parse(localStorage.getItem('moneyManagerTransactions') || '[]');
    const savings = { saving1: 0, saving2: 0, saving3: 0 };
    
    transactions.forEach(t => {
      if (t.saving === 'saving1') {
        if (t.type === 'income') savings.saving1 += t.amount;
        else if (t.type === 'expense') savings.saving1 -= t.amount;
      } else if (t.saving === 'saving2') {
        if (t.type === 'income') savings.saving2 += t.amount;
        else if (t.type === 'expense') savings.saving2 -= t.amount;
      } else if (t.saving === 'saving3') {
        if (t.type === 'income') savings.saving3 += t.amount;
        else if (t.type === 'expense') savings.saving3 -= t.amount;
      }
    });
    
    return savings;
  } catch (e) {
    console.error('Erreur calcul savings:', e);
    return { saving1: 0, saving2: 0, saving3: 0 };
  }
}

function transferSaving(savingType) {
  try {
    const transactions = JSON.parse(localStorage.getItem('moneyManagerTransactions') || '[]');
    const savings = calculateSavings();
    const amount = savings[savingType];
    
    if (amount <= 0) {
      alert('Cannot transfer zero or negative saving amount.');
      return;
    }
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const newId = Date.now();
    
    const normalTransaction = {
      id: newId,
      amount: amount,
      category: 'Saving Release',
      description: `Transfer from ${savingType}`,
      date: dateStr,
      type: 'income',
      saving: 'normal',
      timestamp: now.getTime()
    };
    
    const savingTransaction = {
      id: newId + 1,
      amount: amount,
      category: 'Saving Release',
      description: `Transfer to normal from ${savingType}`,
      date: dateStr,
      type: 'expense',
      saving: savingType,
      timestamp: now.getTime() + 1
    };
    
    transactions.push(normalTransaction, savingTransaction);
    localStorage.setItem('moneyManagerTransactions', JSON.stringify(transactions));
    
    setTimeout(() => {
      if (window.getMoneyManagementData && window.showResultPanel) {
        window.getMoneyManagementData();
        window.showResultPanel();
      }
    }, 100);
    
    window.dispatchEvent(new Event('storage'));
    
  } catch (e) {
    console.error('Erreur transfer saving:', e);
    alert('Error transferring saving: ' + e.message);
  }
}

function getMoneyManagementData(period = null) {
  try {
    if (!window.resultPanelData) {
      window.resultPanelData = {
        currentPeriod: 'monthly',
        monthlyGoal: 0,
        yearlyGoal: 0,
        monthlyIncome: 0,
        yearlyIncome: 0,
        monthlyExpenses: 0,
        yearlyExpenses: 0,
        monthlyTransactions: [],
        yearlyTransactions: [],
        highestTransaction: { amount: 0, category: '' },
        lowestTransaction: { amount: 0, category: '' },
        savings: { saving1: 0, saving2: 0, saving3: 0 }
      };
    }
    
    const currentPeriod = period || window.resultPanelData.currentPeriod;
    const transactions = JSON.parse(localStorage.getItem('moneyManagerTransactions') || '[]');
    const monthlyGoals = JSON.parse(localStorage.getItem('moneyManagerGoals') || '{}');
    const yearlyGoal = parseFloat(localStorage.getItem('moneyManagerYearlyGoal') || '0');
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthKey = `${currentYear}-${currentMonth}`;
    
    const monthlyGoal = monthlyGoals[monthKey] || 0;
    
    const monthlyNormalTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === currentYear && 
             tDate.getMonth() + 1 === parseInt(currentMonth) &&
             t.saving === 'normal';
    });
    
    const yearlyNormalTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === currentYear &&
             t.saving === 'normal';
    });
    
    const monthlyIncome = monthlyNormalTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const yearlyIncome = yearlyNormalTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = monthlyNormalTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const yearlyExpenses = yearlyNormalTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    let monthlyHighest = { amount: 0, category: '' };
    let monthlyLowest = { amount: 0, category: '' };
    let yearlyHighest = { amount: 0, category: '' };
    let yearlyLowest = { amount: 0, category: '' };
    
    if (monthlyNormalTransactions.length > 0) {
      const monthlyIncomes = monthlyNormalTransactions.filter(t => t.type === 'income');
      const monthlyExpensesList = monthlyNormalTransactions.filter(t => t.type === 'expense');
      
      if (monthlyIncomes.length > 0) {
        monthlyHighest = monthlyIncomes.reduce((max, t) => 
          t.amount > max.amount ? t : max
        );
      }
      
      if (monthlyExpensesList.length > 0) {
        monthlyLowest = monthlyExpensesList.reduce((min, t) => 
          t.amount < min.amount ? t : min
        );
      }
    }
    
    if (yearlyNormalTransactions.length > 0) {
      const yearlyIncomes = yearlyNormalTransactions.filter(t => t.type === 'income');
      const yearlyExpensesList = yearlyNormalTransactions.filter(t => t.type === 'expense');
      
      if (yearlyIncomes.length > 0) {
        yearlyHighest = yearlyIncomes.reduce((max, t) => 
          t.amount > max.amount ? t : max
        );
      }
      
      if (yearlyExpensesList.length > 0) {
        yearlyLowest = yearlyExpensesList.reduce((min, t) => 
          t.amount < min.amount ? t : min
        );
      }
    }
    
    const savings = calculateSavings();
    
    window.resultPanelData.monthlyGoal = monthlyGoal;
    window.resultPanelData.yearlyGoal = yearlyGoal;
    window.resultPanelData.monthlyIncome = monthlyIncome;
    window.resultPanelData.yearlyIncome = yearlyIncome;
    window.resultPanelData.monthlyExpenses = monthlyExpenses;
    window.resultPanelData.yearlyExpenses = yearlyExpenses;
    window.resultPanelData.monthlyTransactions = monthlyNormalTransactions;
    window.resultPanelData.yearlyTransactions = yearlyNormalTransactions;
    window.resultPanelData.highestTransaction = currentPeriod === 'monthly' ? monthlyHighest : yearlyHighest;
    window.resultPanelData.lowestTransaction = currentPeriod === 'monthly' ? monthlyLowest : yearlyLowest;
    window.resultPanelData.savings = savings;
    window.resultPanelData.currentPeriod = currentPeriod;
    
    return window.resultPanelData;
    
  } catch (e) {
    console.error('Erreur lors de la récupération des données:', e);
    return window.resultPanelData || {};
  }
}

function showResultPanel() {
  const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
  if (!kinfopaneltousContent) return;
  
  kinfopaneltousContent.innerHTML = '';
  
  const resultPanel = document.createElement('div');
  resultPanel.className = 'result-panel';
  
  const data = getMoneyManagementData();
  
  const currentGoal = window.resultPanelData.currentPeriod === 'monthly' 
    ? window.resultPanelData.monthlyGoal 
    : window.resultPanelData.yearlyGoal;

  const currentIncome = window.resultPanelData.currentPeriod === 'monthly'
    ? window.resultPanelData.monthlyIncome
    : window.resultPanelData.yearlyIncome;

  const currentExpenses = window.resultPanelData.currentPeriod === 'monthly'
    ? (window.resultPanelData.monthlyExpenses || 0)
    : (window.resultPanelData.yearlyExpenses || 0);

  const currentBalance = Math.max(0, currentIncome - currentExpenses);
  
  const percentage = currentGoal > 0 
    ? Math.min((currentBalance / currentGoal) * 100, 100) 
    : 0;
  
  const isGoalReached = percentage >= 100;
  const showAmountOnBar = percentage > 10;
  const progressFilledClass = percentage === 0 ? 'progress-filled empty' : 'progress-filled';
  const progressFilledStyle = percentage === 0 
    ? 'width: 0%; min-width: 0; padding-right: 0;' 
    : `width: ${percentage}%`;
  
  const savings = window.resultPanelData.savings || { saving1: 0, saving2: 0, saving3: 0 };
  
  resultPanel.innerHTML = `
    <div class="period-selector">
      <button class="period-btn ${window.resultPanelData.currentPeriod === 'monthly' ? 'active' : ''}" 
              data-period="monthly">Monthly</button>
      <button class="period-btn ${window.resultPanelData.currentPeriod === 'yearly' ? 'active' : ''}" 
              data-period="yearly">Yearly</button>
    </div>
    
    <div class="progress-section">
      <div class="progress-header">
        <span class="period-label">${window.resultPanelData.currentPeriod === 'monthly' ? 'Monthly' : 'Yearly'}</span>
        <span class="percentage-label">${percentage.toFixed(1)}%</span>
      </div>
      
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="${progressFilledClass}" style="${progressFilledStyle}">
            ${showAmountOnBar ? `£${currentBalance.toFixed(0)}` : ''}
          </div>
          ${!isGoalReached ? `
            <div class="progress-remaining">
              ${percentage < 90 ? `£${Math.max(0, currentGoal - currentBalance).toFixed(0)}` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
    
    <div class="indicators-container">
      <div class="indicator-box indicator-highest">
        <div class="indicator-label">
          <i class="fas fa-arrow-up"></i> Highest
        </div>
        <div class="indicator-value">
          £${window.resultPanelData.highestTransaction.amount.toFixed(2)}
          ${window.resultPanelData.highestTransaction.category ? `<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;">${window.resultPanelData.highestTransaction.category}</div>` : ''}
        </div>
      </div>
      <div class="indicator-box indicator-lowest">
        <div class="indicator-label">
          <i class="fas fa-arrow-down"></i> Lowest
        </div>
        <div class="indicator-value">
          £${window.resultPanelData.lowestTransaction.amount.toFixed(2)}
          ${window.resultPanelData.lowestTransaction.category ? `<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;">${window.resultPanelData.lowestTransaction.category}</div>` : ''}
        </div>
      </div>
    </div>
    
    <div class="savings-container">
      <div class="saving-item">
        <span class="saving-label">Saving 1:</span>
        <span class="saving-amount">£${savings.saving1.toFixed(2)}</span>
        <button class="saving-add-btn" data-saving="saving1" ${savings.saving1 <= 0 ? 'disabled' : ''}>Add</button>
      </div>
      <div class="saving-item">
        <span class="saving-label">Saving 2:</span>
        <span class="saving-amount">£${savings.saving2.toFixed(2)}</span>
        <button class="saving-add-btn" data-saving="saving2" ${savings.saving2 <= 0 ? 'disabled' : ''}>Add</button>
      </div>
      <div class="saving-item">
        <span class="saving-label">Saving 3:</span>
        <span class="saving-amount">£${savings.saving3.toFixed(2)}</span>
        <button class="saving-add-btn" data-saving="saving3" ${savings.saving3 <= 0 ? 'disabled' : ''}>Add</button>
      </div>
    </div>
  `;
  
  kinfopaneltousContent.appendChild(resultPanel);
  
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(faLink);
  }
  
  const periodBtns = resultPanel.querySelectorAll('.period-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const period = this.getAttribute('data-period');
      window.resultPanelData.currentPeriod = period;
      getMoneyManagementData(period);
      showResultPanel();
    });
  });
  
  const savingBtns = resultPanel.querySelectorAll('.saving-add-btn');
  savingBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const savingType = this.getAttribute('data-saving');
      transferSaving(savingType);
    });
  });
}

// ============================================
// GESTION DU LOCALSTORAGE POUR MENU-4
// ============================================

const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, arguments);
  
  if (key && key.includes('moneyManager')) {
    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
      setTimeout(() => {
        getMoneyManagementData();
        showResultPanel();
      }, 100);
    }
  }
};

const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = function(key) {
  originalRemoveItem.apply(this, arguments);
  
  if (key && key.includes('moneyManager')) {
    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
      setTimeout(() => {
        getMoneyManagementData();
        showResultPanel();
      }, 100);
    }
  }
};

// ============================================
// GESTION DES MENUS ET PANELINFO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les variables globales si elles n'existent pas
    window.isInSelectedView = window.isInSelectedView || false;
    window.currentMenuPage = window.currentMenuPage || 'menu-1';
    window.resultPanelData = window.resultPanelData || {
      currentPeriod: 'monthly',
      monthlyGoal: 0,
      yearlyGoal: 0,
      monthlyIncome: 0,
      yearlyIncome: 0,
      monthlyExpenses: 0,
      yearlyExpenses: 0,
      monthlyTransactions: [],
      yearlyTransactions: [],
      highestTransaction: { amount: 0, category: '' },
      lowestTransaction: { amount: 0, category: '' },
      savings: { saving1: 0, saving2: 0, saving3: 0 }
    };
    
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
                kinfopaneltousContent.innerHTML = '<div class="info-message" style="color: #ccc; text-align: center; padding: 20px; font-size: 16px; display: flex; align-items: center; justify-content: center; height: 100%;">Menu 3 - Contenu à définir</div>';
                break;
                
            case 'menu-4':
                getMoneyManagementData();
                showResultPanel();
                break;
                
            case 'menu-5':
                kinfopaneltousContent.innerHTML = '<div class="info-message" style="color: #ccc; text-align: center; padding: 20px; font-size: 16px; display: flex; align-items: center; justify-content: center; height: 100%;">Menu 5 - Contenu à définir</div>';
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
                    const oldMenu = window.currentMenuPage;
                    
                    // Mettre à jour la page courante
                    const classes = megaBox.classList;
                    if (classes.contains('menu-1')) window.currentMenuPage = 'menu-1';
                    else if (classes.contains('menu-2')) window.currentMenuPage = 'menu-2';
                    else if (classes.contains('menu-3')) window.currentMenuPage = 'menu-3';
                    else if (classes.contains('menu-4')) window.currentMenuPage = 'menu-4';
                    else if (classes.contains('menu-5')) window.currentMenuPage = 'menu-5';
                    
                    // Si on passe au menu-4 et qu'on n'est pas en selected view
                    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
                        setTimeout(() => {
                            getMoneyManagementData();
                            showResultPanel();
                        }, 100);
                    }
                    
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

// ============================================
// POLLING POUR MENU-4
// ============================================

setInterval(() => {
  if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
    getMoneyManagementData();
    showResultPanel();
  }
}, 300);

window.addEventListener('load', function() {
  setTimeout(() => {
    updateMenuPanelInfo();
  }, 300);
});

// Variables globales
window.getMoneyManagementData = getMoneyManagementData;
window.showResultPanel = showResultPanel;
window.calculateSavings = calculateSavings;
window.transferSaving = transferSaving;
