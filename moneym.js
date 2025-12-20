        function initPieCharts() {
            // Expense Pie Chart
            const expensePieCtx = document.getElementById('expensePieChart').getContext('2d');
            const expensePieChart = new Chart(expensePieCtx, {
                type: 'pie',
                data: {
                    labels: ['Food', 'Transport', 'Shopping', 'Bills'],
                    datasets: [{
                        data: [300, 150, 200, 350],
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
                    }]
                },
                options: {
                    responsive: false, // IMPORTANT: Désactiver le responsive pour taille fixe
                    maintainAspectRatio: false, // IMPORTANT
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: £${context.raw}`;
                                }
                            }
                        }
                    }
                }
            });
            
            // Income Pie Chart
            const incomePieCtx = document.getElementById('incomePieChart').getContext('2d');
            const incomePieChart = new Chart(incomePieCtx, {
                type: 'pie',
                data: {
                    labels: ['Salary', 'Freelance', 'Trading'],
                    datasets: [{
                        data: [2000, 500, 300],
                        backgroundColor: ['#2ecc71', '#3498db', '#9b59b6']
                    }]
                },
                options: {
                    responsive: false, // IMPORTANT: Désactiver le responsive pour taille fixe
                    maintainAspectRatio: false, // IMPORTANT
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: £${context.raw}`;
                                }
                            }
                        }
                    }
                }
            });
            
            // Forcer le redimensionnement manuel
            expensePieChart.resize();
            incomePieChart.resize();
            
            return { expensePieChart, incomePieChart };
        }
        
        // Initialiser la date
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        
        // Initialiser l'application
        window.addEventListener('load', function() {
            console.log("Initialisation des graphiques...");
            initPieCharts();
            console.log("Graphiques initialisés!");
            
            // Mettre à jour les résumés
            document.getElementById('currentBalanceControl').textContent = '£1,250.00';
            document.getElementById('totalTransactions').textContent = '15';
        });
