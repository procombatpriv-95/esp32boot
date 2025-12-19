        window.addEventListener("load", () => {
            console.log("Démarrage de l'application Money Manager...");
            
            // Variables globales
            let moneyTransactions = [];
            let moneyInvestments = [];
            let moneyMonthlyGoals = {};
            let moneyCurrentFilter = 'month';
            let moneyCurrentYearView = 'current';
            let moneyCurrentTransactionFilter = 'all';
            let moneyCurrentView = 'transactions';
            
            // Récupérer les éléments DOM
            const moneyAmountInput = document.getElementById('amount');
            const moneyDescriptionInput = document.getElementById('description');
            const moneyDateInput = document.getElementById('date');
            const moneyGoalAmountInput = document.getElementById('goalAmount');
            const moneyGoalAllAmountInput = document.getElementById('goalAllAmount');
            const moneyTransactionTypeSelect = document.getElementById('transactionType');
            const moneyCategorySelect = document.getElementById('category');
            const moneyInvestmentNameInput = document.getElementById('investmentName');
            const moneyInitialInvestmentInput = document.getElementById('initialInvestment');
            const moneyAnnualReturnInput = document.getElementById('annualReturn');
            const moneyInvestmentGoalInput = document.getElementById('investmentGoal');
            const moneyTransacBtn = document.getElementById('transacBtn');
            const moneyInvestViewBtn = document.getElementById('investViewBtn');
            const moneyRecentTransactionsTitle = document.getElementById('recentTransactionsTitle');
            const moneyTransactionsSummary = document.getElementById('transactionsSummary');
            const moneyInvestmentsSummary = document.getElementById('investmentsSummary');
            
            // Variables pour les graphiques
            let moneyExpensePieChart, moneyIncomePieChart, moneyLineChart, moneyMonthlyBarChart;
            
            // Initialiser la date à aujourd'hui
            const moneyToday = new Date();
            const moneyYyyy = moneyToday.getFullYear();
            const moneyMm = String(moneyToday.getMonth() + 1).padStart(2, '0');
            const moneyDd = String(moneyToday.getDate()).padStart(2, '0');
            moneyDateInput.value = `${moneyYyyy}-${moneyMm}-${moneyDd}`;
            
            // Générer les noms des 12 mois
            function moneyGetMonthNames() {
                return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            }
            
            // Générer les données pour les 12 derniers mois
            function moneyGetLast12Months(yearOffset = 0) {
                const moneyCurrentDate = new Date();
                const moneyCurrentYear = moneyCurrentDate.getFullYear() - yearOffset;
                const moneyMonths = moneyGetMonthNames();
                
                let moneyStartMonth = yearOffset === 1 ? 11 : moneyCurrentDate.getMonth();
                let moneyStartYear = moneyCurrentYear;
                
                const moneyMonthLabels = [];
                const moneyMonthKeys = [];
                
                for (let i = 0; i < 12; i++) {
                    let moneyMonthIndex = (moneyStartMonth - i + 12) % 12;
                    let moneyYear = moneyStartYear;
                    
                    if (moneyStartMonth - i < 0) {
                        moneyYear = moneyStartYear - 1;
                    }
                    
                    moneyMonthLabels.unshift(moneyMonths[moneyMonthIndex] + ' ' + moneyYear);
                    moneyMonthKeys.unshift(`${moneyYear}-${String(moneyMonthIndex + 1).padStart(2, '0')}`);
                }
                
                return { labels: moneyMonthLabels, keys: moneyMonthKeys };
            }
            
            // Formater la date pour l'affichage
            function moneyFormatDate(dateString) {
                const moneyDate = new Date(dateString);
                return moneyDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            }
            
            // Calculer le solde total
            function moneyCalculateTotalBalance() {
                const moneyTotalIncome = moneyTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const moneyTotalExpenses = moneyTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                return moneyTotalIncome - moneyTotalExpenses;
            }
            
            // Calculer le total investi
            function moneyCalculateTotalInvested() {
                return moneyInvestments.reduce((sum, i) => sum + i.initialAmount, 0);
            }
            
            // Calculer le rendement moyen
            function moneyCalculateAverageReturn() {
                if (moneyInvestments.length === 0) return 0;
                const moneyTotalReturn = moneyInvestments.reduce((sum, i) => sum + i.annualReturn, 0);
                return moneyTotalReturn / moneyInvestments.length;
            }
            
            // Calculer le temps écoulé depuis le début de l'investissement (en années)
            function moneyCalculateYearsSinceStart(startDate) {
                const moneyStart = new Date(startDate);
                const moneyNow = new Date();
                const moneyDiffInMs = moneyNow - moneyStart;
                const moneyYears = moneyDiffInMs / (1000 * 60 * 60 * 24 * 365.25);
                return Math.max(0, Math.min(moneyYears, 20));
            }
            
            // Charger les données depuis localStorage
            function moneyLoadData() {
                try {
                    const moneySavedTransactions = localStorage.getItem('moneyManagerTransactions');
                    const moneySavedInvestments = localStorage.getItem('moneyManagerInvestments');
                    const moneySavedGoals = localStorage.getItem('moneyManagerGoals');
                    
                    if (moneySavedTransactions) {
                        moneyTransactions = JSON.parse(moneySavedTransactions);
                        console.log("Transactions chargées:", moneyTransactions.length);
                    }
                    
                    if (moneySavedInvestments) {
                        moneyInvestments = JSON.parse(moneySavedInvestments);
                        console.log("Investissements chargés:", moneyInvestments.length);
                    }
                    
                    if (moneySavedGoals) {
                        moneyMonthlyGoals = JSON.parse(moneySavedGoals);
                        console.log("Objectifs mensuels chargés:", Object.keys(moneyMonthlyGoals).length);
                    }
                } catch (e) {
                    console.error("Erreur de chargement:", e);
                }
            }
            
            // Sauvegarder les données dans localStorage
            function moneySaveData() {
                try {
                    localStorage.setItem('moneyManagerTransactions', JSON.stringify(moneyTransactions));
                    localStorage.setItem('moneyManagerInvestments', JSON.stringify(moneyInvestments));
                    localStorage.setItem('moneyManagerGoals', JSON.stringify(moneyMonthlyGoals));
                    console.log("Données sauvegardées");
                } catch (e) {
                    console.error("Erreur de sauvegarde:", e);
                }
            }
            
            // Mettre à jour tout le dashboard
            function moneyUpdateDashboard() {
                moneyUpdateView();
                moneyUpdateSummary();
                moneyUpdateRecentTransactionsSummary();
                moneyUpdateCharts();
            }
            
            // Mettre à jour la vue (transactions ou investissements)
            function moneyUpdateView() {
                const moneyList = document.getElementById('transactionsList');
                
                if (moneyCurrentView === 'transactions') {
                    moneyRecentTransactionsTitle.innerHTML = '<i class="fas fa-history"></i> Recent Transactions';
                    moneyTransacBtn.textContent = 'Transaction';
                    moneyTransacBtn.classList.add('active');
                    moneyInvestViewBtn.classList.remove('active');
                    
                    moneyTransactionsSummary.style.display = 'flex';
                    moneyInvestmentsSummary.style.display = 'none';
                    
                    let moneyFiltered;
                    
                    if (moneyCurrentTransactionFilter === 'month') {
                        const moneyNow = new Date();
                        const moneyCurrentMonth = moneyNow.getMonth();
                        const moneyCurrentYear = moneyNow.getFullYear();
                        moneyFiltered = moneyTransactions.filter(t => {
                            const moneyTDate = new Date(t.date);
                            return moneyTDate.getMonth() === moneyCurrentMonth && moneyTDate.getFullYear() === moneyCurrentYear;
                        });
                    } else {
                        moneyFiltered = moneyTransactions;
                    }
                    
                    moneyFiltered.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    if (moneyFiltered.length === 0) {
                        moneyList.innerHTML = `
                            <div class="no-data">
                                <i class="fas fa-exchange-alt"></i>
                                <div>No transactions yet</div>
                            </div>
                        `;
                        return;
                    }
                    
                    let moneyHtml = '';
                    moneyFiltered.slice(0, 12).forEach(moneyTransaction => {
                        const moneySign = moneyTransaction.type === 'income' ? '+' : '-';
                        const moneyAmountClass = moneyTransaction.type === 'income' ? 'transaction-income' : 'transaction-expense';
                        
                        moneyHtml += `
                            <div class="transaction-item" data-id="${moneyTransaction.id}">
                                <div class="transaction-info">
                                    <div class="transaction-category">${moneyTransaction.category}</div>
                                    <div class="transaction-description">${moneyTransaction.description}</div>
                                    <div class="transaction-date">${moneyFormatDate(moneyTransaction.date)}</div>
                                </div>
                                <div class="transaction-actions">
                                    <div class="transaction-amount ${moneyAmountClass}">
                                        ${moneySign}£${moneyTransaction.amount.toFixed(2)}
                                    </div>
                                    <button class="delete-btn" onclick="moneyDeleteTransaction(${moneyTransaction.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                    
                    moneyList.innerHTML = moneyHtml;
                } else {
                    moneyRecentTransactionsTitle.innerHTML = '<i class="fas fa-line-chart"></i> Investments';
                    moneyTransacBtn.textContent = 'Transaction';
                    moneyTransacBtn.classList.remove('active');
                    moneyInvestViewBtn.classList.add('active');
                    
                    moneyTransactionsSummary.style.display = 'none';
                    moneyInvestmentsSummary.style.display = 'flex';
                    
                    document.getElementById('totalInvested').textContent = '£' + moneyCalculateTotalInvested().toLocaleString();
                    document.getElementById('avgReturn').textContent = moneyCalculateAverageReturn().toFixed(1) + '%';
                    document.getElementById('totalInvestments').textContent = moneyInvestments.length;
                    
                    if (moneyInvestments.length === 0) {
                        moneyList.innerHTML = `
                            <div class="no-data">
                                <i class="fas fa-briefcase"></i>
                                <div>No investments yet</div>
                            </div>
                        `;
                        return;
                    }
                    
                    let moneyHtml = '';
                    moneyInvestments.forEach(moneyInvestment => {
                        const moneyGoalText = moneyInvestment.goal ? ` | Goal: £${moneyInvestment.goal.toLocaleString()}` : '';
                        moneyHtml += `
                            <div class="transaction-item" data-id="${moneyInvestment.id}">
                                <div class="transaction-info">
                                    <div class="transaction-category">${moneyInvestment.name}</div>
                                    <div class="transaction-description">Return: ${moneyInvestment.annualReturn}%${moneyGoalText}</div>
                                    <div class="transaction-date">Started: ${moneyFormatDate(moneyInvestment.startDate)}</div>
                                </div>
                                <div class="transaction-actions">
                                    <div class="transaction-amount transaction-income">
                                        £${moneyInvestment.initialAmount.toLocaleString()}
                                    </div>
                                    <button class="delete-btn" onclick="moneyDeleteInvestment(${moneyInvestment.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                    
                    moneyList.innerHTML = moneyHtml;
                }
            }
            
            // Mettre à jour les résumés des transactions récentes
            function moneyUpdateRecentTransactionsSummary() {
                let moneyFiltered;
                
                if (moneyCurrentTransactionFilter === 'month') {
                    const moneyNow = new Date();
                    const moneyCurrentMonth = moneyNow.getMonth();
                    const moneyCurrentYear = moneyNow.getFullYear();
                    moneyFiltered = moneyTransactions.filter(t => {
                        const moneyTDate = new Date(t.date);
                        return moneyTDate.getMonth() === moneyCurrentMonth && moneyTDate.getFullYear() === moneyCurrentYear;
                    });
                } else {
                    moneyFiltered = moneyTransactions;
                }
                
                const moneyTotalIncome = moneyFiltered
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const moneyTotalExpenses = moneyFiltered
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const moneyBalance = moneyTotalIncome - moneyTotalExpenses;
                
                document.getElementById('recentIncome').textContent = '£' + moneyTotalIncome.toFixed(2);
                document.getElementById('recentExpenses').textContent = '£' + moneyTotalExpenses.toFixed(2);
                document.getElementById('recentBalance').textContent = '£' + moneyBalance.toFixed(2);
            }
            
            // Supprimer une transaction
            window.moneyDeleteTransaction = function(id) {
                if (confirm('Are you sure you want to delete this transaction?')) {
                    moneyTransactions = moneyTransactions.filter(t => t.id !== id);
                    moneySaveData();
                    moneyUpdateDashboard();
                    console.log('Transaction deleted');
                }
            }
            
            // Supprimer un investissement
            window.moneyDeleteInvestment = function(id) {
                if (confirm('Are you sure you want to delete this investment?')) {
                    moneyInvestments = moneyInvestments.filter(i => i.id !== id);
                    moneySaveData();
                    moneyUpdateDashboard();
                    console.log('Investment deleted');
                }
            }
            
            // Effacer toutes les transactions
            function moneyClearAllTransactions() {
                if (moneyTransactions.length === 0) {
                    console.log('No transactions to delete');
                    return;
                }
                
                if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
                    moneyTransactions = [];
                    moneySaveData();
                    moneyUpdateDashboard();
                    console.log('All transactions deleted');
                }
            }
            
            // Mettre à jour les résumés
            function moneyUpdateSummary() {
                const moneyFiltered = moneyFilterTransactions(moneyTransactions, moneyCurrentFilter);
                
                const moneyFilteredIncome = moneyFiltered
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const moneyFilteredExpenses = moneyFiltered
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const moneyBalance = moneyCalculateTotalBalance();

                document.getElementById('currentBalanceControl').textContent = '£' + moneyBalance.toFixed(2);
                document.getElementById('totalTransactions').textContent = moneyFiltered.length;
            }
            
            // Filtrer les transactions
            function moneyFilterTransactions(transactions, period) {
                const moneyNow = new Date();
                
                switch(period) {
                    case 'today':
                        const moneyToday = new Date().toISOString().split('T')[0];
                        return transactions.filter(t => t.date === moneyToday);
                    case 'week':
                        const moneyOneWeekAgo = new Date(moneyNow.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return transactions.filter(t => new Date(t.date) >= moneyOneWeekAgo);
                    case 'month':
                        const moneyCurrentMonth = moneyNow.getMonth();
                        const moneyCurrentYear = moneyNow.getFullYear();
                        return transactions.filter(t => {
                            const moneyTDate = new Date(t.date);
                            return moneyTDate.getMonth() === moneyCurrentMonth && moneyTDate.getFullYear() === moneyCurrentYear;
                        });
                    case 'year':
                        const moneyCurrentYearOnly = moneyNow.getFullYear();
                        return transactions.filter(t => new Date(t.date).getFullYear() === moneyCurrentYearOnly);
                    default:
                        return transactions;
                }
            }
            
            // Calculer la croissance d'un investissement sur 20 ans
            function moneyCalculateInvestmentGrowth(investment, years = 20) {
                const moneyGrowth = [];
                
                for (let i = 0; i <= years; i++) {
                    const moneyValue = investment.initialAmount * Math.pow(1 + investment.annualReturn / 100, i);
                    moneyGrowth.push(moneyValue);
                }
                
                return moneyGrowth;
            }
            
            // Trouver l'année où l'objectif d'un investissement est atteint
            function moneyFindGoalYear(investment, growth) {
                if (!investment.goal) return null;
                
                for (let i = 0; i < growth.length; i++) {
                    if (growth[i] >= investment.goal) {
                        return i;
                    }
                }
                return null;
            }
            
            // Initialiser les graphiques
            function moneyInitCharts() {
                // Expense Pie Chart
                const moneyExpensePieCtx = document.getElementById('expensePieChart').getContext('2d');
                moneyExpensePieChart = new Chart(moneyExpensePieCtx, {
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
                
                // Income Pie Chart
                const moneyIncomePieCtx = document.getElementById('incomePieChart').getContext('2d');
                moneyIncomePieChart = new Chart(moneyIncomePieCtx, {
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
                
                // Line Chart pour les investissements (20 ans)
                const moneyLineCtx = document.getElementById('lineChart').getContext('2d');
                moneyLineChart = new Chart(moneyLineCtx, {
                    type: 'line',
                    data: { labels: [], datasets: [] },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Years',
                                    font: { size: 10 },
                                    color: 'white'
                                },
                                ticks: {
                                    font: { size: 9 },
                                    color: 'white'
                                },
                                grid: { color: 'white' }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Value (£)',
                                    font: { size: 10 },
                                    color: 'white'
                                },
                                ticks: {
                                    font: { size: 9 },
                                    color: 'white',
                                    callback: function(value) {
                                        return '£' + (value/1000).toFixed(0) + 'K';
                                    }
                                },
                                grid: { color: 'white' }
                            }
                        },
                        plugins: {
                            legend: {
                                labels: {
                                    font: { size: 9 },
                                    color: 'white',
                                    boxWidth: 10,
                                    padding: 5
                                },
                                position: 'top'
                            }
                        }
                    }
                });
                
                // Monthly Bar Chart avec filled line chart intégré
                const moneyMonthlyBarCtx = document.getElementById('monthlyBarChart').getContext('2d');
                moneyMonthlyBarChart = new Chart(moneyMonthlyBarCtx, {
                    type: 'bar',
                    data: {
                        labels: moneyGetLast12Months().labels,
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
                                    callback: function(value) {
                                        return '£' + value;
                                    }
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
            
            // Mettre à jour les graphiques
            function moneyUpdateCharts() {
                console.log("Mise à jour des graphiques");
                
                const moneyFiltered = moneyFilterTransactions(moneyTransactions, moneyCurrentFilter);
                
                // Pie Chart des Dépenses
                const moneyExpenses = moneyFiltered.filter(t => t.type === 'expense');
                const moneyExpenseCategories = {};
                moneyExpenses.forEach(moneyExpense => {
                    if (!moneyExpenseCategories[moneyExpense.category]) {
                        moneyExpenseCategories[moneyExpense.category] = 0;
                    }
                    moneyExpenseCategories[moneyExpense.category] += moneyExpense.amount;
                });
                
                moneyExpensePieChart.data.labels = Object.keys(moneyExpenseCategories);
                moneyExpensePieChart.data.datasets[0].data = Object.values(moneyExpenseCategories);
                moneyExpensePieChart.update();
                
                // Pie Chart des Revenus
                const moneyIncomes = moneyFiltered.filter(t => t.type === 'income');
                const moneyIncomeCategories = {};
                moneyIncomes.forEach(moneyIncome => {
                    if (!moneyIncomeCategories[moneyIncome.category]) {
                        moneyIncomeCategories[moneyIncome.category] = 0;
                    }
                    moneyIncomeCategories[moneyIncome.category] += moneyIncome.amount;
                });
                
                moneyIncomePieChart.data.labels = Object.keys(moneyIncomeCategories);
                moneyIncomePieChart.data.datasets[0].data = Object.values(moneyIncomeCategories);
                moneyIncomePieChart.update();
                
                // Line Chart des investissements (20 ans)
                const moneyYears = 20;
                const moneyYearLabels = [];
                for (let i = 0; i <= moneyYears; i++) {
                    moneyYearLabels.push(`Y${i}`);
                }
                
                moneyLineChart.data.labels = moneyYearLabels;
                
                const moneyDatasets = [];
                
                moneyInvestments.forEach((moneyInvestment, moneyIndex) => {
                    const moneyGrowth = moneyCalculateInvestmentGrowth(moneyInvestment, moneyYears);
                    const moneyPointBackgroundColors = [];
                    const moneyPointBorderColors = [];
                    const moneyPointRadii = [];
                    
                    const moneyGoalYear = moneyFindGoalYear(moneyInvestment, moneyGrowth);
                    const moneyYearsSinceStart = moneyCalculateYearsSinceStart(moneyInvestment.startDate);
                    
                    for (let i = 0; i < moneyGrowth.length; i++) {
                        if (moneyGoalYear !== null && i === moneyGoalYear && moneyGrowth[i] >= moneyInvestment.goal) {
                            moneyPointBackgroundColors.push('#e74c3c');
                            moneyPointBorderColors.push('#e74c3c');
                            moneyPointRadii.push(3);
                        } else if (Math.abs(i - moneyYearsSinceStart) < 0.5) {
                            moneyPointBackgroundColors.push('#000000');
                            moneyPointBorderColors.push('#000000');
                            moneyPointRadii.push(3);
                        } else {
                            moneyPointBackgroundColors.push(moneyInvestment.color || moneyGetColor(moneyIndex));
                            moneyPointBorderColors.push(moneyInvestment.color || moneyGetColor(moneyIndex));
                            moneyPointRadii.push(3);
                        }
                    }
                    
                    moneyDatasets.push({
                        label: `${moneyInvestment.name} (${moneyInvestment.annualReturn}%)`,
                        data: moneyGrowth,
                        borderColor: moneyInvestment.color || moneyGetColor(moneyIndex),
                        backgroundColor: moneyInvestment.color || moneyGetColor(moneyIndex),
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        pointRadius: moneyPointRadii,
                        pointBackgroundColor: moneyPointBackgroundColors,
                        pointBorderColor: moneyPointBorderColors,
                        pointHoverRadius: 5
                    });
                });
                
                moneyLineChart.data.datasets = moneyDatasets;
                moneyLineChart.update();
                
                // Monthly Bar Chart - 12 mois - AVEC FILLED LINE CHART
                const moneyMonthData = moneyGetLast12Months(moneyCurrentYearView === 'previous' ? 1 : 0);
                moneyMonthlyBarChart.data.labels = moneyMonthData.labels;
                
                const moneyGoalData = [];
                const moneyIncomeData = [];
                const moneyExpenseData = [];
                const moneyBalanceTrendData = [];
                
                moneyMonthData.keys.forEach(moneyMonthKey => {
                    const [moneyYear, moneyMonth] = moneyMonthKey.split('-');
                    const moneyMonthStart = new Date(moneyYear, moneyMonth - 1, 1);
                    const moneyMonthEnd = new Date(moneyYear, moneyMonth, 0);
                    
                    const moneyMonthTransactions = moneyTransactions.filter(t => {
                        const moneyTDate = new Date(t.date);
                        return moneyTDate >= moneyMonthStart && moneyTDate <= moneyMonthEnd;
                    });
                    
                    const moneyMonthIncome = moneyMonthTransactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0);
                        
                    const moneyMonthExpense = moneyMonthTransactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0);
                    
                    moneyIncomeData.push(moneyMonthIncome);
                    moneyExpenseData.push(moneyMonthExpense);
                    
                    const moneyMonthBalance = moneyMonthIncome - moneyMonthExpense;
                    moneyBalanceTrendData.push(moneyMonthBalance);
                    
                    const moneyGoalKey = `${moneyYear}-${moneyMonth}`;
                    const moneyGoalForMonth = moneyMonthlyGoals[moneyGoalKey] || 0;
                    moneyGoalData.push(moneyGoalForMonth);
                });
                
                moneyMonthlyBarChart.data.datasets[0].data = moneyGoalData;
                moneyMonthlyBarChart.data.datasets[1].data = moneyIncomeData;
                moneyMonthlyBarChart.data.datasets[2].data = moneyExpenseData;
                moneyMonthlyBarChart.data.datasets[3].data = moneyBalanceTrendData;
                moneyMonthlyBarChart.update();
            }
            
            // Générer une couleur pour les investissements
            function moneyGetColor(index) {
                const moneyColors = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c'];
                return moneyColors[index % moneyColors.length];
            }
            
            // Ajouter une transaction
            function moneyAddTransaction() {
                console.log("Bouton Add Transaction cliqué");
                
                const moneyAmount = parseFloat(moneyAmountInput.value);
                const moneyDescription = moneyDescriptionInput.value.trim();
                const moneyDate = moneyDateInput.value;
                const moneyType = moneyTransactionTypeSelect.value;
                const moneyCategory = moneyCategorySelect.value;
                
                if (!moneyAmount || moneyAmount <= 0) {
                    alert('Please enter a valid amount');
                    return;
                }
                
                if (!moneyDescription) {
                    alert('Please enter a description');
                    return;
                }
                
                const moneyTransaction = {
                    id: Date.now(),
                    amount: moneyAmount,
                    category: moneyCategory,
                    description: moneyDescription,
                    date: moneyDate,
                    type: moneyType,
                    timestamp: new Date().getTime()
                };
                
                moneyTransactions.push(moneyTransaction);
                moneySaveData();
                moneyUpdateDashboard();
                
                moneyAmountInput.value = '';
                moneyDescriptionInput.value = '';
                
                console.log('Transaction added successfully!');
            }
            
            // Ajouter un investissement
            function moneyAddInvestment() {
                console.log("Bouton Add Investment cliqué");
                
                const moneyName = moneyInvestmentNameInput.value.trim();
                const moneyInitialAmount = parseFloat(moneyInitialInvestmentInput.value);
                const moneyAnnualReturn = parseFloat(moneyAnnualReturnInput.value);
                const moneyGoal = parseFloat(moneyInvestmentGoalInput.value);
                
                if (!moneyName) {
                    alert('Please enter a market name');
                    return;
                }
                
                if (!moneyInitialAmount || moneyInitialAmount <= 0) {
                    alert('Please enter a valid initial investment');
                    return;
                }
                
                if (!moneyAnnualReturn || moneyAnnualReturn <= 0) {
                    alert('Please enter a valid annual return');
                    return;
                }
                
                const moneyInvestment = {
                    id: Date.now(),
                    name: moneyName,
                    initialAmount: moneyInitialAmount,
                    annualReturn: moneyAnnualReturn,
                    startDate: new Date().toISOString().split('T')[0],
                    color: moneyGetColor(moneyInvestments.length),
                    goal: moneyGoal > 0 ? moneyGoal : null
                };
                
                moneyInvestments.push(moneyInvestment);
                moneySaveData();
                moneyUpdateDashboard();
                
                moneyInvestmentNameInput.value = '';
                moneyInitialInvestmentInput.value = '';
                moneyAnnualReturnInput.value = '';
                moneyInvestmentGoalInput.value = '';
                
                console.log('Investment added successfully!');
            }
            
            // Définir l'objectif pour le mois en cours
            function moneySetGoal() {
                console.log("Bouton Set Goal cliqué");
                
                const moneyAmount = parseFloat(moneyGoalAmountInput.value);
                
                if (!moneyAmount || moneyAmount <= 0) {
                    alert('Please enter a valid goal amount');
                    return;
                }
                
                const moneyNow = new Date();
                const moneyCurrentYear = moneyNow.getFullYear();
                const moneyCurrentMonth = String(moneyNow.getMonth() + 1).padStart(2, '0');
                const moneyGoalKey = `${moneyCurrentYear}-${moneyCurrentMonth}`;
                
                moneyMonthlyGoals[moneyGoalKey] = moneyAmount;
                moneySaveData();
                moneyUpdateDashboard();
                
                moneyGoalAmountInput.value = '';
                console.log(`Goal for ${moneyCurrentMonth}/${moneyCurrentYear} set to £${moneyAmount.toFixed(2)}`);
            }
            
            // Définir l'objectif pour tous les mois
            function moneySetAllGoals() {
                console.log("Bouton Set All Goals cliqué");
                
                const moneyAmount = parseFloat(moneyGoalAllAmountInput.value);
                
                if (!moneyAmount || moneyAmount <= 0) {
                    alert('Please enter a valid goal amount');
                    return;
                }
                
                const moneyMonthData = moneyGetLast12Months(moneyCurrentYearView === 'previous' ? 1 : 0);
                
                moneyMonthData.keys.forEach(moneyMonthKey => {
                    moneyMonthlyGoals[moneyMonthKey] = moneyAmount;
                });
                
                moneySaveData();
                moneyUpdateDashboard();
                
                moneyGoalAllAmountInput.value = '';
                console.log(`Goal for all months set to £${moneyAmount.toFixed(2)}`);
            }
            
            // Basculer entre les vues Transactions et Investissements
            function moneyToggleView(view) {
                moneyCurrentView = view;
                moneyUpdateView();
            }
            
            // **CONFIGURATION DES ÉVÉNEMENTS**
            document.getElementById('addTransactionBtn').addEventListener('click', moneyAddTransaction);
            document.getElementById('addInvestmentBtn').addEventListener('click', moneyAddInvestment);
            document.getElementById('setGoalBtn').addEventListener('click', moneySetGoal);
            document.getElementById('setAllGoalBtn').addEventListener('click', moneySetAllGoals);
            document.getElementById('clearAllBtn').addEventListener('click', moneyClearAllTransactions);
            
            moneyTransacBtn.addEventListener('click', () => {
                moneyToggleView('transactions');
            });
            
            moneyInvestViewBtn.addEventListener('click', () => {
                moneyToggleView('investments');
            });
            
            document.querySelectorAll('.filter-btn').forEach(moneyBtn => {
                moneyBtn.addEventListener('click', function() {
                    document.querySelectorAll('.filter-btn').forEach(moneyB => moneyB.classList.remove('active'));
                    this.classList.add('active');
                    moneyCurrentFilter = this.dataset.period;
                    moneyUpdateDashboard();
                });
            });
            
            document.querySelectorAll('.month-btn[data-year]').forEach(moneyBtn => {
                moneyBtn.addEventListener('click', function() {
                    document.querySelectorAll('.month-btn[data-year]').forEach(moneyB => moneyB.classList.remove('active'));
                    this.classList.add('active');
                    moneyCurrentYearView = this.dataset.year;
                    moneyUpdateDashboard();
                });
            });
            
            // **INITIALISATION DE L'APPLICATION**
            function moneyInitApp() {
                console.log("Initialisation de l'application Money Manager");
                moneyLoadData();
                moneyInitCharts();
                
                document.querySelectorAll('.filter-btn').forEach(moneyBtn => {
                    if (moneyBtn.dataset.period === 'month') {
                        moneyBtn.classList.add('active');
                    } else {
                        moneyBtn.classList.remove('active');
                    }
                });
                
                moneyUpdateDashboard();
                console.log("Application Money Manager initialisée");
            }
            
            // Démarrer l'application
            moneyInitApp();
        });
