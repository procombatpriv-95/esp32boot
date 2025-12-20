        function initPieCharts() {
            // Expense Pie Chart
            const expensePieCtx = document.getElementById('expensePieChart').getContext('2d');
            window.expensePieChart = new Chart(expensePieCtx, {
                type: 'pie',
                data: {
                    labels: ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Other'],
                    datasets: [{
                        data: [300, 150, 200, 100, 250, 50],
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
                    }]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
            
            // Income Pie Chart
            const incomePieCtx = document.getElementById('incomePieChart').getContext('2d');
            window.incomePieChart = new Chart(incomePieCtx, {
                type: 'pie',
                data: {
                    labels: ['Salary', 'Freelance', 'Trading', 'Other'],
                    datasets: [{
                        data: [2000, 800, 500, 200],
                        backgroundColor: ['#2ecc71', '#3498db', '#9b59b6', '#f1c40f']
                    }]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
        // Initialiser la date
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        
        // Configuration des événements
        document.getElementById('addTransactionBtn').onclick = function() {
            alert('Add Transaction clicked');
        };
        
        document.getElementById('addInvestmentBtn').onclick = function() {
            alert('Add Investment clicked');
        };
        
        document.getElementById('setGoalBtn').onclick = function() {
            alert('Set Monthly Goal clicked');
        };
        
        document.getElementById('setAllGoalBtn').onclick = function() {
            alert('Set Yearly Goal clicked');
        };
        
        document.getElementById('clearAllBtn').onclick = function() {
            alert('Clear All clicked');
        };
        
        // Initialiser l'application
        window.addEventListener('load', function() {
            console.log("Page chargée, initialisation des graphiques...");
            initPieCharts();
            console.log("Graphiques initialisés");
        });
