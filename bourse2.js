
// ============================================
// VARIABLES GLOBALES POUR LE PANEL RESULTAT
// ============================================

let resultPanelData = {
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

// ============================================
// FONCTIONS POUR CALCULER LES SAVINGS
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
    
    resultPanelData.savings = savings;
    
    return savings;
  } catch (e) {
    console.error('Erreur calcul savings:', e);
    return { saving1: 0, saving2: 0, saving3: 0 };
  }
}

// ============================================
// FONCTION POUR TRANSFÉRER UN SAVING
// ============================================

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
      getMoneyManagementData();
      showResultPanel();
    }, 100);
    
    window.dispatchEvent(new Event('storage'));
    
  } catch (e) {
    console.error('Erreur transfer saving:', e);
    alert('Error transferring saving: ' + e.message);
  }
}

// ============================================
// FONCTIONS POUR LE PANEL RESULTAT (MENU 4)
// ============================================

function getMoneyManagementData(period = null) {
  try {
    const currentPeriod = period || resultPanelData.currentPeriod;
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
    
    resultPanelData.monthlyGoal = monthlyGoal;
    resultPanelData.yearlyGoal = yearlyGoal;
    resultPanelData.monthlyIncome = monthlyIncome;
    resultPanelData.yearlyIncome = yearlyIncome;
    resultPanelData.monthlyExpenses = monthlyExpenses;
    resultPanelData.yearlyExpenses = yearlyExpenses;
    resultPanelData.monthlyTransactions = monthlyNormalTransactions;
    resultPanelData.yearlyTransactions = yearlyNormalTransactions;
    resultPanelData.highestTransaction = currentPeriod === 'monthly' ? monthlyHighest : yearlyHighest;
    resultPanelData.lowestTransaction = currentPeriod === 'monthly' ? monthlyLowest : yearlyLowest;
    resultPanelData.savings = savings;
    
    return {
      monthlyGoal,
      yearlyGoal,
      monthlyIncome,
      yearlyIncome,
      monthlyExpenses,
      yearlyExpenses,
      monthlyTransactions: monthlyNormalTransactions,
      yearlyTransactions: yearlyNormalTransactions,
      highestTransaction: currentPeriod === 'monthly' ? monthlyHighest : yearlyHighest,
      lowestTransaction: currentPeriod === 'monthly' ? monthlyLowest : yearlyLowest,
      savings,
      currentPeriod
    };
    
  } catch (e) {
    console.error('Erreur lors de la récupération des données:', e);
    return resultPanelData;
  }
}

