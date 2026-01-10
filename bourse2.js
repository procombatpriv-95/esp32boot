// ============================================
// GÉOLOCALISATION ET FUSEAU HORAIRE
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
  lowestTransaction: { amount: 0, category: '' }
};

// ============================================
// FONCTIONS POUR LE PANEL RESULTAT (MENU 4)
// ============================================

// Fonction pour récupérer et calculer les données du money management
function getMoneyManagementData(period = null) {
  try {
    // Utiliser la période passée en paramètre ou celle stockée
    const currentPeriod = period || resultPanelData.currentPeriod;
    
    // Récupérer les transactions
    const transactions = JSON.parse(localStorage.getItem('moneyManagerTransactions') || '[]');
    
    // Récupérer les objectifs
    const monthlyGoals = JSON.parse(localStorage.getItem('moneyManagerGoals') || '{}');
    const yearlyGoal = parseFloat(localStorage.getItem('moneyManagerYearlyGoal') || '0');
    
    // Date actuelle
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthKey = `${currentYear}-${currentMonth}`;
    
    // Calculer l'objectif mensuel actuel
    const monthlyGoal = monthlyGoals[monthKey] || 0;
    
    // Filtrer les transactions par mois et année
    const monthlyTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === currentYear && 
             tDate.getMonth() + 1 === parseInt(currentMonth);
    });
    
    const yearlyTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === currentYear;
    });
    
    // Calculer les revenus et dépenses pour chaque période
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyBalance = monthlyIncome - monthlyExpenses;
    
    const yearlyIncome = yearlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const yearlyExpenses = yearlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const yearlyBalance = yearlyIncome - yearlyExpenses;
    
    // Trouver les transactions les plus hautes et basses pour CHAQUE période
    let monthlyHighest = { amount: 0, category: '' };
    let monthlyLowest = { amount: 0, category: '' };
    let yearlyHighest = { amount: 0, category: '' };
    let yearlyLowest = { amount: 0, category: '' };
    
    // Pour le mois
    if (monthlyTransactions.length > 0) {
      const monthlyIncomes = monthlyTransactions.filter(t => t.type === 'income');
      const monthlyExpensesList = monthlyTransactions.filter(t => t.type === 'expense');
      
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
    
    // Pour l'année
    if (yearlyTransactions.length > 0) {
      const yearlyIncomes = yearlyTransactions.filter(t => t.type === 'income');
      const yearlyExpensesList = yearlyTransactions.filter(t => t.type === 'expense');
      
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
    
    // Mettre à jour les données
    resultPanelData.monthlyGoal = monthlyGoal;
    resultPanelData.yearlyGoal = yearlyGoal;
    resultPanelData.monthlyIncome = monthlyIncome;
    resultPanelData.monthlyExpenses = monthlyExpenses;
    resultPanelData.monthlyBalance = monthlyBalance;
    resultPanelData.yearlyIncome = yearlyIncome;
    resultPanelData.yearlyExpenses = yearlyExpenses;
    resultPanelData.yearlyBalance = yearlyBalance;
    resultPanelData.highestTransaction = currentPeriod === 'monthly' ? monthlyHighest : yearlyHighest;
    resultPanelData.lowestTransaction = currentPeriod === 'monthly' ? monthlyLowest : yearlyLowest;
    
    return {
      monthlyGoal,
      yearlyGoal,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance,
      yearlyIncome,
      yearlyExpenses,
      yearlyBalance,
      highestTransaction: currentPeriod === 'monthly' ? monthlyHighest : yearlyHighest,
      lowestTransaction: currentPeriod === 'monthly' ? monthlyLowest : yearlyLowest,
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
  
  // Récupérer les données à jour
  const data = getMoneyManagementData();
  
  // Déterminer l'objectif et la balance actuels selon la période
  const currentGoal = resultPanelData.currentPeriod === 'monthly' 
    ? resultPanelData.monthlyGoal 
    : resultPanelData.yearlyGoal;
  
  const currentBalance = resultPanelData.currentPeriod === 'monthly'
    ? resultPanelData.monthlyBalance
    : resultPanelData.yearlyBalance;
  
  // Calculer le pourcentage (balance par rapport à l'objectif)
  let percentage = 0;
  if (currentGoal > 0) {
    // Si la balance est négative, afficher 0%
    if (currentBalance <= 0) {
      percentage = 0;
    } else {
      // Limiter à 100% maximum
      percentage = Math.min((currentBalance / currentGoal) * 100, 100);
    }
  }
  
  // Déterminer si le goal est atteint ou dépassé
  const isGoalReached = percentage >= 100;
  
  // Pour l'affichage du montant sur la barre
  const showAmountOnBar = Math.abs(currentBalance) > 0 && percentage > 5;
  
  // Déterminer la couleur de la barre en fonction du solde
  const barColor = currentBalance >= 0 ? '#2ecc71' : '#e74c3c';
  
  resultPanel.innerHTML = `
    <div class="period-selector">
      <button class="period-btn ${resultPanelData.currentPeriod === 'monthly' ? 'active' : ''}" 
              data-period="monthly">Monthly</button>
      <button class="period-btn ${resultPanelData.currentPeriod === 'yearly' ? 'active' : ''}" 
              data-period="yearly">Yearly</button>
    </div>
    
    <div class="progress-section">
      <div class="progress-header">
        <span class="period-label">${resultPanelData.currentPeriod === 'monthly' ? 'Monthly Balance' : 'Yearly Balance'}</span>
        <span class="percentage-label" style="color: ${currentBalance >= 0 ? '#2ecc71' : '#e74c3c'}">
          ${currentBalance >= 0 ? '+' : ''}£${currentBalance.toFixed(0)}
        </span>
      </div>
      
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-filled" style="width: ${percentage}%; background: ${barColor}">
            ${showAmountOnBar ? `${currentBalance >= 0 ? '+' : ''}£${currentBalance.toFixed(0)}` : ''}
          </div>
          ${!isGoalReached ? `
            <div class="progress-remaining" style="background: ${currentBalance >= 0 ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)'}">
              ${percentage < 90 ? `£${Math.max(0, currentGoal - currentBalance).toFixed(0)}` : ''}
            </div>
          ` : ''}
        </div>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: rgba(255,255,255,0.7)">
        <div>Goal: £${currentGoal.toFixed(0)}</div>
        <div>${percentage.toFixed(1)}% of goal</div>
      </div>
    </div>
    
    <div class="indicators-container">
      <div class="indicator-box indicator-highest">
        <div class="indicator-label">
          <i class="fas fa-arrow-up"></i> Highest Income
        </div>
        <div class="indicator-value">
          £${resultPanelData.highestTransaction.amount.toFixed(2)}
          ${resultPanelData.highestTransaction.category ? `<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;">${resultPanelData.highestTransaction.category}</div>` : ''}
        </div>
      </div>
      <div class="indicator-box indicator-lowest">
        <div class="indicator-label">
          <i class="fas fa-arrow-down"></i> Lowest Expense
        </div>
        <div class="indicator-value">
          £${resultPanelData.lowestTransaction.amount.toFixed(2)}
          ${resultPanelData.lowestTransaction.category ? `<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;">${resultPanelData.lowestTransaction.category}</div>` : ''}
        </div>
      </div>
    </div>
    
    <!-- Ajout d'un petit résumé des revenus/dépenses -->
    <div style="background: rgba(30, 31, 35, 0.8); border-radius: 10px; padding: 10px; margin-top: 15px; border: 1px solid rgba(255, 255, 255, 0.1);">
      <div style="display: flex; justify-content: space-between; font-size: 12px;">
        <div style="color: #2ecc71">
          <i class="fas fa-arrow-up"></i> Income: £${resultPanelData.currentPeriod === 'monthly' ? resultPanelData.monthlyIncome.toFixed(2) : resultPanelData.yearlyIncome.toFixed(2)}
        </div>
        <div style="color: #e74c3c">
          <i class="fas fa-arrow-down"></i> Expenses: £${resultPanelData.currentPeriod === 'monthly' ? resultPanelData.monthlyExpenses.toFixed(2) : resultPanelData.yearlyExpenses.toFixed(2)}
        </div>
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
    btn.addEventListener('click', function() {
      const period = this.getAttribute('data-period');
      resultPanelData.currentPeriod = period;
      
      // Mettre à jour immédiatement avec la nouvelle période
      getMoneyManagementData(period);
      showResultPanel();
    });
  });
}
// ============================================
// SYSTÈME DE SURVEILLANCE EN TEMPS RÉEL
// ============================================

