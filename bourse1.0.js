// ===== FONCTIONS GÉNÉRALES =====
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

    // Quartier
    let suburb =
      data.address.suburb ||
      data.address.neighbourhood ||
      data.address.quarter ||
      "Quartier inconnu";

    // Borough / District
    let borough =
      data.address.borough ||
      data.address.city_district ||
      "Borough inconnu";

    // Ville
    let city =
      data.address.city ||
      data.address.town ||
      data.address.municipality ||
      data.address.county ||
      "Ville inconnue";

    document.getElementById("output").textContent =
      `Around: ${suburb}, ${borough}, ${city}`;
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
  document.getElementById("output").textContent =
    `Erreur (${err.code}): ${err.message}`;
  
  window.appTimezone = "Europe/London";
}

if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(success, error, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  });
} else {
  document.getElementById("output").textContent =
    "❌ Géolocalisation non supportée par ce navigateur.";
  window.appTimezone = "Europe/London";
}

// ============================================
// VARIABLES GLOBALES POUR LE PANEL RESULTAT
// ============================================

let resultPanelData = {
  currentPeriod: 'monthly',
  monthlyGoal: 0,
  yearlyGoal: 0,
  monthlyIncome: 0,
  yearlyIncome: 0,
  highestTransaction: { amount: 0, category: '' },
  lowestTransaction: { amount: 0, category: '' },
  savings: { saving1: 0, saving2: 0, saving3: 0 },
  isInitialized: false,
  lastUpdateTime: 0,
  updateInProgress: false
};

// ============================================
// FONCTIONS COMMUNICATION ESP32
// ============================================

async function loadMoneyDataFromESP32() {
  try {
    const response = await fetch('/loadMoneyManager');
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur réseau ESP32:', error);
    return null;
  }
}

async function saveMoneyDataToESP32(moneyData) {
  try {
    const response = await fetch('/saveMoneyManager?data=' + 
                               encodeURIComponent(JSON.stringify(moneyData)), {
      method: 'GET'
    });
    
    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Erreur réseau sauvegarde ESP32:', error);
    return { success: false };
  }
}

// ============================================
// FONCTIONS POUR CALCULER LES SAVINGS
// ============================================

