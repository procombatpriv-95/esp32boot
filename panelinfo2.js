// ============================================
// CONFIGURATION
// ============================================
const GNEWS_API_KEY = 'b97899dfc31d70bf41c43c5b865654e6';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const NOTIF_PHRASES = [
    "bonjour mohamed",
    "aussi appel de papa",
    "meteo a 10 degree"
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

// ============================================
// GESTIONNAIRE DE NOTIFICATIONS (multiples simultanées)
// ============================================
class NotificationManager {
    constructor(containerSelector, maxSlots = 2) {
        this.container = document.querySelector(containerSelector);
        this.maxSlots = maxSlots;
        this.activeNotifications = []; // { element, priority, timeoutId, removeTimeout }
    }

    add(message, prefix = "PRIME IA", priority = false, duration = 30000) {
        if (!this.container) return;
        if (priority) duration = 120000; // 2 min pour les prioritaires

        // Si on a déjà atteint le max de notifications
        if (this.activeNotifications.length >= this.maxSlots) {
            // On cherche une notification non prioritaire à remplacer
            const nonPriorityIndex = this.activeNotifications.findIndex(n => !n.priority);
            if (nonPriorityIndex !== -1) {
                // Remplacer la plus ancienne non prioritaire
                this.removeNotification(this.activeNotifications[nonPriorityIndex]);
            } else if (priority) {
                // Si c'est une prioritaire et que toutes sont prioritaires, on remplace la plus ancienne prioritaire
                this.removeNotification(this.activeNotifications[0]); // plus ancienne
            } else {
                // Sinon, on ignore la nouvelle notification non prioritaire
                console.log("Too many notifications, ignoring");
                return;
            }
        }

        // Créer l'élément
        const notif = document.createElement('div');
        notif.className = 'notification-item';
        if (priority) notif.classList.add('priority');

        this.container.appendChild(notif);

        // Gestion des timeouts
        const expandTimeout = setTimeout(() => {
            if (notif.parentNode) {
                notif.classList.add('expanded');
            }
        }, 3000);

        const textTimeout = setTimeout(() => {
            if (notif.parentNode) {
                notif.innerHTML = `<span class="prime-label">${prefix}:</span> ${message}`;
            }
        }, 6000);

        // Timeout pour supprimer la notification après durée
        const removeTimeout = setTimeout(() => {
            this.removeNotification({ element: notif });
        }, duration);

        // Stocker
        this.activeNotifications.push({
            element: notif,
            priority,
            expandTimeout,
            textTimeout,
            removeTimeout
        });
    }

    removeNotification(notifObj) {
        const index = this.activeNotifications.indexOf(notifObj);
        if (index !== -1) {
            // Nettoyer les timeouts
            clearTimeout(notifObj.expandTimeout);
            clearTimeout(notifObj.textTimeout);
            clearTimeout(notifObj.removeTimeout);
            // Retirer du DOM
            if (notifObj.element.parentNode) {
                notifObj.element.remove();
            }
            // Retirer du tableau
            this.activeNotifications.splice(index, 1);
        }
    }

    // Optionnel : supprimer toutes les notifications (utile pour changer de menu)
    clearAll() {
        while (this.activeNotifications.length > 0) {
            this.removeNotification(this.activeNotifications[0]);
        }
    }
}

let notifManager = null;

// ============================================
// GESTION DES ANNIVERSAIRES
// ============================================
let displayedNotifications = new Set(JSON.parse(localStorage.getItem('displayedNotifications')) || []);

function checkBirthdays() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();

    birthdays.forEach(bday => {
        if (bday.day === currentDay && bday.month === currentMonth) {
            const key = `${bday.name}-${currentDay}-${currentMonth}`;
            if (!displayedNotifications.has(key)) {
                notifManager?.add(`Joyeux anniversaire ${bday.name} ! 🎂`, "ANNIVERSAIRE", false, 60000);
                displayedNotifications.add(key);
                localStorage.setItem('displayedNotifications', JSON.stringify(Array.from(displayedNotifications)));
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
// FONCTIONS POUR LES NEWS
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
        const unique = [];
        const titles = new Set();
        allArticles.forEach(article => {
            if (!titles.has(article.title)) {
                titles.add(article.title);
                unique.push(article);
            }
        });
        unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        const top10 = unique.slice(0, 10);
        renderNews(top10);
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
                notifManager?.add("Detector is Online !", "STATUS", true, 120000);
            } else {
                notifManager?.add("Detector is Offline !", "STATUS", true, 120000);
            }
            lastDetectorOnline = data.esp2.online;
        }

        if (data.esp3.online !== lastCameraOnline) {
            if (data.esp3.online) {
                notifManager?.add("Camera is Online !", "STATUS", true, 120000);
            } else {
                notifManager?.add("Camera is Offline !", "STATUS", true, 120000);
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
    const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
    if (!kinfopaneltousContent) return;

    // Nettoyer le conteneur
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

    // Initialiser le gestionnaire de notifications (en vidant l'ancien s'il existe)
    if (notifManager) {
        notifManager.clearAll();
    } else {
        notifManager = new NotificationManager('#notification-container', 2);
    }

    // Charger les news
    fetchNews();

    // Charger le script TradingView
    if (!document.querySelector('script[src*="tv-ticker-tape.js"]')) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';
        document.head.appendChild(script);
    }

    // Lancer le polling des statuts (toutes les secondes)
    if (!window.statusInterval) {
        window.statusInterval = setInterval(updateStatusAndNotify, 1000);
        updateStatusAndNotify();
    }

    // Déclencher les deux notifications PRIME IA 7s après la première visite
    if (!window.firstVisitNotifTriggered) {
        setTimeout(() => {
            window.firstVisitNotifTriggered = true;
            // Ajouter deux notifications simultanément
            for (let i = 0; i < 2; i++) {
                const randomPhrase = NOTIF_PHRASES[Math.floor(Math.random() * NOTIF_PHRASES.length)];
                notifManager?.add(randomPhrase, "PRIME IA", false, 30000);
            }
        }, 7000);
    }

    // Anniversaires
    checkBirthdays();
    scheduleDailyBirthdayCheck();
}

// ============================================
// GESTION DES MENUS (inchangée)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    function updateMenuPanelInfo() {
        const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
        const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
        
        if (!kinfopaneltousContainer || !kinfopaneltousContent) return;
        
        kinfopaneltousContainer.classList.add('active');
        
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

// Polling pour menu-4
setInterval(() => {
  if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
    if (window.getMoneyManagementData && window.showResultPanel) {
      window.getMoneyManagementData();
      window.showResultPanel();
    }
  }
}, 300);

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