// Stocker le dernier état connu des données
let lastTransactionCount = 0;
let lastTransactionHash = '';
let lastGoalHash = '';
let autoUpdateInterval = null;

// Fonction pour calculer un hash simple des transactions
function calculateTransactionHash() {
  try {
    const transactions = JSON.parse(localStorage.getItem('moneyManagerTransactions') || '[]');
    // Créer un hash simple basé sur le nombre et le montant total
    let hash = transactions.length.toString();
    let totalAmount = 0;
    transactions.forEach(t => {
      totalAmount += t.amount;
      hash += t.id + t.amount + t.type;
    });
    return hash + totalAmount.toString();
  } catch (e) {
    return '';
  }
}

// Fonction pour calculer un hash simple des objectifs
function calculateGoalHash() {
  try {
    const monthlyGoals = JSON.parse(localStorage.getItem('moneyManagerGoals') || '{}');
    const yearlyGoal = localStorage.getItem('moneyManagerYearlyGoal') || '0';
    return JSON.stringify(monthlyGoals) + yearlyGoal;
  } catch (e) {
    return '';
  }
}

// Fonction pour vérifier les changements et mettre à jour
function checkForUpdates() {
  // Vérifier si nous sommes dans le menu 4 et pas en mode selected view
  if (window.currentMenuPage !== 'menu-4' || window.isInSelectedView) {
    return;
  }
  
  // Calculer les hashs actuels
  const currentTransactionHash = calculateTransactionHash();
  const currentGoalHash = calculateGoalHash();
  
  // Vérifier si quelque chose a changé
  if (currentTransactionHash !== lastTransactionHash || currentGoalHash !== lastGoalHash) {
    console.log('Changement détecté, mise à jour du panel...');
    
    // Mettre à jour les hashs
    lastTransactionHash = currentTransactionHash;
    lastGoalHash = currentGoalHash;
    
    // Mettre à jour les données
    getMoneyManagementData();
    
    // Mettre à jour l'affichage
    showResultPanel();
    
    // Forcer un reflow pour s'assurer que l'affichage est actualisé
    const panel = document.querySelector('.kinfopaneltous-container');
    if (panel) {
      panel.style.display = 'none';
      panel.offsetHeight; // Force reflow
      panel.style.display = 'flex';
    }
  }
}

