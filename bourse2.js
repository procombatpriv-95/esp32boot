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
  monthlyBalance: 0,
  yearlyBalance: 0,
  highestTransaction: { amount: 0, category: '', description: '' },
  lowestTransaction: { amount: 0, category: '', description: '' }
};

// ============================================
// CARROUSEL TRADINGVIEW - DIFFÉRENTS MARCHÉS
// ============================================

// Configuration des marchés à afficher dans le carrousel
const tradingViewMarkets = [
  {
    name: "CAC 40",
    symbol: "CAC40",
    tradingViewSymbol: "FR40",
    description: "Indice français",
    color: "#4169E1"
  },
  {
    name: "S&P 500",
    symbol: "SPX",
    tradingViewSymbol: "SPX",
    description: "Indice américain",
    color: "#32CD32"
  },
  {
    name: "DAX",
    symbol: "DAX",
    tradingViewSymbol: "DE40",
    description: "Indice allemand",
    color: "#FFD700"
  },
  {
    name: "NASDAQ",
    symbol: "NASDAQ",
    tradingViewSymbol: "NAS100",
    description: "Indice technologique",
    color: "#00BFFF"
  },
  {
    name: "FTSE 100",
    symbol: "FTSE",
    tradingViewSymbol: "UK100",
    description: "Indice britannique",
    color: "#FF4500"
  },
  {
    name: "NIKKEI 225",
    symbol: "NIKKEI",
    tradingViewSymbol: "JP225",
    description: "Indice japonais",
    color: "#FF69B4"
  }
];

// Index courant du carrousel
let currentMarketIndex = 0;
let carouselInterval = null;