function calculateSavings(transactions) {
  try {
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

async function transferSaving(savingType) {
  try {
    if (resultPanelData.updateInProgress) return;
    resultPanelData.updateInProgress = true;
    
    const data = await loadMoneyDataFromESP32();
    if (!data || !data.transactions) {
      alert('Impossible de charger les données depuis l\'ESP32');
      resultPanelData.updateInProgress = false;
      return;
    }
    
    let transactions = data.transactions;
    const savings = calculateSavings(transactions);
    const amount = savings[savingType];
    
    if (amount <= 0) {
      alert('Cannot transfer zero or negative saving amount.');
      resultPanelData.updateInProgress = false;
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
    
    const moneyData = {
      transactions: transactions,
      investments: data.investments || [],
      monthlyGoals: data.monthlyGoals || {},
      yearlyGoal: data.yearlyGoal || 0,
      lastUpdated: new Date().toISOString()
    };
    
    const result = await saveMoneyDataToESP32(moneyData);
    
    if (result && result.success) {
      await getMoneyManagementData();
      updateResultPanelUI();
      
      window.dispatchEvent(new CustomEvent('moneyDataUpdated'));
      
      alert(`✅ £${amount.toFixed(2)} transféré depuis ${savingType}`);
    } else {
      alert('❌ Erreur lors de la sauvegarde sur l\'ESP32');
    }
    
    resultPanelData.updateInProgress = false;
    
  } catch (e) {
    console.error('Erreur transfer saving:', e);
    alert('Error transferring saving: ' + e.message);
    resultPanelData.updateInProgress = false;
  }
}

// ============================================
// FONCTIONS POUR LE PANEL RESULTAT (MENU 4)
// ============================================

async function getMoneyManagementData(period = null) {
  try {
    const currentPeriod = period || resultPanelData.currentPeriod;
    
    const data = await loadMoneyDataFromESP32();
    
    if (!data) {
      return resultPanelData;
    }
    
    const transactions = data.transactions || [];
    const monthlyGoals = data.monthlyGoals || {};
    const yearlyGoal = parseFloat(data.yearlyGoal || '0');
    
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
    
    const savings = calculateSavings(transactions);
    
    resultPanelData.monthlyGoal = monthlyGoal;
    resultPanelData.yearlyGoal = yearlyGoal;
    resultPanelData.monthlyIncome = monthlyIncome;
    resultPanelData.yearlyIncome = yearlyIncome;
    resultPanelData.monthlyExpenses = monthlyExpenses;
    resultPanelData.yearlyExpenses = yearlyExpenses;
    resultPanelData.highestTransaction = currentPeriod === 'monthly' ? monthlyHighest : yearlyHighest;
    resultPanelData.lowestTransaction = currentPeriod === 'monthly' ? monthlyLowest : yearlyLowest;
    resultPanelData.savings = savings;
    resultPanelData.lastUpdateTime = Date.now();
    
    return resultPanelData;
    
  } catch (e) {
    console.error('Erreur lors de la récupération des données:', e);
    return resultPanelData;
  }
}

// Fonction pour mettre à jour l'interface sans recharger tout le panneau
function updateResultPanelUI() {
  const periodLabel = document.querySelector('.period-label');
  const percentageLabel = document.querySelector('.percentage-label');
  const progressFilled = document.querySelector('.progress-filled');
  const progressRemaining = document.querySelector('.progress-remaining');
  const highestAmount = document.querySelector('.indicator-highest .indicator-value');
  const lowestAmount = document.querySelector('.indicator-lowest .indicator-value');
  const saving1Amount = document.querySelector('.saving-item:nth-child(1) .saving-amount');
  const saving2Amount = document.querySelector('.saving-item:nth-child(2) .saving-amount');
  const saving3Amount = document.querySelector('.saving-item:nth-child(3) .saving-amount');
  const saving1Btn = document.querySelector('.saving-item:nth-child(1) .saving-add-btn');
  const saving2Btn = document.querySelector('.saving-item:nth-child(2) .saving-add-btn');
  const saving3Btn = document.querySelector('.saving-item:nth-child(3) .saving-add-btn');
  
  if (!periodLabel || !progressFilled) {
    return;
  }
  
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
  
  periodLabel.textContent = resultPanelData.currentPeriod === 'monthly' ? 'Monthly' : 'Yearly';
  percentageLabel.textContent = percentage.toFixed(1) + '%';
  
  progressFilled.className = percentage === 0 ? 'progress-filled empty' : 'progress-filled';
  progressFilled.style.width = percentage === 0 ? '0%' : percentage + '%';
  progressFilled.textContent = showAmountOnBar ? `£${currentBalance.toFixed(0)}` : '';
  
  if (progressRemaining) {
    progressRemaining.textContent = !isGoalReached && percentage < 90 
      ? `£${Math.max(0, currentGoal - currentBalance).toFixed(0)}` 
      : '';
  }
  
  if (highestAmount) {
    highestAmount.innerHTML = `£${resultPanelData.highestTransaction.amount.toFixed(2)}` +
      (resultPanelData.highestTransaction.category ? 
        `<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;">${resultPanelData.highestTransaction.category}</div>` : '');
  }
  
  if (lowestAmount) {
    lowestAmount.innerHTML = `£${resultPanelData.lowestTransaction.amount.toFixed(2)}` +
      (resultPanelData.lowestTransaction.category ? 
        `<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;">${resultPanelData.lowestTransaction.category}</div>` : '');
  }
  
  const savings = resultPanelData.savings || { saving1: 0, saving2: 0, saving3: 0 };
  
  if (saving1Amount) saving1Amount.textContent = `£${savings.saving1.toFixed(2)}`;
  if (saving2Amount) saving2Amount.textContent = `£${savings.saving2.toFixed(2)}`;
  if (saving3Amount) saving3Amount.textContent = `£${savings.saving3.toFixed(2)}`;
  
  if (saving1Btn) saving1Btn.disabled = savings.saving1 <= 0;
  if (saving2Btn) saving2Btn.disabled = savings.saving2 <= 0;
  if (saving3Btn) saving3Btn.disabled = savings.saving3 <= 0;
}

// Afficher le panel résultat (création initiale)
async function showResultPanel() {
  const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
  if (!kinfopaneltousContent) return;
  
  // Vérifier si le panel existe déjà
  if (document.querySelector('.result-panel')) {
    await getMoneyManagementData();
    updateResultPanelUI();
    return;
  }
  
  // Nettoyer le contenu
  kinfopaneltousContent.innerHTML = '';
  
  // Créer le panel
  const resultPanel = document.createElement('div');
  resultPanel.className = 'result-panel';
  
  // Charger les données
  await getMoneyManagementData();
  
  // Calculer les valeurs
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
  
  const savings = resultPanelData.savings || { saving1: 0, saving2: 0, saving3: 0 };
  
  // Créer le HTML du panel
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
          <div class="${progressFilledClass}" style="width: ${percentage}%">
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
  
  // Ajouter Font Awesome si nécessaire
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(faLink);
  }
  
  // Ajouter les événements aux boutons de période
  const periodBtns = resultPanel.querySelectorAll('.period-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', async function() {
      const period = this.getAttribute('data-period');
      resultPanelData.currentPeriod = period;
      
      periodBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      await getMoneyManagementData(period);
      updateResultPanelUI();
    });
  });
  
  // Ajouter les événements aux boutons de saving
  const savingBtns = resultPanel.querySelectorAll('.saving-add-btn');
  savingBtns.forEach(btn => {
    btn.addEventListener('click', async function() {
      const savingType = this.getAttribute('data-saving');
      await transferSaving(savingType);
    });
  });
  
  resultPanelData.isInitialized = true;
}