// Démarrer la surveillance automatique
function startAutoUpdate() {
  // Initialiser les hashs
  lastTransactionHash = calculateTransactionHash();
  lastGoalHash = calculateGoalHash();
  
  // Vérifier toutes les 500ms (très réactif)
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
  }
  
  autoUpdateInterval = setInterval(checkForUpdates, 500);
  
  console.log('Surveillance automatique démarrée');
}

// Arrêter la surveillance
function stopAutoUpdate() {
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
    autoUpdateInterval = null;
  }
}

// ============================================
// SURCHARGE DU LOCALSTORAGE POUR DÉTECTION IMMÉDIATE
// ============================================

// Surcharger localStorage.setItem pour détecter les changements immédiatement
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  // Appeler la méthode originale
  originalSetItem.apply(this, arguments);
  
  // Vérifier si c'est une clé du money management
  if (key && key.includes('moneyManager')) {
    console.log(`Changement détecté dans localStorage: ${key}`);
    
    // Mettre à jour immédiatement si dans le menu 4
    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
      setTimeout(() => {
        getMoneyManagementData();
        showResultPanel();
      }, 100);
    }
  }
};

// Surcharger localStorage.removeItem
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

// Surcharger localStorage.clear
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

// Écouter les événements storage (pour les changements depuis d'autres onglets)
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

