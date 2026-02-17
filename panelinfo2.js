// ============================================
// VARIABLES GLOBALES
// ============================================

let resultPanelData = {
  currentPeriod: 'monthly',
  monthlyGoal: 0,
  yearlyGoal: 0,
  monthlyIncome: 0,
  yearlyIncome: 0,
  monthlyExpenses: 0,
  yearlyExpenses: 0,
  monthlyTransactions: [],
  yearlyTransactions: [],
  highestTransaction: { amount: 0, category: '' },
  lowestTransaction: { amount: 0, category: '' },
  savings: { saving1: 0, saving2: 0, saving3: 0 }
};

let lastTransactionHash = '';
let lastGoalHash = '';
let lastSavingsHash = '';
let autoUpdateInterval = null;

// ============================================
// FONCTIONS FINANCIÈRES
// ============================================

function calculateSavings() {
  try {
    const transactions = JSON.parse(localStorage.getItem('moneyManagerTransactions') || '[]');
    const savings = { saving1: 0, saving2: 0, saving3: 0 };
    
    transactions.forEach(t => {
      if (t.saving === 'saving1') {
        if (t.type === 'income') savings.saving1 += t.amount;
        else if (t.type === 'expense') savings.saving1 -= t.amount;
      } else if (t.saving === 'saving2') {
        if (t.type === 'income') savings.saving2 += t.amount;
        else if (t.type === 'expense') savings.saving2 -= t.amount;
      } else if (t.saving === 'saving3') {
        if (t.type === 'income') savings.saving3 += t.amount;
        else if (t.type === 'expense') savings.saving3 -= t.amount;
      }
    });
    
    resultPanelData.savings = savings;
    return savings;
  } catch (e) {
    console.error('Erreur calcul savings:', e);
    return { saving1: 0, saving2: 0, saving3: 0 };
  }
}

// Revenus mensuels des 3 dernières années (toujours 3 tableaux de 12 mois)
function getLast3YearsMonthlyIncome() {
    try {
        const transactions = JSON.parse(localStorage.getItem('moneyManagerTransactions') || '[]');
        const currentYear = new Date().getFullYear();
        const years = [currentYear, currentYear - 1, currentYear - 2];
        const result = {};

        years.forEach(year => {
            const monthly = new Array(12).fill(0);
            transactions.forEach(t => {
                if (t.type === 'income' && t.saving === 'normal') {
                    const date = new Date(t.date);
                    if (date.getFullYear() === year) {
                        const month = date.getMonth(); // 0-11
                        monthly[month] += t.amount;
                    }
                }
            });
            result[year] = monthly;
        });
        return result;
    } catch (e) {
        console.error('Erreur getLast3YearsMonthlyIncome:', e);
        const currentYear = new Date().getFullYear();
        return { [currentYear]: new Array(12).fill(0) };
    }
}

function transferSaving(savingType) {
  try {
    const transactions = JSON.parse(localStorage.getItem('moneyManagerTransactions') || '[]');
    const savings = calculateSavings();
    const amount = savings[savingType];
    
    if (amount <= 0) {
      alert('Cannot transfer zero or negative saving amount.');
      return;
    }
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const newId = Date.now();
    
    const normalTransaction = {
      id: newId,
      amount: amount,
      category: 'Saving Release',
      description: `Transfer from ${savingType}`,
      date: dateStr,
      type: 'income',
      saving: 'normal',
      timestamp: now.getTime()
    };
    
    const savingTransaction = {
      id: newId + 1,
      amount: amount,
      category: 'Saving Release',
      description: `Transfer to normal from ${savingType}`,
      date: dateStr,
      type: 'expense',
      saving: savingType,
      timestamp: now.getTime() + 1
    };
    
    transactions.push(normalTransaction, savingTransaction);
    localStorage.setItem('moneyManagerTransactions', JSON.stringify(transactions));
    
    setTimeout(() => {
      getMoneyManagementData();
      showResultPanel();
    }, 100);
    
    window.dispatchEvent(new Event('storage'));
    
  } catch (e) {
    console.error('Erreur transfer saving:', e);
    alert('Error transferring saving: ' + e.message);
  }
}

