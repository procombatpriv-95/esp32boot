// Afficher le panel résultat
function showResultPanel() {
  const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
  if (!kinfopaneltousContent) return;
  
  kinfopaneltousContent.innerHTML = '';
  
  const resultPanel = document.createElement('div');
  resultPanel.className = 'result-panel';
  
  // Récupérer les données à jour
  const data = getMoneyManagementData();
  
  // Déterminer l'objectif et la BALANCE (revenus - dépenses) selon la période
  const currentGoal = resultPanelData.currentPeriod === 'monthly' 
    ? resultPanelData.monthlyGoal 
    : resultPanelData.yearlyGoal;

  // Calculer la BALANCE au lieu de juste les revenus
  const currentIncome = resultPanelData.currentPeriod === 'monthly'
    ? resultPanelData.monthlyIncome
    : resultPanelData.yearlyIncome;

  const currentExpenses = resultPanelData.currentPeriod === 'monthly'
    ? (resultPanelData.monthlyExpenses || 0)
    : (resultPanelData.yearlyExpenses || 0);

  const currentBalance = Math.max(0, currentIncome - currentExpenses);
  
  // Calculer le pourcentage (max 100%) - BASÉ SUR LA BALANCE
  const percentage = currentGoal > 0 
    ? Math.min((currentBalance / currentGoal) * 100, 100) 
    : 0;
  
  // Déterminer si le goal est atteint ou dépassé
  const isGoalReached = percentage >= 100;
  
  // Pour l'affichage du montant sur la barre verte
  const showAmountOnBar = percentage > 10; // Afficher si > 10% pour les deux périodes
  
  // CORRECTION: Quand percentage est 0, on force width à 0 et on enlève min-width
  const progressFilledStyle = percentage === 0 
    ? 'width: 0%; min-width: 0;' 
    : `width: ${percentage}%`;
  
  resultPanel.innerHTML = `
    <div class="period-selector">
      <button class="period-btn ${resultPanelData.currentPeriod === 'monthly' ? 'active' : ''}" 
              data-period="monthly">Monthly</button>
      <button class="period-btn ${resultPanelData.currentPeriod === 'yearly' ? 'active' : ''}" 
              data-period="yearly">Yearly</button>
    </div>
    
    <div class="progress-section">
      <div class="progress-header">
        <span class="period-label">${resultPanelData.currentPeriod === 'monthly' ? 'Monthly' : 'Yearly'}</span>
        <span class="percentage-label">${percentage.toFixed(1)}%</span>
      </div>
      
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-filled" style="${progressFilledStyle}">
            ${showAmountOnBar ? `£${currentBalance.toFixed(0)}` : ''}
          </div>
          ${!isGoalReached ? `
            <div class="progress-remaining">
              ${percentage < 90 ? `£${Math.max(0, currentGoal - currentBalance).toFixed(0)}` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
    
    <div class="indicators-container">
      <div class="indicator-box indicator-highest">
        <div class="indicator-label">
          <i class="fas fa-arrow-up"></i> Highest
        </div>
        <div class="indicator-value">
          £${resultPanelData.highestTransaction.amount.toFixed(2)}
          ${resultPanelData.highestTransaction.category ? `<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;">${resultPanelData.highestTransaction.category}</div>` : ''}
        </div>
      </div>
      <div class="indicator-box indicator-lowest">
        <div class="indicator-label">
          <i class="fas fa-arrow-down"></i> Lowest
        </div>
        <div class="indicator-value">
          £${resultPanelData.lowestTransaction.amount.toFixed(2)}
          ${resultPanelData.lowestTransaction.category ? `<div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;">${resultPanelData.lowestTransaction.category}</div>` : ''}
        </div>
      </div>
    </div>
  `;
  
  kinfopaneltousContent.appendChild(resultPanel);
  
  // Ajouter Font Awesome si nécessaire
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(faLink);
  }
  
  // Ajouter les événements aux boutons de période
  const periodBtns = resultPanel.querySelectorAll('.period-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const period = this.getAttribute('data-period');
      resultPanelData.currentPeriod = period;
      
      // Mettre à jour immédiatement avec la nouvelle période
      getMoneyManagementData(period);
      showResultPanel();
    });
  });
}
