// ============================================
// VARIABLES GLOBALES GESTION FINANCIÈRE
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

let lastTransactionHash = '';
let lastGoalHash = '';
let lastSavingsHash = '';
let autoUpdateInterval = null;
let menu1WidgetsInterval = null;
let currentBottomLeftWidget = 'eurusd';
let currentBottomRightWidget = 'apple';
let currentMenuPage = 'menu-1';
let currentKinfopaneltousWidget = null;

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
    
    return resultPanelData;
    
  } catch (e) {
    console.error('Erreur lors de la récupération des données:', e);
    return resultPanelData;
  }
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
// WIDGETS MENU-1 - TICKER TAPE VERSION
// ============================================

function loadMenu1Widgets() {
  const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
  if (!kinfopaneltousContent) return;
  
  kinfopaneltousContent.innerHTML = '';
  
  // Créer un conteneur principal pour le widget ticker tape
  const widgetsContainer = document.createElement('div');
  widgetsContainer.id = 'menu1WidgetsContainer';
  widgetsContainer.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: transparent;
    z-index: 1;
  `;
  
  // Créer le conteneur du ticker tape
  const tickerContainer = document.createElement('div');
  tickerContainer.id = 'ticker-container-1';
  tickerContainer.className = 'ticker-container';
  tickerContainer.style.cssText = `
    width: 250px;
    height: 240px;
    border-radius: 30px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    background: rgba(0, 0, 0, 0.3);
  `;
  
  // Créer l'élément tv-ticker-tape
  const tickerTape = document.createElement('tv-ticker-tape');
  tickerTape.setAttribute('symbols', 'FOREXCOM:SPXUSD,FX:EURUSD,CMCMARKETS:GOLD,OANDA:NZDUSD,OANDA:GBPUSD,FX_IDC:JPYUSD,FX_IDC:CADUSD,OANDA:AUDUSD');
  tickerTape.setAttribute('direction', 'vertical');
  tickerTape.setAttribute('theme', 'dark');
  
  tickerContainer.appendChild(tickerTape);
  widgetsContainer.appendChild(tickerContainer);
  kinfopaneltousContent.appendChild(widgetsContainer);
  
  // Charger le script TradingView s'il n'est pas déjà chargé
  if (!document.querySelector('script[src="https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js"]')) {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';
    script.async = true;
    document.head.appendChild(script);
  }
  
  // S'assurer que le conteneur principal est positionné correctement
  kinfopaneltousContent.style.cssText = `
    position: relative;
    width: 100%;
    height: 100%;
  `;
  
  // Arrêter l'intervalle des anciens widgets s'il existe
  if (menu1WidgetsInterval) {
    clearInterval(menu1WidgetsInterval);
    menu1WidgetsInterval = null;
  }
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
// GESTION DU PANEL INFO
// ============================================

function updatePanelInfo() {
  const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
  const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
  if (!kinfopaneltousContainer || !kinfopaneltousContent) return;
  
  kinfopaneltousContainer.classList.add('active');
  
  // Si on change de menu et qu'on était en selected view, on le quitte
  if (window.wasInSelectedView && currentMenuPage !== 'menu-2') {
      window.isInSelectedView = false;
      window.wasInSelectedView = false;
  }
  
  // Les news ne s'affichent QUE si toutes ces conditions sont remplies
  if (window.isInSelectedView && window.selectedAsset && currentMenuPage === 'menu-2') {
      loadKinfopaneltousNews(window.selectedAsset);
  } else {
      // Sinon, on désactive le selected view
      if (window.isInSelectedView && currentMenuPage !== 'menu-2') {
          window.isInSelectedView = false;
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

function updateCurrentMenuPage() {
  const megaBox = document.getElementById('megaBox');
  if (!megaBox) return;
  
  const classes = megaBox.classList;
  if (classes.contains('menu-1')) currentMenuPage = 'menu-1';
  else if (classes.contains('menu-2')) currentMenuPage = 'menu-2';
  else if (classes.contains('menu-3')) currentMenuPage = 'menu-3';
  else if (classes.contains('menu-4')) currentMenuPage = 'menu-4';
  else if (classes.contains('menu-5')) currentMenuPage = 'menu-5';
}

// ============================================
// SYSTÈME PRINCIPAL DES MENUS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // Éléments DOM
  const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
  const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
  const megaBox = document.getElementById('megaBox');
  
  if (!kinfopaneltousContainer || !kinfopaneltousContent || !megaBox) return;
  
  // Gestion du changement de menu
  const observerMenuChange = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
          if (mutation.attributeName === 'class') {
              const oldMenu = currentMenuPage;
              updateCurrentMenuPage();
              
              if (window.isInSelectedView && oldMenu !== currentMenuPage) {
                  window.isInSelectedView = false;
                  window.wasInSelectedView = false;
                  const selectedView = document.getElementById('selectedView');
                  const carouselScene = document.getElementById('carouselScene');
                  const sideMenu = document.getElementById('sideMenu');
                  const carousel = document.getElementById('mainCarousel');
                  const backBtn = document.getElementById('backBtn');
                  
                  if (selectedView) selectedView.classList.remove('active');
                  if (carouselScene) carouselScene.classList.remove('hidden');
                  if (sideMenu) sideMenu.classList.remove('hidden');
                  if (carousel) carousel.classList.remove('carousel-paused');
                  if (backBtn) backBtn.classList.add('hidden');
              }
              
              updatePanelInfo();
          }
      });
  });
  
  observerMenuChange.observe(megaBox, {
      attributes: true,
      attributeFilter: ['class']
  });
  
  // Initialisation
  updateCurrentMenuPage();
  updatePanelInfo();
  
  // Polling pour les mises à jour financières
  setInterval(() => {
    if (currentMenuPage === 'menu-4' && !window.isInSelectedView) {
      getMoneyManagementData();
      showResultPanel();
    }
  }, 300);
  
  window.addEventListener('load', function() {
    setTimeout(() => {
      if (currentMenuPage === 'menu-4' && !window.isInSelectedView) {
        getMoneyManagementData();
        showResultPanel();
      }
    }, 300);
  });
  
  // Gestion du localStorage pour les transactions financières
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    
    if (key && key.includes('moneyManager')) {
      if (currentMenuPage === 'menu-4' && !window.isInSelectedView) {
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
      if (currentMenuPage === 'menu-4' && !window.isInSelectedView) {
        setTimeout(() => {
          getMoneyManagementData();
          showResultPanel();
        }, 100);
      }
    }
  };
  
  // Variables globales pour communication avec l'autre bloc
  window.updatePanelInfo = updatePanelInfo;
  window.currentMenuPage = currentMenuPage;
  window.getMoneyManagementData = getMoneyManagementData;
  window.showResultPanel = showResultPanel;
  window.calculateSavings = calculateSavings;
  window.transferSaving = transferSaving;
});  