// Afficher le panel résultat
function showResultPanel() {
  const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
  if (!kinfopaneltousContent) return;
  
  kinfopaneltousContent.innerHTML = '';
  
  const resultPanel = document.createElement('div');
  resultPanel.className = 'result-panel';
  
  const data = getMoneyManagementData();
  
  const currentGoal = resultPanelData.currentPeriod === 'monthly' 
    ? resultPanelData.monthlyGoal 
    : resultPanelData.yearlyGoal;

  const currentIncome = resultPanelData.currentPeriod === 'monthly'
    ? resultPanelData.monthlyIncome
    : resultPanelData.yearlyIncome;

  const currentExpenses = resultPanelData.currentPeriod === 'monthly'
    ? (resultPanelData.monthlyExpenses || 0)
    : (resultPanelData.yearlyExpenses || 0);

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
  
  const savings = resultPanelData.savings || { saving1: 0, saving2: 0, saving3: 0 };
  
  resultPanel.innerHTML = `
    <div class="period-selector">
      <button class="period-btn ${resultPanelData.currentPeriod === 'monthly' ? 'active' : ''}" 
              data-period="monthly">Monthly</button>
      <button class="period-btn ${resultPanelData.currentPeriod === 'yearly' ? 'active' : ''}" 
              data-period="yearly">Yearly</button>
    </div>
    
    <div class="progress-section">
      <div class="progress-header">
        <span class="period-label">${resultPanelData.currentPeriod === 'monthly' ? 'Monthly' : 'Yearly'}</span>
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
          £${resultPanelData.highestTransaction.amount.toFixed(2)}
          ${resultPanelData.highestTransaction.category ? `<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;">${resultPanelData.highestTransaction.category}</div>` : ''}
        </div>
      </div>
      <div class="indicator-box indicator-lowest">
        <div class="indicator-label">
          <i class="fas fa-arrow-down"></i> Lowest
        </div>
        <div class="indicator-value">
          £${resultPanelData.lowestTransaction.amount.toFixed(2)}
          ${resultPanelData.lowestTransaction.category ? `<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;">${resultPanelData.lowestTransaction.category}</div>` : ''}
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
      resultPanelData.currentPeriod = period;
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
// SYSTÈME DE SURVEILLANCE EN TEMPS RÉEL
// ============================================

let lastTransactionHash = '';
let lastGoalHash = '';
let lastSavingsHash = '';
let autoUpdateInterval = null;

function calculateTransactionHash() {
  try {
    const transactions = JSON.parse(localStorage.getItem('moneyManagerTransactions') || '[]');
    let hash = transactions.length.toString();
    let totalAmount = 0;
    transactions.forEach(t => {
      totalAmount += t.amount;
      hash += t.id + t.amount + t.type + t.saving;
    });
    return hash + totalAmount.toString();
  } catch (e) {
    return '';
  }
}

function calculateGoalHash() {
  try {
    const monthlyGoals = JSON.parse(localStorage.getItem('moneyManagerGoals') || '{}');
    const yearlyGoal = localStorage.getItem('moneyManagerYearlyGoal') || '0';
    return JSON.stringify(monthlyGoals) + yearlyGoal;
  } catch (e) {
    return '';
  }
}

function calculateSavingsHash() {
  try {
    const savings = calculateSavings();
    return JSON.stringify(savings);
  } catch (e) {
    return '';
  }
}

function checkForUpdates() {
  if (window.currentMenuPage !== 'menu-4' || window.isInSelectedView) {
    return;
  }
  
  const currentTransactionHash = calculateTransactionHash();
  const currentGoalHash = calculateGoalHash();
  const currentSavingsHash = calculateSavingsHash();
  
  if (currentTransactionHash !== lastTransactionHash || 
      currentGoalHash !== lastGoalHash ||
      currentSavingsHash !== lastSavingsHash) {
    
    console.log('Changement détecté, mise à jour du panel...');
    
    lastTransactionHash = currentTransactionHash;
    lastGoalHash = currentGoalHash;
    lastSavingsHash = currentSavingsHash;
    
    getMoneyManagementData();
    showResultPanel();
    
    const panel = document.querySelector('.kinfopaneltous-container');
    if (panel) {
      panel.style.display = 'none';
      panel.offsetHeight;
      panel.style.display = 'flex';
    }
  }
}

function startAutoUpdate() {
  lastTransactionHash = calculateTransactionHash();
  lastGoalHash = calculateGoalHash();
  lastSavingsHash = calculateSavingsHash();
  
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
  }
  
  autoUpdateInterval = setInterval(checkForUpdates, 500);
  console.log('Surveillance automatique démarrée');
}

function stopAutoUpdate() {
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
    autoUpdateInterval = null;
  }
}

// ============================================
// SURCHARGE DU LOCALSTORAGE POUR DÉTECTION IMMÉDIATE
// ============================================

const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, arguments);
  
  if (key && key.includes('moneyManager')) {
    console.log(`Changement détecté dans localStorage: ${key}`);
    
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
    console.log(`Suppression détectée dans localStorage: ${key}`);
    
    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
      setTimeout(() => {
        getMoneyManagementData();
        showResultPanel();
      }, 100);
    }
  }
};

const originalClear = localStorage.clear;
localStorage.clear = function() {
  originalClear.apply(this, arguments);
  
  console.log('localStorage effacé');
  
  if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
    setTimeout(() => {
      getMoneyManagementData();
      showResultPanel();
    }, 100);
  }
};

