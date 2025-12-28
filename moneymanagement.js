document.addEventListener('DOMContentLoaded', function() {
    const menu4Content = document.getElementById('menu4Content');
    if (!menu4Content) return;
    
    let transactions = [];
    let investments = [];
    let monthlyGoals = {};
    let currentFilter = 'month';
    let currentYearView = 'current';
    let currentTransactionFilter = 'all';
    let currentView = 'transactions';
    
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
    
    let expensePieChart, incomePieChart, lineChart, monthlyBarChart, horizontalBarChart;
    
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
    
    function calculateTotalInvested() {
        return investments.reduce((sum, i) => sum + i.initialAmount, 0);
    }
    
    function calculateAverageReturn() {
        if (investments.length === 0) return 0;
        const totalReturn = investments.reduce((sum, i) => sum + i.annualReturn, 0);
        return totalReturn / investments.length;
    }
    
    function calculateYearsSinceStart(startDate) {
        const start = new Date(startDate);
        const now = new Date();
        const diffInMs = now - start;
        const years = diffInMs / (1000 * 60 * 60 * 24 * 365.25);
        return Math.max(0, Math.min(years, 20));
    }
    
    function loadData() {
        try {
            const savedTransactions = localStorage.getItem('moneyManagerTransactions');
            const savedInvestments = localStorage.getItem('moneyManagerInvestments');
            const savedGoals = localStorage.getItem('moneyManagerGoals');
            
            if (savedTransactions) {
                transactions = JSON.parse(savedTransactions);
            }
            
            if (savedInvestments) {
                investments = JSON.parse(savedInvestments);
            }
            
            if (savedGoals) {
                monthlyGoals = JSON.parse(savedGoals);
            }
        } catch (e) {
            console.error("Erreur de chargement:", e);
            transactions = [];
            investments = [];
            monthlyGoals = {};
        }
    }
    
    function saveData() {
        try {
            localStorage.setItem('moneyManagerTransactions', JSON.stringify(transactions));
            localStorage.setItem('moneyManagerInvestments', JSON.stringify(investments));
            localStorage.setItem('moneyManagerGoals', JSON.stringify(monthlyGoals));
        } catch (e) {
            console.error("Erreur de sauvegarde:", e);
        }
    }
    
    function updateDashboard() {
        updateView();
        updateSummary();
        updateRecentTransactionsSummary();
        updateCharts();
    }
    
    function updateView() {
        const list = document.getElementById('transactionsList');
        if (!list) return;
        
        if (currentView === 'transactions') {
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
        } else {
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
    
    window.deleteInvestment = function(id) {
        if (confirm('Are you sure you want to delete this investment?')) {
            investments = investments.filter(i => i.id !== id);
            saveData();
            updateDashboard();
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
    
    function calculateInvestmentGrowth(investment, years = 20) {
        const growth = [];
        
        for (let i = 0; i <= years; i++) {
            const value = investment.initialAmount * Math.pow(1 + investment.annualReturn / 100, i);
            growth.push(value);
        }
        
        return growth;
    }
    
    function findGoalYear(investment, growth) {
        if (!investment.goal) return null;
        
        for (let i = 0; i < growth.length; i++) {
            if (growth[i] >= investment.goal) {
                return i;
            }
        }
        return null;
    }
    
    function calculateCategoryPercentageData() {
        const categories = {};
        
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const allCategories = ['Trading', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Salary', 'Selling', 'Other'];
        allCategories.forEach(cat => {
            categories[cat] = {
                income: 0,
                expense: 0,
                incomePercent: 0,
                expensePercent: 0
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
            if (totalIncome > 0) {
                categories[cat].incomePercent = (categories[cat].income / totalIncome) * 100;
            }
            if (totalExpenses > 0) {
                categories[cat].expensePercent = (categories[cat].expense / totalExpenses) * 100;
            }
        });
        
        const filteredCategories = Object.keys(categories).filter(cat => 
            categories[cat].income > 0 || categories[cat].expense > 0
        );
        
        filteredCategories.sort((a, b) => {
            const totalA = categories[a].incomePercent - categories[a].expensePercent;
            const totalB = categories[b].incomePercent - categories[b].expensePercent;
            return totalB - totalA;
        });
        
        return {
            categories: filteredCategories,
            data: categories,
            totalIncome,
            totalExpenses
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
        
        const horizontalBarCanvas = document.getElementById('horizontalBarChart');
        if (horizontalBarCanvas) {
            const horizontalBarCtx = horizontalBarCanvas.getContext('2d');
            
 const percentagePlugin = {
    id: 'percentagePlugin',
    afterDatasetsDraw(chart) {
        const { ctx, data, chartArea: { top, bottom, left, right, width, height }, scales: { x, y } } = chart;
        
        ctx.save();
        
        // Parcourir chaque catégorie
        data.labels.forEach((label, index) => {
            // Obtenir les valeurs des deux datasets pour cette catégorie
            const incomeValue = data.datasets[0].data[index] || 0;
            const expenseValue = data.datasets[1].data[index] || 0;
            
            // Calculer les totaux pour obtenir les pourcentages
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const totalExpenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const incomeForCategory = transactions
                .filter(t => t.type === 'income' && t.category === label)
                .reduce((sum, t) => sum + t.amount, 0);
                
            const expenseForCategory = transactions
                .filter(t => t.type === 'expense' && t.category === label)
                .reduce((sum, t) => sum + t.amount, 0);
            
            // Calculer les pourcentages individuels
            const incomePercent = totalIncome > 0 ? (incomeForCategory / totalIncome) * 100 : 0;
            const expensePercent = totalExpenses > 0 ? (expenseForCategory / totalExpenses) * 100 : 0;
            
            if (incomePercent > 0 || expensePercent > 0) {
                // Afficher le pourcentage
                const displayText = `${incomePercent.toFixed(1)}% / ${expensePercent.toFixed(1)}%`;
                
                ctx.font = 'bold 9px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Obtenir la position Y de cette catégorie (centre de la barre)
                const categoryY = y.getPixelForValue(index);
                
                // Pour le positionnement X, nous prenons le centre du conteneur
                // Car les barres sont limitées en largeur
                const centerX = left + (width / 2);
                
                ctx.fillText(displayText, centerX, categoryY);
            }
        });
        
        ctx.restore();
    }
};
            
horizontalBarChart = new Chart(horizontalBarCtx, {
    type: 'bar',
    plugins: [percentagePlugin],
    data: {
        labels: [],
        datasets: [
            {
                label: 'Income',
                data: [],
                backgroundColor: '#3498db',
                borderColor: '#3498db',
                borderWidth: 0,
                barPercentage: 0.6, // Réduit pour avoir des barres plus fines
                categoryPercentage: 0.8
            },
            {
                label: 'Expenses',
                data: [],
                backgroundColor: '#e67e22',
                borderColor: '#e67e22',
                borderWidth: 0,
                barPercentage: 0.6, // Réduit pour avoir des barres plus fines
                categoryPercentage: 0.8
            }
        ]
    },
    options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: false
            }
        },
        scales: {
            x: {
                stacked: true,
                display: false,
                ticks: {
                    display: false
                },
                grid: {
                    display: false
                },
                // Limiter la largeur maximale à 60px de chaque côté
                afterFit: function(scale) {
                    // Calculer la largeur maximale basée sur le conteneur
                    const maxBarWidth = 60; // 60px maximum
                    const centerPoint = scale.width / 2;
                    
                    // Limiter l'extension de chaque côté
                    scale.left = centerPoint - Math.min(maxBarWidth, centerPoint);
                    scale.right = centerPoint + Math.min(maxBarWidth, centerPoint);
                    scale.width = Math.min(scale.width, maxBarWidth * 2);
                }
            },
            y: {
                stacked: true,
                ticks: {
                    font: {
                        size: 9
                    },
                    color: 'white',
                    padding: 10 // Plus d'espace entre les barres et les labels
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                    drawBorder: false
                },
                beginAtZero: true,
                // Ajouter du padding pour que les barres ne touchent pas les bords
                afterFit: function(scale) {
                    scale.paddingTop = 15;
                    scale.paddingBottom = 15;
                }
            }
        },
        layout: {
            padding: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
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
        
        if (lineChart) {
            const years = 20;
            const yearLabels = [];
            for (let i = 0; i <= years; i++) {
                yearLabels.push(`Y${i}`);
            }
            
            lineChart.data.labels = yearLabels;
            
            const datasets = [];
            
            investments.forEach((investment, index) => {
                const growth = calculateInvestmentGrowth(investment, years);
                
                const pointBackgroundColors = [];
                const pointBorderColors = [];
                const pointRadii = [];
                
                const goalYear = findGoalYear(investment, growth);
                const yearsSinceStart = calculateYearsSinceStart(investment.startDate);
                
                for (let i = 0; i < growth.length; i++) {
                    if (goalYear !== null && i === goalYear && growth[i] >= investment.goal) {
                        pointBackgroundColors.push('#e74c3c');
                        pointBorderColors.push('#e74c3c');
                        pointRadii.push(3);
                    } else if (Math.abs(i - yearsSinceStart) < 0.5) {
                        pointBackgroundColors.push('#000000');
                        pointBorderColors.push('#000000');
                        pointRadii.push(3);
                    } else {
                        pointBackgroundColors.push(investment.color || getColor(index));
                        pointBorderColors.push(investment.color || getColor(index));
                        pointRadii.push(3);
                    }
                }
                
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
            const categoryData = calculateCategoryPercentageData();
            const labels = categoryData.categories;
            const incomeData = [];
            const expenseData = [];
            
            labels.forEach(category => {
                const data = categoryData.data[category];
                incomeData.push(data.incomePercent);
                expenseData.push(-data.expensePercent);
            });
            
            horizontalBarChart.data.labels = labels;
            horizontalBarChart.data.datasets[0].data = incomeData;
            horizontalBarChart.data.datasets[1].data = expenseData;
            horizontalBarChart.update();
        }
    }
    
    function getColor(index) {
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c'];
        return colors[index % colors.length];
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
        saveData();
        updateDashboard();
        
        amountInput.value = '';
        descriptionInput.value = '';
    }
    
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
            color: getColor(investments.length),
            goal: goal > 0 ? goal : null
        };
        
        investments.push(investment);
        saveData();
        updateDashboard();
        
        investmentNameInput.value = '';
        initialInvestmentInput.value = '';
        annualReturnInput.value = '';
        investmentGoalInput.value = '';
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
        saveData();
        updateDashboard();
        
        goalAmountInput.value = '';
    }
    
    function setAllGoals() {
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
    }
    
    function toggleView(view) {
        currentView = view;
        updateView();
    }
    
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
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.period;
            updateDashboard();
        });
    });
    
    document.querySelectorAll('.month-btn[data-year]').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.month-btn[data-year]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentYearView = this.dataset.year;
            updateDashboard();
        });
    });
    
    function initApp() {
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
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.dataset.period === 'month') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    initApp();
    
    window.addEventListener('resize', function() {
        setTimeout(updateCharts, 100);
    });
});
