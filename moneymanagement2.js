document.addEventListener('DOMContentLoaded', function() {
    const menu4Content = document.getElementById('menu4Content');
    if (!menu4Content) return;
    
    let transactions = [];
    let investments = [];
    let monthlyGoals = {};
    let yearlyGoal = 0;
    let currentFilter = 'all';
    let currentYearView = 'current';
    let longTermOffset = 0;
    
    // Configuration Supabase
    const supabaseUrl = 'https://obetden7wnehmdknbt0meag.supabase.co';
    const supabaseKey = 'sb_publishable_ObETdEn7WNehMDkNt0meag_ubB_n7VK';
    const supabaseHeaders = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };
    
    // Éléments DOM
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const dateInput = document.getElementById('date');
    const goalAmountInput = document.getElementById('goalAmount');
    const goalAllAmountInput = document.getElementById('goalAllAmount');
    const transactionTypeSelect = document.getElementById('transactionType');
    const categorySelect = document.getElementById('category');
    const allBtn = document.getElementById('allBtn');
    const monthlyBtn = document.getElementById('monthlyBtn');
    const recentTransactionsTitle = document.getElementById('recentTransactionsTitle');
    const transactionsSummary = document.getElementById('transactionsSummary');
    const leftLegendText = document.getElementById('leftLegendText');
    const rightLegendText = document.getElementById('rightLegendText');
    const longTermContent = document.getElementById('longTermContent');
    const prevDaysBtn = document.getElementById('prevDaysBtn');
    const nextDaysBtn = document.getElementById('nextDaysBtn');
    
    let expensePieChart, incomePieChart, monthlyBarChart;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;
    
    // ============================================
    // FONCTIONS SUPABASE - STOCKAGE EN LIGNE UNIQUEMENT
    // ============================================
    
    // Générer un ID unique de session
    function getSessionId() {
        let sessionId = sessionStorage.getItem('money_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('money_session_id', sessionId);
        }
        return sessionId;
    }
    
    // Vérifier la connexion Internet
    async function checkInternetConnection() {
        try {
            const response = await fetch('https://www.google.com', { mode: 'no-cors' });
            return true;
        } catch (error) {
            return false;
        }
    }
    
    // Sauvegarder TOUT sur Supabase
    async function saveAllToSupabase() {
        const sessionId = getSessionId();
        
        try {
            // Préparer les données
            const dataToSave = {
                session_id: sessionId,
                transactions: JSON.stringify(transactions),
                investments: JSON.stringify(investments),
                monthly_goals: JSON.stringify(monthlyGoals),
                yearly_goal: yearlyGoal,
                total_transactions: transactions.length,
                total_investments: investments.length,
                last_updated: new Date().toISOString(),
                device_info: navigator.userAgent,
                timestamp: Date.now()
            };
            
            console.log('📤 Envoi des données à Supabase...', dataToSave);
            
            // Vérifier la taille des données
            const dataSize = JSON.stringify(dataToSave).length;
            if (dataSize > 50000) { // 50KB max
                console.warn('⚠️ Données volumineuses:', dataSize, 'bytes');
            }
            
            // Sauvegarder sur Supabase
            const response = await fetch(`${supabaseUrl}/rest/v1/money_storage`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify(dataToSave)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Supabase error ${response.status}: ${errorText}`);
            }
            
            console.log('✅ DONNÉES SAUVEGARDÉES SUR SUPABASE !');
            console.log('📊 Statistiques:');
            console.log('- Transactions:', transactions.length);
            console.log('- Investissements:', investments.length);
            console.log('- Objectifs mensuels:', Object.keys(monthlyGoals).length);
            console.log('- Session ID:', sessionId);
            
            // Afficher une notification à l'utilisateur
            showNotification('✅ Données sauvegardées en ligne !', 'success');
            
            return true;
            
        } catch (error) {
            console.error('❌ ERREUR SUPABASE CRITIQUE:', error);
            showNotification('❌ Erreur de sauvegarde en ligne', 'error');
            
            // En cas d'erreur, on peut essayer une méthode alternative
            await saveBackupToSupabase();
            return false;
        }
    }
    
    // Méthode de backup pour Supabase
    async function saveBackupToSupabase() {
        try {
            const sessionId = getSessionId();
            
            // Format simplifié pour contourner les problèmes
            const backupData = {
                session_id: sessionId,
                data_summary: {
                    transaction_count: transactions.length,
                    investment_count: investments.length,
                    goal_count: Object.keys(monthlyGoals).length,
                    total_balance: calculateTotalBalance(),
                    last_updated: new Date().toISOString()
                },
                raw_data: btoa(encodeURIComponent(JSON.stringify({
                    t: transactions,
                    i: investments,
                    m: monthlyGoals,
                    y: yearlyGoal
                }))),
                backup_timestamp: Date.now()
            };
            
            const response = await fetch(`${supabaseUrl}/rest/v1/money_backup`, {
                method: 'POST',
                headers: supabaseHeaders,
                body: JSON.stringify(backupData)
            });
            
            if (response.ok) {
                console.log('✅ Backup envoyé à Supabase');
                return true;
            }
        } catch (error) {
            console.error('❌ Backup échoué:', error);
        }
        return false;
    }
    
    // Charger depuis Supabase
    async function loadFromSupabase() {
        const sessionId = getSessionId();
        
        try {
            console.log('📥 Chargement depuis Supabase...');
            
            // D'abord essayer la table principale
            const response = await fetch(
                `${supabaseUrl}/rest/v1/money_storage?session_id=eq.${sessionId}&order=last_updated.desc&limit=1`,
                {
                    method: 'GET',
                    headers: supabaseHeaders
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const latestData = data[0];
                    
                    // Récupérer les données
                    transactions = JSON.parse(latestData.transactions || '[]');
                    investments = JSON.parse(latestData.investments || '[]');
                    monthlyGoals = JSON.parse(latestData.monthly_goals || '{}');
                    yearlyGoal = latestData.yearly_goal || 0;
                    
                    console.log('✅ Données chargées depuis Supabase:');
                    console.log('- Transactions:', transactions.length);
                    console.log('- Dernière mise à jour:', latestData.last_updated);
                    
                    showNotification('✅ Données chargées depuis le cloud', 'success');
                    return true;
                }
            }
            
            console.log('ℹ️ Aucune donnée trouvée pour cette session');
            return false;
            
        } catch (error) {
            console.error('❌ Erreur de chargement Supabase:', error);
            showNotification('❌ Impossible de charger depuis le cloud', 'error');
            return false;
        }
    }
    
    // Synchronisation complète
    async function syncWithSupabase() {
        console.log('🔄 Synchronisation avec Supabase...');
        
        try {
            // 1. Charger d'abord depuis Supabase
            const loaded = await loadFromSupabase();
            
            // 2. Mettre à jour l'interface
            updateDashboard();
            
            // 3. Si on n'a pas pu charger, on sauvegarde les données actuelles
            if (!loaded && (transactions.length > 0 || Object.keys(monthlyGoals).length > 0)) {
                await saveAllToSupabase();
            }
            
            console.log('✅ Synchronisation terminée');
            
        } catch (error) {
            console.error('❌ Erreur de synchronisation:', error);
        }
    }
    
    // Fonction utilitaire pour afficher les notifications
    function showNotification(message, type = 'info') {
        // Créer la notification
        const notification = document.createElement('div');
        notification.className = `supabase-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Style de la notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 400px;
            animation: slideIn 0.3s ease;
            font-family: Arial, sans-serif;
        `;
        
        // Style du contenu
        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        `;
        
        // Style du bouton fermer
        notification.querySelector('.notification-close').style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            margin-left: 15px;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Ajouter l'animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Fermer la notification
        notification.querySelector('.notification-close').onclick = () => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        };
        
        // Auto-fermer après 5 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Ajouter au DOM
        document.body.appendChild(notification);
    }
    
    // ============================================
    // FONCTIONS DE L'APPLICATION
    // ============================================
    
    function getMonthNames() {
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
    
    function getLast12Months(yearOffset = 0) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() - yearOffset;
        const months = getMonthNames();
        
        let startMonth = yearOffset === 1 ? 11 : currentDate.getMonth();
        let startYear = currentYear;
        
        const monthLabels = [];
        const monthKeys = [];
        
        for (let i = 0; i < 12; i++) {
            let monthIndex = (startMonth - i + 12) % 12;
            let year = startYear;
            
            if (startMonth - i < 0) {
                year = startYear - 1;
            }
            
            monthLabels.unshift(months[monthIndex] + ' ' + year);
            monthKeys.unshift(`${year}-${String(monthIndex + 1).padStart(2, '0')}`);
        }
        
        return { labels: monthLabels, keys: monthKeys };
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    function formatShortDate(date) {
        const day = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }
    
    function getDayName(date) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    function calculateTotalBalance() {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        return totalIncome - totalExpenses;
    }
    
    function getColor(index) {
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c'];
        return colors[index % colors.length];
    }
    
    function updateDashboard() {
        updateView();
        updateSummary();
        updateRecentTransactionsSummary();
        updateCharts();
        updateHorizontalBarGraph();
        updateLongTermSection();
        
        // SAUVEGARDE AUTOMATIQUE SUR SUPABASE
        saveAllToSupabase().catch(error => {
            console.error('Auto-save failed:', error);
        });
    }
    
    function updateLongTermSection() {
        if (!longTermContent) return;
        
        const days = [];
        const today = new Date();
        
        const startOffset = longTermOffset * 6;
        
        for (let i = 0; i < 6; i++) {
            const day = new Date(today);
            day.setDate(today.getDate() - startOffset - i);
            days.push(day);
        }
        
        days.sort((a, b) => b - a);
        
        longTermContent.innerHTML = '';
        
        days.forEach(day => {
            const dayCard = document.createElement('div');
            dayCard.className = 'day-card';
            
            const dayTransactions = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getDate() === day.getDate() &&
                       tDate.getMonth() === day.getMonth() &&
                       tDate.getFullYear() === day.getFullYear();
            });
            
            dayCard.innerHTML = `
                <div class="day-number">${day.getDate()}</div>
                <div class="day-transactions-list">
                    ${dayTransactions.length > 0 ? 
                        dayTransactions.map(t => `
                            <div class="transaction-day-item ${t.type}">
                                <div class="transaction-day-category">${t.category}</div>
                                <div class="transaction-day-amount ${t.type === 'income' ? 'income-amount' : 'expense-amount'}">
                                    ${t.type === 'income' ? '+' : '-'}£${t.amount.toFixed(2)}
                                </div>
                            </div>
                        `).join('') 
                        : 
                        '<div class="no-transactions-day">No transactions</div>'
                    }
                </div>
            `;
            
            longTermContent.appendChild(dayCard);
        });
        
        const titleElement = document.querySelector('.long-term-section .section-title2');
        if (titleElement) {
            if (longTermOffset === 0) {
                titleElement.innerHTML = '<i class="fas fa-line-chart"></i> Last 6 Days';
            } else {
                const startDate = new Date(today);
                startDate.setDate(today.getDate() - (longTermOffset * 6) - 5);
                const endDate = new Date(today);
                endDate.setDate(today.getDate() - (longTermOffset * 6));
                
                titleElement.innerHTML = `<i class="fas fa-line-chart"></i> ${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
            }
        }
    }
    
    function calculateCategoryData() {
        const categories = [
            'General', 'Trading', 'Food', 'Order', 
            'Shopping', 'Investment', 'Salary', 'Bills', 'Other'
        ];
        
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;
        
        let selectedYear = currentYear;
        if (currentYearView === 'previous') {
            selectedYear = previousYear;
        }
        
        const categoryExpenses = {};
        const categoryIncome = {};
        
        categories.forEach(cat => {
            categoryExpenses[cat] = 0;
            categoryIncome[cat] = 0;
        });
        
        transactions.forEach(transaction => {
            const transDate = new Date(transaction.date);
            const transYear = transDate.getFullYear();
            
            if (transYear === selectedYear) {
                if (transaction.type === 'expense') {
                    categoryExpenses[transaction.category] += transaction.amount;
                } else if (transaction.type === 'income') {
                    categoryIncome[transaction.category] += transaction.amount;
                }
            }
        });
        
        const validCategories = [];
        const expensesData = [];
        const incomeData = [];
        
        categories.forEach(cat => {
            if (categoryExpenses[cat] > 0 || categoryIncome[cat] > 0) {
                validCategories.push(cat);
                expensesData.push(categoryExpenses[cat]);
                incomeData.push(categoryIncome[cat]);
            }
        });
        
        if (validCategories.length === 0) {
            return {
                categories: [],
                expenses: [],
                income: []
            };
        }
        
        return {
            categories: validCategories,
            expenses: expensesData,
            income: incomeData
        };
    }
    
    function updateHorizontalBarGraph() {
        const yAxis = document.getElementById('yAxis');
        const barsContainer = document.getElementById('barsContainer');
        const xAxisSpectrum = document.getElementById('xAxisSpectrum');
        
        if (!yAxis || !barsContainer || !xAxisSpectrum) return;
        
        const categoryData = calculateCategoryData();
        const categories = categoryData.categories;
        const expensesData = categoryData.expenses;
        const incomeData = categoryData.income;
        
        if (leftLegendText && rightLegendText) {
            const yearText = currentYearView === 'current' ? 'Current Year' : 'Previous Year';
            leftLegendText.textContent = `${yearText} Expenses`;
            rightLegendText.textContent = `${yearText} Income`;
        }
        
        yAxis.innerHTML = '';
        barsContainer.innerHTML = '';
        xAxisSpectrum.innerHTML = '';
        
        if (categories.length === 0) {
            const noDataMessage = document.createElement('div');
            noDataMessage.className = 'no-data';
            noDataMessage.innerHTML = `
                <i class="fas fa-chart-bar"></i>
                <div>No data available for selected year</div>
            `;
            barsContainer.appendChild(noDataMessage);
            
            const zeroLabel = document.createElement('div');
            zeroLabel.className = 'spectrum-label';
            zeroLabel.textContent = '0';
            zeroLabel.style.left = '50%';
            xAxisSpectrum.appendChild(zeroLabel);
            
            return;
        }
        
        const maxExpense = Math.max(...expensesData);
        const maxIncome = Math.max(...incomeData);
        const maxValue = Math.max(maxExpense, maxIncome);
        
        let maxDisplayValue;
        if (maxValue === 0) {
            maxDisplayValue = 1000;
        } else {
            if (maxValue < 500) {
                maxDisplayValue = Math.ceil(maxValue / 100) * 100;
            } else if (maxValue < 2000) {
                maxDisplayValue = Math.ceil(maxValue / 500) * 500;
            } else {
                maxDisplayValue = Math.ceil(maxValue / 1000) * 1000;
            }
        }
        
        maxDisplayValue = Math.max(maxDisplayValue, 1000);
        
        const numIntervals = 4;
        const intervalValue = maxDisplayValue / numIntervals;
        const pixelsPerValue = 50 / maxDisplayValue;
        
        categories.forEach((category, index) => {
            const categoryLabel = document.createElement('div');
            categoryLabel.className = 'category-label';
            categoryLabel.textContent = category;
            categoryLabel.style.height = `${100 / categories.length}%`;
            categoryLabel.style.display = 'flex';
            categoryLabel.style.alignItems = 'center';
            categoryLabel.style.justifyContent = 'flex-end';
            yAxis.appendChild(categoryLabel);
            
            const barGroup = document.createElement('div');
            barGroup.className = 'bar-group';
            
            const topPercentage = (index * 100) / categories.length;
            barGroup.style.top = `${topPercentage}%`;
            barGroup.style.height = `${100 / categories.length}%`;
            barGroup.style.display = 'flex';
            barGroup.style.alignItems = 'center';
            
            const expenseValue = expensesData[index];
            const incomeValue = incomeData[index];
            
            const expenseWidth = Math.min(expenseValue * pixelsPerValue, 50);
            const incomeWidth = Math.min(incomeValue * pixelsPerValue, 50);
            
            if (expenseValue > 0) {
                const leftBar = document.createElement('div');
                leftBar.className = 'bar left-bar';
                leftBar.style.width = '0%';
                leftBar.style.right = '50%';
                leftBar.style.height = '70%';
                
                if (expenseValue >= 1000) {
                    leftBar.textContent = `£${(expenseValue / 1000).toFixed(1)}k`;
                } else {
                    leftBar.textContent = `£${expenseValue.toFixed(0)}`;
                }
                barGroup.appendChild(leftBar);
                
                setTimeout(() => {
                    leftBar.style.width = `${expenseWidth}%`;
                }, 50 + (index * 100));
            }
            
            if (incomeValue > 0) {
                const rightBar = document.createElement('div');
                rightBar.className = 'bar right-bar';
                rightBar.style.width = '0%';
                rightBar.style.left = '50%';
                rightBar.style.height = '70%';
                
                if (incomeValue >= 1000) {
                    rightBar.textContent = `£${(incomeValue / 1000).toFixed(1)}k`;
                } else {
                    rightBar.textContent = `£${incomeValue.toFixed(0)}`;
                }
                barGroup.appendChild(rightBar);
                
                setTimeout(() => {
                    rightBar.style.width = `${incomeWidth}%`;
                }, 50 + (index * 100));
            }
            
            barsContainer.appendChild(barGroup);
        });
        
        for (let i = 1; i <= numIntervals; i++) {
            const value = i * intervalValue;
            
            const leftTick = document.createElement('div');
            leftTick.className = 'spectrum-tick';
            const leftPosition = 50 - (value * pixelsPerValue);
            leftTick.style.left = `${leftPosition}%`;
            xAxisSpectrum.appendChild(leftTick);
            
            const leftLabel = document.createElement('div');
            leftLabel.className = 'spectrum-label';
            if (value >= 1000) {
                leftLabel.textContent = `-£${(value / 1000).toFixed(1)}k`;
            } else {
                leftLabel.textContent = `-£${Math.round(value)}`;
            }
            leftLabel.style.left = `${leftPosition}%`;
            xAxisSpectrum.appendChild(leftLabel);
            
            const rightTick = document.createElement('div');
            rightTick.className = 'spectrum-tick';
            const rightPosition = 50 + (value * pixelsPerValue);
            rightTick.style.left = `${rightPosition}%`;
            xAxisSpectrum.appendChild(rightTick);
            
            const rightLabel = document.createElement('div');
            rightLabel.className = 'spectrum-label';
            if (value >= 1000) {
                rightLabel.textContent = `£${(value / 1000).toFixed(1)}k`;
            } else {
                rightLabel.textContent = `£${Math.round(value)}`;
            }
            rightLabel.style.left = `${rightPosition}%`;
            xAxisSpectrum.appendChild(rightLabel);
        }
        
        const zeroTick = document.createElement('div');
        zeroTick.className = 'spectrum-tick zero-tick';
        zeroTick.style.left = '50%';
        xAxisSpectrum.appendChild(zeroTick);
        
        const zeroLabel = document.createElement('div');
        zeroLabel.className = 'spectrum-label';
        zeroLabel.textContent = '0';
        zeroLabel.style.left = '50%';
        zeroLabel.style.transform = 'translateX(-50%)';
        xAxisSpectrum.appendChild(zeroLabel);
    }
    
    function updateView() {
        const list = document.getElementById('transactionsList');
        if (!list) return;
        
        let filtered;
        
        if (currentFilter === 'month') {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            filtered = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
            });
        } else {
            filtered = transactions;
        }
        
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exchange-alt"></i>
                    <div>No transactions yet</div>
                </div>
            `;
            return;
        }
        
        let html = '';
        filtered.slice(0, 8).forEach(transaction => {
            const sign = transaction.type === 'income' ? '+' : '-';
            const amountClass = transaction.type === 'income' ? 'transaction-income' : 'transaction-expense';
            
            html += `
                <div class="transaction-item" data-id="${transaction.id}">
                    <div class="transaction-info">
                        <div class="transaction-category">${transaction.category}</div>
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-date">${formatDate(transaction.date)}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${sign}£${transaction.amount.toFixed(2)}
                    </div>
                    <div class="transaction-actions">
                        <button class="trash-icon-btn" onclick="deleteTransaction(${transaction.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    }
    
    window.deleteTransaction = function(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(t => t.id !== id);
            updateDashboard();
        }
    }
    
    function updateRecentTransactionsSummary() {
        let filtered;
        
        if (currentFilter === 'month') {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            filtered = transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
            });
        } else {
            filtered = transactions;
        }
        
        const totalIncome = filtered
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = filtered
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const balance = totalIncome - totalExpenses;
        
        if (document.getElementById('recentIncome')) {
            document.getElementById('recentIncome').textContent = '£' + totalIncome.toFixed(2);
        }
        
        if (document.getElementById('recentExpenses')) {
            document.getElementById('recentExpenses').textContent = '£' + totalExpenses.toFixed(2);
        }
        
        if (document.getElementById('recentBalance')) {
            document.getElementById('recentBalance').textContent = '£' + balance.toFixed(2);
        }
    }
    
    function clearAllTransactions() {
        if (transactions.length === 0) {
            return;
        }
        
        if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
            transactions = [];
            investments = [];
            monthlyGoals = {};
            yearlyGoal = 0;
            updateDashboard();
        }
    }
    
    function updateSummary() {
        const balance = calculateTotalBalance();

        if (document.getElementById('currentBalanceControl')) {
            document.getElementById('currentBalanceControl').textContent = '£' + balance.toFixed(2);
        }
        
        if (document.getElementById('totalTransactions')) {
            document.getElementById('totalTransactions').textContent = transactions.length;
        }
    }
    
    function initCharts() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js n\'est pas chargé');
            setTimeout(initCharts, 100);
            return;
        }
        
        const expensePieCanvas = document.getElementById('expensePieChart');
        if (expensePieCanvas) {
            const expensePieCtx = expensePieCanvas.getContext('2d');
            expensePieChart = new Chart(expensePieCtx, {
                type: 'pie',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
        const incomePieCanvas = document.getElementById('incomePieChart');
        if (incomePieCanvas) {
            const incomePieCtx = incomePieCanvas.getContext('2d');
            incomePieChart = new Chart(incomePieCtx, {
                type: 'pie',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: ['#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#34495e', '#f1c40f']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
        const monthlyBarCanvas = document.getElementById('monthlyBarChart');
        if (monthlyBarCanvas) {
            const monthlyBarCtx = monthlyBarCanvas.getContext('2d');
            monthlyBarChart = new Chart(monthlyBarCtx, {
                type: 'bar',
                data: {
                    labels: getLast12Months().labels,
                    datasets: [
                        {
                            label: 'Goal',
                            data: [],
                            backgroundColor: 'rgba(52, 152, 219, 0.5)',
                            borderColor: '#3498db',
                            borderWidth: 1,
                            type: 'bar'
                        },
                        {
                            label: 'Income',
                            data: [],
                            backgroundColor: 'rgba(46, 204, 113, 0.5)',
                            borderColor: '#2ecc71',
                            borderWidth: 1,
                            type: 'bar'
                        },
                        {
                            label: 'Expenses',
                            data: [],
                            backgroundColor: 'rgba(231, 76, 60, 0.5)',
                            borderColor: '#e74c3c',
                            borderWidth: 1,
                            type: 'bar'
                        },
                        {
                            label: 'Balance Trend',
                            data: [],
                            backgroundColor: 'rgba(155, 89, 182, 0.2)',
                            borderColor: '#9b59b6',
                            borderWidth: 2,
                            fill: true,
                            type: 'line',
                            tension: 0.3,
                            pointBackgroundColor: '#9b59b6',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 1,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    scales: {
                        x: {
                            stacked: false,
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                font: {
                                    size: 8
                                },
                                color: 'white'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            stacked: false,
                            ticks: {
                                font: {
                                    size: 8
                                },
                                color: 'white',
                                callback: function(value) {
                                    return '£' + value;
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: '#3498db',
                            borderWidth: 1
                        }
                    }
                }
            });
        }
    }
    
    function updateCharts() {
        if (expensePieChart) {
            const expenses = transactions.filter(t => t.type === 'expense');
            const expenseCategories = {};
            expenses.forEach(expense => {
                if (!expenseCategories[expense.category]) {
                    expenseCategories[expense.category] = 0;
                }
                expenseCategories[expense.category] += expense.amount;
            });
            
            expensePieChart.data.labels = Object.keys(expenseCategories);
            expensePieChart.data.datasets[0].data = Object.values(expenseCategories);
            expensePieChart.update();
        }
        
        if (incomePieChart) {
            const incomes = transactions.filter(t => t.type === 'income');
            const incomeCategories = {};
            incomes.forEach(income => {
                if (!incomeCategories[income.category]) {
                    incomeCategories[income.category] = 0;
                }
                incomeCategories[income.category] += income.amount;
            });
            
            incomePieChart.data.labels = Object.keys(incomeCategories);
            incomePieChart.data.datasets[0].data = Object.values(incomeCategories);
            incomePieChart.update();
        }
        
        if (monthlyBarChart) {
            const monthData = getLast12Months(currentYearView === 'previous' ? 1 : 0);
            monthlyBarChart.data.labels = monthData.labels;
            
            const goalData = [];
            const incomeData = [];
            const expenseData = [];
            const balanceTrendData = [];
            
            monthData.keys.forEach(monthKey => {
                const [year, month] = monthKey.split('-');
                const monthStart = new Date(year, month - 1, 1);
                const monthEnd = new Date(year, month, 0);
                
                const monthTransactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate >= monthStart && tDate <= monthEnd;
                });
                
                const monthIncome = monthTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const monthExpense = monthTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                
                incomeData.push(monthIncome);
                expenseData.push(monthExpense);
                
                const monthBalance = monthIncome - monthExpense;
                balanceTrendData.push(monthBalance);
                
                const goalKey = `${year}-${month}`;
                const goalForMonth = monthlyGoals[goalKey] || 0;
                goalData.push(goalForMonth);
            });
            
            monthlyBarChart.data.datasets[0].data = goalData;
            monthlyBarChart.data.datasets[1].data = incomeData;
            monthlyBarChart.data.datasets[2].data = expenseData;
            monthlyBarChart.data.datasets[3].data = balanceTrendData;
            monthlyBarChart.update();
        }
    }
    
    function addTransaction() {
        const amount = parseFloat(amountInput.value);
        const description = descriptionInput.value.trim();
        const date = dateInput.value;
        const type = transactionTypeSelect.value;
        const category = categorySelect.value;
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        if (!description) {
            alert('Please enter a description');
            return;
        }
        
        if (!date) {
            alert('Please select a date');
            return;
        }
        
        const transaction = {
            id: Date.now(),
            amount: amount,
            category: category,
            description: description,
            date: date,
            type: type,
            timestamp: new Date().getTime()
        };
        
        transactions.push(transaction);
        updateDashboard();
        
        amountInput.value = '';
        descriptionInput.value = '';
    }
    
    function setGoal() {
        const amount = parseFloat(goalAmountInput.value);
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid goal amount');
            return;
        }
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const goalKey = `${currentYear}-${currentMonth}`;
        
        monthlyGoals[goalKey] = amount;
        updateDashboard();
        
        goalAmountInput.value = '';
    }
    
    function setAllGoals() {
        const amount = parseFloat(goalAllAmountInput.value);
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid goal amount');
            return;
        }
        
        yearlyGoal = amount;
        updateDashboard();
        
        goalAllAmountInput.value = '';
    }
    
    // Ajouter un bouton de vérification Supabase
    function addSupabaseStatusButton() {
        const statusBtn = document.createElement('button');
        statusBtn.id = 'supabaseStatusBtn';
        statusBtn.className = 'supabase-status-btn';
        statusBtn.innerHTML = '<i class="fas fa-cloud"></i> Supabase';
        statusBtn.title = 'Vérifier la connexion à Supabase';
        
        statusBtn.addEventListener('click', async function() {
            statusBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
            statusBtn.disabled = true;
            
            try {
                // Test de connexion
                const testResponse = await fetch(`${supabaseUrl}/rest/v1/money_storage?select=count`, {
                    headers: { 'apikey': supabaseKey }
                });
                
                if (testResponse.ok) {
                    // Vérifier les données
                    const dataResponse = await fetch(
                        `${supabaseUrl}/rest/v1/money_storage?session_id=eq.${getSessionId()}&order=last_updated.desc&limit=1`,
                        { headers: { 'apikey': supabaseKey } }
                    );
                    
                    if (dataResponse.ok) {
                        const data = await dataResponse.json();
                        if (data.length > 0) {
                            const lastUpdate = new Date(data[0].last_updated);
                            alert(`✅ Supabase connecté !\n\n📊 Dernière sauvegarde: ${lastUpdate.toLocaleString()}\n📈 Transactions: ${JSON.parse(data[0].transactions).length}\n💾 Taille: ${Math.round(JSON.stringify(data[0]).length / 1024)} KB`);
                        } else {
                            alert('✅ Supabase connecté !\n\nℹ️ Aucune donnée sauvegardée pour cette session.');
                        }
                    }
                } else {
                    alert('❌ Impossible de se connecter à Supabase');
                }
            } catch (error) {
                alert('❌ Erreur de connexion à Supabase');
            }
            
            statusBtn.innerHTML = '<i class="fas fa-cloud"></i> Supabase';
            statusBtn.disabled = false;
        });
        
        // Ajouter au header
        const header = document.querySelector('.section-title:first-of-type');
        if (header) {
            header.appendChild(statusBtn);
        }
    }
    
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const setGoalBtn = document.getElementById('setGoalBtn');
    const setAllGoalBtn = document.getElementById('setAllGoalBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    if (addTransactionBtn) addTransactionBtn.addEventListener('click', addTransaction);
    if (setGoalBtn) setGoalBtn.addEventListener('click', setGoal);
    if (setAllGoalBtn) setAllGoalBtn.addEventListener('click', setAllGoals);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllTransactions);
    
    if (allBtn) {
        allBtn.addEventListener('click', function() {
            allBtn.classList.add('active');
            monthlyBtn.classList.remove('active');
            currentFilter = 'all';
            updateView();
            updateRecentTransactionsSummary();
        });
    }
    
    if (monthlyBtn) {
        monthlyBtn.addEventListener('click', function() {
            monthlyBtn.classList.add('active');
            allBtn.classList.remove('active');
            currentFilter = 'month';
            updateView();
            updateRecentTransactionsSummary();
        });
    }
    
    if (prevDaysBtn) {
        prevDaysBtn.addEventListener('click', function() {
            longTermOffset++;
            updateLongTermSection();
        });
    }
    
    if (nextDaysBtn) {
        nextDaysBtn.addEventListener('click', function() {
            if (longTermOffset > 0) {
                longTermOffset--;
                updateLongTermSection();
            }
        });
    }
    
    document.querySelectorAll('.category-balance-section .month-btn[data-year]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-balance-section .month-btn[data-year]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentYearView = this.dataset.year;
            updateHorizontalBarGraph();
        });
    });
    
    document.querySelectorAll('.monthly-section .month-btn[data-year]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.monthly-section .month-btn[data-year]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentYearView = this.dataset.year;
            updateCharts();
        });
    });
    
    async function initApp() {
        console.log("🚀 Initialisation de l'application Money Management");
        
        // Ajouter le bouton de status Supabase
        addSupabaseStatusButton();
        
        // Initialiser les graphiques
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            script.onload = async function() {
                initCharts();
                
                // CHARGER DIRECTEMENT DEPUIS SUPABASE
                console.log('⬇️ Chargement depuis Supabase...');
                const loaded = await loadFromSupabase();
                
                if (!loaded) {
                    console.log('ℹ️ Aucune donnée sur Supabase, démarrage avec données vides');
                    transactions = [];
                    investments = [];
                    monthlyGoals = {};
                    yearlyGoal = 0;
                }
                
                updateDashboard();
            };
            document.head.appendChild(script);
        } else {
            initCharts();
            
            // CHARGER DIRECTEMENT DEPUIS SUPABASE
            console.log('⬇️ Chargement depuis Supabase...');
            const loaded = await loadFromSupabase();
            
            if (!loaded) {
                console.log('ℹ️ Aucune donnée sur Supabase, démarrage avec données vides');
                transactions = [];
                investments = [];
                monthlyGoals = {};
                yearlyGoal = 0;
            }
            
            updateDashboard();
        }
        
        console.log("✅ Application Money Management initialisée (100% Supabase)");
    }
    
    initApp();
    
    window.addEventListener('resize', function() {
        setTimeout(updateCharts, 100);
        setTimeout(updateHorizontalBarGraph, 100);
    });
    
    // Sauvegarde automatique toutes les 30 secondes
    setInterval(() => {
        if (transactions.length > 0 || Object.keys(monthlyGoals).length > 0) {
            saveAllToSupabase().catch(console.error);
        }
    }, 30000);
    
    // Sauvegarder avant de quitter la page
    window.addEventListener('beforeunload', function() {
        if (transactions.length > 0 || Object.keys(monthlyGoals).length > 0) {
            // Sauvegarde synchrone (peut ralentir un peu)
            navigator.sendBeacon(
                `${supabaseUrl}/rest/v1/money_storage`,
                JSON.stringify({
                    session_id: getSessionId(),
                    transactions: JSON.stringify(transactions),
                    investments: JSON.stringify(investments),
                    monthly_goals: JSON.stringify(monthlyGoals),
                    yearly_goal: yearlyGoal,
                    last_updated: new Date().toISOString(),
                    exit_save: true
                })
            );
        }
    });
});