// ============================================
// SYSTÈME DE SURVEILLANCE OPTIMISÉ
// ============================================

let lastTransactionHash = '';
let autoUpdateInterval = null;
let isUpdating = false;

async function calculateTransactionHash() {
  try {
    const data = await loadMoneyDataFromESP32();
    if (!data || !data.transactions) return '';
    
    const transactions = data.transactions;
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

async function checkForUpdates() {
  if (isUpdating || window.currentMenuPage !== 'menu-4' || window.isInSelectedView) {
    return;
  }
  
  isUpdating = true;
  
  try {
    const currentTransactionHash = await calculateTransactionHash();
    
    if (currentTransactionHash !== lastTransactionHash) {
      lastTransactionHash = currentTransactionHash;
      
      await getMoneyManagementData();
      
      if (resultPanelData.isInitialized) {
        updateResultPanelUI();
      } else {
        await showResultPanel();
      }
    }
  } catch (error) {
    console.error('Erreur vérification mises à jour:', error);
  } finally {
    isUpdating = false;
  }
}

function startAutoUpdate() {
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
  }
  
  autoUpdateInterval = setInterval(checkForUpdates, 2000);
}

function stopAutoUpdate() {
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
    autoUpdateInterval = null;
  }
}

// ============================================
// ÉVÉNEMENTS GLOBAUX POUR LA MISE À JOUR
// ============================================

window.addEventListener('moneyDataUpdated', async function() {
  if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
    setTimeout(async () => {
      await getMoneyManagementData();
      updateResultPanelUI();
    }, 500);
  }
});