function getMoneyManagementData(period = null) {
  try {
    const currentPeriod = period || resultPanelData.currentPeriod;
    const transactions = JSON.parse(localStorage.getItem('moneyManagerTransactions') || '[]');
    const monthlyGoals = JSON.parse(localStorage.getItem('moneyManagerGoals') || '{}');
    const yearlyGoal = parseFloat(localStorage.getItem('moneyManagerYearlyGoal') || '0');
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthKey = `${currentYear}-${currentMonth}`;
    
    const monthlyGoal = monthlyGoals[monthKey] || 0;
    
    const monthlyNormalTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === currentYear && 
             tDate.getMonth() + 1 === parseInt(currentMonth) &&
             t.saving === 'normal';
    });
    
    const yearlyNormalTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === currentYear &&
             t.saving === 'normal';
    });
    
    const monthlyIncome = monthlyNormalTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const yearlyIncome = yearlyNormalTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = monthlyNormalTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const yearlyExpenses = yearlyNormalTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    let monthlyHighest = { amount: 0, category: '' };
    let monthlyLowest = { amount: 0, category: '' };
    let yearlyHighest = { amount: 0, category: '' };
    let yearlyLowest = { amount: 0, category: '' };
    
    if (monthlyNormalTransactions.length > 0) {
      const monthlyIncomes = monthlyNormalTransactions.filter(t => t.type === 'income');
      const monthlyExpensesList = monthlyNormalTransactions.filter(t => t.type === 'expense');
      
      if (monthlyIncomes.length > 0) {
        monthlyHighest = monthlyIncomes.reduce((max, t) => 
          t.amount > max.amount ? t : max
        );
      }
      
      if (monthlyExpensesList.length > 0) {
        monthlyLowest = monthlyExpensesList.reduce((min, t) => 
          t.amount < min.amount ? t : min
        );
      }
    }
    
    if (yearlyNormalTransactions.length > 0) {
      const yearlyIncomes = yearlyNormalTransactions.filter(t => t.type === 'income');
      const yearlyExpensesList = yearlyNormalTransactions.filter(t => t.type === 'expense');
      
      if (yearlyIncomes.length > 0) {
        yearlyHighest = yearlyIncomes.reduce((max, t) => 
          t.amount > max.amount ? t : max
        );
      }
      
      if (yearlyExpensesList.length > 0) {
        yearlyLowest = yearlyExpensesList.reduce((min, t) => 
          t.amount < min.amount ? t : min
        );
      }
    }
    
    const savings = calculateSavings();
    
    resultPanelData.monthlyGoal = monthlyGoal;
    resultPanelData.yearlyGoal = yearlyGoal;
    resultPanelData.monthlyIncome = monthlyIncome;
    resultPanelData.yearlyIncome = yearlyIncome;
    resultPanelData.monthlyExpenses = monthlyExpenses;
    resultPanelData.yearlyExpenses = yearlyExpenses;
    resultPanelData.monthlyTransactions = monthlyNormalTransactions;
    resultPanelData.yearlyTransactions = yearlyNormalTransactions;
    resultPanelData.highestTransaction = currentPeriod === 'monthly' ? monthlyHighest : yearlyHighest;
    resultPanelData.lowestTransaction = currentPeriod === 'monthly' ? monthlyLowest : yearlyLowest;
    resultPanelData.savings = savings;
    
    return resultPanelData;
    
  } catch (e) {
    console.error('Erreur lors de la récupération des données:', e);
    return resultPanelData;
  }
}

