document.addEventListener('DOMContentLoaded', function() {
    // === CONFIGURATION SUPABASE ===
    const SUPABASE_URL = 'https://obetden7wnehmdknbt0meag.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_ObETdEn7WNehMDkNt0meag_ubB_n7VK';
    
    // === VARIABLES GLOBALES ===
    let transactions = [];
    let investments = [];
    let monthlyGoals = {};
    let yearlyGoal = 0;
    let currentFilter = 'all';
    let currentYearView = 'current';
    let longTermOffset = 0;
    
    // === ÉLÉMENTS DOM ===
    const elements = {
        menu4Content: document.getElementById('menu4Content'),
        amountInput: document.getElementById('amount'),
        descriptionInput: document.getElementById('description'),
        dateInput: document.getElementById('date'),
        goalAmountInput: document.getElementById('goalAmount'),
        goalAllAmountInput: document.getElementById('goalAllAmount'),
        transactionTypeSelect: document.getElementById('transactionType'),
        categorySelect: document.getElementById('category'),
        allBtn: document.getElementById('allBtn'),
        monthlyBtn: document.getElementById('monthlyBtn'),
        addTransactionBtn: document.getElementById('addTransactionBtn'),
        setGoalBtn: document.getElementById('setGoalBtn'),
        setAllGoalBtn: document.getElementById('setAllGoalBtn'),
        clearAllBtn: document.getElementById('clearAllBtn'),
        transactionsList: document.getElementById('transactionsList'),
        recentIncome: document.getElementById('recentIncome'),
        recentExpenses: document.getElementById('recentExpenses'),
        recentBalance: document.getElementById('recentBalance'),
        currentBalanceControl: document.getElementById('currentBalanceControl'),
        totalTransactions: document.getElementById('totalTransactions'),
        yAxis: document.getElementById('yAxis'),
        barsContainer: document.getElementById('barsContainer'),
        xAxisSpectrum: document.getElementById('xAxisSpectrum'),
        leftLegendText: document.getElementById('leftLegendText'),
        rightLegendText: document.getElementById('rightLegendText'),
        longTermContent: document.getElementById('longTermContent'),
        prevDaysBtn: document.getElementById('prevDaysBtn'),
        nextDaysBtn: document.getElementById('nextDaysBtn')
    };
    
    let expensePieChart, incomePieChart, monthlyBarChart;
    
    // === INITIALISATION DE LA DATE ===
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    if (elements.dateInput) elements.dateInput.value = `${yyyy}-${mm}-${dd}`;
    
    // === FONCTIONS SUPABASE ===
    
    function getSessionId() {
        let sessionId = localStorage.getItem('money_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('money_session_id', sessionId);
        }
        return sessionId;
    }
    
    async function saveToSupabase() {
        const sessionId = getSessionId();
        
        try {
            console.log('💾 Sauvegarde sur Supabase...');
            
            const dataToSave = {
                session_id: sessionId,
                transactions: JSON.stringify(transactions),
                investments: JSON.stringify(investments),
                monthly_goals: JSON.stringify(monthlyGoals),
                yearly_goal: yearlyGoal,
                total_transactions: transactions.length,
                total_investments: investments.length,
                last_updated: new Date().toISOString(),
                device_info: navigator.userAgent.substring(0, 100),
                timestamp: Date.now()
            };
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/money_data`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(dataToSave)
            });
            
            if (response.ok) {
                console.log('✅ Données sauvegardées sur Supabase !');
                showNotification('✅ Données sauvegardées en ligne', 'success');
                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Erreur Supabase:', errorText);
                showNotification('❌ Erreur de sauvegarde', 'error');
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur réseau:', error);
            showNotification('❌ Pas de connexion internet', 'error');
            return false;
        }
    }
    
    async function loadFromSupabase() {
        const sessionId = getSessionId();
        
        try {
            console.log('📥 Chargement depuis Supabase...');
            
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/money_data?session_id=eq.${sessionId}&order=last_updated.desc&limit=1`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const latestData = data[0];
                    
                    transactions = JSON.parse(latestData.transactions || '[]');
                    investments = JSON.parse(latestData.investments || '[]');
                    monthlyGoals = JSON.parse(latestData.monthly_goals || '{}');
                    yearlyGoal = latestData.yearly_goal || 0;
                    
                    console.log('✅ Données chargées depuis Supabase');
                    showNotification('✅ Données chargées depuis le cloud', 'success');
                    return true;
                }
            }
            
            console.log('ℹ️ Aucune donnée sur Supabase');
            return false;
        } catch (error) {
            console.error('❌ Erreur de chargement:', error);
            return false;
        }
    }
    
    // === FONCTIONS UTILITAIRES ===
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `supabase-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 250px;
            animation: slideIn 0.3s ease;
        `;
        
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
        
        notification.querySelector('.notification-close').onclick = () => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        };
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
        
        document.body.appendChild(notification);
    }
    
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
    
    function calculateTotalBalance() {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        return totalIncome - totalExpenses;
    }
    
    // === FONCTIONS DE L'INTERFACE ===
    
    function updateDashboard() {
        updateView();
        updateSummary();
        updateRecentTransactionsSummary();
        updateCharts();
        updateHorizontalBarGraph();
        updateLongTermSection();
        
        // Sauvegarde automatique sur Supabase
        if (transactions.length > 0 || Object.keys(monthlyGoals).length > 0) {
            saveToSupabase();
        }
    }
    
    function updateView() {
        if (!elements.transactionsList) return;
        
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
            elements.transactionsList.innerHTML = `
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
        
        elements.transactionsList.innerHTML = html;
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
        
        if (elements.recentIncome) {
            elements.recentIncome.textContent = '£' + totalIncome.toFixed(2);
        }
        
        if (elements.recentExpenses) {
            elements.recentExpenses.textContent = '£' + totalExpenses.toFixed(2);
        }
        
        if (elements.recentBalance) {
            elements.recentBalance.textContent = '£' + balance.toFixed(2);
        }
    }
    
    function updateSummary() {
        const balance = calculateTotalBalance();

        if (elements.currentBalanceControl) {
            elements.currentBalanceControl.textContent = '£' + balance.toFixed(2);
        }
        
        if (elements.totalTransactions) {
            elements.totalTransactions.textContent = transactions.length;
        }
    }
    
    function updateLongTermSection() {
        if (!elements.longTermContent) return;
        
        const days = [];
        const today = new Date();
        const startOffset = longTermOffset * 6;
        
        for (let i = 0; i < 6; i++) {
            const day = new Date(today);
            day.setDate(today.getDate() - startOffset - i);
            days.push(day);
        }
        
        days.sort((a, b) => b - a);
        
        elements.longTermContent.innerHTML = '';
        
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
            
            elements.longTermContent.appendChild(dayCard);
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
        
        return {
            categories: validCategories,
            expenses: expensesData,
            income: incomeData
        };
    }
    
    function updateHorizontalBarGraph() {
        if (!elements.yAxis || !elements.barsContainer || !elements.xAxisSpectrum) return;
        
        const categoryData = calculateCategoryData();
        const categories = categoryData.categories;
        const expensesData = categoryData.expenses;
        const incomeData = categoryData.income;
        
        if (elements.leftLegendText && elements.rightLegendText) {
            const yearText = currentYearView === 'current' ? 'Current Year' : 'Previous Year';
            elements.leftLegendText.textContent = `${yearText} Expenses`;
            elements.rightLegendText.textContent = `${yearText} Income`;
        }
        
        elements.yAxis.innerHTML = '';
        elements.barsContainer.innerHTML = '';
        elements.xAxisSpectrum.innerHTML = '';
        
        if (categories.length === 0) {
            const noDataMessage = document.createElement('div');
            noDataMessage.className = 'no-data';
            noDataMessage.innerHTML = `
                <i class="fas fa-chart-bar"></i>
                <div>No data available for selected year</div>
            `;
            elements.barsContainer.appendChild(noDataMessage);
            
            const zeroLabel = document.createElement('div');
            zeroLabel.className = 'spectrum-label';
            zeroLabel.textContent = '0';
            zeroLabel.style.left = '50%';
            elements.xAxisSpectrum.appendChild(zeroLabel);
            return;
        }
        
        const maxExpense = Math.max(...expensesData);
        const maxIncome = Math.max(...incomeData);
        const maxValue = Math.max(maxExpense, maxIncome);
        
        let maxDisplayValue = 1000;
        if (maxValue > 0) {
            if (maxValue < 500) {
                maxDisplayValue = Math.ceil(maxValue / 100) * 100;
            } else if (maxValue < 2000) {
                maxDisplayValue = Math.ceil(maxValue / 500) * 500;
            } else {
                maxDisplayValue = Math.ceil(maxValue / 1000) * 1000;
            }
        }
        
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
            elements.yAxis.appendChild(categoryLabel);
            
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
                
                leftBar.textContent = expenseValue >= 1000 ? 
                    `£${(expenseValue / 1000).toFixed(1)}k` : `£${expenseValue.toFixed(0)}`;
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
                
                rightBar.textContent = incomeValue >= 1000 ? 
                    `£${(incomeValue / 1000).toFixed(1)}k` : `£${incomeValue.toFixed(0)}`;
                barGroup.appendChild(rightBar);
                
                setTimeout(() => {
                    rightBar.style.width = `${incomeWidth}%`;
                }, 50 + (index * 100));
            }
            
            elements.barsContainer.appendChild(barGroup);
        });
        
        for (let i = 1; i <= numIntervals; i++) {
            const value = i * intervalValue;
            const leftPosition = 50 - (value * pixelsPerValue);
            const rightPosition = 50 + (value * pixelsPerValue);
            
            // Left side (expenses)
            const leftTick = document.createElement('div');
            leftTick.className = 'spectrum-tick';
            leftTick.style.left = `${leftPosition}%`;
            elements.xAxisSpectrum.appendChild(leftTick);
            
            const leftLabel = document.createElement('div');
            leftLabel.className = 'spectrum-label';
            leftLabel.textContent = value >= 1000 ? `-£${(value / 1000).toFixed(1)}k` : `-£${Math.round(value)}`;
            leftLabel.style.left = `${leftPosition}%`;
            elements.xAxisSpectrum.appendChild(leftLabel);
            
            // Right side (income)
            const rightTick = document.createElement('div');
            rightTick.className = 'spectrum-tick';
            rightTick.style.left = `${rightPosition}%`;
            elements.xAxisSpectrum.appendChild(rightTick);
            
            const rightLabel = document.createElement('div');
            rightLabel.className = 'spectrum-label';
            rightLabel.textContent = value >= 1000 ? `£${(value / 1000).toFixed(1)}k` : `£${Math.round(value)}`;
            rightLabel.style.left = `${rightPosition}%`;
            elements.xAxisSpectrum.appendChild(rightLabel);
        }
        
        // Zero point
        const zeroTick = document.createElement('div');
        zeroTick.className = 'spectrum-tick zero-tick';
        zeroTick.style.left = '50%';
        elements.xAxisSpectrum.appendChild(zeroTick);
        
        const zeroLabel = document.createElement('div');
        zeroLabel.className = 'spectrum-label';
        zeroLabel.textContent = '0';
        zeroLabel.style.left = '50%';
        zeroLabel.style.transform = 'translateX(-50%)';
        elements.xAxisSpectrum.appendChild(zeroLabel);
    }
    
    // === FONCTIONS DES GRAPHIQUES ===
    
    function initCharts() {
        if (typeof Chart === 'undefined') {
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
                    plugins: { legend: { display: false } }
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
                    plugins: { legend: { display: false } }
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
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: {
                            stacked: false,
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                font: { size: 8 },
                                color: 'white'
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: {
                            beginAtZero: true,
                            stacked: false,
                            ticks: {
                                font: { size: 8 },
                                color: 'white',
                                callback: function(value) { return '£' + value; }
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    },
                    plugins: {
                        legend: { display: false },
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
    
    // === GESTION DES TRANSACTIONS ===
    
    function addTransaction() {
        const amount = parseFloat(elements.amountInput.value);
        const description = elements.descriptionInput.value.trim();
        const date = elements.dateInput.value;
        const type = elements.transactionTypeSelect.value;
        const category = elements.categorySelect.value;
        
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
        
        elements.amountInput.value = '';
        elements.descriptionInput.value = '';
    }
    
    function setGoal() {
        const amount = parseFloat(elements.goalAmountInput.value);
        
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
        
        elements.goalAmountInput.value = '';
    }
    
    function setAllGoals() {
        const amount = parseFloat(elements.goalAllAmountInput.value);
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid goal amount');
            return;
        }
        
        yearlyGoal = amount;
        updateDashboard();
        
        elements.goalAllAmountInput.value = '';
    }
    
    function clearAllTransactions() {
        if (transactions.length === 0) return;
        
        if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
            transactions = [];
            investments = [];
            monthlyGoals = {};
            yearlyGoal = 0;
            updateDashboard();
        }
    }
    
    // === BOUTON DE DEBUG SUPABASE ===
    
    function addDebugButton() {
        const debugBtn = document.createElement('button');
        debugBtn.innerHTML = '🐛 Debug Supabase';
        debugBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 9999;
            font-size: 12px;
        `;
        
        debugBtn.onclick = async function() {
            console.clear();
            console.log('=== DEBUG SUPABASE ===');
            console.log('URL:', SUPABASE_URL);
            console.log('Key (first 10):', SUPABASE_KEY.substring(0, 10) + '...');
            console.log('Session ID:', getSessionId());
            console.log('Transactions:', transactions.length);
            
            // Test de connexion
            try {
                console.log('Testing connection...');
                const response = await fetch(`${SUPABASE_URL}/rest/v1/money_data?limit=1`, {
                    headers: { 'apikey': SUPABASE_KEY }
                });
                
                console.log('Response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Table exists, rows:', data.length);
                    alert('✅ Supabase connection OK!\nTable exists with ' + data.length + ' rows');
                } else {
                    const error = await response.text();
                    console.error('Error:', error);
                    alert('❌ Supabase error: ' + response.status + '\n' + error);
                }
            } catch (error) {
                console.error('Network error:', error);
                alert('❌ Network error: ' + error.message);
            }
        };
        
        document.body.appendChild(debugBtn);
    }
    
    // === ÉVÉNEMENTS ===
    
    function setupEventListeners() {
        if (elements.addTransactionBtn) {
            elements.addTransactionBtn.addEventListener('click', addTransaction);
        }
        
        if (elements.setGoalBtn) {
            elements.setGoalBtn.addEventListener('click', setGoal);
        }
        
        if (elements.setAllGoalBtn) {
            elements.setAllGoalBtn.addEventListener('click', setAllGoals);
        }
        
        if (elements.clearAllBtn) {
            elements.clearAllBtn.addEventListener('click', clearAllTransactions);
        }
        
        if (elements.allBtn) {
            elements.allBtn.addEventListener('click', function() {
                elements.allBtn.classList.add('active');
                elements.monthlyBtn.classList.remove('active');
                currentFilter = 'all';
                updateView();
                updateRecentTransactionsSummary();
            });
        }
        
        if (elements.monthlyBtn) {
            elements.monthlyBtn.addEventListener('click', function() {
                elements.monthlyBtn.classList.add('active');
                elements.allBtn.classList.remove('active');
                currentFilter = 'month';
                updateView();
                updateRecentTransactionsSummary();
            });
        }
        
        if (elements.prevDaysBtn) {
            elements.prevDaysBtn.addEventListener('click', function() {
                longTermOffset++;
                updateLongTermSection();
            });
        }
        
        if (elements.nextDaysBtn) {
            elements.nextDaysBtn.addEventListener('click', function() {
                if (longTermOffset > 0) {
                    longTermOffset--;
                    updateLongTermSection();
                }
            });
        }
        
        // Year view buttons
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
        
        // Enter key for adding transactions
        if (elements.amountInput && elements.descriptionInput) {
            elements.amountInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') addTransaction();
            });
            elements.descriptionInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') addTransaction();
            });
        }
    }
    
    // === INITIALISATION ===
    
    async function initApp() {
        console.log('🚀 Initialisation Money Management');
        
        // Vérifier si on est dans la bonne page
        if (!elements.menu4Content) return;
        
        // Ajouter le bouton de debug
        addDebugButton();
        
        // Charger Chart.js si nécessaire
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            script.onload = async function() {
                initCharts();
                await loadFromSupabase();
                updateDashboard();
            };
            document.head.appendChild(script);
        } else {
            initCharts();
            await loadFromSupabase();
            updateDashboard();
        }
        
        // Configurer les événements
        setupEventListeners();
        
        console.log('✅ Application initialisée');
    }
    
    // === SAUVEGARDE AVANT FERMETURE ===
    
    window.addEventListener('beforeunload', function() {
        if (transactions.length > 0) {
            // Essayer de sauvegarder une dernière fois
            const data = {
                session_id: getSessionId(),
                transactions: JSON.stringify(transactions),
                investments: JSON.stringify(investments),
                monthly_goals: JSON.stringify(monthlyGoals),
                yearly_goal: yearlyGoal,
                last_updated: new Date().toISOString(),
                exit_save: true
            };
            
            // Utiliser sendBeacon pour une sauvegarde asynchrone
            navigator.sendBeacon(`${SUPABASE_URL}/rest/v1/money_data`, JSON.stringify(data));
        }
    });
    
    // === DÉMARRAGE ===
    
    initApp();
});
