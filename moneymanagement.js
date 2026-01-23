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
    let currentTransactionForSaving = null;
    
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
    
    let monthlyBarChart, categoryBarVerticalChart;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;
    
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
        // N'inclure que les transactions normales (pas les saving)
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
    
    function loadData() {
        try {
            const savedTransactions = localStorage.getItem('moneyManagerTransactions');
            const savedInvestments = localStorage.getItem('moneyManagerInvestments');
            const savedGoals = localStorage.getItem('moneyManagerGoals');
            const savedYearlyGoal = localStorage.getItem('moneyManagerYearlyGoal');
            
            if (savedTransactions) {
                transactions = JSON.parse(savedTransactions);
            }
            
            if (savedInvestments) {
                investments = JSON.parse(savedInvestments);
            }
            
            if (savedGoals) {
                monthlyGoals = JSON.parse(savedGoals);
            }
            
            if (savedYearlyGoal) {
                yearlyGoal = parseFloat(savedYearlyGoal);
            }
        } catch (e) {
            console.error("Erreur de chargement:", e);
            transactions = [];
            investments = [];
            monthlyGoals = {};
            yearlyGoal = 0;
        }
    }
    
    function saveData() {
        try {
            localStorage.setItem('moneyManagerTransactions', JSON.stringify(transactions));
            localStorage.setItem('moneyManagerInvestments', JSON.stringify(investments));
            localStorage.setItem('moneyManagerGoals', JSON.stringify(monthlyGoals));
            localStorage.setItem('moneyManagerYearlyGoal', yearlyGoal.toString());
            
            window.dispatchEvent(new Event('storage'));
        } catch (e) {
            console.error("Erreur de sauvegarde:", e);
        }
    }
    
    function updateDashboard() {
        updateView();
        updateSummary();
        updateRecentTransactionsSummary();
        updateCharts();
        updateHorizontalBarGraph();
        updateLongTermSection();
        saveData();
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
        
        // Ne prendre en compte que les transactions normales (pas les saving)
        // ET exclure les transactions qui sont des transferts vers saving
        transactions.forEach(transaction => {
            const transDate = new Date(transaction.date);
            const transYear = transDate.getFullYear();
            
            if (transYear === selectedYear && transaction.saving === 'normal') {
                // Exclure les transactions de transfert (celles avec "Transfer to" dans la description)
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
        
        // Initialiser toutes les catégories
        categories.forEach(cat => {
            categoryBalances[cat] = 0;
        });
        
        // Calculer le solde (income - expenses) pour chaque catégorie
        // Ne prendre en compte que les transactions normales
        // ET exclure les transactions de transfert
        transactions.forEach(transaction => {
            if (transaction.saving === 'normal' && categoryBalances.hasOwnProperty(transaction.category)) {
                // Exclure les transactions de transfert
                if (!transaction.description.includes('Transfer to Saving')) {
                    if (transaction.type === 'income') {
                        categoryBalances[transaction.category] += transaction.amount;
                    } else if (transaction.type === 'expense') {
                        categoryBalances[transaction.category] -= transaction.amount;
                    }
                }
            }
        });
        
        // Filtrer les catégories qui ont des transactions (solde non nul)
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
            amounts: balances // Ce sont maintenant des soldes, pas des sommes
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
        maxDisplayValue = 100; // Valeur par défaut plus petite
    } else {
        // Calculer un maxDisplayValue adapté aux données
        if (maxValue < 10) {
            // Pour les très petites valeurs (< 10)
            maxDisplayValue = Math.ceil(maxValue / 1) * 1;
        } else if (maxValue < 50) {
            // Pour les petites valeurs (10-50)
            maxDisplayValue = Math.ceil(maxValue / 10) * 10;
        } else if (maxValue < 100) {
            // Pour les valeurs moyennes (50-100)
            maxDisplayValue = Math.ceil(maxValue / 20) * 20;
        } else if (maxValue < 500) {
            // Pour les valeurs plus grandes (100-500)
            maxDisplayValue = Math.ceil(maxValue / 100) * 100;
        } else if (maxValue < 2000) {
            // Pour les grandes valeurs (500-2000)
            maxDisplayValue = Math.ceil(maxValue / 500) * 500;
        } else {
            // Pour les très grandes valeurs
            maxDisplayValue = Math.ceil(maxValue / 1000) * 1000;
        }
    }
    
    // S'assurer que maxDisplayValue est au moins 10% plus grand que maxValue pour un peu d'espace
    maxDisplayValue = Math.max(maxDisplayValue, Math.ceil(maxValue * 1.1));
    
    // Limiter le nombre d'intervalles pour éviter trop de labels
    const numIntervals = Math.min(4, Math.ceil(maxDisplayValue / 50)); // Moins d'intervalles pour petites valeurs
    
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
        
        // Réinitialiser le popup
        transferAmountInput.value = '';
        errorMessage.textContent = '';
        savingSelect.value = 'saving1';
        selectedSavingText.textContent = 'Saving 1';
        
        // Afficher le popup
        savingPopupOverlay.style.display = 'flex';
    }
    
    function applySavingToTransaction(savingType) {
        if (!currentTransactionForSaving) return;
        
        // Mettre à jour le type de saving de la transaction
        currentTransactionForSaving.saving = savingType;
        
        // Mettre à jour le tableau de bord
        updateDashboard();
        
        // Fermer le popup
        savingPopupOverlay.style.display = 'none';
        currentTransactionForSaving = null;
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
        
        // Calculer seulement les transactions normales pour income/expenses/balance
        const normalTransactions = filtered.filter(t => t.saving === 'normal');
        
        const totalIncome = normalTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = normalTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const balance = totalIncome - totalExpenses;
        
        // Calculer le total des saving (tous les saving1, saving2, saving3)
        const totalSaving = calculateTotalSavings();
        
        // CORRECTION : Mettre à jour les éléments HTML avec les ID corrects
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
    
    function clearAllTransactions() {
        if (transactions.length === 0) {
            return;
        }
        
        if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
            transactions = [];
            updateDashboard();
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
    
    function initCharts() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js n\'est pas chargé');
            setTimeout(initCharts, 100);
            return;
        }
        
        // Détruire les anciens graphiques s'ils existent
        if (monthlyBarChart) monthlyBarChart.destroy();
        if (categoryBarVerticalChart) categoryBarVerticalChart.destroy();
        
        // Monthly Bar Chart
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
                                stepSize: 5
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
        
        // Category Bar Chart Vertical - MODIFIÉ pour enlever le grillage
        const categoryBarVerticalCanvas = document.getElementById('categoryBarChartVertical');
        if (categoryBarVerticalCanvas) {
            const categoryBarVerticalCtx = categoryBarVerticalCanvas.getContext('2d');
            categoryBarVerticalChart = new Chart(categoryBarVerticalCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Amount',
                        data: [],
                        backgroundColor: '#FFA500', // Orange color
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
                                display: false, // Désactivé
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
                                stepSize: 20
                            },
                            grid: {
                                display: false, // Désactivé
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
        }
    }
    
    function updateCategoryBarChart() {
        if (!categoryBarVerticalChart) return;
        
        const categoryData = calculateCategoryBarChartData();
        
        // Limiter à 6 catégories maximum pour une meilleure lisibilité
        const maxCategories = 10;
        const categories = categoryData.categories.slice(0, maxCategories);
        const amounts = categoryData.amounts.slice(0, maxCategories);
        
        categoryBarVerticalChart.data.labels = categories;
        categoryBarVerticalChart.data.datasets[0].data = amounts;
        
        // Définir l'échelle Y avec un max arrondi au multiple de 20 supérieur
        const maxValue = Math.max(...amounts, 30);
        const maxTick = Math.ceil(maxValue / 30) * 30;
        
        // Mettre à jour les options du graphique
        categoryBarVerticalChart.options.scales.y.max = maxTick;
        categoryBarVerticalChart.options.scales.y.ticks.stepSize = 30; // Échelle de 20 en 20
        
        categoryBarVerticalChart.update();
    }
    function updateCharts() {
        // Monthly Bar Chart
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
                
                // Inclure seulement les transactions normales pour les revenus et dépenses
                // ET exclure les transactions de transfert
                const monthIncome = monthTransactions
                    .filter(t => t.type === 'income' && t.saving === 'normal' && !t.description.includes('Transfer to Saving'))
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const monthExpense = monthTransactions
                    .filter(t => t.type === 'expense' && t.saving === 'normal' && !t.description.includes('Transfer to Saving'))
                    .reduce((sum, t) => sum + t.amount, 0);
                
                incomeData.push(monthIncome);
                expenseData.push(monthExpense);
                
                // Pour la balance trend, utiliser seulement les transactions normales
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
            
            // Définir l'échelle Y avec un max arrondi au multiple de 5 supérieur
            const allData = [...goalData, ...incomeData, ...expenseData];
            const maxValue = Math.max(...allData, 5);
            const maxTick = Math.ceil(maxValue / 5) * 5;
            monthlyBarChart.options.scales.y.max = maxTick;
            
            monthlyBarChart.update();
        }
        
        // Category Bar Chart Vertical
        updateCategoryBarChart();
    }
    
    function addTransaction() {
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
        updateDashboard();
        
        // Réinitialiser les champs
        amountInput.value = '';
        descriptionInput.value = '';
        savingTypeSelect.value = 'normal';
    }
    
    function setGoal() {
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
        updateDashboard();
        
        goalAmountInput.value = '';
    }
    
    function setAllGoals() {
        const amount = parseFloat(goalAllAmountInput.value);
        
        if (!amount || amount <= 0 || isNaN(amount)) {
            alert('Please enter a valid goal amount');
            return;
        }
        
        yearlyGoal = amount;
        updateDashboard();
        
        goalAllAmountInput.value = '';
    }
    
    // Initialiser les événements
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
    
    // Fermer le popup en cliquant en dehors
    savingPopupOverlay.addEventListener('click', function(e) {
        if (e.target === savingPopupOverlay) {
            savingPopupOverlay.style.display = 'none';
            currentTransactionForSaving = null;
        }
    });
    
    // Mettre à jour le texte du saving sélectionné
    if (savingSelect) {
        savingSelect.addEventListener('change', function() {
            const savingText = this.options[this.selectedIndex].text;
            selectedSavingText.textContent = savingText;
        });
    }
    
    // Valider le montant de transfert
    if (transferAmountInput) {
        transferAmountInput.addEventListener('input', function() {
            const amount = parseFloat(this.value) || 0;
            const transactionAmount = currentTransactionForSaving ? currentTransactionForSaving.amount : 0;
            
            if (amount > transactionAmount) {
                errorMessage.textContent = 'Not enough money in this transaction';
                confirmTransferBtn.disabled = true;
            } else {
                errorMessage.textContent = '';
                confirmTransferBtn.disabled = false;
            }
        });
    }
    

    if (confirmTransferBtn) {
        confirmTransferBtn.addEventListener('click', function() {
            if (!currentTransactionForSaving) return;
            
            const amount = parseFloat(transferAmountInput.value) || 0;
            const transactionAmount = currentTransactionForSaving.amount;
            const savingType = savingSelect.value;
            
            if (amount > transactionAmount || amount <= 0) {
                errorMessage.textContent = 'Invalid amount';
                return;
            }
            
            // Créer une nouvelle transaction pour le saving (type income)
            const savingTransaction = {
                id: Date.now(),
                amount: amount,
                category: currentTransactionForSaving.category,
                description: `Transfer to ${savingSelect.options[savingSelect.selectedIndex].text}`,
                date: currentTransactionForSaving.date,
                type: 'income', // Changé de 'expense' à 'income' pour le saving
                saving: savingType,
                timestamp: new Date().getTime()
            };
            
            // Ajouter la transaction de saving
            transactions.push(savingTransaction);
            
            // Mettre à jour le montant de la transaction originale
            currentTransactionForSaving.amount -= amount;
            
            // Si le montant devient 0, supprimer la transaction
            if (currentTransactionForSaving.amount <= 0) {
                transactions = transactions.filter(t => t.id !== currentTransactionForSaving.id);
            }
            
            // Mettre à jour le tableau de bord
            updateDashboard();
            
            // Fermer le popup
            savingPopupOverlay.style.display = 'none';
            currentTransactionForSaving = null;
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
    
    // Initialiser l'application
    function initApp() {
        console.log("Initialisation de l'application Money Management");
        loadData();
        
        // Attendre que Chart.js soit chargé
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            script.onload = function() {
                initCharts();
                updateDashboard();
            };
            document.head.appendChild(script);
        } else {
            initCharts();
            updateDashboard();
        }
        
        console.log("Application Money Management initialisée");
    }
    
    initApp();
    
    // Redimensionnement de la fenêtre
    window.addEventListener('resize', function() {
        setTimeout(updateCharts, 100);
        setTimeout(updateHorizontalBarGraph, 100);
    });
});