function showResultPanel() {
  const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
  if (!kinfopaneltousContent) return;
  
  kinfopaneltousContent.innerHTML = '';
  
  const resultPanel = document.createElement('div');
  resultPanel.className = 'result-panel';
  
  const data = getMoneyManagementData();
  
  const currentGoal = resultPanelData.currentPeriod === 'monthly' 
    ? resultPanelData.monthlyGoal 
    : resultPanelData.yearlyGoal;

  const currentIncome = resultPanelData.currentPeriod === 'monthly'
    ? resultPanelData.monthlyIncome
    : resultPanelData.yearlyIncome;

  const currentExpenses = resultPanelData.currentPeriod === 'monthly'
    ? (resultPanelData.monthlyExpenses || 0)
    : (resultPanelData.yearlyExpenses || 0);

  const currentBalance = Math.max(0, currentIncome - currentExpenses);
  
  const percentage = currentGoal > 0 
    ? Math.min((currentBalance / currentGoal) * 100, 100) 
    : 0;
  
  const isGoalReached = percentage >= 100;
  const showAmountOnBar = percentage > 10;
  const progressFilledClass = percentage === 0 ? 'progress-filled empty' : 'progress-filled';
  const progressFilledStyle = percentage === 0 
    ? 'width: 0%; min-width: 0; padding-right: 0;' 
    : `width: ${percentage}%`;
  
  const savings = resultPanelData.savings || { saving1: 0, saving2: 0, saving3: 0 };
  
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
          <div class="${progressFilledClass}" style="${progressFilledStyle}">
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
    
    <div class="savings-container">
      <div class="saving-item">
        <span class="saving-label">Saving 1:</span>
        <span class="saving-amount">£${savings.saving1.toFixed(2)}</span>
        <button class="saving-add-btn" data-saving="saving1" ${savings.saving1 <= 0 ? 'disabled' : ''}>Add</button>
      </div>
      <div class="saving-item">
        <span class="saving-label">Saving 2:</span>
        <span class="saving-amount">£${savings.saving2.toFixed(2)}</span>
        <button class="saving-add-btn" data-saving="saving2" ${savings.saving2 <= 0 ? 'disabled' : ''}>Add</button>
      </div>
      <div class="saving-item">
        <span class="saving-label">Saving 3:</span>
        <span class="saving-amount">£${savings.saving3.toFixed(2)}</span>
        <button class="saving-add-btn" data-saving="saving3" ${savings.saving3 <= 0 ? 'disabled' : ''}>Add</button>
      </div>
    </div>
  `;
  
  // --- AJOUT DU GRAPHIQUE INCOME 3 ANS (sans titre) ---
  const chartContainer = document.createElement('div');
  chartContainer.style.width = '200px';
  chartContainer.style.marginTop = '10px';
  chartContainer.style.padding = '10px';
  chartContainer.style.background = 'rgba(30, 31, 35, 0.8)';
  chartContainer.style.borderRadius = '10px';
  chartContainer.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  chartContainer.style.alignSelf = 'center';

  const canvas = document.createElement('canvas');
  canvas.id = 'incomeLineChart';
  canvas.style.width = '100%';
  canvas.style.height = '100px';
  canvas.width = 200;
  canvas.height = 100;
  chartContainer.appendChild(canvas);

  // Mini légende colorée
  const legendDiv = document.createElement('div');
  legendDiv.style.display = 'flex';
  legendDiv.style.justifyContent = 'center';
  legendDiv.style.gap = '10px';
  legendDiv.style.marginTop = '5px';
  legendDiv.style.fontSize = '8px';
  legendDiv.style.color = 'white';

  const incomeData = getLast3YearsMonthlyIncome();
  const years = Object.keys(incomeData).sort((a, b) => a - b); // tri croissant (ancienne -> récente)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Destruction de l'ancien graphique s'il existe
  if (window.incomeLineChart) {
      window.incomeLineChart.destroy();
  }

  const ctx = canvas.getContext('2d');
  window.incomeLineChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: months,
          datasets: years.map((year, index) => ({
              label: year.toString(),
              data: incomeData[year],
              borderColor: index === 0 ? '#2ecc71' : (index === 1 ? '#3498db' : '#9b59b6'),
              backgroundColor: 'transparent',
              borderWidth: 2,
              pointRadius: 2,
              pointHoverRadius: 4,
              tension: 0.1,
              fill: false
          }))
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
              x: {
                  ticks: { font: { size: 8 }, color: 'white' },
                  grid: { display: false }
              },
              y: {
                  beginAtZero: true,
                  ticks: { 
                      font: { size: 8 }, 
                      color: 'white', 
                      callback: (v) => '£' + v 
                  },
                  grid: { color: 'rgba(255,255,255,0.1)' }
              }
          },
          plugins: {
              legend: { display: false },
              tooltip: { enabled: true }
          }
      }
  });

  years.forEach((year, index) => {
      const item = document.createElement('span');
      item.innerHTML = `<span style="display:inline-block; width:8px; height:8px; background:${index === 0 ? '#2ecc71' : (index === 1 ? '#3498db' : '#9b59b6')}; border-radius:2px; margin-right:3px;"></span> ${year}`;
      legendDiv.appendChild(item);
  });
  chartContainer.appendChild(legendDiv);

  resultPanel.appendChild(chartContainer);
  // --- FIN AJOUT ---

  kinfopaneltousContent.appendChild(resultPanel);
  
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(faLink);
  }
  
  const periodBtns = resultPanel.querySelectorAll('.period-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const period = this.getAttribute('data-period');
      resultPanelData.currentPeriod = period;
      getMoneyManagementData(period);
      showResultPanel();
    });
  });
  
  const savingBtns = resultPanel.querySelectorAll('.saving-add-btn');
  savingBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const savingType = this.getAttribute('data-saving');
      transferSaving(savingType);
    });
  });
}

// ============================================
// GESTION DU LOCALSTORAGE
// ============================================

const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, arguments);
  
  if (key && key.includes('moneyManager')) {
    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
      setTimeout(() => {
        getMoneyManagementData();
        showResultPanel();
      }, 100);
    }
  }
};

const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = function(key) {
  originalRemoveItem.apply(this, arguments);
  
  if (key && key.includes('moneyManager')) {
    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
      setTimeout(() => {
        getMoneyManagementData();
        showResultPanel();
      }, 100);
    }
  }
}; 

// ============================================
// GESTION DES NOTIFICATIONS ET NEWS (menu-1)
// ============================================

const GNEWS_API_KEY = 'b97899dfc31d70bf41c43c5b865654e6';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const NOTIF_PHRASES = [
    "As tu appele ton pere",
    "Verifie t est note",
    "Bourse en hausse",
    "As tu fait la priere"
];

// Liste des anniversaires (mois 0-indexé)
const birthdays = [
    { name: "Mohamed", day: 10, month: 6 },
    { name: "Dad", day: 18, month: 6 },
    { name: "Mom", day: 14, month: 3 },
    { name: "Bilal", day: 28, month: 10 },
    { name: "Assya", day: 21, month: 9 },
    { name: "Zackaria", day: 5, month: 4 }
];

// Durées
const DURATION_PRIME = 2 * 60 * 1000;      // 2 minutes
const DURATION_BIRTHDAY = 5 * 60 * 60 * 1000; // 5 heures
const DURATION_STATUS = 5 * 60 * 1000;     // 5 minutes

// ============================================
// GESTIONNAIRE DE NOTIFICATIONS AVEC SLOTS
// ============================================
class NotificationManager {
    constructor(containerSelector, maxSlots = 2) {
        this.container = document.querySelector(containerSelector);
        this.maxSlots = maxSlots;
        this.slots = new Array(maxSlots).fill(null);
        this.queue = [];
        this.nextId = 0;
        this.primeUpdateInterval = null;
    }

    // Ajouter une notification
    add(message, prefix, type, priority = false) {
        let duration;
        if (type === 'prime') duration = DURATION_PRIME;
        else if (type === 'birthday') duration = DURATION_BIRTHDAY;
        else if (type === 'status') duration = DURATION_STATUS;
        else duration = 30000;

        const notif = {
            id: this.nextId++,
            message,
            prefix,
            type,
            priority,
            duration,
            createdAt: Date.now(),
            element: null,
            slotIndex: null,
            timeouts: {},
            typingInterval: null,
            labelSpan: null,
            messageSpan: null
        };

        if (priority) {
            this.tryDisplayPriority(notif);
        } else {
            this.queue.push(notif);
            this.processQueue();
        }
    }

    tryDisplayPriority(notif) {
        const emptySlot = this.slots.findIndex(s => s === null);
        if (emptySlot !== -1) {
            this.displayInSlot(notif, emptySlot);
            return;
        }

        const nonPrioritySlot = this.slots.findIndex(s => s && !s.priority);
        if (nonPrioritySlot !== -1) {
            const oldNotif = this.slots[nonPrioritySlot];
            this.moveToQueue(oldNotif);
            this.displayInSlot(notif, nonPrioritySlot);
            return;
        }

        // Tous les slots sont prioritaires : on met en file d'attente
        this.queue.push(notif);
    }

    displayInSlot(notif, slotIndex) {
        if (!this.container) return;

        const element = document.createElement('div');
        element.className = 'notification-item';
        if (notif.priority) element.classList.add('priority');
        element.dataset.id = notif.id;

        // Créer les spans mais les laisser vides (cercle initial sans texte)
        const labelSpan = document.createElement('span');
        labelSpan.className = 'prime-label';
        const messageSpan = document.createElement('span');
        messageSpan.className = 'notification-message';
        element.appendChild(labelSpan);
        element.appendChild(messageSpan);

        this.container.appendChild(element);

        notif.element = element;
        notif.labelSpan = labelSpan;
        notif.messageSpan = messageSpan;
        notif.slotIndex = slotIndex;
        this.slots[slotIndex] = notif;

        // Expansion après 4s
        notif.timeouts.expand = setTimeout(() => {
            if (element.parentNode) {
                element.classList.add('expanded');
            }
        }, 4000);

        // Début de l'écriture après 8s (4s expansion + 4s)
        notif.timeouts.text = setTimeout(() => {
            this.startTyping(notif);
        }, 8000);

        if (notif.duration !== Infinity) {
            notif.timeouts.remove = setTimeout(() => {
                this.removeNotification(notif, true);
            }, notif.duration);
        }
    }

    startTyping(notif) {
        if (!notif.element || !notif.element.parentNode) return;

        // Arrêter un éventuel intervalle précédent
        if (notif.typingInterval) clearInterval(notif.typingInterval);

        // Ajouter le label maintenant (après expansion)
        notif.labelSpan.textContent = notif.prefix + ':';
        const fullText = notif.message;
        const messageSpan = notif.messageSpan;
        messageSpan.textContent = '';
        let index = 0;
        const speed = 4000 / fullText.length;

        const interval = setInterval(() => {
            if (index < fullText.length) {
                messageSpan.textContent += fullText.charAt(index);
                index++;
            } else {
                clearInterval(interval);
                notif.typingInterval = null;
            }
        }, speed);

        notif.typingInterval = interval;
    }

    moveToQueue(notif) {
        if (!notif) return;
        this.cleanupNotification(notif);
        if (notif.element && notif.element.parentNode) {
            notif.element.remove();
        }
        if (notif.slotIndex !== null) {
            this.slots[notif.slotIndex] = null;
            notif.slotIndex = null;
        }
        this.queue.push(notif);
    }

    removeNotification(notif, expired = false) {
        if (!notif) return;
        this.cleanupNotification(notif);
        if (notif.element && notif.element.parentNode) {
            notif.element.remove();
        }
        if (notif.slotIndex !== null) {
            this.slots[notif.slotIndex] = null;
        }
        // Si c'est une PRIME (qui ne devrait pas expirer normalement), on la remet en queue
        if (notif.type === 'prime') {
            notif.slotIndex = null;
            this.queue.push(notif);
        }
        this.processQueue();
    }

    cleanupNotification(notif) {
        if (notif.timeouts.expand) clearTimeout(notif.timeouts.expand);
        if (notif.timeouts.text) clearTimeout(notif.timeouts.text);
        if (notif.timeouts.remove) clearTimeout(notif.timeouts.remove);
        if (notif.typingInterval) clearInterval(notif.typingInterval);
        notif.typingInterval = null;
    }

    processQueue() {
        for (let i = 0; i < this.maxSlots; i++) {
            if (this.slots[i] === null && this.queue.length > 0) {
                this.queue.sort((a, b) => {
                    if (a.priority !== b.priority) return a.priority ? -1 : 1;
                    return a.createdAt - b.createdAt;
                });
                const next = this.queue.shift();
                this.displayInSlot(next, i);
            }
        }
    }

    updatePrimeMessages() {
        const allPrimes = [
            ...this.slots.filter(s => s && s.type === 'prime'),
            ...this.queue.filter(q => q.type === 'prime')
        ];

        allPrimes.forEach(notif => {
            let newMessage;
            do {
                newMessage = NOTIF_PHRASES[Math.floor(Math.random() * NOTIF_PHRASES.length)];
            } while (NOTIF_PHRASES.length > 1 && newMessage === notif.message);
            notif.message = newMessage;
            if (notif.element && notif.labelSpan && notif.messageSpan) {
                this.startTyping(notif);
            }
        });
    }

    startPrimeUpdate() {
        if (this.primeUpdateInterval) clearInterval(this.primeUpdateInterval);
        this.primeUpdateInterval = setInterval(() => {
            this.updatePrimeMessages();
        }, 60000);
    }

    clearAll() {
        this.slots.forEach((notif, index) => {
            if (notif) {
                this.cleanupNotification(notif);
                if (notif.element && notif.element.parentNode) {
                    notif.element.remove();
                }
                this.slots[index] = null;
            }
        });
        this.queue = [];
        if (this.primeUpdateInterval) {
            clearInterval(this.primeUpdateInterval);
            this.primeUpdateInterval = null;
        }
    }
}

let notifManager = null;

// ============================================
// GESTION DES ANNIVERSAIRES
// ============================================
let displayedBirthdays = new Set(JSON.parse(localStorage.getItem('displayedBirthdays')) || []);

function checkBirthdays() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();

    birthdays.forEach(bday => {
        if (bday.day === currentDay && bday.month === currentMonth) {
            const key = `${bday.name}-${currentDay}-${currentMonth}`;
            if (!displayedBirthdays.has(key)) {
                notifManager?.add(
                    `Joyeux anniversaire ${bday.name} ! 🎂`,
                    "ANNIVERSAIRE",
                    'birthday',
                    false
                );
                displayedBirthdays.add(key);
                localStorage.setItem('displayedBirthdays', JSON.stringify(Array.from(displayedBirthdays)));
            }
        }
    });
}

function scheduleDailyBirthdayCheck() {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const timeUntilMidnight = nextMidnight - now;
    setTimeout(() => {
        checkBirthdays();
        setInterval(checkBirthdays, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
}

// ============================================
// FONCTIONS POUR LES NEWS (30 articles)
// ============================================
function escapeHTML(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function fetchNews() {
    const countries = [
        { code: 'fr', label: 'FR' },
        { code: 'gb', label: 'GB' },
        { code: 'us', label: 'US' }
    ];

    const promises = countries.map(country =>
        fetch(CORS_PROXY + encodeURIComponent(`https://gnews.io/api/v4/top-headlines?country=${country.code}&max=10&token=${GNEWS_API_KEY}`))
            .then(res => res.ok ? res.json() : Promise.reject('Erreur réseau'))
            .then(data => {
                const articles = data.articles || [];
                articles.forEach(a => a.country = country.label);
                return articles;
            })
            .catch(err => {
                console.error(`Erreur fetch news ${country.code}:`, err);
                return [];
            })
    );

    Promise.all(promises).then(results => {
        let allArticles = results.flat();

        // Déduplication par titre pour éviter les doublons entre pays
        const unique = [];
        const titles = new Set();
        allArticles.forEach(article => {
            if (!titles.has(article.title)) {
                titles.add(article.title);
                unique.push(article);
            }
        });

        // Tri par date décroissante (les plus récentes en premier)
        unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        // On garde tous les articles (jusqu'à 30)
        renderNews(unique);
    }).catch(error => {
        console.error('Erreur globale news:', error);
        renderNewsError();
    });
}

