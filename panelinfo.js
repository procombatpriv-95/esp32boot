// ============================================
// PANEL INFO & MENUS MANAGEMENT SYSTEM
// ============================================

// Variables globales pour le système de panel info
let currentMenuPage = 'menu-1';
let menu1WidgetsInterval = null;
let currentBottomLeftWidget = 'eurusd';
let currentBottomRightWidget = 'apple';
let currentKinfopaneltousWidget = null;

// Variables pour le système financier
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

// Éléments DOM
const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
const megaBox = document.getElementById('megaBox');

// === FONCTIONS FINANCIÈRES ===
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
    
    // Charger Font Awesome si nécessaire
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const faLink = document.createElement('link');
        faLink.rel = 'stylesheet';
        faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(faLink);
    }
    
    // Gérer les boutons de période
    const periodBtns = resultPanel.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const period = this.getAttribute('data-period');
            resultPanelData.currentPeriod = period;
            getMoneyManagementData(period);
            showResultPanel();
        });
    });
    
    // Gérer les boutons d'épargne
    const savingBtns = resultPanel.querySelectorAll('.saving-add-btn');
    savingBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const savingType = this.getAttribute('data-saving');
            transferSaving(savingType);
        });
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

// === ACTUALITÉS SELECTED VIEW ===
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

// === GESTION DU PANEL INFO ===
function updatePanelInfo() {
    if (!kinfopaneltousContainer) return;
    
    kinfopaneltousContainer.classList.add('active');
    
    // Vérifier si on est en selected view
    const isSelectedView = window.isInSelectedView || false;
    const selectedAsset = window.selectedAsset || null;
    
    // Si on change de menu et qu'on était en selected view, on le quitte
    if (isSelectedView && currentMenuPage !== 'menu-2') {
        window.isInSelectedView = false;
    }
    
    // Les news ne s'affichent QUE si toutes ces conditions sont remplies
    if (isSelectedView && selectedAsset && currentMenuPage === 'menu-2') {
        loadKinfopaneltousNews(selectedAsset);
    } else {
        // Sinon, on désactive le selected view
        if (isSelectedView && currentMenuPage !== 'menu-2') {
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
    if (!megaBox) return;
    
    const classes = megaBox.classList;
    if (classes.contains('menu-1')) currentMenuPage = 'menu-1';
    else if (classes.contains('menu-2')) currentMenuPage = 'menu-2';
    else if (classes.contains('menu-3')) currentMenuPage = 'menu-3';
    else if (classes.contains('menu-4')) currentMenuPage = 'menu-4';
    else if (classes.contains('menu-5')) currentMenuPage = 'menu-5';
}

// === GESTION DU LOCALSTORAGE ===
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

// === OBSERVATEUR DE CHANGEMENT DE MENU ===
function setupMenuObserver() {
    if (!megaBox) return;
    
    const observerMenuChange = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                const oldMenu = currentMenuPage;
                updateCurrentMenuPage();
                
                if (window.isInSelectedView && oldMenu !== currentMenuPage) {
                    window.isInSelectedView = false;
                }
                
                updatePanelInfo();
            }
        });
    });
    
    observerMenuChange.observe(megaBox, {
        attributes: true,
        attributeFilter: ['class']
    });
}

// === GESTION DE LA SELECTED VIEW ===
window.onSelectedViewChange = function(isSelected, asset) {
    window.isInSelectedView = isSelected;
    window.selectedAsset = asset;
    
    // Si on est en selected view et qu'on est sur le menu-2, afficher les news
    if (isSelected && currentMenuPage === 'menu-2') {
        if (asset) {
            loadKinfopaneltousNews(asset);
        }
    } else {
        updatePanelInfo();
    }
};

// === INITIALISATION DU SYSTÈME PANEL INFO ===
function initPanelInfoSystem() {
    // Configurer l'observateur de menu
    setupMenuObserver();
    
    // Déterminer le menu actuel
    updateCurrentMenuPage();
    
    // Initialiser le panel info
    updatePanelInfo();
    
    // Configurer le polling pour le menu-4
    setInterval(() => {
        if (currentMenuPage === 'menu-4' && !window.isInSelectedView) {
            getMoneyManagementData();
            showResultPanel();
        }
    }, 300);
}

// === GÉOLOCALISATION ===
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
        
        // Mettre à jour les fuseaux horaires des widgets TradingView
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

// Exporter les fonctions globales
window.getMoneyManagementData = getMoneyManagementData;
window.showResultPanel = showResultPanel;
window.calculateSavings = calculateSavings;
window.transferSaving = transferSaving;

// Initialiser lorsque le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPanelInfoSystem);
} else {
    initPanelInfoSystem();
}
