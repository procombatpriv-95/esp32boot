// ============================================
// VARIABLES GLOBALES
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
  savings: { saving1: 0, saving2: 0, saving3: 0 },
  monthlyIncomes: new Array(12).fill(0), // Pour l'area chart
  selectedNewsView: false, // Nouveau: pour suivre l'état de la vue sélectionnée des news
  currentNews: null // Nouveau: pour stocker la news sélectionnée
};

let lastTransactionHash = '';
let lastGoalHash = '';
let lastSavingsHash = '';
let autoUpdateInterval = null;
let menu4Interval = null;
let selectedNewsState = {
  isActive: false,
  currentNews: null
};

// ============================================
// FONCTIONS FINANCIÈRES
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
    
    // Calcul des revenus mensuels pour l'area chart
    const monthlyIncomes = new Array(12).fill(0);
    const monthlyExpensesArray = new Array(12).fill(0);
    
    yearlyNormalTransactions.forEach(t => {
      const month = new Date(t.date).getMonth();
      if (t.type === 'income') {
        monthlyIncomes[month] += t.amount;
      } else if (t.type === 'expense') {
        monthlyExpensesArray[month] += t.amount;
      }
    });
    
    let monthlyHighest = { amount: 0, category: '' };
    let monthlyLowest = { amount: 0, category: '' };
    let yearlyHighest = { amount: 0, category: '' };
    let yearlyLowest = { amount: 0, category: '' };
    
    if (monthlyNormalTransactions.length > 0) {
      const monthlyIncomesList = monthlyNormalTransactions.filter(t => t.type === 'income');
      const monthlyExpensesList = monthlyNormalTransactions.filter(t => t.type === 'expense');
      
      if (monthlyIncomesList.length > 0) {
        monthlyHighest = monthlyIncomesList.reduce((max, t) => 
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
      const yearlyIncomesList = yearlyNormalTransactions.filter(t => t.type === 'income');
      const yearlyExpensesList = yearlyNormalTransactions.filter(t => t.type === 'expense');
      
      if (yearlyIncomesList.length > 0) {
        yearlyHighest = yearlyIncomesList.reduce((max, t) => 
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
    resultPanelData.monthlyIncomes = monthlyIncomes;
    
    return resultPanelData;
    
  } catch (e) {
    console.error('Erreur lors de la récupération des données:', e);
    return resultPanelData;
  }
}

function drawAreaChart(monthlyIncomes, period) {
  const container = document.getElementById('areaChartContainer');
  if (!container) return;
  
  // Créer le canvas s'il n'existe pas
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'incomeAreaChart';
    canvas.width = 200;
    canvas.height = 200;
    container.innerHTML = '';
    container.appendChild(canvas);
  }
  
  const ctx = canvas.getContext('2d');
  
  // Effacer le canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Données pour le graphique
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const incomeData = monthlyIncomes;
  
  // Trouver les valeurs min et max pour l'échelle
  const minValue = Math.min(...incomeData);
  const maxValue = Math.max(...incomeData);
  const range = maxValue - minValue || 1; // Éviter division par zéro
  
  // Créer un gradient pour l'area chart
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(67, 97, 238, 0.3)');
  gradient.addColorStop(1, 'rgba(67, 97, 238, 0.1)');
  
  // Dessiner l'area chart
  ctx.beginPath();
  ctx.moveTo(10, canvas.height - 10);
  
  incomeData.forEach((value, index) => {
    const x = 10 + (index / (incomeData.length - 1)) * (canvas.width - 20);
    const y = canvas.height - 10 - ((value - minValue) / range) * (canvas.height - 20);
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.lineTo(canvas.width - 10, canvas.height - 10);
  ctx.lineTo(10, canvas.height - 10);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Dessiner la ligne
  ctx.beginPath();
  ctx.strokeStyle = '#4361ee';
  ctx.lineWidth = 2;
  
  incomeData.forEach((value, index) => {
    const x = 10 + (index / (incomeData.length - 1)) * (canvas.width - 20);
    const y = canvas.height - 10 - ((value - minValue) / range) * (canvas.height - 20);
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // Ajouter des points sur la ligne
  incomeData.forEach((value, index) => {
    const x = 10 + (index / (incomeData.length - 1)) * (canvas.width - 20);
    const y = canvas.height - 10 - ((value - minValue) / range) * (canvas.height - 20);
    
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#4361ee';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  
  // Ajouter les labels des mois (tous les 2 mois)
  ctx.fillStyle = '#666';
  ctx.font = '8px Arial';
  ctx.textAlign = 'center';
  
  incomeData.forEach((value, index) => {
    if (index % 2 === 0) { // Tous les 2 mois
      const x = 10 + (index / (incomeData.length - 1)) * (canvas.width - 20);
      ctx.fillText(months[index], x, canvas.height - 2);
    }
  });
  
  // Ajouter le titre
  ctx.fillStyle = '#333';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Évolution des Revenus', canvas.width / 2, 15);
  
  // Ajouter la période
  ctx.font = '8px Arial';
  ctx.fillStyle = '#666';
  ctx.fillText(`Période: ${period === 'monthly' ? 'Mensuelle' : 'Annuelle'}`, canvas.width / 2, 30);
}

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
    
    <!-- Area Chart Container -->
    <div id="areaChartContainer" style="width: 200px; height: 200px; margin: 20px auto; background: rgba(255,255,255,0.1); border-radius: 10px; padding: 10px;"></div>
  `;
  
  kinfopaneltousContent.appendChild(resultPanel);
  
  // Dessiner l'area chart
  setTimeout(() => {
    drawAreaChart(resultPanelData.monthlyIncomes, resultPanelData.currentPeriod);
  }, 100);
  
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(faLink);
  }
  
  // Gestion des boutons de période - MISE À JOUR AUTOMATIQUE
  const periodBtns = resultPanel.querySelectorAll('.period-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const period = this.getAttribute('data-period');
      resultPanelData.currentPeriod = period;
      
      // Mettre à jour immédiatement sans clic supplémentaire
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
// GESTION DU LOCALSTORAGE
// ============================================

const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, arguments);
  
  if (key && key.includes('moneyManager')) {
    // Mettre à jour automatiquement si on est sur le menu-4
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
// SYSTÈME PRINCIPAL
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

    // Variables d'état
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
    let wasInSelectedView = false;
    
    if (!window.appTimezone) {
        window.appTimezone = "Europe/London";
    }

    // Éléments DOM
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

    // === WIDGETS MENU-1 ===
    function loadMenu1Widgets() {
        kinfopaneltousContent.innerHTML = '';
        
        // Créer un conteneur principal pour les widgets
        const widgetsContainer = document.createElement('div');
        widgetsContainer.id = 'menu1WidgetsContainer';
        widgetsContainer.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 250px;
            height: 180px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            overflow: hidden;
            z-index: 1;
        `;
        
        // Créer la structure des 3 widgets
        widgetsContainer.innerHTML = `
            <!-- Widget du haut - SP500 -->
            <div id="topWidget" style="position: absolute; top: 0; left: 0; width: 250px; height: 90px; border-radius: 15px 15px 0 0; overflow: hidden;">
                <!-- SP500 sera chargé ici -->
            </div>
            
            <!-- Widgets du bas -->
            <div style="position: absolute; top: 90px; left: 0; width: 250px; height: 90px;">
                <!-- Widget gauche -->
                <div id="bottomLeftWidget" style="position: absolute; top: 0; left: 0; width: 125px; height: 90px; border-radius: 0 0 0 15px; overflow: hidden;">
                    <!-- FOREX sera chargé ici -->
                </div>
                
                <!-- Widget droit -->
                <div id="bottomRightWidget" style="position: absolute; top: 0; left: 125px; width: 125px; height: 90px; border-radius: 0 0 15px 0; overflow: hidden;">
                    <!-- Action/Crypto sera chargé ici -->
                </div>
            </div>
        `;
        
        kinfopaneltousContent.appendChild(widgetsContainer);
        
        // S'assurer que le conteneur principal est positionné correctement
        kinfopaneltousContent.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
        `;
        
        // Charger les widgets
        loadSP500Widget();
        loadRandomBottomWidgets();
        
        // Démarrer l'intervalle pour changer les widgets du bas
        if (menu1WidgetsInterval) {
            clearInterval(menu1WidgetsInterval);
        }
        
        menu1WidgetsInterval = setInterval(() => {
            loadRandomBottomWidgets();
        }, 180000);
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

    // === ACTUALITÉS SELECTED VIEW - CORRIGÉES ===
    function loadKinfopaneltousNews(asset) {
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

    // === GESTION DU PANEL ===
    function updatePanelInfo() {
        kinfopaneltousContainer.classList.add('active');
        
        // Gestion spéciale pour le menu-2: restaurer la vue sélectionnée si elle était active
        if (currentMenuPage === 'menu-2') {
            // Si on a une vue sélectionnée active, on la restaure
            if (selectedNewsState.isActive && selectedNewsState.currentNews) {
                // Réactiver l'interface de la vue sélectionnée
                isInSelectedView = true;
                carouselScene.classList.add('hidden');
                sideMenu.classList.add('hidden');
                selectedView.classList.add('active');
                backBtn.classList.remove('hidden');
                carousel.classList.add('carousel-paused');
                
                // Recharger les news
                loadKinfopaneltousNews(selectedNewsState.currentNews);
                return;
            } else {
                // Sinon, on montre le carousel normal
                isInSelectedView = false;
                selectedView.classList.remove('active');
                carouselScene.classList.remove('hidden');
                sideMenu.classList.remove('hidden');
                backBtn.classList.add('hidden');
                carousel.classList.remove('carousel-paused');
                kinfopaneltousContent.innerHTML = '';
            }
        }
        
        // Les news ne s'affichent QUE si toutes ces conditions sont remplies
        if (isInSelectedView && selectedAsset && currentMenuPage === 'menu-2') {
            // Sauvegarder l'état de la vue sélectionnée
            selectedNewsState.isActive = true;
            selectedNewsState.currentNews = selectedAsset;
            
            loadKinfopaneltousNews(selectedAsset);
        } else {
            // Si on change de menu et qu'on était en selected view, on garde l'état
            if (isInSelectedView && currentMenuPage !== 'menu-2') {
                // On ne réinitialise pas isInSelectedView, on garde l'état
                // Mais on masque l'interface de la vue sélectionnée
                selectedView.classList.remove('active');
                carouselScene.classList.remove('hidden');
                sideMenu.classList.remove('hidden');
                carousel.classList.remove('carousel-paused');
                backBtn.classList.add('hidden');
            }
            
            if (currentMenuPage === 'menu-1') {
                loadMenu1Widgets();
            } else if (currentMenuPage === 'menu-4') {
                // Mettre à jour automatiquement les données financières
                getMoneyManagementData();
                showResultPanel();
                
                // Démarrer l'intervalle de mise à jour automatique
                if (menu4Interval) clearInterval(menu4Interval);
                menu4Interval = setInterval(() => {
                    if (currentMenuPage === 'menu-4' && !isInSelectedView) {
                        getMoneyManagementData();
                        showResultPanel();
                    }
                }, 30000); // Mise à jour toutes les 30 secondes
            } else {
                kinfopaneltousContent.innerHTML = '';
                if (menu1WidgetsInterval) {
                    clearInterval(menu1WidgetsInterval);
                    menu1WidgetsInterval = null;
                }
                
                // Arrêter l'intervalle du menu-4 si on n'est pas dans le menu-4
                if (menu4Interval) {
                    clearInterval(menu4Interval);
                    menu4Interval = null;
                }
            }
        }
    }

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
        selectedAsset = currentAssets.find(c => c.id === assetId);
        if (!selectedAsset) return;

        isInSelectedView = true;
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
            }, 1500);
        }, 500);
    }

    // === ÉVÉNEMENTS ===
    backBtn.addEventListener('click', function() {
        isInSelectedView = false;
        selectedNewsState.isActive = false;
        selectedNewsState.currentNews = null;
        
        selectedView.classList.remove('active');
        carouselScene.classList.remove('hidden');
        backBtn.classList.add('hidden');
        sideMenu.classList.remove('hidden');
        carousel.classList.remove('carousel-paused');
        updatePanelInfo();
    });

    const observerMenuChange = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                const oldMenu = currentMenuPage;
                updateCurrentMenuPage();
                
                // Si on quitte le menu-2, on garde l'état de la vue sélectionnée
                if (oldMenu === 'menu-2' && currentMenuPage !== 'menu-2') {
                    // On ne réinitialise pas isInSelectedView, on garde l'état
                    // Mais on masque l'interface de la vue sélectionnée
                    selectedView.classList.remove('active');
                    carouselScene.classList.remove('hidden');
                    sideMenu.classList.remove('hidden');
                    carousel.classList.remove('carousel-paused');
                    backBtn.classList.add('hidden');
                }
                
                // Si on revient au menu-2, on restaure l'état si nécessaire
                if (oldMenu !== 'menu-2' && currentMenuPage === 'menu-2') {
                    // La restauration se fera dans updatePanelInfo
                }
                
                updatePanelInfo();
            }
        });
    });
    
    observerMenuChange.observe(megaBox, {
        attributes: true,
        attributeFilter: ['class']
    });

    // DÉMARRAGE
    init();

    window.addEventListener('resize', function() {
        sideMenu.style.top = '50%';
        sideMenu.style.transform = 'translateY(-50%)';
    });
    
    // Variables globales
    window.tvWidgets = tvWidgets;
    window.selectedTVWidget = selectedTVWidget;
    window.isInSelectedView = isInSelectedView;
    window.currentMenuPage = currentMenuPage;
    window.getMoneyManagementData = getMoneyManagementData;
    window.showResultPanel = showResultPanel;
    window.calculateSavings = calculateSavings;
    window.transferSaving = transferSaving;
});

// Polling
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
