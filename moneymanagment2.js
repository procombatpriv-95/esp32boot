        document.addEventListener('DOMContentLoaded', function() {
            const menu4Content = document.getElementById('menu4Content');
            if (!menu4Content) return;
            
            let transactions = [];
            let investments = [];
            let monthlyGoals = {};
            let yearlyGoal = 0;
            let currentFilter = 'all'; // Par défaut, afficher toutes les transactions
            let currentYearView = 'current';
            
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
            
            let expensePieChart, incomePieChart, monthlyBarChart;
            
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
                saveData();
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
                    
                    // Juste un zéro sur le spectrum
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
                
                // Créer les traits et labels pour chaque intervalle
                for (let i = 1; i <= numIntervals; i++) {
                    const value = i * intervalValue;
                    
                    // Trait gauche
                    const leftTick = document.createElement('div');
                    leftTick.className = 'spectrum-tick';
                    const leftPosition = 50 - (value * pixelsPerValue);
                    leftTick.style.left = `${leftPosition}%`;
                    xAxisSpectrum.appendChild(leftTick);
                    
                    // Label gauche
                    const leftLabel = document.createElement('div');
                    leftLabel.className = 'spectrum-label';
                    if (value >= 1000) {
                        leftLabel.textContent = `-£${(value / 1000).toFixed(1)}k`;
                    } else {
                        leftLabel.textContent = `-£${Math.round(value)}`;
                    }
                    leftLabel.style.left = `${leftPosition}%`;
                    xAxisSpectrum.appendChild(leftLabel);
                    
                    // Trait droit
                    const rightTick = document.createElement('div');
                    rightTick.className = 'spectrum-tick';
                    const rightPosition = 50 + (value * pixelsPerValue);
                    rightTick.style.left = `${rightPosition}%`;
                    xAxisSpectrum.appendChild(rightTick);
                    
                    // Label droit
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
                
                // Trait zéro sur le spectrum (plus long)
                const zeroTick = document.createElement('div');
                zeroTick.className = 'spectrum-tick zero-tick';
                zeroTick.style.left = '50%';
                xAxisSpectrum.appendChild(zeroTick);
                
                // UN SEUL label zéro sur le spectrum
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
                    saveData();
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
                    saveData();
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
            
// Dans la fonction addTransaction() du money-management, ajoutez cette ligne à la fin :

function addTransaction() {
    console.log("Bouton Add Transaction cliqué");
    
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
    saveData();
    updateDashboard();
    
    amountInput.value = '';
    descriptionInput.value = '';
    
    console.log('Transaction added successfully!');
    
    // AJOUTEZ CETTE LIGNE POUR DÉCLENCHER LA MISE À JOUR DU PANEL RÉSULTAT
    if (window.forceUpdateResultPanel) {
        setTimeout(() => {
            window.forceUpdateResultPanel();
        }, 500);
    }
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
            
            function initApp() {
                console.log("Initialisation de l'application Money Management");
                loadData();
                
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
            
            window.addEventListener('resize', function() {
                setTimeout(updateCharts, 100);
                setTimeout(updateHorizontalBarGraph, 100);
            });
        });