function renderNews(articles) {
    const newsContainer = document.querySelector('#kinfopaneltousContent .news-block-container');
    if (!newsContainer) return;

    if (!articles || articles.length === 0) {
        newsContainer.innerHTML = '<div class="news-error">Aucune actualité disponible</div>';
        return;
    }

    let html = '<div class="news-list">';
    articles.forEach(article => {
        const title = article.title || 'Sans titre';
        const source = article.source?.name || 'Source inconnue';
        const time = article.publishedAt
            ? new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';
        const imageUrl = article.image || 'https://via.placeholder.com/50x50?text=News';
        const country = article.country || '?';

        html += `
            <div class="news-item">
                <img class="news-image" src="${escapeHTML(imageUrl)}" alt="news" loading="lazy" onerror="this.src='https://via.placeholder.com/50x50?text=Error'">
                <div class="news-content">
                    <div class="news-title">${escapeHTML(title)}</div>
                    <div class="news-source">
                        <span>${escapeHTML(source)}</span>
                        <span class="news-country">${country}</span>
                    </div>
                    <div style="font-size:9px; color:#aaa;">${time}</div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    newsContainer.innerHTML = html;
}

function renderNewsError() {
    const newsContainer = document.querySelector('#kinfopaneltousContent .news-block-container');
    if (newsContainer) {
        newsContainer.innerHTML = '<div class="news-error">Erreur de chargement des actualités</div>';
    }
}

// ============================================
// FONCTIONS POUR LES STATUTS DÉTECTEUR/CAMÉRA
// ============================================
let lastDetectorOnline = null;
let lastCameraOnline = null;

async function updateStatusAndNotify() {
    try {
        const res = await fetch("/status");
        const data = await res.json();

        if (data.esp2.online !== lastDetectorOnline) {
            if (data.esp2.online) {
                notifManager?.add("Detector is Online !", "STATUS", 'status', true);
            } else {
                notifManager?.add("Detector is Offline !", "STATUS", 'status', true);
            }
            lastDetectorOnline = data.esp2.online;
        }

        if (data.esp3.online !== lastCameraOnline) {
            if (data.esp3.online) {
                notifManager?.add("Camera is Online !", "STATUS", 'status', true);
            } else {
                notifManager?.add("Camera is Offline !", "STATUS", 'status', true);
            }
            lastCameraOnline = data.esp3.online;
        }
    } catch (e) {
        console.error("Erreur status fetch", e);
    }
}

// ============================================
// CHARGEMENT DU MENU-1
// ============================================
function loadMenu1Widgets() {
    const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
    const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
    if (!kinfopaneltousContent || !kinfopaneltousContainer) return;

    // Rendre le fond transparent pour le menu-1
    kinfopaneltousContainer.classList.add('transparent-bg');
    kinfopaneltousContent.classList.add('transparent-bg');

    // Nettoyer le contenu
    kinfopaneltousContent.innerHTML = '';

    // Créer le layout
    const layoutWrapper = document.createElement('div');
    layoutWrapper.style.display = 'flex';
    layoutWrapper.style.flexDirection = 'column';
    layoutWrapper.style.gap = '12px';
    layoutWrapper.style.height = '100%';
    layoutWrapper.style.width = '100%';
    layoutWrapper.style.overflowY = 'auto';
    layoutWrapper.style.maxHeight = '100%';
    layoutWrapper.style.paddingRight = '5px';

    // 1. Notifications
    const notifContainer = document.createElement('div');
    notifContainer.className = 'notifications-container';
    notifContainer.id = 'notification-container';
    layoutWrapper.appendChild(notifContainer);

    // 2. Bloc news
    const newsContainer = document.createElement('div');
    newsContainer.className = 'news-block-container';
    newsContainer.innerHTML = '<div class="news-loading">Chargement des actualités...</div>';
    layoutWrapper.appendChild(newsContainer);

    // 3. Widget TradingView
    const tickerContainer = document.createElement('div');
    tickerContainer.id = 'ticker-container-1';
    tickerContainer.className = 'ticker-container';
    const tickerTape = document.createElement('tv-ticker-tape');
    tickerTape.setAttribute('symbols', 'FOREXCOM:SPXUSD,FX:EURUSD,CMCMARKETS:GOLD,OANDA:NZDUSD,OANDA:GBPUSD,FX_IDC:JPYUSD,FX_IDC:CADUSD,OANDA:AUDUSD');
    tickerTape.setAttribute('direction', 'vertical');
    tickerTape.setAttribute('theme', 'dark');
    tickerContainer.appendChild(tickerTape);
    layoutWrapper.appendChild(tickerContainer);

    kinfopaneltousContent.appendChild(layoutWrapper);

    // Initialiser le gestionnaire de notifications
    if (notifManager) {
        notifManager.clearAll();
    }
    notifManager = new NotificationManager('#notification-container', 2);
    notifManager.startPrimeUpdate();

    // Ajouter immédiatement deux notifications PRIME IA avec des phrases différentes
    let phrases = [...NOTIF_PHRASES];
    if (phrases.length > 1) {
        phrases = phrases.sort(() => Math.random() - 0.5);
    }
    notifManager.add(phrases[0], "PRIME IA", 'prime', false);
    notifManager.add(phrases[1] || phrases[0], "PRIME IA", 'prime', false);

    // Charger les news
    fetchNews();

    // Charger le script TradingView
    if (!document.querySelector('script[src*="tv-ticker-tape.js"]')) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';
        document.head.appendChild(script);
    }

    // Lancer le polling des statuts
    if (!window.statusInterval) {
        window.statusInterval = setInterval(updateStatusAndNotify, 1000);
        updateStatusAndNotify();
    }

    // Anniversaires
    checkBirthdays();
    scheduleDailyBirthdayCheck();
}

// ============================================
// GESTION DES MENUS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    function updateMenuPanelInfo() {
        const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
        const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
        
        if (!kinfopaneltousContainer || !kinfopaneltousContent) return;
        
        kinfopaneltousContainer.classList.add('active');
        
        // Retirer la classe transparent-bg pour tous les menus par défaut
        kinfopaneltousContainer.classList.remove('transparent-bg');
        kinfopaneltousContent.classList.remove('transparent-bg');
        
        if (window.isInSelectedView && window.currentMenuPage === 'menu-2') {
            return;
        }
        
        switch(window.currentMenuPage) {
            case 'menu-1':
                loadMenu1Widgets();
                break;
            case 'menu-3':
                kinfopaneltousContent.innerHTML = '<div class="info-message">Menu 3 - Contenu à définir</div>';
                break;
            case 'menu-4':
                // Pour menu-4, on garde le fond normal (déjà retiré)
                if (window.getMoneyManagementData) window.getMoneyManagementData();
                if (window.showResultPanel) window.showResultPanel();
                break;
            case 'menu-5':
                kinfopaneltousContent.innerHTML = '<div class="info-message">Menu 5 - Contenu à définir</div>';
                break;
            default:
                kinfopaneltousContainer.classList.remove('active');
                break;
        }
    }
    
    const megaBox = document.getElementById('megaBox');
    if (megaBox) {
        const observerMenuChange = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    const classes = megaBox.classList;
                    if (classes.contains('menu-1')) window.currentMenuPage = 'menu-1';
                    else if (classes.contains('menu-2')) window.currentMenuPage = 'menu-2';
                    else if (classes.contains('menu-3')) window.currentMenuPage = 'menu-3';
                    else if (classes.contains('menu-4')) window.currentMenuPage = 'menu-4';
                    else if (classes.contains('menu-5')) window.currentMenuPage = 'menu-5';
                    
                    updateMenuPanelInfo();
                }
            });
        });
        
        observerMenuChange.observe(megaBox, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
    
    setTimeout(() => {
        updateMenuPanelInfo();
    }, 300);
});

// Mise à jour uniquement lors des changements localStorage (plus de polling intempestif)
// L'intervalle de 300ms a été supprimé pour éviter les recréations en boucle.

window.addEventListener('load', function() {
  setTimeout(() => {
    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
      if (window.getMoneyManagementData && window.showResultPanel) {
        window.getMoneyManagementData();
        window.showResultPanel();
      }
    }
  }, 300);
});
