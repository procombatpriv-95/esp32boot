// Bloc 2 - Investment & Savings Dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let investments = [];
    let savings = {
        saving1: 0,
        saving2: 0,
        saving3: 0
    };
    let savingGoals = {
        saving1: 1000,
        saving2: 2000,
        saving3: 3000
    };
    
    // Références aux éléments DOM
    const savingsTotalElement = document.getElementById('savingsTotal');
    const investmentValueElement = document.getElementById('investmentValue');
    const investmentPerformanceElement = document.getElementById('investmentPerformance');
    const totalPortfolioElement = document.getElementById('totalPortfolio');
    const savingsChartCanvas = document.getElementById('savingsChart');
    const investmentChartCanvas = document.getElementById('investmentChart');
    const investmentForm = document.getElementById('investmentForm');
    const investmentNameInput = document.getElementById('investmentName');
    const investmentAmountInput = document.getElementById('investmentAmount');
    const investmentTypeSelect = document.getElementById('investmentType');
    const investmentDateInput = document.getElementById('investmentDate');
    const investmentNotesInput = document.getElementById('investmentNotes');
    const investmentList = document.getElementById('investmentList');
    const addInvestmentBtn = document.getElementById('addInvestmentBtn');
    const clearInvestmentsBtn = document.getElementById('clearInvestmentsBtn');
    const releaseSaving1Btn = document.getElementById('releaseSaving1Btn');
    const releaseSaving2Btn = document.getElementById('releaseSaving2Btn');
    const releaseSaving3Btn = document.getElementById('releaseSaving3Btn');
    const setGoalSaving1Btn = document.getElementById('setGoalSaving1Btn');
    const setGoalSaving2Btn = document.getElementById('setGoalSaving2Btn');
    const setGoalSaving3Btn = document.getElementById('setGoalSaving3Btn');
    const goalAmountSaving1Input = document.getElementById('goalAmountSaving1');
    const goalAmountSaving2Input = document.getElementById('goalAmountSaving2');
    const goalAmountSaving3Input = document.getElementById('goalAmountSaving3');
    const saving1AmountElement = document.getElementById('saving1Amount');
    const saving2AmountElement = document.getElementById('saving2Amount');
    const saving3AmountElement = document.getElementById('saving3Amount');
    const saving1ProgressBar = document.getElementById('saving1Progress');
    const saving2ProgressBar = document.getElementById('saving2Progress');
    const saving3ProgressBar = document.getElementById('saving3Progress');
    const saving1ProgressText = document.getElementById('saving1ProgressText');
    const saving2ProgressText = document.getElementById('saving2ProgressText');
    const saving3ProgressText = document.getElementById('saving3ProgressText');
    
    // Variables pour les graphiques
    let savingsChart, investmentChart;
    
    // Initialiser la date du jour
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    if (investmentDateInput) investmentDateInput.value = `${yyyy}-${mm}-${dd}`;
    
    // Fonction pour charger les données depuis localStorage
    function loadData() {
        try {
            const savedInvestments = localStorage.getItem('moneyManagerInvestments');
            const savedSavings = localStorage.getItem('moneyManagerSavings');
            const savedSavingGoals = localStorage.getItem('moneyManagerSavingGoals');
            
            if (savedInvestments) {
                investments = JSON.parse(savedInvestments);
            }
            
            if (savedSavings) {
                savings = JSON.parse(savedSavings);
            }
            
            if (savedSavingGoals) {
                savingGoals = JSON.parse(savedSavingGoals);
            }
        } catch (e) {
            console.error("Erreur de chargement des données:", e);
            investments = [];
            savings = {
                saving1: 0,
                saving2: 0,
                saving3: 0
            };
            savingGoals = {
                saving1: 1000,
                saving2: 2000,
                saving3: 3000
            };
        }
    }
    
    // Fonction pour sauvegarder les données dans localStorage
    function saveData() {
        try {
            localStorage.setItem('moneyManagerInvestments', JSON.stringify(investments));
            localStorage.setItem('moneyManagerSavings', JSON.stringify(savings));
            localStorage.setItem('moneyManagerSavingGoals', JSON.stringify(savingGoals));
            
            // Émettre un événement pour informer le Bloc 1
            window.dispatchEvent(new Event('savingsUpdated'));
        } catch (e) {
            console.error("Erreur de sauvegarde des données:", e);
        }
    }
    
    // Fonction pour mettre à jour l'affichage
    function updateDashboard() {
        updateSavingsDisplay();
        updateInvestmentsDisplay();
        updateCharts();
        updateSummary();
        saveData();
    }
    
    // Fonction pour mettre à jour l'affichage des savings
    function updateSavingsDisplay() {
        // Mettre à jour les montants
        if (saving1AmountElement) saving1AmountElement.textContent = `£${savings.saving1.toFixed(2)}`;
        if (saving2AmountElement) saving2AmountElement.textContent = `£${savings.saving2.toFixed(2)}`;
        if (saving3AmountElement) saving3AmountElement.textContent = `£${savings.saving3.toFixed(2)}`;
        
        // Mettre à jour les barres de progression
        updateProgressBar(saving1ProgressBar, saving1ProgressText, savings.saving1, savingGoals.saving1);
        updateProgressBar(saving2ProgressBar, saving2ProgressText, savings.saving2, savingGoals.saving2);
        updateProgressBar(saving3ProgressBar, saving3ProgressText, savings.saving3, savingGoals.saving3);
        
        // Mettre à jour les champs de goal
        if (goalAmountSaving1Input) goalAmountSaving1Input.value = savingGoals.saving1;
        if (goalAmountSaving2Input) goalAmountSaving2Input.value = savingGoals.saving2;
        if (goalAmountSaving3Input) goalAmountSaving3Input.value = savingGoals.saving3;
    }
    
    // Fonction pour mettre à jour une barre de progression
    function updateProgressBar(progressBar, progressText, current, goal) {
        if (!progressBar || !progressText) return;
        
        const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
        progressBar.style.width = `${percentage}%`;
        
        // Changer la couleur en fonction du pourcentage
        if (percentage < 50) {
            progressBar.style.backgroundColor = '#e74c3c'; // Rouge
        } else if (percentage < 80) {
            progressBar.style.backgroundColor = '#f39c12'; // Orange
        } else if (percentage < 100) {
            progressBar.style.backgroundColor = '#3498db'; // Bleu
        } else {
            progressBar.style.backgroundColor = '#2ecc71'; // Vert
        }
        
        progressText.textContent = `${percentage.toFixed(1)}%`;
    }
    
    // Fonction pour mettre à jour l'affichage des investissements
    function updateInvestmentsDisplay() {
        if (!investmentList) return;
        
        if (investments.length === 0) {
            investmentList.innerHTML = `
                <div class="no-investments">
                    <i class="fas fa-chart-line"></i>
                    <div>No investments yet</div>
                    <div class="sub-text">Add your first investment to start tracking</div>
                </div>
            `;
            return;
        }
        
        // Trier les investissements par date (du plus récent au plus ancien)
        investments.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let html = '';
        investments.forEach((investment, index) => {
            const performance = investment.currentValue - investment.amount;
            const performancePercentage = investment.amount > 0 ? ((performance / investment.amount) * 100) : 0;
            const performanceClass = performance >= 0 ? 'positive' : 'negative';
            const performanceIcon = performance >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
            
            html += `
                <div class="investment-item" data-id="${investment.id}">
                    <div class="investment-header">
                        <div class="investment-name">${investment.name}</div>
                        <div class="investment-actions">
                            <button class="edit-investment-btn" onclick="editInvestment(${investment.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-investment-btn" onclick="deleteInvestment(${investment.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="investment-details">
                        <div class="investment-type">${investment.type}</div>
                        <div class="investment-date">${formatDate(investment.date)}</div>
                    </div>
                    <div class="investment-amounts">
                        <div class="investment-amount">
                            <span class="label">Invested:</span>
                            <span class="value">£${investment.amount.toFixed(2)}</span>
                        </div>
                        <div class="investment-current">
                            <span class="label">Current:</span>
                            <span class="value">£${investment.currentValue.toFixed(2)}</span>
                        </div>
                        <div class="investment-performance ${performanceClass}">
                            <span class="label">Performance:</span>
                            <span class="value">
                                <i class="fas ${performanceIcon}"></i>
                                £${Math.abs(performance).toFixed(2)} (${Math.abs(performancePercentage).toFixed(1)}%)
                            </span>
                        </div>
                    </div>
                    ${investment.notes ? `<div class="investment-notes">${investment.notes}</div>` : ''}
                </div>
            `;
        });
        
        investmentList.innerHTML = html;
    }
    
    // Fonction pour formater une date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    // Fonction pour mettre à jour le résumé
    function updateSummary() {
        // Calculer le total des savings
        const totalSavings = savings.saving1 + savings.saving2 + savings.saving3;
        
        // Calculer le total des investissements
        const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
        const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalPerformance = totalCurrentValue - totalInvested;
        const totalPerformancePercentage = totalInvested > 0 ? (totalPerformance / totalInvested) * 100 : 0;
        
        // Calculer le portefeuille total
        const totalPortfolio = totalSavings + totalCurrentValue;
        
        // Mettre à jour les éléments
        if (savingsTotalElement) savingsTotalElement.textContent = `£${totalSavings.toFixed(2)}`;
        if (investmentValueElement) investmentValueElement.textContent = `£${totalCurrentValue.toFixed(2)}`;
        
        if (investmentPerformanceElement) {
            if (totalPerformance >= 0) {
                investmentPerformanceElement.innerHTML = `<i class="fas fa-arrow-up"></i> £${totalPerformance.toFixed(2)} (${totalPerformancePercentage.toFixed(1)}%)`;
                investmentPerformanceElement.className = 'positive';
            } else {
                investmentPerformanceElement.innerHTML = `<i class="fas fa-arrow-down"></i> £${Math.abs(totalPerformance).toFixed(2)} (${Math.abs(totalPerformancePercentage).toFixed(1)}%)`;
                investmentPerformanceElement.className = 'negative';
            }
        }
        
        if (totalPortfolioElement) totalPortfolioElement.textContent = `£${totalPortfolio.toFixed(2)}`;
    }
    
    // Fonction pour initialiser les graphiques
    function initCharts() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js n\'est pas chargé');
            setTimeout(initCharts, 100);
            return;
        }
        
        // Graphique des savings
        if (savingsChartCanvas) {
            const savingsCtx = savingsChartCanvas.getContext('2d');
            savingsChart = new Chart(savingsCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Saving 1', 'Saving 2', 'Saving 3'],
                    datasets: [{
                        data: [savings.saving1, savings.saving2, savings.saving3],
                        backgroundColor: [
                            'rgba(52, 152, 219, 0.8)',
                            'rgba(155, 89, 182, 0.8)',
                            'rgba(46, 204, 113, 0.8)'
                        ],
                        borderColor: [
                            'rgb(52, 152, 219)',
                            'rgb(155, 89, 182)',
                            'rgb(46, 204, 113)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: 'white',
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Graphique des investissements
        if (investmentChartCanvas) {
            const investmentCtx = investmentChartCanvas.getContext('2d');
            investmentChart = new Chart(investmentCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Invested Amount',
                            data: [],
                            borderColor: 'rgb(52, 152, 219)',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3
                        },
                        {
                            label: 'Current Value',
                            data: [],
                            borderColor: 'rgb(46, 204, 113)',
                            backgroundColor: 'rgba(46, 204, 113, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: {
                                color: 'white',
                                font: {
                                    size: 9
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            ticks: {
                                color: 'white',
                                font: {
                                    size: 9
                                },
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
                            labels: {
                                color: 'white',
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Fonction pour mettre à jour les graphiques
    function updateCharts() {
        if (savingsChart) {
            savingsChart.data.datasets[0].data = [savings.saving1, savings.saving2, savings.saving3];
            savingsChart.update();
        }
        
        if (investmentChart) {
            // Trier les investissements par date
            const sortedInvestments = [...investments].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Préparer les données pour le graphique
            const labels = sortedInvestments.map(inv => formatDate(inv.date));
            const investedData = [];
            const currentData = [];
            
            let cumulativeInvested = 0;
            let cumulativeCurrent = 0;
            
            sortedInvestments.forEach(inv => {
                cumulativeInvested += inv.amount;
                cumulativeCurrent += inv.currentValue;
                
                investedData.push(cumulativeInvested);
                currentData.push(cumulativeCurrent);
            });
            
            investmentChart.data.labels = labels;
            investmentChart.data.datasets[0].data = investedData;
            investmentChart.data.datasets[1].data = currentData;
            investmentChart.update();
        }
    }
    
    // Fonction pour ajouter un investissement
    function addInvestment() {
        const name = investmentNameInput.value.trim();
        const amount = parseFloat(investmentAmountInput.value);
        const type = investmentTypeSelect.value;
        const date = investmentDateInput.value;
        const notes = investmentNotesInput.value.trim();
        
        if (!name) {
            alert('Please enter an investment name');
            return;
        }
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        
        if (!date) {
            alert('Please select a date');
            return;
        }
        
        const investment = {
            id: Date.now(),
            name: name,
            amount: amount,
            currentValue: amount, // Initialement égal au montant investi
            type: type,
            date: date,
            notes: notes,
            timestamp: new Date().getTime()
        };
        
        investments.push(investment);
        updateDashboard();
        
        // Réinitialiser le formulaire
        investmentNameInput.value = '';
        investmentAmountInput.value = '';
        investmentTypeSelect.value = 'Stock';
        investmentDateInput.value = `${yyyy}-${mm}-${dd}`;
        investmentNotesInput.value = '';
        
        alert('Investment added successfully!');
    }
    
    // Fonction pour supprimer un investissement
    window.deleteInvestment = function(id) {
        if (confirm('Are you sure you want to delete this investment?')) {
            investments = investments.filter(inv => inv.id !== id);
            updateDashboard();
        }
    };
    
    // Fonction pour éditer un investissement
    window.editInvestment = function(id) {
        const investment = investments.find(inv => inv.id === id);
        if (!investment) return;
        
        const newValue = prompt(`Edit current value for "${investment.name}" (original: £${investment.amount.toFixed(2)})`, investment.currentValue);
        if (newValue === null) return;
        
        const parsedValue = parseFloat(newValue);
        if (isNaN(parsedValue)) {
            alert('Please enter a valid number');
            return;
        }
        
        investment.currentValue = parsedValue;
        updateDashboard();
        alert('Investment updated successfully!');
    };
    
    // Fonction pour effacer tous les investissements
    function clearAllInvestments() {
        if (investments.length === 0) {
            alert('No investments to clear!');
            return;
        }
        
        if (confirm('Are you sure you want to delete ALL investments? This action cannot be undone.')) {
            investments = [];
            updateDashboard();
            alert('All investments have been cleared!');
        }
    }
    
    // Fonctions pour libérer les savings
    function releaseSaving1() {
        if (savings.saving1 <= 0) {
            alert('No savings in Saving 1 to release');
            return;
        }
        
        if (confirm(`Release £${savings.saving1.toFixed(2)} from Saving 1 to your balance?`)) {
            // Cette fonction est appelée depuis le Bloc 1 via window.releaseSaving
            if (typeof window.releaseSaving === 'function') {
                window.releaseSaving('saving1');
            } else {
                alert('Error: Cannot connect to Money Manager. Please refresh the page.');
            }
        }
    }
    
    function releaseSaving2() {
        if (savings.saving2 <= 0) {
            alert('No savings in Saving 2 to release');
            return;
        }
        
        if (confirm(`Release £${savings.saving2.toFixed(2)} from Saving 2 to your balance?`)) {
            if (typeof window.releaseSaving === 'function') {
                window.releaseSaving('saving2');
            } else {
                alert('Error: Cannot connect to Money Manager. Please refresh the page.');
            }
        }
    }
    
    function releaseSaving3() {
        if (savings.saving3 <= 0) {
            alert('No savings in Saving 3 to release');
            return;
        }
        
        if (confirm(`Release £${savings.saving3.toFixed(2)} from Saving 3 to your balance?`)) {
            if (typeof window.releaseSaving === 'function') {
                window.releaseSaving('saving3');
            } else {
                alert('Error: Cannot connect to Money Manager. Please refresh the page.');
            }
        }
    }
    
    // Fonctions pour définir les objectifs de savings
    function setGoalSaving1() {
        const amount = parseFloat(goalAmountSaving1Input.value);
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid goal amount');
            return;
        }
        
        savingGoals.saving1 = amount;
        updateDashboard();
        alert('Goal for Saving 1 updated successfully!');
    }
    
    function setGoalSaving2() {
        const amount = parseFloat(goalAmountSaving2Input.value);
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid goal amount');
            return;
        }
        
        savingGoals.saving2 = amount;
        updateDashboard();
        alert('Goal for Saving 2 updated successfully!');
    }
    
    function setGoalSaving3() {
        const amount = parseFloat(goalAmountSaving3Input.value);
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid goal amount');
            return;
        }
        
        savingGoals.saving3 = amount;
        updateDashboard();
        alert('Goal for Saving 3 updated successfully!');
    }
    
    // Écouter les événements de mise à jour des savings depuis le Bloc 1
    window.addEventListener('savingsUpdated', function() {
        // Recharger les données depuis localStorage
        const savedSavings = localStorage.getItem('moneyManagerSavings');
        if (savedSavings) {
            savings = JSON.parse(savedSavings);
            updateDashboard();
        }
    });
    
    window.addEventListener('storage', function(e) {
        if (e.key === 'moneyManagerSavings') {
            savings = JSON.parse(e.newValue);
            updateDashboard();
        }
    });
    
    // Événements des boutons
    if (addInvestmentBtn) addInvestmentBtn.addEventListener('click', addInvestment);
    if (clearInvestmentsBtn) clearInvestmentsBtn.addEventListener('click', clearAllInvestments);
    if (releaseSaving1Btn) releaseSaving1Btn.addEventListener('click', releaseSaving1);
    if (releaseSaving2Btn) releaseSaving2Btn.addEventListener('click', releaseSaving2);
    if (releaseSaving3Btn) releaseSaving3Btn.addEventListener('click', releaseSaving3);
    if (setGoalSaving1Btn) setGoalSaving1Btn.addEventListener('click', setGoalSaving1);
    if (setGoalSaving2Btn) setGoalSaving2Btn.addEventListener('click', setGoalSaving2);
    if (setGoalSaving3Btn) setGoalSaving3Btn.addEventListener('click', setGoalSaving3);
    
    // Initialiser l'application
    function initApp() {
        console.log("Initialisation du Bloc 2 - Investment & Savings Dashboard");
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
        
        console.log("Bloc 2 - Investment & Savings Dashboard initialisé");
    }
    
    // Démarrer l'application
    initApp();
    
    // Gérer le redimensionnement de la fenêtre
    window.addEventListener('resize', function() {
        setTimeout(() => {
            if (savingsChart) savingsChart.resize();
            if (investmentChart) investmentChart.resize();
        }, 100);
    });
});
