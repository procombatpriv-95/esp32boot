       // Variables globales
        let transactions = [];
        let investments = [];
        let monthlyGoals = {};
        let currentFilter = 'month';
        let currentYearView = 'current';
        let currentTransactionFilter = 'all';
        
        // Récupérer les éléments DOM
        const amountInput = document.getElementById('amount');
        const descriptionInput = document.getElementById('description');
        const dateInput = document.getElementById('date');
        const goalAmountInput = document.getElementById('goalAmount');
        const goalAllAmountInput = document.getElementById('goalAllAmount');
        const transactionTypeSelect = document.getElementById('transactionType');
        const categorySelect = document.getElementById('category');
        
        // Variables pour les graphiques
        let monthlyBarChart;
        
        // Initialiser la date à aujourd'hui
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
        
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
        
        // Charger les données depuis localStorage
        function loadData() {
            try {
                const savedTransactions = localStorage.getItem('moneyManagerTransactions');
                const savedInvestments = localStorage.getItem('moneyManagerInvestments');
                const savedGoals = localStorage.getItem('moneyManagerGoals');
                
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
            } catch (e) {
                console.error("Erreur de chargement:", e);
            }
        }
        
        // Sauvegarder les données dans localStorage
        function saveData() {
            try {
                localStorage.setItem('moneyManagerTransactions', JSON.stringify(transactions));
                localStorage.setItem('moneyManagerInvestments', JSON.stringify(investments));
                localStorage.setItem('moneyManagerGoals', JSON.stringify(monthlyGoals));
                console.log("Données sauvegardées");
            } catch (e) {
                console.error("Erreur de sauvegarde:", e);
            }
        }
        
        // Mettre à jour tout le dashboard
        function updateDashboard() {
            updateRecentTransactions();
            updateSummary();
            updateRecentTransactionsSummary();
            updateCharts();
        }
        
        // Mettre à jour les transactions récentes
        function updateRecentTransactions() {
            const list = document.getElementById('transactionsList');
            
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
            filtered.slice(0, 20).forEach(transaction => {
                const sign = transaction.type === 'income' ? '+' : '-';
                const amountClass = transaction.type === 'income' ? 'transaction-income' : 'transaction-expense';
                
                html += `
                    <div class="transaction-item" data-id="${transaction.id}">
                        <div class="transaction-info">
                            <div class="transaction-category">${transaction.category}</div>
                            <div class="transaction-description">${transaction.description}</div>
                            <div class="transaction-date">${formatDate(transaction.date)}</div>
                        </div>
                        <div class="transaction-actions">
                            <div class="transaction-amount ${amountClass}">
                                ${sign}£${transaction.amount.toFixed(2)}
                            </div>
                            <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            list.innerHTML = html;
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
            
            document.getElementById('recentIncome').textContent = '£' + totalIncome.toFixed(2);
            document.getElementById('recentExpenses').textContent = '£' + totalExpenses.toFixed(2);
            document.getElementById('recentBalance').textContent = '£' + balance.toFixed(2);
        }
        
        // Supprimer une transaction
        function deleteTransaction(id) {
            if (confirm('Are you sure you want to delete this transaction?')) {
                transactions = transactions.filter(t => t.id !== id);
                saveData();
                updateDashboard();
                console.log('Transaction deleted');
            }
        }
        
        // Effacer toutes les transactions
        function clearAllTransactions() {
            if (transactions.length === 0) {
                alert('No transactions to delete');
                return;
            }
            
            if (confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
                transactions = [];
                saveData();
                updateDashboard();
                alert('All transactions deleted');
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

            document.getElementById('currentBalanceControl').textContent = '£' + balance.toFixed(2);
            document.getElementById('totalTransactions').textContent = filtered.length;
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
        
        // Initialiser les graphiques
        function initCharts() {
            // Monthly Bar Chart avec filled line chart intégré
            const monthlyBarCtx = document.getElementById('monthlyBarChart').getContext('2d');
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
                            stacked: false,
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
                            borderWidth: 1
                        }
                    }
                }
            });
        }
        
        // Mettre à jour les graphiques
        function updateCharts() {
            console.log("Mise à jour des graphiques");
            
            // Monthly Bar Chart - 12 mois - AVEC FILLED LINE CHART
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
        }
        
        // Définir l'objectif pour le mois en cours
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
            saveData();
            updateDashboard();
            
            goalAmountInput.value = '';
            console.log(`Goal for ${currentMonth}/${currentYear} set to £${amount.toFixed(2)}`);
        }
        
        // Définir l'objectif pour tous les mois
        function setAllGoals() {
            console.log("Bouton Set All Goals cliqué");
            
            const amount = parseFloat(goalAllAmountInput.value);
            
            if (!amount || amount <= 0) {
                alert('Please enter a valid goal amount');
                return;
            }
            
            const monthData = getLast12Months(currentYearView === 'previous' ? 1 : 0);
            
            monthData.keys.forEach(monthKey => {
                monthlyGoals[monthKey] = amount;
            });
            
            saveData();
            updateDashboard();
            
            goalAllAmountInput.value = '';
            console.log(`Goal for all months set to £${amount.toFixed(2)}`);
        }
        
        // **CONFIGURATION DES ÉVÉNEMENTS**
        
        // Configuration directe des événements
        document.getElementById('addTransactionBtn').onclick = addTransaction;
        document.getElementById('setGoalBtn').onclick = setGoal;
        document.getElementById('setAllGoalBtn').onclick = setAllGoals;
        document.getElementById('clearAllBtn').onclick = clearAllTransactions;
        
        // Configuration des boutons de filtre
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentFilter = this.dataset.period;
                updateDashboard();
            };
        });
        
        // Configuration des boutons d'année (Current/Previous)
        document.querySelectorAll('.month-btn[data-year]').forEach(btn => {
            btn.onclick = function() {
                document.querySelectorAll('.month-btn[data-year]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentYearView = this.dataset.year;
                updateDashboard();
            };
        });
        
        // Configuration des boutons de période pour transactions
        document.querySelectorAll('.month-btn[data-period]').forEach(btn => {
            btn.onclick = function() {
                if (this.dataset.period) {
                    document.querySelectorAll('.month-btn[data-period]').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentTransactionFilter = this.dataset.period;
                    updateDashboard();
                }
            };
        });
        
        // **INITIALISATION DE L'APPLICATION**
        function initApp() {
            console.log("Initialisation de l'application");
            loadData();
            initCharts();
            
            // Activer le filtre par défaut
            document.querySelectorAll('.filter-btn').forEach(btn => {
                if (btn.dataset.period === 'month') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            updateDashboard();
            console.log("Application initialisée");
        }
        
        // Démarrer l'application quand la page est chargée
        window.addEventListener('load', initApp);