// Fonction pour charger un widget TradingView pour un marché spécifique
function loadTradingViewWidget(market) {
  const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
  if (!kinfopaneltousContent) return;
  
  kinfopaneltousContent.innerHTML = '';
  
  // Créer le conteneur du widget
  const widgetContainer = document.createElement('div');
  widgetContainer.className = 'tradingview-widget-container carousel-widget';
  widgetContainer.style.cssText = `
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  `;
  
  // En-tête du marché
  const marketHeader = document.createElement('div');
  marketHeader.className = 'market-header';
  marketHeader.style.cssText = `
    padding: 15px;
    background: linear-gradient(135deg, ${market.color}40, ${market.color}20);
    border-radius: 8px 8px 0 0;
    margin-bottom: 10px;
  `;
  
  marketHeader.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h3 style="margin: 0; color: white; font-size: 18px;">${market.name}</h3>
        <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.8); font-size: 12px;">${market.description}</p>
      </div>
      <div style="font-size: 24px; color: white; opacity: 0.8;">📊</div>
    </div>
  `;
  
  widgetContainer.appendChild(marketHeader);
  
  // Conteneur du graphique
  const chartContainer = document.createElement('div');
  chartContainer.id = `tradingview_${market.symbol.toLowerCase()}`;
  chartContainer.style.cssText = `
    flex: 1;
    min-height: 250px;
    border-radius: 0 0 8px 8px;
    overflow: hidden;
  `;
  
  widgetContainer.appendChild(chartContainer);
  
  // Contrôles du carrousel
  const carouselControls = document.createElement('div');
  carouselControls.className = 'carousel-controls';
  carouselControls.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 10px;
    background: rgba(30, 30, 40, 0.8);
    border-radius: 8px;
    margin-top: 10px;
  `;
  
  // Boutons de navigation
  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '◀';
  prevBtn.style.cssText = `
    background: ${market.color};
    border: none;
    color: white;
    padding: 8px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: opacity 0.3s;
  `;
  prevBtn.onmouseover = () => prevBtn.style.opacity = '0.8';
  prevBtn.onmouseout = () => prevBtn.style.opacity = '1';
  prevBtn.onclick = () => showPreviousMarket();
  
  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '▶';
  nextBtn.style.cssText = `
    background: ${market.color};
    border: none;
    color: white;
    padding: 8px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: opacity 0.3s;
  `;
  nextBtn.onmouseover = () => nextBtn.style.opacity = '0.8';
  nextBtn.onmouseout = () => nextBtn.style.opacity = '1';
  nextBtn.onclick = () => showNextMarket();
  
  // Indicateur de position
  const positionIndicator = document.createElement('div');
  positionIndicator.className = 'position-indicator';
  positionIndicator.style.cssText = `
    display: flex;
    align-items: center;
    gap: 5px;
  `;
  
  tradingViewMarkets.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${index === currentMarketIndex ? market.color : 'rgba(255,255,255,0.3)'};
      cursor: pointer;
      transition: background 0.3s;
    `;
    dot.onclick = () => {
      currentMarketIndex = index;
      loadTradingViewWidget(tradingViewMarkets[currentMarketIndex]);
      updatePositionIndicator();
    };
    positionIndicator.appendChild(dot);
  });
  
  carouselControls.appendChild(prevBtn);
  carouselControls.appendChild(positionIndicator);
  carouselControls.appendChild(nextBtn);
  
  widgetContainer.appendChild(carouselControls);
  kinfopaneltousContent.appendChild(widgetContainer);
  
  // Charger le widget TradingView
  setTimeout(() => {
    new TradingView.widget({
      "container_id": `tradingview_${market.symbol.toLowerCase()}`,
      "width": "100%",
      "height": "250",
      "symbol": market.tradingViewSymbol,
      "interval": "D",
      "timezone": window.appTimezone || "Europe/London",
      "theme": "dark",
      "style": "1",
      "locale": "fr",
      "toolbar_bg": "#f1f3f6",
      "enable_publishing": false,
      "hide_volume": true,
      "save_image": false,
      "details": false,
      "studies": [],
      "show_popup_button": false,
      "popup_width": "1000",
      "popup_height": "650"
    });
  }, 100);
  
  // Mettre à jour l'indicateur de position
  function updatePositionIndicator() {
    const dots = positionIndicator.querySelectorAll('span');
    dots.forEach((dot, index) => {
      dot.style.background = index === currentMarketIndex ? market.color : 'rgba(255,255,255,0.3)';
    });
  }
  
  updatePositionIndicator();
}

// Fonction pour afficher le marché suivant
function showNextMarket() {
  currentMarketIndex = (currentMarketIndex + 1) % tradingViewMarkets.length;
  loadTradingViewWidget(tradingViewMarkets[currentMarketIndex]);
}

// Fonction pour afficher le marché précédent
function showPreviousMarket() {
  currentMarketIndex = (currentMarketIndex - 1 + tradingViewMarkets.length) % tradingViewMarkets.length;
  loadTradingViewWidget(tradingViewMarkets[currentMarketIndex]);
}

// Démarrer le carrousel automatique
function startCarousel() {
  if (carouselInterval) clearInterval(carouselInterval);
  
  carouselInterval = setInterval(() => {
    showNextMarket();
  }, 10000); // Change toutes les 10 secondes
}

// Arrêter le carrousel
function stopCarousel() {
  if (carouselInterval) {
    clearInterval(carouselInterval);
    carouselInterval = null;
  }
}

// ============================================
// FONCTIONS POUR LE PANEL RESULTAT (MENU 4)
// ============================================

// Fonction pour récupérer et calculer les données du money management avec BALANCE
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
    
    // Calculer la BALANCE (revenus - dépenses) pour chaque période
    const monthlyBalance = monthlyTransactions.reduce((sum, t) => {
      return t.type === 'income' ? sum + t.amount : sum - t.amount;
    }, 0);
    
    const yearlyBalance = yearlyTransactions.reduce((sum, t) => {
      return t.type === 'income' ? sum + t.amount : sum - t.amount;
    }, 0);
    
    // Trouver les transactions les plus hautes et basses pour CHAQUE période
    let monthlyHighest = { amount: 0, category: '', description: '' };
    let monthlyLowest = { amount: 0, category: '', description: '' };
    let yearlyHighest = { amount: 0, category: '', description: '' };
    let yearlyLowest = { amount: 0, category: '', description: '' };
    
    // Pour le mois
    if (monthlyTransactions.length > 0) {
      const allMonthlyAmounts = monthlyTransactions.map(t => ({
        ...t,
        signedAmount: t.type === 'income' ? t.amount : -t.amount
      }));
      
      if (allMonthlyAmounts.length > 0) {
        monthlyHighest = allMonthlyAmounts.reduce((max, t) => 
          t.signedAmount > max.signedAmount ? t : max
        );
        monthlyLowest = allMonthlyAmounts.reduce((min, t) => 
          t.signedAmount < min.signedAmount ? t : min
        );
      }
    }
    
    // Pour l'année
    if (yearlyTransactions.length > 0) {
      const allYearlyAmounts = yearlyTransactions.map(t => ({
        ...t,
        signedAmount: t.type === 'income' ? t.amount : -t.amount
      }));
      
      if (allYearlyAmounts.length > 0) {
        yearlyHighest = allYearlyAmounts.reduce((max, t) => 
          t.signedAmount > max.signedAmount ? t : max
        );
        yearlyLowest = allYearlyAmounts.reduce((min, t) => 
          t.signedAmount < min.signedAmount ? t : min
        );
      }
    }
    
    // Mettre à jour les données
    resultPanelData.monthlyGoal = monthlyGoal;
    resultPanelData.yearlyGoal = yearlyGoal;
    resultPanelData.monthlyBalance = monthlyBalance;
    resultPanelData.yearlyBalance = yearlyBalance;
    resultPanelData.highestTransaction = currentPeriod === 'monthly' ? monthlyHighest : yearlyHighest;
    resultPanelData.lowestTransaction = currentPeriod === 'monthly' ? monthlyLowest : yearlyLowest;
    resultPanelData.currentPeriod = currentPeriod;
    
    return {
      monthlyGoal,
      yearlyGoal,
      monthlyBalance,
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

// Fonction pour forcer la mise à jour du panel résultat
function forceUpdateResultPanel() {
  if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
    getMoneyManagementData();
    showResultPanel();
  }
}

// Fonction pour vérifier si le panel résultat est visible
function isResultPanelVisible() {
  const megaBox = document.getElementById('megaBox');
  return megaBox && megaBox.classList.contains('menu-4') && !window.isInSelectedView;
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
  
  // Calculer le pourcentage (max 100%, min 0%)
  // Si le goal est 0, le pourcentage est 0
  let percentage = 0;
  if (currentGoal > 0) {
    percentage = Math.min(Math.max((currentBalance / currentGoal) * 100, 0), 100);
  }
  
  // Déterminer si le goal est atteint ou dépassé
  const isGoalReached = percentage >= 100;
  
  // Pour l'affichage du montant sur la barre verte - montrer si > 0 et > 10%
  const showAmountOnBar = percentage > 10 && currentBalance > 0;
  const showRemainingAmount = !isGoalReached && currentGoal > currentBalance && (currentGoal - currentBalance) > 0;
  
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
          <div class="progress-filled" style="width: ${percentage}%">
            ${showAmountOnBar ? `£${Math.abs(currentBalance).toFixed(0)}` : ''}
          </div>
          ${showRemainingAmount ? `
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
          £${Math.abs(resultPanelData.highestTransaction.amount || 0).toFixed(2)}
          ${resultPanelData.highestTransaction.description ? `<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;">${resultPanelData.highestTransaction.description}</div>` : ''}
        </div>
      </div>
      <div class="indicator-box indicator-lowest">
        <div class="indicator-label">
          <i class="fas fa-arrow-down"></i> Lowest
        </div>
        <div class="indicator-value">
          £${Math.abs(resultPanelData.lowestTransaction.amount || 0).toFixed(2)}
          ${resultPanelData.lowestTransaction.description ? `<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;">${resultPanelData.lowestTransaction.description}</div>` : ''}
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
      
      // Recharger les données avec la nouvelle période
      getMoneyManagementData(period);
      
      // Mettre à jour immédiatement
      showResultPanel();
    });
  });
}