// ============================================
// ÉVÉNEMENTS GLOBAUX POUR LA MISE À JOUR
// ============================================

window.addEventListener('storage', function(e) {
  if (e.key && e.key.includes('moneyManager')) {
    console.log(`Événement storage détecté: ${e.key}`);
    
    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
      setTimeout(() => {
        getMoneyManagementData();
        showResultPanel();
      }, 100);
    }
  }
});

window.addEventListener('transactionUpdated', function() {
  if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
    setTimeout(() => {
      getMoneyManagementData();
      showResultPanel();
    }, 100);
  }
});

// ============================================
// CONFIGURATION DES ACTIFS ET TRADINGVIEW
// ============================================

document.addEventListener('DOMContentLoaded', function() {
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

    let currentAssetType = 'crypto';
    let currentAssets = assetTypes.crypto;
    let selectedAsset = null;
    let tvWidgets = {};
    let selectedTVWidget = null;
    let chartStates = {};
    let currentKinfopaneltousWidget = null;
    let isInSelectedView = false;
    let currentMenuPage = 'menu-1';
    let menu1WidgetsInterval = null;
    let currentBottomLeftWidget = 'eurusd';
    let currentBottomRightWidget = 'apple';
    let wasInSelectedView = false; // Nouvelle variable pour suivre l'état précédent
    
    if (!window.appTimezone) {
        window.appTimezone = "Europe/London";
    }

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

    // === CHARGER LES WIDGETS DU MENU-1 ===
    function loadMenu1Widgets() {
        kinfopaneltousContent.innerHTML = '';
        
        const widgetsContainer = document.createElement('div');
        widgetsContainer.className = 'menu-1-widgets';
        widgetsContainer.id = 'menu1WidgetsContainer';
        
        widgetsContainer.innerHTML = `
            <div class="menu-1-widgets-container">
                <div class="market-cell top-widget" id="topWidget"></div>
                <div class="bottom-widgets">
                    <div class="market-cell bottom-left-widget" id="bottomLeftWidget"></div>
                    <div class="market-cell bottom-right-widget" id="bottomRightWidget"></div>
                </div>
            </div>
        `;
        
        kinfopaneltousContent.appendChild(widgetsContainer);
        loadSP500Widget();
        loadRandomBottomWidgets();
        
        if (menu1WidgetsInterval) {
            clearInterval(menu1WidgetsInterval);
        }
        
        menu1WidgetsInterval = setInterval(() => {
            loadRandomBottomWidgets();
        }, 30000);
    }

    // === CHARGER LE WIDGET SP500 ===
    function loadSP500Widget() {
        const topWidget = document.getElementById('topWidget');
        if (!topWidget) return;
        
        topWidget.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.tradingview.com/embed-widget/single-quote/?locale=fr&symbol=Vantage:SP500&width=250&height=90&colorTheme=dark&isTransparent=true`;
        iframe.frameBorder = '0';
        iframe.scrolling = 'no';
        iframe.allowtransparency = 'true';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.display = 'block';
        iframe.style.borderRadius = '15px 15px 0 0';
        topWidget.appendChild(iframe);
    }

    // === CHARGER LES WIDGETS DU BAS (ALÉATOIRES) ===
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
            { id: 'ethereum', symbol: 'BITSTAMP:ETHUSD', name: 'Ethereum' },
            { id: 'nasdaq', symbol: 'NASDAQ:IXIC', name: 'NASDAQ' }
        ];
        
        const randomForex = forexSymbols[Math.floor(Math.random() * forexSymbols.length)];
        const randomStockCrypto = stockCryptoSymbols[Math.floor(Math.random() * stockCryptoSymbols.length)];
        
        currentBottomLeftWidget = randomForex.id;
        currentBottomRightWidget = randomStockCrypto.id;
        
        const bottomLeftWidget = document.getElementById('bottomLeftWidget');
        if (bottomLeftWidget) {
            bottomLeftWidget.innerHTML = '';
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.tradingview.com/embed-widget/single-quote/?locale=fr&symbol=${randomForex.symbol}&width=124.5&height=90&colorTheme=dark&isTransparent=true`;
            iframe.frameBorder = '0';
            iframe.scrolling = 'no';
            iframe.allowtransparency = 'true';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.display = 'block';
            iframe.style.borderRadius = '0 0 0 15px';
            bottomLeftWidget.appendChild(iframe);
        }
        
        const bottomRightWidget = document.getElementById('bottomRightWidget');
        if (bottomRightWidget) {
            bottomRightWidget.innerHTML = '';
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.tradingview.com/embed-widget/single-quote/?locale=fr&symbol=${randomStockCrypto.symbol}&width=124.5&height=90&colorTheme=dark&isTransparent=true`;
            iframe.frameBorder = '0';
            iframe.scrolling = 'no';
            iframe.allowtransparency = 'true';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.display = 'block';
            iframe.style.borderRadius = '0 0 15px 0';
            bottomRightWidget.appendChild(iframe);
        }
        
        setTimeout(() => {
            adjustIFrameScale();
        }, 500);
    }

    // === Ajuster le scale des iframes ===
    function adjustIFrameScale() {
        const cells = document.querySelectorAll('.market-cell');
        cells.forEach(cell => {
            const iframe = cell.querySelector('iframe');
            if (iframe) {
                iframe.style.transform = 'scale(0.8)';
                iframe.style.transformOrigin = 'top left';
                iframe.style.width = '125%';
                iframe.style.height = '125%';
            }
        });
    }

    // === CHARGER LES KINFOPANELTOUS POUR LES ACTUALITÉS ===
    function loadKinfopaneltousNews(asset) {
        kinfopaneltousContent.innerHTML = '';
        
        const loaderDiv = document.createElement('div');
        loaderDiv.className = 'kinfopaneltous-loader';
        loaderDiv.textContent = 'Loading...';
        kinfopaneltousContent.appendChild(loaderDiv);
        
        const widgetDiv = document.createElement('div');
        widgetDiv.className = 'tradingview-kinfopaneltous-news';
        widgetDiv.id = 'tradingview_kinfopaneltous_news';
        
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
                "displayMode": "compact",
                "width": "250",
                "height": "600",
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
            currentKinfopaneltousWidget = widgetDiv;
            setTimeout(removeAllTooltips, 1500);
        }, 500);
    }

    // === GESTION DU PANEL INFO EN FONCTION DE L'ÉTAT ===
    function updatePanelInfo() {
        kinfopaneltousContainer.classList.add('active');
        
        // Si on vient de quitter le selected view ET on n'est pas en menu-2
        if (wasInSelectedView && currentMenuPage !== 'menu-2') {
            isInSelectedView = false;
            wasInSelectedView = false;
        }
        
        // Si on est en selected view et on a un asset sélectionné ET on est en menu-2
        if (isInSelectedView && selectedAsset && currentMenuPage === 'menu-2') {
            loadKinfopaneltousNews(selectedAsset);
        } else {
            // Sinon, désactiver le selected view
            if (isInSelectedView && currentMenuPage !== 'menu-2') {
                isInSelectedView = false;
            }
            
            if (currentMenuPage === 'menu-1') {
                loadMenu1Widgets();
            } else if (currentMenuPage === 'menu-4') {
                getMoneyManagementData();
                showResultPanel();
            } else {
                kinfopaneltousContent.innerHTML = '';
                if (menu1WidgetsInterval) {
                    clearInterval(menu1WidgetsInterval);
                    menu1WidgetsInterval = null;
                }
            }
        }
    }

    // === DÉTECTION DE LA PAGE ACTIVE ===
    function updateCurrentMenuPage() {
        const classes = megaBox.classList;
        if (classes.contains('menu-1')) currentMenuPage = 'menu-1';
        else if (classes.contains('menu-2')) currentMenuPage = 'menu-2';
        else if (classes.contains('menu-3')) currentMenuPage = 'menu-3';
        else if (classes.contains('menu-4')) currentMenuPage = 'menu-4';
        else if (classes.contains('menu-5')) currentMenuPage = 'menu-5';
    }

    // === INITIALISATION ===
    function init() {
        const saved = localStorage.getItem('chartStates');
        if (saved) {
            try {
                chartStates = JSON.parse(saved);
            } catch (e) {
                console.error('Erreur lors du chargement des états:', e);
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
        updateCurrentMenuPage();
        updatePanelInfo();
        
        setTimeout(removeAllTooltips, 1000);
        
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
            timezone: window.appTimezone,
            theme: "dark",
            style: "1",
            locale: "fr",
            enable_publishing: false,
            allow_symbol_change: false,
            save_image: false,
            container_id: containerId,
            time_frames: [
                { text: "5min", resolution: "5", description: "5 Minutes", title: "5min" },
                { text: "15min", resolution: "15", description: "15 Minutes", title: "15min" },
                { text: "2h", resolution: "120", description: "2 Hours", title: "2h" },
                { text: "4h", resolution: "240", description: "4 Hours", title: "4h" },
                { text: "1D", resolution: "1D", description: "1 Day", title: "1D" }
            ]
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
                widgetConfig.studies = ["RSI@tv-basicstudies", "VWAP@tv-basicstudies"];
                widgetConfig.studies_overrides = {
                    "volume.volume.color.0": "rgba(0, 0, 0, 0)",
                    "volume.volume.color.1": "rgba(0, 0, 0, 0)",
                    "RSI.rsi.linewidth": 2,
                    "RSI.rsi.period": 14,
                    "RSI.rsi.plottype": "line",
                    "VWAP.vwap.color": "#FF6B00",
                    "VWAP.vwap.linewidth": 2,
                    "VWAP.vwap.period": 50,
                    "VWAP.vwap.plottype": "line",
                    "VWAP.vwap.transparency": 0
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

        isInSelectedView = true;
        wasInSelectedView = true;
        carousel.classList.add('carousel-paused');
        carouselScene.classList.add('hidden');
        sideMenu.classList.add('hidden');
        selectedView.classList.add('active');
        backBtn.classList.remove('hidden');
        loader.classList.remove('hidden');

        updatePanelInfo();

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
    backBtn.addEventListener('click', function() {
        isInSelectedView = false;
        wasInSelectedView = false;
        selectedView.classList.remove('active');
        carouselScene.classList.remove('hidden');
        backBtn.classList.add('hidden');
        sideMenu.classList.remove('hidden');
        carousel.classList.remove('carousel-paused');
        updatePanelInfo();
        removeAllTooltips();
    });

    // === SURVEILLANCE DU CHANGEMENT DE MENU ===
    const observerMenuChange = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                const oldMenu = currentMenuPage;
                updateCurrentMenuPage();
                
                // Si on était en selected view et qu'on change de menu (même si c'est menu-2)
                if (isInSelectedView && oldMenu !== currentMenuPage) {
                    // On quitte le selected view si on change de menu
                    isInSelectedView = false;
                    selectedView.classList.remove('active');
                    carouselScene.classList.remove('hidden');
                    sideMenu.classList.remove('hidden');
                    carousel.classList.remove('carousel-paused');
                    backBtn.classList.add('hidden');
                }
                
                updatePanelInfo();
            }
        });
    });
    
    observerMenuChange.observe(megaBox, {
        attributes: true,
        attributeFilter: ['class']
    });

    init();

    window.addEventListener('resize', function() {
        sideMenu.style.top = '50%';
        sideMenu.style.transform = 'translateY(-50%)';
    });
    
    window.tvWidgets = tvWidgets;
    window.selectedTVWidget = selectedTVWidget;
    window.isInSelectedView = isInSelectedView;
    window.currentMenuPage = currentMenuPage;
    window.getMoneyManagementData = getMoneyManagementData;
    window.showResultPanel = showResultPanel;
    window.calculateSavings = calculateSavings;
    window.transferSaving = transferSaving;
});

// Polling global
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
// GÉOLOCALISATION
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
