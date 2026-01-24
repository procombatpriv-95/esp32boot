document.addEventListener('DOMContentLoaded', function() {
    const menu4Content = document.getElementById('menu4Content');
    if (!menu4Content) return;
    
    // ===== VARIABLES DE DONNÉES =====
    let transactions = [];
    let investments = [];
    let monthlyGoals = {};
    let yearlyGoal = 0;
    let currentFilter = 'all';
    let currentYearView = 'current';
    let longTermOffset = 0;
    let currentTransactionForSaving = null;
    
    // ===== VARIABLES DOM =====
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const dateInput = document.getElementById('date');
    const goalAmountInput = document.getElementById('goalAmount');
    const goalAllAmountInput = document.getElementById('goalAllAmount');
    const transactionTypeSelect = document.getElementById('transactionType');
    const categorySelect = document.getElementById('category');
    const savingTypeSelect = document.getElementById('savingType');
    const allBtn = document.getElementById('allBtn');
    const monthlyBtn = document.getElementById('monthlyBtn');
    const recentTransactionsTitle = document.getElementById('recentTransactionsTitle');
    const transactionsSummary = document.getElementById('transactionsSummary');
    const leftLegendText = document.getElementById('leftLegendText');
    const rightLegendText = document.getElementById('rightLegendText');
    const longTermContent = document.getElementById('longTermContent');
    const prevDaysBtn = document.getElementById('prevDaysBtn');
    const nextDaysBtn = document.getElementById('nextDaysBtn');
    const savingPopupOverlay = document.getElementById('savingPopupOverlay');
    const closePopupBtn = document.getElementById('closePopupBtn');
    const savingSelect = document.getElementById('savingSelect');
    const transferAmountInput = document.getElementById('transferAmount');
    const selectedSavingText = document.getElementById('selectedSavingText');
    const errorMessage = document.getElementById('errorMessage');
    const confirmTransferBtn = document.getElementById('confirmTransferBtn');
    
    // ===== VARIABLES DES GRAPHIQUES =====
    let monthlyBarChart = null;
    let categoryBarVerticalChart = null;
    
    // ===== CONFIGURATION =====
    // Date du jour
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;
    
    // ===== FONCTIONS UTILITAIRES =====
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
            .filter(t => t.type === 'income' && t.saving === 'normal')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = transactions
            .filter(t => t.type === 'expense' && t.saving === 'normal')
            .reduce((sum, t) => sum + t.amount, 0);
            
        return totalIncome - totalExpenses;
    }
    
    function calculateTotalSavings() {
        let totalSaving = 0;
        
        transactions.forEach(t => {
            if (t.saving === 'saving1' || t.saving === 'saving2' || t.saving === 'saving3') {
                if (t.type === 'income') {
                    totalSaving += t.amount;
                } else if (t.type === 'expense') {
                    totalSaving -= t.amount;
                }
            }
        });
        
        return totalSaving;
    }
    
    function calculateSavingsTotal() {
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
    }
    
    function getColor(index) {
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c'];
        return colors[index % colors.length];
    }
    
    // ===== FONCTIONS COMMUNICATION SERVEUR =====
    async function saveMoneyDataToServer(data) {
        console.log('💾 Sauvegarde des données sur le serveur Mac...');
        
        try {
            const response = await fetch('/saveMoneyManager?data=' + encodeURIComponent(JSON.stringify(data)), {
                method: 'GET'
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Données sauvegardées sur le Mac');
                return result;
            } else {
                throw new Error('Erreur HTTP: ' + response.status);
            }
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            showNotification('⚠️ Impossible de sauvegarder sur le serveur Mac', 'warning');
            return { success: false, error: error.message };
        }
    }
    
    async function loadMoneyDataFromServer() {
        console.log('📥 Chargement des données depuis le serveur Mac...');
        
        try {
            const response = await fetch('/loadMoneyManager');
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Données chargées depuis le Mac');
                return data;
            } else {
                throw new Error('Erreur HTTP: ' + response.status);
            }
        } catch (error) {
            console.error('❌ Erreur chargement:', error);
            showNotification('⚠️ Impossible de charger depuis le serveur Mac', 'warning');
            return {
                transactions: [],
                investments: [],
                monthlyGoals: {},
                yearlyGoal: 0
            };
        }
    }
    
    // ===== FONCTIONS DE GESTION DES DONNÉES =====
    async function loadData() {
        console.log('🔄 Chargement des données...');
        
        const data = await loadMoneyDataFromServer();
        
        if (data) {
            transactions = data.transactions || [];
            investments = data.investments || [];
            monthlyGoals = data.monthlyGoals || {};
            yearlyGoal = data.yearlyGoal || 0;
            
            console.log(`✅ ${transactions.length} transactions chargées`);
            console.log(`✅ Objectifs mensuels: ${Object.keys(monthlyGoals).length}`);
            console.log(`💰 Objectif annuel: £${yearlyGoal}`);
        } else {
            console.log('⚠️ Aucune donnée chargée, utilisation des valeurs par défaut');
            transactions = [];
            investments = [];
            monthlyGoals = {};
            yearlyGoal = 0;
        }
        
        return true;
    }
    
    async function saveData() {
        console.log('💾 Sauvegarde des données...');
        
        const moneyData = {
            transactions: transactions,
            investments: investments,
            monthlyGoals: monthlyGoals,
            yearlyGoal: yearlyGoal,
            lastUpdated: new Date().toISOString()
        };
        
        const result = await saveMoneyDataToServer(moneyData);
        
        if (result && result.success) {
            console.log('✅ Données sauvegardées avec succès');
            return true;
        } else {
            console.error('❌ Échec de la sauvegarde');
            return false;
        }
    }
    
    // ===== FONCTIONS D'AFFICHAGE =====
    function updateDashboard() {
        console.log('🔄 Mise à jour du tableau de bord...');
        
        updateView();
        updateSummary();
        updateRecentTransactionsSummary();
        updateCharts();
        updateHorizontalBarGraph();
        updateLongTermSection();
        
        console.log('✅ Tableau de bord mis à jour');
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
                                <div class="transaction-day-category">${t.category}${t.saving !== 'normal' ? ` (${t.saving})` : ''}</div>
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
            
            if (transYear === selectedYear && transaction.saving === 'normal') {
                if (!transaction.description.includes('Transfer to Saving')) {
                    if (transaction.type === 'expense') {
                        categoryExpenses[transaction.category] += transaction.amount;
                    } else if (transaction.type === 'income') {
                        categoryIncome[transaction.category] += transaction.amount;
                    }
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
    
    function calculateCategoryBarChartData() {
        const categories = [
            'General', 'Trading', 'Food', 'Order', 
            'Shopping', 'Investment', 'Salary', 'Bills', 'Other'
        ];
        
        const categoryBalances = {};
        
        categories.forEach(cat => {
            categoryBalances[cat] = 0;
        });
        
        transactions.forEach(transaction => {
            if (transaction.saving === 'normal' && categoryBalances.hasOwnProperty(transaction.category)) {
                if (!transaction.description.includes('Transfer to Saving')) {
                    if (transaction.type === 'income') {
                        categoryBalances[transaction.category] += transaction.amount;
                    } else if (transaction.type === 'expense') {
                        categoryBalances[transaction.category] -= transaction.amount;
                    }
                }
            }
        });
        
        const validCategories = [];
        const balances = [];
        
        categories.forEach(cat => {
            if (categoryBalances[cat] !== 0) {
                validCategories.push(cat);
                balances.push(categoryBalances[cat]);
            }
        });
        
        return {
            categories: validCategories,
            amounts: balances
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
            maxDisplayValue = 100;
        } else {
            if (maxValue < 10) {
                maxDisplayValue = Math.ceil(maxValue / 1) * 1;
            } else if (maxValue < 50) {
                maxDisplayValue = Math.ceil(maxValue / 10) * 10;
            } else if (maxValue < 100) {
                maxDisplayValue = Math.ceil(maxValue / 20) * 20;
            } else if (maxValue < 500) {
                maxDisplayValue = Math.ceil(maxValue / 100) * 100;
            } else if (maxValue < 2000) {
                maxDisplayValue = Math.ceil(maxValue / 500) * 500;
            } else {
                maxDisplayValue = Math.ceil(maxValue / 1000) * 1000;
            }
        }
        
        maxDisplayValue = Math.max(maxDisplayValue, Math.ceil(maxValue * 1.1));
        const numIntervals = Math.min(4, Math.ceil(maxDisplayValue / 50));
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
            const savingBadge = transaction.saving !== 'normal' ? 
                `<span style="font-size: 8px; background: rgba(155, 89, 182, 0.3); padding: 1px 4px; border-radius: 3px; margin-left: 5px; color: #9b59b6;">${transaction.saving}</span>` : '';
            
            html += `
                <div class="transaction-item" data-id="${transaction.id}">
                    <div class="transaction-info">
                        <div class="transaction-category">${transaction.category}${savingBadge}</div>
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-date">${formatDate(transaction.date)}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${sign}£${transaction.amount.toFixed(2)}
                    </div>
                    <div class="transaction-actions">
                        <button class="add-btn" onclick="showSavingPopup(${transaction.id})">
                            <i class="fas fa-plus"></i> Add
                        </button>
                        <button class="trash-icon-btn" onclick="deleteTransaction(${transaction.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    }
    
    window.showSavingPopup = function(transactionId) {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;
        
        currentTransactionForSaving = transaction;
        transferAmountInput.value = '';
        errorMessage.textContent = '';
        savingSelect.value = 'saving1';
        selectedSavingText.textContent = 'Saving 1';
        savingPopupOverlay.style.display = 'flex';
    }
    
    function applySavingToTransaction(savingType) {
        if (!currentTransactionForSaving) return;
        
        currentTransactionForSaving.saving = savingType;
        updateAndSaveDashboard();
        savingPopupOverlay.style.display = 'none';
        currentTransactionForSaving = null;
    }
    
    window.deleteTransaction = async function(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(t => t.id !== id);
            await updateAndSaveDashboard();
        }
    }
    
    async function updateAndSaveDashboard() {
        updateDashboard();
        await saveData();
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
        
        const normalTransactions = filtered.filter(t => t.saving === 'normal');
        
        const totalIncome = normalTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = normalTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const balance = totalIncome - totalExpenses;
        const totalSaving = calculateTotalSavings();
        
        const recentIncomeElem = document.getElementById('recentIncome');
        const recentExpensesElem = document.getElementById('recentExpenses');
        const recentSavingElem = document.getElementById('recentSaving');
        const recentBalanceElem = document.getElementById('recentBalance');
        
        if (recentIncomeElem) {
            recentIncomeElem.textContent = '£' + totalIncome.toFixed(2);
        }
        
        if (recentExpensesElem) {
            recentExpensesElem.textContent = '£' + totalExpenses.toFixed(2);
        }
        
        if (recentSavingElem) {
            recentSavingElem.textContent = '£' + Math.max(totalSaving, 0).toFixed(2);
        }
        
        if (recentBalanceElem) {
            recentBalanceElem.textContent = '£' + balance.toFixed(2);
        }
    }
    
    async function clearAllTransactions() {
        if (transactions.length === 0) {
            return;
        }
        
        if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
            transactions = [];
            await updateAndSaveDashboard();
        }
    }
    
    function updateSummary() {
        const balance = calculateTotalBalance();
        const currentBalanceControl = document.getElementById('currentBalanceControl');
        const totalTransactionsElem = document.getElementById('totalTransactions');
        
        if (currentBalanceControl) {
            currentBalanceControl.textContent = '£' + balance.toFixed(2);
        }
        
        if (totalTransactionsElem) {
            totalTransactionsElem.textContent = transactions.length;
        }
    }
    
    // ===== FONCTIONS DES GRAPHIQUES =====
    function initCharts() {
        console.log('📊 Initialisation des graphiques...');
        
        // Détruire les anciens graphiques s'ils existent
        if (monthlyBarChart) {
            monthlyBarChart.destroy();
            monthlyBarChart = null;
        }
        
        if (categoryBarVerticalChart) {
            categoryBarVerticalChart.destroy();
            categoryBarVerticalChart = null;
        }
        
        // Monthly Bar Chart
        const monthlyBarCanvas = document.getElementById('monthlyBarChart');
        if (monthlyBarCanvas) {
            console.log('🔄 Création du graphique mensuel...');
            const monthlyBarCtx = monthlyBarCanvas.getContext('2d');
            
            // Obtenir les 12 derniers mois
            const monthData = getLast12Months();
            
            monthlyBarChart = new Chart(monthlyBarCtx, {
                type: 'bar',
                data: {
                    labels: monthData.labels,
                    datasets: [
                        {
                            label: 'Goal',
                            data: new Array(12).fill(0),
                            backgroundColor: 'rgba(52, 152, 219, 0.5)',
                            borderColor: '#3498db',
                            borderWidth: 1,
                            type: 'bar'
                        },
                        {
                            label: 'Income',
                            data: new Array(12).fill(0),
                            backgroundColor: 'rgba(46, 204, 113, 0.5)',
                            borderColor: '#2ecc71',
                            borderWidth: 1,
                            type: 'bar'
                        },
                        {
                            label: 'Expenses',
                            data: new Array(12).fill(0),
                            backgroundColor: 'rgba(231, 76, 60, 0.5)',
                            borderColor: '#e74c3c',
                            borderWidth: 1,
                            type: 'bar'
                        },
                        {
                            label: 'Balance Trend',
                            data: new Array(12).fill(0),
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
                    maintainAspectRatio: false,
                    aspectRatio: 1.52,
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
                                },
                                stepSize: 100
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
            console.log('✅ Graphique mensuel créé');
        }
        
        // Category Bar Chart Vertical
        const categoryBarVerticalCanvas = document.getElementById('categoryBarChartVertical');
        if (categoryBarVerticalCanvas) {
            console.log('🔄 Création du graphique catégories...');
            const categoryBarVerticalCtx = categoryBarVerticalCanvas.getContext('2d');
            
            categoryBarVerticalChart = new Chart(categoryBarVerticalCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Balance',
                        data: [],
                        backgroundColor: '#FFA500',
                        borderColor: '#FF8C00',
                        borderWidth: 1,
                        borderRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: {
                                color: 'white',
                                font: {
                                    size: 8
                                },
                                maxRotation: 0,
                                minRotation: 0
                            },
                            grid: {
                                display: false,
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: 'white',
                                font: {
                                    size: 8
                                },
                                callback: function(value) {
                                    return '£' + value;
                                },
                                stepSize: 100
                            },
                            grid: {
                                display: false,
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
                            borderColor: '#FFA500',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    const sign = value >= 0 ? '+' : '';
                                    return `Balance: ${sign}£${value.toFixed(2)}`;
                                }
                            }
                        }
                    }
                }
            });
            console.log('✅ Graphique catégories créé');
        }
        
        console.log('📊 Graphiques initialisés');
    }
    
    function updateCategoryBarChart() {
        if (!categoryBarVerticalChart) {
            console.log('❌ Graphique catégories non initialisé');
            return;
        }
        
        console.log('🔄 Mise à jour du graphique catégories...');
        
        const categoryData = calculateCategoryBarChartData();
        const maxCategories = 8;
        const categories = categoryData.categories.slice(0, maxCategories);
        const amounts = categoryData.amounts.slice(0, maxCategories);
        
        categoryBarVerticalChart.data.labels = categories;
        categoryBarVerticalChart.data.datasets[0].data = amounts;
        
        // Définir l'échelle Y avec un max adapté
        const maxValue = Math.max(...amounts, 100);
        const minValue = Math.min(...amounts, 0);
        const maxTick = Math.ceil(Math.max(Math.abs(maxValue), Math.abs(minValue)) / 100) * 100;
        
        categoryBarVerticalChart.options.scales.y.max = maxTick;
        categoryBarVerticalChart.options.scales.y.min = -maxTick;
        categoryBarVerticalChart.options.scales.y.ticks.stepSize = Math.ceil(maxTick / 5);
        
        try {
            categoryBarVerticalChart.update();
            console.log('✅ Graphique catégories mis à jour');
        } catch (error) {
            console.error('❌ Erreur mise à jour graphique catégories:', error);
        }
    }
    
    function updateCharts() {
        console.log('🔄 Mise à jour des graphiques...');
        
        if (!monthlyBarChart || !categoryBarVerticalChart) {
            console.log('⚠️ Graphiques non initialisés, tentative d\'initialisation...');
            initCharts();
        }
        
        // Monthly Bar Chart
        if (monthlyBarChart) {
            console.log('🔄 Mise à jour graphique mensuel...');
            
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
                    .filter(t => t.type === 'income' && t.saving === 'normal' && !t.description.includes('Transfer to Saving'))
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const monthExpense = monthTransactions
                    .filter(t => t.type === 'expense' && t.saving === 'normal' && !t.description.includes('Transfer to Saving'))
                    .reduce((sum, t) => sum + t.amount, 0);
                
                incomeData.push(monthIncome);
                expenseData.push(monthExpense);
                
                const monthNormalIncome = monthTransactions
                    .filter(t => t.type === 'income' && t.saving === 'normal')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const monthNormalExpense = monthTransactions
                    .filter(t => t.type === 'expense' && t.saving === 'normal')
                    .reduce((sum, t) => sum + t.amount, 0);
                
                const monthBalance = monthNormalIncome - monthNormalExpense;
                balanceTrendData.push(monthBalance);
                
                const goalKey = `${year}-${month}`;
                const goalForMonth = monthlyGoals[goalKey] || 0;
                goalData.push(goalForMonth);
            });
            
            monthlyBarChart.data.datasets[0].data = goalData;
            monthlyBarChart.data.datasets[1].data = incomeData;
            monthlyBarChart.data.datasets[2].data = expenseData;
            monthlyBarChart.data.datasets[3].data = balanceTrendData;
            
            // Définir l'échelle Y avec un max adapté
            const allData = [...goalData, ...incomeData, ...expenseData, ...balanceTrendData];
            const maxValue = Math.max(...allData, 100);
            const minValue = Math.min(...allData, 0);
            const maxTick = Math.ceil(Math.max(Math.abs(maxValue), Math.abs(minValue)) / 100) * 100;
            
            monthlyBarChart.options.scales.y.max = maxTick;
            monthlyBarChart.options.scales.y.min = 0;
            monthlyBarChart.options.scales.y.ticks.stepSize = Math.ceil(maxTick / 5);
            
            try {
                monthlyBarChart.update();
                console.log('✅ Graphique mensuel mis à jour');
            } catch (error) {
                console.error('❌ Erreur mise à jour graphique mensuel:', error);
            }
        }
        
        // Category Bar Chart
        updateCategoryBarChart();
        
        console.log('✅ Tous les graphiques mis à jour');
    }
    
    async function addTransaction() {
        const amount = parseFloat(amountInput.value);
        const description = descriptionInput.value.trim();
        const date = dateInput.value;
        const type = transactionTypeSelect.value;
        const category = categorySelect.value;
        const saving = savingTypeSelect.value;
        
        if (!amount || amount <= 0 || isNaN(amount)) {
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
            saving: saving,
            timestamp: new Date().getTime()
        };
        
        transactions.push(transaction);
        await updateAndSaveDashboard();
        
        amountInput.value = '';
        descriptionInput.value = '';
        savingTypeSelect.value = 'normal';
    }
    
    async function setGoal() {
        const amount = parseFloat(goalAmountInput.value);
        
        if (!amount || amount <= 0 || isNaN(amount)) {
            alert('Please enter a valid goal amount');
            return;
        }
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const goalKey = `${currentYear}-${currentMonth}`;
        
        monthlyGoals[goalKey] = amount;
        await updateAndSaveDashboard();
        
        goalAmountInput.value = '';
    }
    
    async function setAllGoals() {
        const amount = parseFloat(goalAllAmountInput.value);
        
        if (!amount || amount <= 0 || isNaN(amount)) {
            alert('Please enter a valid goal amount');
            return;
        }
        
        yearlyGoal = amount;
        await updateAndSaveDashboard();
        
        goalAllAmountInput.value = '';
    }
    
    // ===== NOTIFICATION SYSTEM =====
    function showNotification(message, type = 'info') {
        // Créer une notification
        const notification = document.createElement('div');
        notification.className = 'server-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'warning' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 20px;">
                ${type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}
            </span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Supprimer après 5 secondes
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    
    // Ajouter les styles d'animation
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
    
    // ===== TEST DE CONNEXION =====
    async function testServerConnection() {
        try {
            const response = await fetch('/checkMac');
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'connected') {
                    console.log('✅ Serveur Mac connecté');
                    showNotification('✅ Connecté au serveur Mac', 'success');
                } else {
                    console.log('⚠️ Serveur Mac déconnecté');
                    showNotification('⚠️ Serveur Mac non connecté', 'warning');
                }
            }
        } catch (error) {
            console.error('❌ Impossible de vérifier le serveur Mac:', error);
            showNotification('❌ Impossible de se connecter au serveur', 'warning');
        }
    }
    
    // ===== INITIALISATION DES ÉVÉNEMENTS =====
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
    
    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', function() {
            savingPopupOverlay.style.display = 'none';
            currentTransactionForSaving = null;
        });
    }
    
    if (savingPopupOverlay) {
        savingPopupOverlay.addEventListener('click', function(e) {
            if (e.target === savingPopupOverlay) {
                savingPopupOverlay.style.display = 'none';
                currentTransactionForSaving = null;
            }
        });
    }
    
    if (savingSelect) {
        savingSelect.addEventListener('change', function() {
            const savingText = this.options[this.selectedIndex].text;
            if (selectedSavingText) selectedSavingText.textContent = savingText;
        });
    }
    
    if (transferAmountInput) {
        transferAmountInput.addEventListener('input', function() {
            const amount = parseFloat(this.value) || 0;
            const transactionAmount = currentTransactionForSaving ? currentTransactionForSaving.amount : 0;
            
            if (amount > transactionAmount) {
                if (errorMessage) errorMessage.textContent = 'Not enough money in this transaction';
                if (confirmTransferBtn) confirmTransferBtn.disabled = true;
            } else {
                if (errorMessage) errorMessage.textContent = '';
                if (confirmTransferBtn) confirmTransferBtn.disabled = false;
            }
        });
    }
    
    if (confirmTransferBtn) {
        confirmTransferBtn.addEventListener('click', async function() {
            if (!currentTransactionForSaving) return;
            
            const amount = parseFloat(transferAmountInput.value) || 0;
            const transactionAmount = currentTransactionForSaving.amount;
            const savingType = savingSelect.value;
            
            if (amount > transactionAmount || amount <= 0) {
                if (errorMessage) errorMessage.textContent = 'Invalid amount';
                return;
            }
            
            const savingTransaction = {
                id: Date.now(),
                amount: amount,
                category: currentTransactionForSaving.category,
                description: `Transfer to ${savingSelect.options[savingSelect.selectedIndex].text}`,
                date: currentTransactionForSaving.date,
                type: 'income',
                saving: savingType,
                timestamp: new Date().getTime()
            };
            
            transactions.push(savingTransaction);
            currentTransactionForSaving.amount -= amount;
            
            if (currentTransactionForSaving.amount <= 0) {
                transactions = transactions.filter(t => t.id !== currentTransactionForSaving.id);
            }
            
            await updateAndSaveDashboard();
            if (savingPopupOverlay) savingPopupOverlay.style.display = 'none';
            currentTransactionForSaving = null;
        });
    }
    
    // Boutons d'année pour les graphiques
    document.querySelectorAll('.category-balance-section .month-btn[data-year]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-balance-section .month-btn[data-year]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentYearView = this.dataset.year;
            updateHorizontalBarGraph();
            updateCharts();
        });
    });
    
    document.querySelectorAll('.monthly-section .month-btn[data-year]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.monthly-section .month-btn[data-year]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentYearView = this.dataset.year;
            updateCharts();
            updateHorizontalBarGraph();
        });
    });
    
    // ===== INITIALISATION DE L'APPLICATION =====
    async function initApp() {
        console.log("💰 Initialisation Money Management");
        
        // Tester la connexion au serveur
        await testServerConnection();
        
        // Charger Chart.js si nécessaire
        if (typeof Chart === 'undefined') {
            console.log('📥 Chargement de Chart.js...');
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
            
            console.log('✅ Chart.js chargé');
        }
        
        // Initialiser les graphiques AVANT de charger les données
        initCharts();
        
        // Charger les données
        await loadData();
        
        // Mettre à jour le tableau de bord
        updateDashboard();
        
        console.log("✅ Money Management initialisé");
    }
    
    // Démarrer l'application
    initApp();
    
    // Redimensionnement de la fenêtre
    window.addEventListener('resize', function() {
        setTimeout(() => {
            if (monthlyBarChart) monthlyBarChart.resize();
            if (categoryBarVerticalChart) categoryBarVerticalChart.resize();
        }, 100);
    });
    
    // ===== FONCTIONS DE DÉBOGAGE =====
    window.debugMoneyManager = {
        syncData: async function() {
            console.log('🔄 Synchronisation manuelle...');
            await loadData();
            updateDashboard();
            showNotification('✅ Données synchronisées depuis le serveur', 'success');
        },
        clearAll: async function() {
            if (confirm('Effacer TOUTES les données ?')) {
                transactions = [];
                investments = [];
                monthlyGoals = {};
                yearlyGoal = 0;
                await saveData();
                updateDashboard();
                showNotification('✅ Toutes les données ont été effacées', 'success');
            }
        },
        showData: function() {
            console.log('=== DONNÉES MONEY MANAGER ===');
            console.log(`Transactions: ${transactions.length}`);
            console.log(`Objectifs mensuels: ${Object.keys(monthlyGoals).length}`);
            console.log(`Objectif annuel: £${yearlyGoal}`);
            console.log('============================');
        },
        testConnection: async function() {
            await testServerConnection();
        },
        reloadCharts: function() {
            console.log('🔄 Rechargement des graphiques...');
            initCharts();
            updateCharts();
            updateHorizontalBarGraph();
            showNotification('✅ Graphiques rechargés', 'success');
        }
    };
    
    console.log('✅ Script Money Management chargé');
});