// ============================================
// CHARGEMENT DES ACTUALITÉS TRADINGVIEW
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
    
    setTimeout(removeAllTooltips, 1500);
  }, 500);
}

// ============================================
// SUPPRESSION DES TOOLTIPS
// ============================================

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

// ============================================
// GESTION DES ÉVÉNEMENTS EN TEMPS RÉEL
// ============================================

// Écouter les événements personnalisés du money management
document.addEventListener('moneyManagerUpdated', function() {
  if (isResultPanelVisible()) {
    getMoneyManagementData();
    showResultPanel();
  }
});

// Écouter les changements de localStorage
window.addEventListener('storage', function(e) {
  if (e.key === 'moneyManagerTransactions' || 
      e.key === 'moneyManagerGoals' || 
      e.key === 'moneyManagerYearlyGoal') {
    if (isResultPanelVisible()) {
      setTimeout(() => {
        getMoneyManagementData();
        showResultPanel();
      }, 100);
    }
  }
});

// Surveiller les changements dans le DOM du money management
function setupMoneyManagementObserver() {
  const moneyManagementContainer = document.getElementById('menu4Content');
  if (moneyManagementContainer) {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // Si des boutons sont cliqués dans le money management
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          setTimeout(() => {
            if (isResultPanelVisible()) {
              getMoneyManagementData();
              showResultPanel();
            }
          }, 300);
        }
      });
    });
    
    observer.observe(moneyManagementContainer, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    // Observer également les boutons spécifiques
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const setGoalBtn = document.getElementById('setGoalBtn');
    const setAllGoalBtn = document.getElementById('setAllGoalBtn');
    
    if (addTransactionBtn) {
      addTransactionBtn.addEventListener('click', function() {
        setTimeout(() => {
          if (isResultPanelVisible()) {
            getMoneyManagementData();
            showResultPanel();
          }
        }, 500);
      });
    }
    
    if (setGoalBtn) {
      setGoalBtn.addEventListener('click', function() {
        setTimeout(() => {
          if (isResultPanelVisible()) {
            getMoneyManagementData();
            showResultPanel();
          }
        }, 500);
      });
    }
    
    if (setAllGoalBtn) {
      setAllGoalBtn.addEventListener('click', function() {
        setTimeout(() => {
          if (isResultPanelVisible()) {
            getMoneyManagementData();
            showResultPanel();
          }
        }, 500);
      });
    }
  }
}

