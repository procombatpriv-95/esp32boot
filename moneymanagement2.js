document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let transactions = [];
    let investments = [];
    let monthlyGoals = {};
    let yearlyGoal = 0;
    let currentFilter = 'month';
    let currentYearView = 'current';
    let currentTransactionFilter = 'all';
    let currentView = 'transactions';
    
    // Récupérer les éléments DOM
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const dateInput = document.getElementById('date');
    const goalAmountInput = document.getElementById('goalAmount');
    const goalAllAmountInput = document.getElementById('goalAllAmount');
    const transactionTypeSelect = document.getElementById('transactionType');
    const categorySelect = document.getElementById('category');
    const investmentNameInput = document.getElementById('investmentName');
    const initialInvestmentInput = document.getElementById('initialInvestment');
    const annualReturnInput = document.getElementById('annualReturn');
    const investmentGoalInput = document.getElementById('investmentGoal');
    const transacBtn = document.getElementById('transacBtn');
    const investViewBtn = document.getElementById('investViewBtn');
    const currentYearBtn = document.getElementById('currentYearBtn');
    const previousYearBtn = document.getElementById('previousYearBtn');
    const recentTransactionsTitle = document.getElementById('recentTransactionsTitle');
    const transactionsSummary = document.getElementById('transactionsSummary');
    const investmentsSummary = document.getElementById('investmentsSummary');
    const doubleBarGraph = document.getElementById('doubleBarGraph');
    
    // Variables pour les graphiques
    let expensePieChart, incomePieChart, lineChart, monthlyBarChart;
    
    // Initialiser la date à aujourd'hui
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;
    
    // Générer les noms des 12 mois
    function getMonthNames() {
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
    
    // Charger les données depuis localStorage
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
    
    // Sauvegarder les données dans localStorage
    function saveData() {
        try {
            localStorage.setItem('moneyManagerTransactions', JSON.stringify(transactions));
            localStorage.setItem('moneyManagerInvestments', JSON.stringify(investments));
            localStorage.setItem('moneyManagerGoals', JSON.stringify(monthlyGoals));
            localStorage.setItem('moneyManagerYearlyGoal', yearlyGoal.toString());
        } catch (e) {
            console.error("Erreur de sauvegarde:", e);
        }
    }
    
    // Mettre à jour tout le dashboard
    function updateDashboard() {
        updateView();
        updateSummary();
        updateRecentTransactionsSummary();
        updateCharts();
        updateDoubleBarGraph(); // Mettre à jour le double bar graph
        saveData();
    }
    
    // Formater la date pour l'affichage
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    // Calculer le solde total
    function calculateTotalBalance() {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        return totalIncome - totalExpenses;
    }
    
    // Calculer le total investi
    function calculateTotalInvested() {
        return investments.reduce((sum, i) => sum + i.initialAmount, 0);
    }
    
    // Calculer le rendement moyen
    function calculateAverageReturn() {
        if (investments.length === 0) return 0;
        const totalReturn = investments.reduce((sum, i) => sum + i.annualReturn, 0);
        return totalReturn / investments.length;
    }
    
    // Mettre à jour la vue (transactions ou investissements)
    function updateView() {
        const list = document.getElementById('transactionsList');
        if (!list) return;
        
        if (currentView === 'transactions') {
            // Afficher les transactions
            if (recentTransactionsTitle) {
                recentTransactionsTitle.innerHTML = '<i class="fas fa-history"></i> Recent Transactions';
            }
            
            if (transacBtn) {
                transacBtn.classList.add('active');
            }
            
            if (investViewBtn) {
                investViewBtn.classList.remove('active');
            }
            
            if (transactionsSummary) {
                transactionsSummary.style.display = 'flex';
            }
            
            if (investmentsSummary) {
                investmentsSummary.style.display = 'none';
            }
            
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
            
            // Trier par date (du plus récent au plus ancien)
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
        } else {
            // Afficher les investissements
            if (recentTransactionsTitle) {
                recentTransactionsTitle.innerHTML = '<i class="fas fa-line-chart"></i> Investments';
            }
            
            if (transacBtn) {
                transacBtn.classList.remove('active');
            }
            
            if (investViewBtn) {
                investViewBtn.classList.add('active');
            }
            
            if (transactionsSummary) {
                transactionsSummary.style.display = 'none';
            }
            
            if (investmentsSummary) {
                investmentsSummary.style.display = 'flex';
            }
            
            // Mettre à jour le résumé des investissements
            const totalInvested = calculateTotalInvested();
            const avgReturn = calculateAverageReturn();
            
            if (document.getElementById('totalInvested')) {
                document.getElementById('totalInvested').textContent = '£' + totalInvested.toLocaleString();
            }
            
            if (document.getElementById('avgReturn')) {
                document.getElementById('avgReturn').textContent = avgReturn.toFixed(1) + '%';
            }
            
            if (document.getElementById('totalInvestments')) {
                document.getElementById('totalInvestments').textContent = investments.length;
            }
            
            if (investments.length === 0) {
                list.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-briefcase"></i>
                        <div>No investments yet</div>
                    </div>
                `;
                return;
            }
            
            let html = '';
            investments.forEach(investment => {
                const goalText = investment.goal ? ` | Goal: £${investment.goal.toLocaleString()}` : '';
                html += `
                    <div class="transaction-item" data-id="${investment.id}">
                        <div class="transaction-info">
                            <div class="transaction-category">${investment.name}</div>
                            <div class="transaction-description">Return: ${investment.annualReturn}%${goalText}</div>
                            <div class="transaction-date">Started: ${formatDate(investment.startDate)}</div>
                        </div>
                        <div class="transaction-amount transaction-income">
                            £${investment.initialAmount.toLocaleString()}
                        </div>
                        <div class="transaction-actions">
                            <button class="trash-icon-btn" onclick="deleteInvestment(${investment.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            list.innerHTML = html;
        }
    }
    
    // Mettre à jour les résumés des transactions récentes
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
    
    // Supprimer une transaction
    window.deleteTransaction = function(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            transactions = transactions.filter(t => t.id !== id);
            saveData();
            updateDashboard();
        }
    }
    
    // Supprimer un investissement
    window.deleteInvestment = function(id) {
        if (confirm('Are you sure you want to delete this investment?')) {
            investments = investments.filter(i => i.id !== id);
            saveData();
            updateDashboard();
        }
    }
    
    // Effacer toutes les transactions
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
    
    // Mettre à jour les résumés
    function updateSummary() {
        const filtered = filterTransactions(transactions, currentFilter);
        
        const filteredIncome = filtered
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const filteredExpenses = filtered
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const balance = calculateTotalBalance();

        if (document.getElementById('currentBalanceControl')) {
            document.getElementById('currentBalanceControl').textContent = '£' + balance.toFixed(2);
        }
        
        if (document.getElementById('totalTransactions')) {
            document.getElementById('totalTransactions').textContent = filtered.length;
        }
    }
    
    // Filtrer les transactions
    function filterTransactions(transactions, period) {
        const now = new Date();
        
        switch(period) {
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                return transactions.filter(t => t.date === today);
            case 'week':
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return transactions.filter(t => new Date(t.date) >= oneWeekAgo);
            case 'month':
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                return transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
                });
            case 'year':
                const currentYearOnly = now.getFullYear();
                return transactions.filter(t => new Date(t.date).getFullYear() === currentYearOnly);
            default:
                return transactions;
        }
    }
    
    // Calculer les données pour le double bar graph
    function calculateCategoryData() {
        const categories = ['Trading', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Salary', 'Selling', 'Other'];
        const result = [];
        
        // Filtrer les transactions par année
        const currentYear = new Date().getFullYear();
        const yearToFilter = currentYearView === 'previous' ? currentYear - 1 : currentYear;
        
        const yearTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === yearToFilter;
        });
        
        categories.forEach(category => {
            const income = yearTransactions
                .filter(t => t.type === 'income' && t.category === category)
                .reduce((sum, t) => sum + t.amount, 0);
                
            const expense = yearTransactions
                .filter(t => t.type === 'expense' && t.category === category)
                .reduce((sum, t) => sum + t.amount, 0);
            
            if (income > 0 || expense > 0) {
                result.push({
                    category: category,
                    income: income,
                    expense: expense
                });
            }
        });
        
        // Trier par income décroissant
        result.sort((a, b) => b.income - a.income);
        
        return result;
    }
    
    // Mettre à jour le double bar graph
    function updateDoubleBarGraph() {
        if (!doubleBarGraph) return;
        
        const categoryData = calculateCategoryData();
        
        // Si pas de données
        if (categoryData.length === 0) {
            doubleBarGraph.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: rgba(255, 255, 255, 0.5); font-size: 12px;">
                    No category data available for ${currentYearView === 'previous' ? 'previous' : 'current'} year
                </div>
            `;
            return;
        }
        
        // Calculer la valeur maximale pour l'échelle (toujours 18000 comme sur l'image)
        const maxValue = 18000;
        
        // Générer le HTML pour les lignes de guide
        const gridLinesHTML = `
            <div class="grid-lines">
                <div class="grid-line" style="left: 0%;"></div>
                <div class="grid-line" style="left: 16.66%;"></div>
                <div class="grid-line" style="left: 33.33%;"></div>
                <div class="grid-line" style="left: 50%;"></div>
                <div class="grid-line" style="left: 66.66%;"></div>
                <div class="grid-line" style="left: 83.33%;"></div>
                <div class="grid-line" style="left: 100%;"></div>
            </div>
        `;
        
        // Générer les lignes de catégories
        const categoryRowsHTML = categoryData.map(item => {
            const incomePercent = (item.income / maxValue) * 100;
            const expensePercent = (item.expense / maxValue) * 100;
            
            return `
                <div class="category-row">
                    <div class="category-label">${item.category}</div>
                    <div class="bars-container">
                        ${gridLinesHTML}
                        <div class="bar-group">
                            <div class="bar bar-income" style="width: ${incomePercent}%;">
                                <span class="bar-value">${item.income > 0 ? '£' + (item.income/1000).toFixed(0) + 'k' : ''}</span>
                            </div>
                            <div class="bar bar-expense" style="width: ${expensePercent}%;">
                                <span class="bar-value">${item.expense > 0 ? '£' + (item.expense/1000).toFixed(0) + 'k' : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        doubleBarGraph.innerHTML = categoryRowsHTML;
    }
    
    // Initialiser les graphiques
    function initCharts() {
        // Vérifier si Chart.js est chargé
        if (typeof Chart === 'undefined') {
            console.error('Chart.js n\'est pas chargé');
            setTimeout(initCharts, 100);
            return;
        }
        
        // Expense Pie Chart
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
        
        // Income Pie Chart
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
        
        // Line Chart pour les investissements (20 ans)
        const lineCanvas = document.getElementById('lineChart');
        if (lineCanvas) {
            const lineCtx = lineCanvas.getContext('2d');
            lineChart = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Years',
                                font: {
                                    size: 10
                                },
                                color: 'white'
                            },
                            ticks: {
                                font: {
                                    size: 9
                                },
                                color: 'white'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Value (£)',
                                font: {
                                    size: 10
                                },
                                color: 'white'
                            },
                            ticks: {
                                font: {
                                    size: 9
                                },
                                color: 'white',
                                callback: function(value) {
                                    return '£' + (value/1000).toFixed(0) + 'K';
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                font: {
                                    size: 9
                                },
                                color: 'white',
                                boxWidth: 10,
                                padding: 5
                            },
                            position: 'top'
                        }
                    }
                }
            });
        }
        
        // Monthly Bar Chart
        const monthlyBarCanvas = document.getElementById('monthlyBarChart');
        if (monthlyBarCanvas) {
            const monthlyBarCtx = monthlyBarCanvas.getContext('2d');
            monthlyBarChart = new Chart(monthlyBarCtx, {
                type: 'bar',
                data: {
                    labels: getMonthNames(),
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
    
    // Mettre à jour les graphiques
    function updateCharts() {
        const filtered = filterTransactions(transactions, currentFilter);
        
        // Pie Chart des Dépenses
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
        
        // Pie Chart des Revenus
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
        
        // Line Chart des investissements (20 ans)
        if (lineChart) {
            const years = 20;
            const yearLabels = [];
            for (let i = 0; i <= years; i++) {
                yearLabels.push(`Y${i}`);
            }
            
            lineChart.data.labels = yearLabels;
            
            // Créer les datasets pour chaque investissement
            const datasets = [];
            
            investments.forEach((investment, index) => {
                const growth = calculateInvestmentGrowth(investment, years);
                
                // Créer un tableau de couleurs
                const colors = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c'];
                const color = colors[index % colors.length];
                
                datasets.push({
                    label: `${investment.name} (${investment.annualReturn}%)`,
                    data: growth,
                    borderColor: color,
                    backgroundColor: color,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                });
            });
            
            lineChart.data.datasets = datasets;
            lineChart.update();
        }
        
        // Monthly Bar Chart
        if (monthlyBarChart) {
            const months = getMonthNames();
            const goalData = [];
            const incomeData = [];
            const expenseData = [];
            const balanceTrendData = [];
            
            const currentYear = currentYearView === 'previous' ? today.getFullYear() - 1 : today.getFullYear();
            
            for (let i = 0; i < 12; i++) {
                const monthStart = new Date(currentYear, i, 1);
                const monthEnd = new Date(currentYear, i + 1, 0);
                
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
                
                // Calculer le balance (income - expense) pour le trend
                const monthBalance = monthIncome - monthExpense;
                balanceTrendData.push(monthBalance);
                
                const goalKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
                const goalForMonth = monthlyGoals[goalKey] || 0;
                goalData.push(goalForMonth);
            }
            
            // Mettre à jour tous les datasets
            monthlyBarChart.data.datasets[0].data = goalData;
            monthlyBarChart.data.datasets[1].data = incomeData;
            monthlyBarChart.data.datasets[2].data = expenseData;
            monthlyBarChart.data.datasets[3].data = balanceTrendData;
            monthlyBarChart.update();
        }
    }
    
    // Calculer la croissance d'un investissement
    function calculateInvestmentGrowth(investment, years = 20) {
        const growth = [];
        
        for (let i = 0; i <= years; i++) {
            const value = investment.initialAmount * Math.pow(1 + investment.annualReturn / 100, i);
            growth.push(value);
        }
        
        return growth;
    }
    
    // Ajouter une transaction
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
    
    // Ajouter un investissement
    function addInvestment() {
        const name = investmentNameInput.value.trim();
        const initialAmount = parseFloat(initialInvestmentInput.value);
        const annualReturn = parseFloat(annualReturnInput.value);
        const goal = parseFloat(investmentGoalInput.value);
        
        if (!name) {
            alert('Please enter a market name');
            return;
        }
        
        if (!initialAmount || initialAmount <= 0) {
            alert('Please enter a valid initial investment');
            return;
        }
        
        if (!annualReturn || annualReturn <= 0) {
            alert('Please enter a valid annual return');
            return;
        }
        
        const investment = {
            id: Date.now(),
            name: name,
            initialAmount: initialAmount,
            annualReturn: annualReturn,
            startDate: new Date().toISOString().split('T')[0],
            goal: goal > 0 ? goal : null
        };
        
        investments.push(investment);
        updateDashboard();
        
        investmentNameInput.value = '';
        initialInvestmentInput.value = '';
        annualReturnInput.value = '';
        investmentGoalInput.value = '';
    }
    
    // Définir l'objectif mensuel
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
    
    // Définir l'objectif annuel
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
    
    // Basculer entre les vues Transactions et Investissements
    function toggleView(view) {
        currentView = view;
        updateView();
    }
    
    // Changer l'année du graphique de catégories
    function toggleCategoryYear(year) {
        currentYearView = year;
        if (year === 'current') {
            currentYearBtn.classList.add('active');
            previousYearBtn.classList.remove('active');
        } else {
            currentYearBtn.classList.remove('active');
            previousYearBtn.classList.add('active');
        }
        updateDashboard();
    }
    
    // **CONFIGURATION DES ÉVÉNEMENTS**
    
    // Configuration directe des événements
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const addInvestmentBtn = document.getElementById('addInvestmentBtn');
    const setGoalBtn = document.getElementById('setGoalBtn');
    const setAllGoalBtn = document.getElementById('setAllGoalBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', addTransaction);
    }
    
    if (addInvestmentBtn) {
        addInvestmentBtn.addEventListener('click', addInvestment);
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
    
    // Configuration des boutons de vue
    if (transacBtn) {
        transacBtn.addEventListener('click', function() {
            toggleView('transactions');
        });
    }
    
    if (investViewBtn) {
        investViewBtn.addEventListener('click', function() {
            toggleView('investments');
        });
    }
    
    // Configuration des boutons d'année (Current/Previous)
    if (currentYearBtn) {
        currentYearBtn.addEventListener('click', function() {
            toggleCategoryYear('current');
        });
    }
    
    if (previousYearBtn) {
        previousYearBtn.addEventListener('click', function() {
            toggleCategoryYear('previous');
        });
    }
    
    // Configuration des boutons d'année pour le monthly chart
    document.querySelectorAll('.month-btn[data-year]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.month-btn[data-year]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentYearView = this.dataset.year;
            updateDashboard();
        });
    });
    
    // **INITIALISATION DE L'APPLICATION**
    function initApp() {
        console.log("Initialisation de l'application Money Management");
        loadData();
        
        // Charger Chart.js si nécessaire
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
    
    // Démarrer l'application
    initApp();
});