// Créer un événement personnalisé pour les mises à jour
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
    // Configuration des actifs avec symboles TradingView
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
                id: 'tesla',
                name: 'Tesla (TSLA)',
                symbol: 'TSLA',
                tradingViewSymbol: 'NASDAQ:TSLA',
                displayName: 'Tesla',
                kinfopaneltousSymbol: 'NASDAQ:TSLA'
            },
            {
                id: 'microsoft',
                name: 'Microsoft (MSFT)',
                symbol: 'MSFT',
                tradingViewSymbol: 'NASDAQ:MSFT',
                displayName: 'Microsoft',
                kinfopaneltousSymbol: 'NASDAQ:MSFT'
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
    
    // Fuseau horaire par défaut (sera mis à jour par géolocalisation)
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
    function updatePanelInfo() {
        kinfopaneltousContainer.classList.add('active');
        
        // PRIORITÉ 1: Si Selected View est ouvert, TOUJOURS afficher les news
        if (isInSelectedView && selectedAsset) {
            loadKinfopaneltousNews(selectedAsset);
        } 
        // PRIORITÉ 2: Sinon, afficher selon la page active
        else {
            if (currentMenuPage === 'menu-1') {
                showDefaultMessage();
            } else if (currentMenuPage === 'menu-4') {
                // Toujours charger les données à jour
                getMoneyManagementData();
                showResultPanel();
            } else {
                // Pour les autres pages
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
        
        // Détecter la page initiale
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
                widgetConfig.studies = ["RSI@tv-basicstudies", "EMA@tv-basicstudies"];
                widgetConfig.studies_overrides = {
                    "volume.volume.color.0": "rgba(0, 0, 0, 0)",
                    "volume.volume.color.1": "rgba(0, 0, 0, 0)",
                    "RSI.rsi.linewidth": 2,
                    "RSI.rsi.period": 14,
                    "RSI.rsi.plottype": "line",
                    "EMA.ema.color": "#FF6B00",
                    "EMA.ema.linewidth": 2,
                    "EMA.ema.period": 50,
                    "EMA.ema.plottype": "line",
                    "EMA.ema.transparency": 0
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

        // Activer le mode Selected View
        isInSelectedView = true;
        
        // Animation et transition
        carousel.classList.add('carousel-paused');
        carouselScene.classList.add('hidden');
        sideMenu.classList.add('hidden');
        selectedView.classList.add('active');
        backBtn.classList.remove('hidden');
        loader.classList.remove('hidden');

        // Mettre à jour le panel info (afficher les news)
        updatePanelInfo();

        // Préparer le graphique TradingView
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
        // Désactiver le mode Selected View
        isInSelectedView = false;
        
        selectedView.classList.remove('active');
        carouselScene.classList.remove('hidden');
        backBtn.classList.add('hidden');
        sideMenu.classList.remove('hidden');
        carousel.classList.remove('carousel-paused');
        
        // Mettre à jour le panel info selon la page active
        updatePanelInfo();
        
        removeAllTooltips();
    });

    // === SURVEILLANCE DU CHANGEMENT DE MENU ===
    const observerMenuChange = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                // Mettre à jour la page active
                updateCurrentMenuPage();
                
                // Mettre à jour le panel info seulement si Selected View n'est PAS actif
                if (!isInSelectedView) {
                    updatePanelInfo();
                }
                // Si Selected View est actif, on NE CHANGE RIEN - les news restent
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
    
    // Stocker les widgets dans l'objet global pour pouvoir les mettre à jour
    window.tvWidgets = tvWidgets;
    window.selectedTVWidget = selectedTVWidget;
    window.isInSelectedView = isInSelectedView;
    window.currentMenuPage = currentMenuPage;
    window.getMoneyManagementData = getMoneyManagementData;
    window.showResultPanel = showResultPanel;
    
    // ============================================
    // DÉMARRER LA SURVEILLANCE AUTOMATIQUE
    // ============================================
    
    // Démarrer la surveillance immédiatement
    setTimeout(() => {
        startAutoUpdate();
        
        // Vérifier toutes les 2 secondes en backup
        setInterval(() => {
            if (currentMenuPage === 'menu-4' && !isInSelectedView) {
                getMoneyManagementData();
                showResultPanel();
            }
        }, 2000);
    }, 1000);
});

// Polling global de secours toutes les secondes
setInterval(() => {
  if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
    if (window.getMoneyManagementData && window.showResultPanel) {
      window.getMoneyManagementData();
      window.showResultPanel();
    }
  }
}, 1000);

// Mettre à jour immédiatement au chargement de la page
window.addEventListener('load', function() {
  setTimeout(() => {
    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
      if (window.getMoneyManagementData && window.showResultPanel) {
        window.getMoneyManagementData();
        window.showResultPanel();
      }
    }
  }, 500);
});