// ============================================
// GESTION DU PANEL INFO EN FONCTION DE L'ÉTAT
// ============================================

function updatePanelInfo() {
  const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
  if (!kinfopaneltousContainer) return;
  
  kinfopaneltousContainer.classList.add('active');
  
  // Vérifier si nous sommes dans le menu 4
  const megaBox = document.getElementById('megaBox');
  if (!megaBox) return;
  
  const isMenu4 = megaBox.classList.contains('menu-4');
  
  // Si Selected View est ouvert, afficher les news
  if (window.isInSelectedView && window.selectedAsset) {
    loadKinfopaneltousNews(window.selectedAsset);
    stopCarousel();
  } 
  // Sinon, afficher selon la page active
  else {
    if (isMenu4) {
      // Toujours charger les données à jour pour le menu 4
      getMoneyManagementData();
      showResultPanel();
      stopCarousel();
    } else {
      // Pour les autres menus, afficher le carrousel TradingView
      if (tradingViewMarkets.length > 0) {
        loadTradingViewWidget(tradingViewMarkets[currentMarketIndex]);
        startCarousel();
      }
    }
  }
}

// ============================================
// DÉTECTION DE LA PAGE ACTIVE
// ============================================

function updateCurrentMenuPage() {
  const megaBox = document.getElementById('megaBox');
  if (!megaBox) return;
  
  if (megaBox.classList.contains('menu-1')) window.currentMenuPage = 'menu-1';
  else if (megaBox.classList.contains('menu-2')) window.currentMenuPage = 'menu-2';
  else if (megaBox.classList.contains('menu-3')) window.currentMenuPage = 'menu-3';
  else if (megaBox.classList.contains('menu-4')) window.currentMenuPage = 'menu-4';
  else if (megaBox.classList.contains('menu-5')) window.currentMenuPage = 'menu-5';
}

// ============================================
// INITIALISATION AU CHARGEMENT DE LA PAGE
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  // Initialiser les variables globales
  if (!window.currentMenuPage) window.currentMenuPage = 'menu-1';
  if (!window.isInSelectedView) window.isInSelectedView = false;
  if (!window.selectedAsset) window.selectedAsset = null;
  
  // Initialiser les boutons monthly/yearly par défaut
  resultPanelData.currentPeriod = 'monthly';
  
  // Initialiser l'index du marché
  currentMarketIndex = 0;
  
  // Détecter la page initiale
  updateCurrentMenuPage();
  
  // Mettre à jour le panel info
  setTimeout(updatePanelInfo, 100);
  
  // Configurer l'observateur pour le money management
  setTimeout(setupMoneyManagementObserver, 1000);
  
  // Mettre à jour périodiquement le panel résultat si on est dans le menu 4
  setInterval(() => {
    if (isResultPanelVisible()) {
      getMoneyManagementData();
      showResultPanel();
    }
  }, 3000);
  
  // Surveiller les changements de menu
  const megaBox = document.getElementById('megaBox');
  if (megaBox) {
    const observerMenuChange = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'class') {
          // Mettre à jour la page active
          updateCurrentMenuPage();
          
          // Mettre à jour le panel info seulement si Selected View n'est PAS actif
          if (!window.isInSelectedView) {
            updatePanelInfo();
          }
        }
      });
    });
    
    observerMenuChange.observe(megaBox, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  
  // Gérer la visibilité de la page pour arrêter/démarrer le carrousel
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      stopCarousel();
    } else {
      const megaBox = document.getElementById('megaBox');
      const isMenu4 = megaBox && megaBox.classList.contains('menu-4');
      
      if (!window.isInSelectedView && !isMenu4 && tradingViewMarkets.length > 0) {
        startCarousel();
      }
    }
  });
});

// ============================================
// EXPOSITION DES FONCTIONS GLOBALES
// ============================================

window.showResultPanel = showResultPanel;
window.forceUpdateResultPanel = forceUpdateResultPanel;
window.getMoneyManagementData = getMoneyManagementData;
window.loadTradingViewWidget = loadTradingViewWidget;
window.showNextMarket = showNextMarket;
window.showPreviousMarket = showPreviousMarket;
window.startCarousel = startCarousel;
window.stopCarousel = stopCarousel;