// ============================================
// CONFIGURATION DES ACTIFS ET TRADINGVIEW
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const assetTypes = {
        crypto: [
            {
                id: 'bitcoin',
                name: 'Bitcoin (BTC)',
                symbol: 'BTC',
                tradingViewSymbol: 'BITSTAMP:BTCUSD',
                displayName: 'Bitcoin',
                kinfopaneltousSymbol: 'BTCUSD'
            },
            {
                id: 'litecoin',
                name: 'Litecoin (LTC)',
                symbol: 'LTC',
                tradingViewSymbol: 'BITSTAMP:LTCUSD',
                displayName: 'Litecoin',
                kinfopaneltousSymbol: 'LTCUSD'
            },
            {
                id: 'ethereum',
                name: 'Ethereum (ETH)',
                symbol: 'ETH',
                tradingViewSymbol: 'BITSTAMP:ETHUSD',
                displayName: 'Ethereum',
                kinfopaneltousSymbol: 'ETHUSD'
            },
            {
                id: 'xrp',
                name: 'XRP',
                symbol: 'XRP',
                tradingViewSymbol: 'BITSTAMP:XRPUSD',
                displayName: 'XRP',
                kinfopaneltousSymbol: 'XRPUSD'
            }
        ],
        shares: [
            {
                id: 'S&P 500',
                name: 'S&P 500 (SP500)',
                symbol: 'S&P 500',
                tradingViewSymbol: 'Vantage:SP500',
                displayName: 'S&P 500',
                kinfopaneltousSymbol: 'Vantage:SP500'
            },
            {
               id: 'nasdaq',
               name: 'NASDAQ Composite',
               symbol: 'NASDAQ',
               tradingViewSymbol: 'NASDAQ:IXIC',
               displayName: 'NASDAQ',
               kinfopaneltousSymbol: 'NASDAQ:IXIC'
            },

            {
                id: 'apple',
                name: 'Apple (AAPL)',
                symbol: 'AAPL',
                tradingViewSymbol: 'NASDAQ:AAPL',
                displayName: 'Apple',
                kinfopaneltousSymbol: 'NASDAQ:AAPL'
            },

            {
                id: 'GameStop',
                name: 'GameStop (GME)',
                symbol: 'GME',
                tradingViewSymbol: 'NYSE:GME',
                displayName: 'GameStop',
                kinfopaneltousSymbol: 'NYSE:GME'
            }
        ],
        commodities: [
            {
                id: 'gold',
                name: 'Gold (XAUUSD)',
                symbol: 'XAU',
                tradingViewSymbol: 'OANDA:XAUUSD',
                displayName: 'Gold',
                kinfopaneltousSymbol: 'XAUUSD'
            },
            {
                id: 'silver',
                name: 'Silver (XAGUSD)',
                symbol: 'XAG',
                tradingViewSymbol: 'OANDA:XAGUSD',
                displayName: 'Silver',
                kinfopaneltousSymbol: 'XAGUSD'
            },
            {
                id: 'platinum',
                name: 'Platinum (XPTUSD)',
                symbol: 'XPT',
                tradingViewSymbol: 'TVC:PLATINUM',
                displayName: 'Platinum',
                kinfopaneltousSymbol: 'PLATINUM'
            },
            {
                id: 'oil',
                name: 'Crude Oil (WTI)',
                symbol: 'OIL',
                tradingViewSymbol: 'TVC:USOIL',
                displayName: 'Crude Oil',
                kinfopaneltousSymbol: 'USOIL'
            }
        ],
        forex: [
            {
                id: 'eurusd',
                name: 'EUR/USD',
                symbol: 'EUR',
                tradingViewSymbol: 'FX_IDC:EURUSD',
                displayName: 'EUR/USD',
                kinfopaneltousSymbol: 'EURUSD'
            },
            {
                id: 'gbpusd',
                name: 'GBP/USD',
                symbol: 'GBP',
                tradingViewSymbol: 'FX_IDC:GBPUSD',
                displayName: 'GBP/USD',
                kinfopaneltousSymbol: 'GBPUSD'
            },
            {
                id: 'audusd',
                name: 'AUD/USD',
                symbol: 'AUD',
                tradingViewSymbol: 'FX_IDC:AUDUSD',
                displayName: 'AUD/USD',
                kinfopaneltousSymbol: 'AUDUSD'
            },
            {
                id: 'nzdusd',
                name: 'NZD/USD',
                symbol: 'NZD',
                tradingViewSymbol: 'FX_IDC:NZDUSD',
                displayName: 'NZD/USD',
                kinfopaneltousSymbol: 'NZDUSD'
            }
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

    if (!window.appTimezone) {
        window.appTimezone = "Europe/London";
    }

    // Éléments du DOM
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

    // === AFFICHER LE MESSAGE PAR DÉFAUT (Menu 1) ===
    function showDefaultMessage() {
        kinfopaneltousContent.innerHTML = '';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'kinfopaneltous-default';
        messageDiv.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
        `;
        messageDiv.textContent = 'Bonjour Mohamed';
        
        kinfopaneltousContent.appendChild(messageDiv);
    }

    // === CHARGEMENT DES KINFOPANELTOUS POUR LES ACTUALITÉS ===
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
                "height": "400",
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
    async function updatePanelInfo() {
        kinfopaneltousContainer.classList.add('active');
        
        if (isInSelectedView && selectedAsset) {
            loadKinfopaneltousNews(selectedAsset);
        } else {
            if (currentMenuPage === 'menu-1') {
                showDefaultMessage();
            } else if (currentMenuPage === 'menu-4') {
                await showResultPanel();
            } else {
                showDefaultMessage();
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
    async function init() {
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
            setTimeout(() => createTradingViewWidget(containerId, symbol, assetId, isCarousel), 100);
            return null;
        }

        const container = document.getElementById(containerId);
        if (!container) {
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

    // === RETOUR AU CAROUSEL (MANUEL SEULEMENT) ===
    backBtn.addEventListener('click', function() {
        isInSelectedView = false;
        
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
                updateCurrentMenuPage();
                
                if (!isInSelectedView) {
                    updatePanelInfo();
                }
            }
        });
    });
    
    observerMenuChange.observe(megaBox, {
        attributes: true,
        attributeFilter: ['class']
    });

    // DÉMARRER L'APPLICATION
    init();

    window.addEventListener('resize', function() {
        sideMenu.style.top = '50%';
        sideMenu.style.transform = 'translateY(-50%)';
    });
    
    // Stocker dans l'objet global
    window.tvWidgets = tvWidgets;
    window.selectedTVWidget = selectedTVWidget;
    window.isInSelectedView = isInSelectedView;
    window.currentMenuPage = currentMenuPage;
    window.getMoneyManagementData = getMoneyManagementData;
    window.showResultPanel = showResultPanel;
    window.updateResultPanelUI = updateResultPanelUI;
    window.calculateSavings = calculateSavings;
    window.transferSaving = transferSaving;
    
    // Démarrer la surveillance automatique
    setTimeout(async () => {
        startAutoUpdate();
    }, 2000);
});

// Mettre à jour au chargement de la page
window.addEventListener('load', async function() {
  setTimeout(async () => {
    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
      await window.showResultPanel();
    }
  }, 1000);
});
