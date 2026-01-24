// ===== CONFIGURATION SERVEUR =====
// REMPLACER par l'IP de votre Mac
const MAC_SERVER = "http://172.20.10.13:5000";
const ESP_SERVER = window.location.origin;

// ===== FONCTIONS COMMUNICATION SERVEUR =====
async function saveMoneyDataToServer(data) {
    console.log('💾 Sauvegarde Money Manager...');
    
    try {
        // Proxy via ESP32 vers Mac
        const response = await fetch(`${ESP_SERVER}/saveMoneyManager?data=` + 
                                   encodeURIComponent(JSON.stringify(data)), {
            method: 'GET'
        });
        
        if (response.ok) {
            console.log('✅ Données sauvegardées');
            return await response.json();
        } else {
            console.error('❌ Erreur sauvegarde');
            return {success: false};
        }
    } catch (error) {
        console.error('❌ Erreur réseau:', error);
        return {success: false};
    }
}

async function loadMoneyDataFromServer() {
    console.log('📥 Chargement Money Manager...');
    
    try {
        // Proxy via ESP32 depuis Mac
        const response = await fetch(`${ESP_SERVER}/loadMoneyManager`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Données chargées');
            return data;
        } else {
            console.error('❌ Erreur chargement');
            return null;
        }
    } catch (error) {
        console.error('❌ Erreur réseau:', error);
        return null;
    }
}

// ============================================
// FONCTIONS POUR CALCULER LES SAVINGS
// ============================================

