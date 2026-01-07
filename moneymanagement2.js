document.addEventListener('DOMContentLoaded', function() {
    const menu4Content = document.getElementById('menu4Content');
    if (!menu4Content) return;
    
    let transactions = [];
    let monthlyGoals = {};
    let yearlyGoal = 0;
    let currentFilter = 'month';
    let currentYearView = 'current';
    let currentTransactionFilter = 'all';
    
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const dateInput = document.getElementById('date');
    const goalAmountInput = document.getElementById('goalAmount');
    const goalAllAmountInput = document.getElementById('goalAllAmount');
    const transactionTypeSelect = document.getElementById('transactionType');
    const categorySelect = document.getElementById('category');
    const allBtn = document.getElementById('allBtn');
    const monthlyBtn = document.getElementById('monthlyBtn');
    
    let expensePieChart, incomePieChart, monthlyBarChart, horizontalBarChart;
    
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
    
    function loadData() {
        try {
            const savedTransactions = localStorage.getItem('moneyManagerTransactions');
            const savedGoals = localStorage.getItem('moneyManagerGoals');
            const savedYearlyGoal = localStorage.getItem('moneyManagerYearlyGoal');
            
            if (savedTransactions) {
                transactions = JSON.parse(savedTransactions);
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
            monthlyGoals = {};
            yearlyGoal = 0;
        }
    }
    
    function saveData() {
        try {
            localStorage.setItem('moneyManagerTransactions', JSON.stringify(transactions));
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
        saveData();
    }
    
    function updateView() {
        const list = document.getElementById('transactionsList');
        if (!list) return;
        
        let filtered;
        
        if (currentTransactionFilter === 'month') {
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
                        <button class="trash-icon-btn" onclick="window.deleteTransaction(${transaction.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    }
    
    function updateRecentTransactionsSummary() {
        let filtered;
        
        if (currentTransactionFilter === 'month') {
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
    
    window.deleteTransaction = function(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(t => t.id !== id);
            saveData();
            updateDashboard();
        }
    }
    
    function clearAllTransactions() {
        if (transactions.length === 0) return;
        
        if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
            transactions = [];
            saveData();
            updateDashboard();
        }
    }
    
    function updateSummary() {
        const filtered = filterTransactions(transactions, currentFilter);
        const balance = calculateTotalBalance();

        if (document.getElementById('currentBalanceControl')) {
            document.getElementById('currentBalanceControl').textContent = '£' + balance.toFixed(2);
        }
        
        if (document.getElementById('totalTransactions')) {
            document.getElementById('totalTransactions').textContent = filtered.length;
        }
    }
    
    function filterTransactions(transactions, period) {
        const now = new Date();
        
        switch(period) {
            case 'month':
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                return transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
                });
            default:
                return transactions;
        }
    }
    
    function calculateCategoryBalanceData() {
        const categories = {};
        const totalBalance = calculateTotalBalance();
        
        const allCategories = ['Trading', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Salary', 'Selling', 'Other'];
        allCategories.forEach(cat => {
            categories[cat] = {
                income: 0,
                expense: 0,
                balance: 0,
                percentage: 0
            };
        });
        
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                categories[transaction.category].income += transaction.amount;
            } else {
                categories[transaction.category].expense += transaction.amount;
            }
        });
        
        Object.keys(categories).forEach(cat => {
            categories[cat].balance = categories[cat].income - categories[cat].expense;
            if (totalBalance !== 0) {
                categories[cat].percentage = (categories[cat].balance / Math.abs(totalBalance)) * 100;
            }
        });
        
        const filteredCategories = Object.keys(categories).filter(cat => 
            categories[cat].income > 0 || categories[cat].expense > 0
        );
        
        filteredCategories.sort((a, b) => categories[b].balance - categories[a].balance);
        
        return {
            categories: filteredCategories,
            data: categories
        };
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
                        legend: { display: false }
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
                        legend: { display: false }
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
        
        const horizontalBarCanvas = document.getElementById('horizontalBarChart');
        if (horizontalBarCanvas) {
            const horizontalBarCtx = horizontalBarCanvas.getContext('2d');
            horizontalBarChart = new Chart(horizontalBarCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Income',
                            data: [],
                            backgroundColor: '#2ecc71',
                            borderColor: '#27ae60',
                            borderWidth: 1
                        },
                        {
                            label: 'Expenses',
                            data: [],
                            backgroundColor: '#e74c3c',
                            borderColor: '#c0392b',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    label += '£' + context.parsed.x.toFixed(2);
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,
                            ticks: {
                                font: { size: 9 },
                                color: 'white',
                                callback: function(value) {
                                    return '£' + value;
                                }
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: {
                            stacked: true,
                            ticks: {
                                font: { size: 9 },
                                color: 'white'
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    }
                }
            });
        }
    }
    
    function updateCharts() {
        const filtered = filterTransactions(transactions, currentFilter);
        
        if (expensePieChart) {
            const expenses = filtered.filter(t => t.type === 'expense');
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
            const incomes = filtered.filter(t => t.type === 'income');
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
        
        if (horizontalBarChart) {
            const categoryData = calculateCategoryBalanceData();
            const labels = categoryData.categories;
            const incomeData = [];
            const expenseData = [];
            
            labels.forEach(category => {
                const data = categoryData.data[category];
                incomeData.push(data.income);
                expenseData.push(-data.expense);
            });
            
            horizontalBarChart.data.labels = labels;
            horizontalBarChart.data.datasets[0].data = incomeData;
            horizontalBarChart.data.datasets[1].data = expenseData;
            
            horizontalBarChart.update();
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
    
    function toggleTransactionFilter(filter) {
        currentTransactionFilter = filter;
        allBtn.classList.toggle('active', filter === 'all');
        monthlyBtn.classList.toggle('active', filter === 'month');
        updateDashboard();
    }
    
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const setGoalBtn = document.getElementById('setGoalBtn');
    const setAllGoalBtn = document.getElementById('setAllGoalBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', addTransaction);
    }
    
    if (setGoalBtn) {
        setGoalBtn.addEventListener('click', setGoal);
    }
    
    if (setAllGoalBtn) {
        setAllGoalBtn.addEventListener('click', setAllGoals);
    }
    
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllTransactions);
    }
    
    if (allBtn) {
        allBtn.addEventListener('click', () => toggleTransactionFilter('all'));
    }
    
    if (monthlyBtn) {
        monthlyBtn.addEventListener('click', () => toggleTransactionFilter('month'));
    }
    
    document.querySelectorAll('.month-btn[data-year]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.month-btn[data-year]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentYearView = this.dataset.year;
            updateDashboard();
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
    }
    
    initApp();
    
    window.addEventListener('resize', function() {
        setTimeout(updateCharts, 100);
    });
});
