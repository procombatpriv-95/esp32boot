document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes dans menu4Content
    const menu4Content = document.getElementById('menu4Content');
    if (!menu4Content) return;
    
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
    const recentTransactionsTitle = document.getElementById('recentTransactionsTitle');
    const transactionsSummary = document.getElementById('transactionsSummary');
    const investmentsSummary = document.getElementById('investmentsSummary');
    
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
    
    // Générer les données pour les 12 derniers mois
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
    
    // Calculer le temps écoulé depuis le début de l'investissement (en années)
    function calculateYearsSinceStart(startDate) {
        const start = new Date(startDate);
        const now = new Date();
        const diffInMs = now - start;
        const years = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
        return Math.max(0, Math.min(years, 20)); // Limiter à 0-20 ans
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
                console.log("Transactions chargées:", transactions.length);
            }
            
            if (savedInvestments) {
                investments = JSON.parse(savedInvestments);
                console.log("Investissements chargés:", investments.length);
            }
            
            if (savedGoals) {
                monthlyGoals = JSON.parse(savedGoals);
                console.log("Objectifs mensuels chargés:", Object.keys(monthlyGoals).length);
            }
            
            if (savedYearlyGoal) {
                yearlyGoal = parseFloat(savedYearlyGoal);
                console.log("Objectif annuel chargé:", yearlyGoal);
            }
        } catch (e) {
            console.error("Erreur de chargement:", e);
            // Initialiser avec des données par défaut si erreur
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
            console.log("Données sauvegardées");
            
            // Déclencher un événement de stockage pour informer le panel résultat
            window.dispatchEvent(new Event('storage'));
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
        saveData(); // Sauvegarder pour le panel résultat
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
            filtered.slice(0, 8).forEach(transaction => { // Réduit à 8 transactions
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
                            <button class="trash-icon-btn" onclick="window.deleteInvestment(${investment.id})">
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
            console.log('Transaction deleted');
        }
    }
    
    // Supprimer un investissement
    window.deleteInvestment = function(id) {
        if (confirm('Are you sure you want to delete this investment?')) {
            investments = investments.filter(i => i.id !== id);
            saveData();
            updateDashboard();
            console.log('Investment deleted');
        }
    }
    
    // Effacer toutes les transactions
    function clearAllTransactions() {
        if (transactions.length === 0) {
            console.log('No transactions to delete');
            return;
        }
        
        if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
            transactions = [];
            saveData();
            updateDashboard();
            console.log('All transactions deleted');
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
    
    // Calculer la croissance d'un investissement sur 20 ans
    function calculateInvestmentGrowth(investment, years = 20) {
        const growth = [];
        
        for (let i = 0; i <= years; i++) {
            const value = investment.initialAmount * Math.pow(1 + investment.annualReturn / 100, i);
            growth.push(value);
        }
        
        return growth;
    }
    
    // Trouver l'année où l'objectif d'un investissement est atteint
    function findGoalYear(investment, growth) {
        if (!investment.goal) return null;
        
        for (let i = 0; i < growth.length; i++) {
            if (growth[i] >= investment.goal) {
                return i;
            }
        }
        return null;
    }
    
    // Calculer les données pour le graphique Category Perspective
    function calculateCategoryPerspectiveData() {
        const categories = {};
        
        // Initialiser les catégories
        const allCategories = ['Trading', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Salary', 'Selling', 'Other'];
        allCategories.forEach(cat => {
            categories[cat] = {
                income: 0,
                expense: 0
            };
        });
        
        // Calculer les totaux par catégorie
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                categories[transaction.category].income += transaction.amount;
            } else {
                categories[transaction.category].expense += transaction.amount;
            }
        });
        
        // Filtrer les catégories qui ont des données
        const filteredCategories = Object.keys(categories).filter(cat => 
            categories[cat].income > 0 || categories[cat].expense > 0
        );
        
        // Trier par total (income + expense) décroissant
        filteredCategories.sort((a, b) => {
            const totalA = categories[a].income + categories[a].expense;
            const totalB = categories[b].income + categories[b].expense;
            return totalB - totalA;
        });
        
        return {
            categories: filteredCategories,
            data: categories
        };
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
        
        // Monthly Bar Chart avec filled line chart intégré
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
        
        // Initialiser le graphique Category Perspective personnalisé
        initCategoryPerspectiveChart();
    }
    
    // Initialiser le graphique Category Perspective personnalisé
    function initCategoryPerspectiveChart() {
        const categoryPerspectiveContainer = document.querySelector('.category-perspective-container');
        if (categoryPerspectiveContainer) {
            // Supprimer le contenu existant
            categoryPerspectiveContainer.innerHTML = '';
            
            // Créer un wrapper pour notre graphique personnalisé
            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'category-perspective-wrapper';
            chartWrapper.id = 'categoryPerspectiveChartCustom';
            categoryPerspectiveContainer.appendChild(chartWrapper);
        }
    }
    
    // Mettre à jour les graphiques
    function updateCharts() {
        console.log("Mise à jour des graphiques");
        
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
                
                // Créer un tableau de couleurs pour les points
                const pointBackgroundColors = [];
                const pointBorderColors = [];
                const pointRadii = [];
                
                // Trouver l'année du goal
                const goalYear = findGoalYear(investment, growth);
                
                // Calculer le temps écoulé depuis le début
                const yearsSinceStart = calculateYearsSinceStart(investment.startDate);
                
                // Configurer les points
                for (let i = 0; i < growth.length; i++) {
                    if (goalYear !== null && i === goalYear && growth[i] >= investment.goal) {
                        // Point rouge pour le goal
                        pointBackgroundColors.push('#e74c3c');
                        pointBorderColors.push('#e74c3c');
                        pointRadii.push(3);
                    } else if (Math.abs(i - yearsSinceStart) < 0.5) {
                        // Point noir pour la position actuelle
                        pointBackgroundColors.push('#000000');
                        pointBorderColors.push('#000000');
                        pointRadii.push(3);
                    } else {
                        // Point normal
                        pointBackgroundColors.push(investment.color || getColor(index));
                        pointBorderColors.push(investment.color || getColor(index));
                        pointRadii.push(3);
                    }
                }
                
                // Ajouter le dataset principal pour l'investissement avec les points colorés
                datasets.push({
                    label: `${investment.name} (${investment.annualReturn}%)`,
                    data: growth,
                    borderColor: investment.color || getColor(index),
                    backgroundColor: investment.color || getColor(index),
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: pointRadii,
                    pointBackgroundColor: pointBackgroundColors,
                    pointBorderColor: pointBorderColors,
                    pointHoverRadius: 5
                });
            });
            
            lineChart.data.datasets = datasets;
            lineChart.update();
        }
        
        // Monthly Bar Chart - 12 mois - AVEC FILLED LINE CHART
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
                
                // Calculer le balance (income - expense) pour le trend
                const monthBalance = monthIncome - monthExpense;
                balanceTrendData.push(monthBalance);
                
                const goalKey = `${year}-${month}`;
                const goalForMonth = monthlyGoals[goalKey] || 0;
                goalData.push(goalForMonth);
            });
            
            // Mettre à jour tous les datasets
            monthlyBarChart.data.datasets[0].data = goalData;
            monthlyBarChart.data.datasets[1].data = incomeData;
            monthlyBarChart.data.datasets[2].data = expenseData;
            monthlyBarChart.data.datasets[3].data = balanceTrendData;
            monthlyBarChart.update();
        }
        
        // Mettre à jour le graphique Category Perspective personnalisé
        updateCategoryPerspectiveChart();
        updateCategorySpectrum();
    }
    
    // Mettre à jour le graphique Category Perspective personnalisé
    function updateCategoryPerspectiveChart() {
        const chartWrapper = document.getElementById('categoryPerspectiveChartCustom');
        if (!chartWrapper) {
            initCategoryPerspectiveChart();
            return;
        }
        
        const categoryData = calculateCategoryPerspectiveData();
        const labels = categoryData.categories;
        
        if (labels.length === 0) {
            chartWrapper.innerHTML = `
                <div class="no-categories-data">
                    <i class="fas fa-chart-bar"></i>
                    <div>No category data available</div>
                </div>
            `;
            return;
        }
        
        // Trouver la valeur maximale pour l'échelle
        let maxValue = 0;
        labels.forEach(category => {
            const data = categoryData.data[category];
            maxValue = Math.max(maxValue, data.income, data.expense);
        });
        
        // S'assurer que maxValue n'est pas 0 pour éviter la division par zéro
        if (maxValue === 0) maxValue = 1;
        
        // Créer le HTML pour chaque catégorie
        let html = '';
        
        labels.forEach(category => {
            const data = categoryData.data[category];
            // Les barres peuvent aller jusqu'à 100% maintenant
            const incomeWidth = (data.income / maxValue) * 100;
            const expenseWidth = (data.expense / maxValue) * 100;
            
            html += `
                <div class="category-perspective-row">
                    <div class="category-name" title="${category}">${category}</div>
                    <div class="category-bars-container">
                        <div class="center-white-line"></div>
                        ${data.expense > 0 ? `
                            <div class="category-bar expense-bar" 
                                 style="width: ${expenseWidth}%; right: 50%;">
                                -£${data.expense.toFixed(0)}
                            </div>
                        ` : ''}
                        ${data.income > 0 ? `
                            <div class="category-bar income-bar" 
                                 style="width: ${incomeWidth}%; left: 50%;">
                                £${data.income.toFixed(0)}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        chartWrapper.innerHTML = html;
    }
    
    // Mettre à jour le spectrum (axe) en dessous
    function updateCategorySpectrum() {
        const categorySpectrum = document.getElementById('categorySpectrum');
        if (!categorySpectrum) return;
        
        const categoryData = calculateCategoryPerspectiveData();
        let maxValue = 0;
        
        // Trouver la valeur maximale pour l'échelle
        categoryData.categories.forEach(category => {
            const data = categoryData.data[category];
            maxValue = Math.max(maxValue, data.income, data.expense);
        });
        
        if (maxValue === 0) maxValue = 1;
        
        // Créer le spectrum avec 7 points: -max, -2/3 max, -1/3 max, 0, 1/3 max, 2/3 max, max
        const positions = [-1, -0.666, -0.333, 0, 0.333, 0.666, 1];
        const labels = [
            `-£${Math.round(maxValue)}`,
            `-£${Math.round(maxValue * 2/3)}`,
            `-£${Math.round(maxValue * 1/3)}`,
            '£0',
            `£${Math.round(maxValue * 1/3)}`,
            `£${Math.round(maxValue * 2/3)}`,
            `£${Math.round(maxValue)}`
        ];
        
        let html = '<div class="spectrum-scale">';
        
        // Ajouter la ligne centrale avec £0
        html += `
            <div class="center-tick"></div>
            <div class="center-label">£0</div>
        `;
        
        // Ajouter les ticks et labels
        positions.forEach((pos, index) => {
            if (pos !== 0) { // Éviter de dupliquer le centre
                const positionPercent = 50 + (pos * 50); // Convertir de -1..1 à 0..100%
                html += `
                    <div class="spectrum-tick" style="left: ${positionPercent}%;"></div>
                    <div class="spectrum-label" style="left: ${positionPercent}%;">${labels[index]}</div>
                `;
            }
        });
        
        html += '</div>';
        categorySpectrum.innerHTML = html;
    }
    
    // Générer une couleur pour les investissements
    function getColor(index) {
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c'];
        return colors[index % colors.length];
    }
    
    // Ajouter une transaction
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
        updateDashboard();
        
        amountInput.value = '';
        descriptionInput.value = '';
        
        console.log('Transaction added successfully!');
    }
    
    // Ajouter un investissement
    function addInvestment() {
        console.log("Bouton Add Investment cliqué");
        
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
            color: getColor(investments.length),
            goal: goal > 0 ? goal : null
        };
        
        investments.push(investment);
        updateDashboard();
        
        investmentNameInput.value = '';
        initialInvestmentInput.value = '';
        annualReturnInput.value = '';
        investmentGoalInput.value = '';
        
        console.log('Investment added successfully!');
    }
    
    // Définir l'objectif mensuel
    function setGoal() {
        console.log("Bouton Set Goal cliqué");
        
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
        console.log(`Goal for ${currentMonth}/${currentYear} set to £${amount.toFixed(2)}`);
    }
    
    // Définir l'objectif annuel
    function setAllGoals() {
        console.log("Bouton Set All Goals cliqué");
        
        const amount = parseFloat(goalAllAmountInput.value);
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid goal amount');
            return;
        }
        
        yearlyGoal = amount;
        updateDashboard();
        
        goalAllAmountInput.value = '';
        console.log(`Yearly goal set to £${amount.toFixed(2)}`);
    }
    
    // Basculer entre les vues Transactions et Investissements
    function toggleView(view) {
        currentView = view;
        updateView();
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
        
        console.log("Application Money Management initialisée");
    }
    
    // Démarrer l'application quand la page est chargée
    initApp();
    
    // Réinitialiser les dimensions si besoin
    window.addEventListener('resize', function() {
        setTimeout(updateCharts, 100);
    });
});