async function calculateSavings() {
    try {
        const data = await loadMoneyDataFromServer();
        const transactions = data?.transactions || [];
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

// ============================================
// FONCTION POUR TRANSFÉRER UN SAVING
// ============================================

async function transferSaving(savingType) {
    try {
        // Charger les données actuelles
        const data = await loadMoneyDataFromServer();
        if (!data) {
            alert('Impossible de charger les données');
            return;
        }
        
        const transactions = data.transactions || [];
        const monthlyGoals = data.monthlyGoals || {};
        const yearlyGoal = data.yearlyGoal || 0;
        
        // Calculer les savings actuels
        const savings = await calculateSavings();
        const amount = savings[savingType];
        
        if (amount <= 0) {
            alert('Cannot transfer zero or negative saving amount.');
            return;
        }
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const newId = Date.now();
        
        // 1. Créer une transaction normale (income) pour ajouter à la balance
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
        
        // 2. Créer une transaction expense dans le saving (pour le vider)
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
        
        // 3. Ajouter les deux transactions
        transactions.push(normalTransaction, savingTransaction);
        
        // 4. Sauvegarder sur le serveur
        const saveResult = await saveMoneyDataToServer({
            transactions: transactions,
            investments: data.investments || [],
            monthlyGoals: monthlyGoals,
            yearlyGoal: yearlyGoal
        });
        
        if (saveResult && saveResult.success) {
            console.log('✅ Transfert sauvegardé');
            
            // 5. Mettre à jour l'affichage
            setTimeout(async () => {
                await getMoneyManagementData();
                showResultPanel();
            }, 100);
            
        } else {
            alert('Erreur lors de la sauvegarde');
        }
        
    } catch (e) {
        console.error('Erreur transfer saving:', e);
        alert('Error transferring saving: ' + e.message);
    }
}

// ============================================
// FONCTIONS POUR LE PANEL RESULTAT (MENU 4)
// ============================================

async function getMoneyManagementData(period = null) {
    try {
        // Utiliser la période passée en paramètre ou celle stockée
        const currentPeriod = period || resultPanelData.currentPeriod;
        
        // Récupérer les données depuis le serveur
        const data = await loadMoneyDataFromServer();
        
        if (!data) {
            console.error('❌ Aucune donnée disponible');
            return resultPanelData;
        }
        
        const transactions = data.transactions || [];
        const monthlyGoals = data.monthlyGoals || {};
        const yearlyGoal = data.yearlyGoal || 0;
        
        // Date actuelle
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const monthKey = `${currentYear}-${currentMonth}`;
        
        // Calculer l'objectif mensuel actuel
        const monthlyGoal = monthlyGoals[monthKey] || 0;
        
        // Filtrer les transactions par mois et année (normales seulement)
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
        
        // Calculer les revenus (normaux seulement)
        const monthlyIncome = monthlyNormalTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const yearlyIncome = yearlyNormalTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Calculer les dépenses (normales seulement)
        const monthlyExpenses = monthlyNormalTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const yearlyExpenses = yearlyNormalTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        // Trouver les transactions les plus hautes et basses pour CHAQUE période (normales seulement)
        let monthlyHighest = { amount: 0, category: '' };
        let monthlyLowest = { amount: 0, category: '' };
        let yearlyHighest = { amount: 0, category: '' };
        let yearlyLowest = { amount: 0, category: '' };
        
        // Pour le mois (normales seulement)
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
        
        // Pour l'année (normales seulement)
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
        
        // Calculer les savings
        const savings = await calculateSavings();
        
        // Mettre à jour les données globales
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
        resultPanelData.currentPeriod = currentPeriod;
        
        console.log(`💰 Données chargées: ${transactions.length} transactions`);
        
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
        console.error('❌ Erreur lors de la récupération des données:', e);
        return resultPanelData;
    }
}

// ============================================
// FONCTION POUR AFFICHER LE PANEL
// ============================================

async function showResultPanel() {
    const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
    if (!kinfopaneltousContent) return;
    
    kinfopaneltousContent.innerHTML = '';
    
    // Afficher un loader pendant le chargement
    const loader = document.createElement('div');
    loader.className = 'loading-panel';
    loader.innerHTML = '<div class="loader"></div><p>Chargement des données...</p>';
    kinfopaneltousContent.appendChild(loader);
    
    try {
        // Récupérer les données à jour
        const data = await getMoneyManagementData();
        
        // Supprimer le loader
        kinfopaneltousContent.innerHTML = '';
        
        const resultPanel = document.createElement('div');
        resultPanel.className = 'result-panel';
        
        // Déterminer l'objectif et la BALANCE (revenus - dépenses) selon la période
        const currentGoal = resultPanelData.currentPeriod === 'monthly' 
            ? resultPanelData.monthlyGoal 
            : resultPanelData.yearlyGoal;

        // Calculer la BALANCE (normales seulement)
        const currentIncome = resultPanelData.currentPeriod === 'monthly'
            ? resultPanelData.monthlyIncome
            : resultPanelData.yearlyIncome;

        const currentExpenses = resultPanelData.currentPeriod === 'monthly'
            ? (resultPanelData.monthlyExpenses || 0)
            : (resultPanelData.yearlyExpenses || 0);

        const currentBalance = Math.max(0, currentIncome - currentExpenses);
        
        // Calculer le pourcentage (max 100%) - BASÉ SUR LA BALANCE
        const percentage = currentGoal > 0 
            ? Math.min((currentBalance / currentGoal) * 100, 100) 
            : 0;
        
        // Déterminer si le goal est atteint ou dépassé
        const isGoalReached = percentage >= 100;
        
        // Pour l'affichage du montant sur la barre verte
        const showAmountOnBar = percentage > 10;
        
        // CORRECTION: Quand percentage est 0
        const progressFilledClass = percentage === 0 ? 'progress-filled empty' : 'progress-filled';
        const progressFilledStyle = percentage === 0 
            ? 'width: 0%; min-width: 0; padding-right: 0;' 
            : `width: ${percentage}%`;
        
        // Récupérer les savings
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
            
            <!-- SAVINGS SECTION -->
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
                
                // Mettre à jour avec la nouvelle période
                await getMoneyManagementData(period);
                await showResultPanel();
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
        
    } catch (error) {
        // En cas d'erreur, afficher un message
        kinfopaneltousContent.innerHTML = '';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-panel';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erreur de connexion</h3>
            <p>Impossible de charger les données depuis le serveur</p>
            <button id="retry-btn">Réessayer</button>
        `;
        kinfopaneltousContent.appendChild(errorDiv);
        
        document.getElementById('retry-btn').addEventListener('click', async () => {
            await showResultPanel();
        });
    }
}

// ============================================
// SYSTÈME DE SURVEILLANCE EN TEMPS RÉEL
// ============================================

let lastDataHash = '';
let autoUpdateInterval = null;

async function calculateDataHash() {
    try {
        const data = await loadMoneyDataFromServer();
        if (!data) return '';
        
        // Créer un hash simple des données
        let hash = '';
        if (data.transactions) {
            hash += data.transactions.length.toString();
            data.transactions.forEach(t => {
                hash += t.id + t.amount + t.type + t.saving;
            });
        }
        if (data.monthlyGoals) {
            hash += JSON.stringify(data.monthlyGoals);
        }
        hash += data.yearlyGoal || '0';
        
        return hash;
    } catch (e) {
        return '';
    }
}

async function checkForUpdates() {
    if (window.currentMenuPage !== 'menu-4' || window.isInSelectedView) {
        return;
    }
    
    const currentHash = await calculateDataHash();
    
    if (currentHash && currentHash !== lastDataHash) {
        console.log('🔄 Changement détecté, mise à jour du panel...');
        
        lastDataHash = currentHash;
        
        await getMoneyManagementData();
        await showResultPanel();
        
        const panel = document.querySelector('.kinfopaneltous-container');
        if (panel) {
            panel.style.display = 'none';
            panel.offsetHeight;
            panel.style.display = 'flex';
        }
    }
}

function startAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
    }
    
    // Initialiser le hash
    calculateDataHash().then(hash => {
        lastDataHash = hash;
    });
    
    // Vérifier toutes les 5 secondes
    autoUpdateInterval = setInterval(() => {
        checkForUpdates();
    }, 5000);
    
    console.log('✅ Surveillance automatique démarrée');
}

// ============================================
// INTÉGRATION DANS LE SYSTÈME EXISTANT
// ============================================

// Remplacer les fonctions globales existantes
window.getMoneyManagementData = getMoneyManagementData;
window.showResultPanel = showResultPanel;
window.calculateSavings = calculateSavings;
window.transferSaving = transferSaving;

// Modifier l'initialisation pour utiliser le serveur
document.addEventListener('DOMContentLoaded', function() {
    // ... code existant ...
    
    // DANS LA FONCTION init() OU À LA FIN DU DOMContentLoaded
    // Démarrer la surveillance automatique
    setTimeout(() => {
        startAutoUpdate();
    }, 2000);
});

// ============================================
// CSS POUR LE LOADER ET LES MESSAGES D'ERREUR
// ============================================

const style = document.createElement('style');
style.textContent = `
    .loading-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: white;
    }
    
    .loader {
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top: 4px solid #3498db;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 20px;
        text-align: center;
        color: white;
    }
    
    .error-panel i {
        font-size: 48px;
        color: #e74c3c;
        margin-bottom: 20px;
    }
    
    .error-panel h3 {
        margin-bottom: 10px;
        color: #e74c3c;
    }
    
    .error-panel p {
        margin-bottom: 20px;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .error-panel button {
        background: #3498db;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .error-panel button:hover {
        background: #2980b9;
    }
`;

document.head.appendChild(style);

// ============================================
// FONCTIONS DE DÉBOGAGE
// ============================================

// Exposer les fonctions pour débogage
window.debugMoneyManager = {
    loadData: async function() {
        console.log('📥 Chargement manuel des données...');
        const data = await loadMoneyDataFromServer();
        console.log('Données:', data);
        return data;
    },
    
    saveData: async function(testData) {
        console.log('💾 Sauvegarde manuelle...');
        const result = await saveMoneyDataToServer(testData);
        console.log('Résultat:', result);
        return result;
    },
    
    checkConnection: async function() {
        try {
            const response = await fetch(`${ESP_SERVER}/checkMac`);
            if (response.ok) {
                const data = await response.json();
                console.log('Connexion serveur:', data);
                return data;
            }
        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            return null;
        }
    },
    
    clearCache: function() {
        lastDataHash = '';
        console.log('✅ Cache nettoyé');
    }
};

console.log('✅ Menu-4 Money Manager initialisé avec serveur Mac');
