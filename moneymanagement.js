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
            let currentYearCompare = 'current'; // Pour le double bar graph
            
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
            let expensePieChart, incomePieChart, lineChart, monthlyBarChart, doubleBarChart;
            
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
                saveData();
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
            
            // Calculer les données pour le double bar graph par catégorie
            function calculateCategoryData(yearOffset = 0) {
                const currentYear = new Date().getFullYear() - yearOffset;
                const categories = ['Trading', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Salary', 'Selling', 'Other'];
                
                const categoryData = {};
                categories.forEach(cat => {
                    categoryData[cat] = 0;
                });
                
                // Filtrer les transactions pour l'année spécifiée
                const yearTransactions = transactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getFullYear() === currentYear && t.type === 'income';
                });
                
                // Calculer les totaux par catégorie
                yearTransactions.forEach(transaction => {
                    if (categoryData.hasOwnProperty(transaction.category)) {
                        categoryData[transaction.category] += transaction.amount;
                    } else {
                        categoryData[transaction.category] = transaction.amount;
                    }
                });
                
                // Convertir en tableau pour le graphique
                const labels = [];
                const data = [];
                
                // Trier par montant décroissant
                const sortedCategories = Object.keys(categoryData).sort((a, b) => categoryData[b] - categoryData[a]);
                
                sortedCategories.forEach(cat => {
                    if (categoryData[cat] > 0) {
                        labels.push(cat);
                        data.push(categoryData[cat]);
                    }
                });
                
                return { labels, data };
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
                
                // DOUBLE BAR CHART - Category Balance & Contribution
                const doubleBarCanvas = document.getElementById('doubleBarChart');
                if (doubleBarCanvas) {
                    const doubleBarCtx = doubleBarCanvas.getContext('2d');
                    doubleBarChart = new Chart(doubleBarCtx, {
                        type: 'bar',
                        data: {
                            labels: [],
                            datasets: [
                                {
                                    label: 'Current Year',
                                    data: [],
                                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                                    borderColor: '#3498db',
                                    borderWidth: 1,
                                    barPercentage: 0.6,
                                    categoryPercentage: 0.8
                                },
                                {
                                    label: 'Previous Year',
                                    data: [],
                                    backgroundColor: 'rgba(155, 89, 182, 0.8)',
                                    borderColor: '#9b59b6',
                                    borderWidth: 1,
                                    barPercentage: 0.6,
                                    categoryPercentage: 0.8
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            scales: {
                                x: {
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
                                    beginAtZero: true,
                                    ticks: {
                                        font: {
                                            size: 9
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
                                    borderWidth: 1,
                                    callbacks: {
                                        label: function(context) {
                                            let label = context.dataset.label || '';
                                            if (label) {
                                                label += ': ';
                                            }
                                            label += '£' + context.parsed.y.toFixed(2);
                                            return label;
                                        }
                                    }
                                }
                            }
                        }
                    });
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
                        // Calculer la croissance
                        const growth = [];
                        for (let i = 0; i <= years; i++) {
                            const value = investment.initialAmount * Math.pow(1 + investment.annualReturn / 100, i);
                            growth.push(value);
                        }
                        
                        datasets.push({
                            label: `${investment.name} (${investment.annualReturn}%)`,
                            data: growth,
                            borderColor: investment.color || getColor(index),
                            backgroundColor: investment.color || getColor(index),
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
                
                // DOUBLE BAR CHART - Category Balance
                if (doubleBarChart) {
                    // Calculer les données pour l'année en cours et l'année précédente
                    const currentYearData = calculateCategoryData(0); // Année en cours
                    const previousYearData = calculateCategoryData(1); // Année précédente
                    
                    // Limiter à 6 catégories pour une meilleure lisibilité
                    const maxCategories = 6;
                    const limitedLabels = currentYearData.labels.slice(0, maxCategories);
                    
                    // Ajuster les données en fonction des labels limités
                    const limitedCurrentData = [];
                    const limitedPreviousData = [];
                    
                    limitedLabels.forEach((label, index) => {
                        limitedCurrentData.push(currentYearData.data[index]);
                        
                        // Trouver l'index correspondant dans les données de l'année précédente
                        const prevIndex = previousYearData.labels.indexOf(label);
                        if (prevIndex !== -1) {
                            limitedPreviousData.push(previousYearData.data[prevIndex]);
                        } else {
                            limitedPreviousData.push(0);
                        }
                    });
                    
                    doubleBarChart.data.labels = limitedLabels;
                    
                    if (currentYearCompare === 'current') {
                        doubleBarChart.data.datasets[0].label = 'Current Year Income';
                        doubleBarChart.data.datasets[0].data = limitedCurrentData;
                        doubleBarChart.data.datasets[1].label = 'Previous Year Income';
                        doubleBarChart.data.datasets[1].data = limitedPreviousData;
                    } else {
                        // Inverser pour montrer l'année précédente en premier
                        doubleBarChart.data.datasets[0].label = 'Previous Year Income';
                        doubleBarChart.data.datasets[0].data = limitedPreviousData;
                        doubleBarChart.data.datasets[1].label = 'Current Year Income';
                        doubleBarChart.data.datasets[1].data = limitedCurrentData;
                    }
                    
                    doubleBarChart.update();
                }
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
            
            // Configuration des boutons de comparaison d'année pour le double bar graph
            document.querySelectorAll('.month-btn[data-year-compare]').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.month-btn[data-year-compare]').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentYearCompare = this.dataset.yearCompare;
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
