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

// Liste des anniversaires (mois : 0 = janvier, 11 = décembre)
const birthdays = [
    { name: "Mohamed", day: 10, month: 6 },   // 10 juillet
    { name: "Dad", day: 18, month: 6 },       // 18 juillet
    { name: "Mom", day: 14, month: 3 },       // 14 avril (mois 3 = avril)
    { name: "Bilal", day: 28, month: 10 },    // 28 novembre
    { name: "Assya", day: 21, month: 9 },     // 21 octobre
    { name: "Zackaria", day: 5, month: 4 }    // 5 mai
];

// ============================================
// GESTIONNAIRE DE NOTIFICATIONS (file d'attente avec priorité)
// ============================================
class NotificationManager {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.queue = [];
        this.currentNotification = null;
        this.timeoutId = null;
        this.priorityActive = false;
        this.priorityEndTime = 0;
        console.log('NotificationManager initialisé avec container:', this.container);
    }

    add(message, prefix = "PRIME IA", priority = false, duration = 120000) {
        if (!this.container) {
            console.error('Container de notifications introuvable');
            return;
        }
        this.queue.push({ message, prefix, priority, duration });
        console.log('Notification ajoutée à la file:', { message, prefix, priority, duration });
        this.processQueue();
    }

    processQueue() {
        if (this.currentNotification) {
            // Si une notification prioritaire est en cours, on ne la remplace que par une plus prioritaire
            if (this.priorityActive && Date.now() < this.priorityEndTime) {
                const priorityIndex = this.queue.findIndex(n => n.priority);
                if (priorityIndex !== -1) {
                    console.log('Remplacement par une notification prioritaire');
                    this.clearCurrent();
                    this.showNext();
                }
            } else {
                if (this.queue.length > 0) {
                    console.log('Chargement de la notification suivante (pas de prioritaire)');
                    this.clearCurrent();
                    this.showNext();
                }
            }
        } else {
            this.showNext();
        }
    }

    clearCurrent() {
        if (this.currentNotification && this.currentNotification.element) {
            this.currentNotification.element.remove();
        }
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.currentNotification = null;
        this.priorityActive = false;
    }

    showNext() {
        if (this.queue.length === 0) return;
        const next = this.queue.shift();
        this.displayNotification(next);
    }

    displayNotification(notifData) {
        if (!this.container) return;

        const notif = document.createElement('div');
        notif.className = 'notification-item';
        if (notifData.priority) notif.classList.add('priority');
        notif.innerHTML = ''; // cercle vide initial

        this.container.appendChild(notif);
        this.currentNotification = {
            element: notif,
            ...notifData
        };

        if (notifData.priority) {
            this.priorityActive = true;
            this.priorityEndTime = Date.now() + notifData.duration;
        }

        // Animation : expansion après 2s
        setTimeout(() => {
            if (notif.parentNode) {
                notif.classList.add('expanded');
            }
        }, 2000);

        // Ajout du texte après 4s
        setTimeout(() => {
            if (notif.parentNode) {
                notif.innerHTML = `<span class="prime-label">${notifData.prefix}:</span> ${notifData.message}`;
            }
        }, 4000);

        // Durée d'affichage
        const displayDuration = notifData.priority ? notifData.duration : 30000;
        this.timeoutId = setTimeout(() => {
            if (notifData.priority) {
                this.priorityActive = false;
                const nextPriority = this.queue.findIndex(n => n.priority);
                if (nextPriority === -1) {
                    this.clearCurrent();
                }
            } else {
                this.clearCurrent();
            }
            this.processQueue();
        }, displayDuration);
    }
}

// Gestionnaire global
let notifManager = null;

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
// FONCTIONS POUR LES STATUTS DETECTEUR/CAMERA
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
// FONCTION POUR LES ANNIVERSAIRES
// ============================================
function checkBirthdays() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();

    birthdays.forEach(b => {
        if (b.day === currentDay && b.month === currentMonth) {
            const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
            const key = `birthday_${b.name}_${todayStr}`;
            if (!localStorage.getItem(key)) {
                notifManager?.add(`Joyeux anniversaire ${b.name} ! 🎂`, "ANNIVERSAIRE", true, 120000);
                localStorage.setItem(key, 'true');
            }
        }
    });
}

// ============================================
// CHARGEMENT DU MENU-1 (NOTIFICATIONS + NEWS + TICKER)
// ============================================
function loadMenu1Widgets() {
    console.log('loadMenu1Widgets appelé');
    const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
    if (!kinfopaneltousContent) {
        console.error('kinfopaneltousContent introuvable');
        return;
    }

    // Vider le conteneur
    kinfopaneltousContent.innerHTML = '';

    // Layout wrapper
    const layoutWrapper = document.createElement('div');
    layoutWrapper.style.display = 'flex';
    layoutWrapper.style.flexDirection = 'column';
    layoutWrapper.style.gap = '15px';
    layoutWrapper.style.height = '100%';
    layoutWrapper.style.width = '100%';
    layoutWrapper.style.overflowY = 'auto';
    layoutWrapper.style.maxHeight = '100%';
    layoutWrapper.style.paddingRight = '5px';

    // 1. Conteneur des notifications
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

    // Initialiser le gestionnaire de notifications si nécessaire
    if (!notifManager) {
        notifManager = new NotificationManager('#notification-container');
    } else {
        // Mettre à jour le container du manager
        notifManager.container = document.querySelector('#notification-container');
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

    // Lancer la vérification des anniversaires (toutes les heures)
    if (!window.birthdayInterval) {
        window.birthdayInterval = setInterval(checkBirthdays, 3600000);
        checkBirthdays();
    }

    // Déclencher les notifications PRIME IA 7s après la première visite
    if (!window.firstVisitNotifTriggered) {
        setTimeout(() => {
            window.firstVisitNotifTriggered = true;
            console.log('Déclenchement des notifications PRIME IA');
            for (let i = 0; i < 2; i++) {
                const randomPhrase = NOTIF_PHRASES[Math.floor(Math.random() * NOTIF_PHRASES.length)];
                notifManager?.add(randomPhrase, "PRIME IA", false, 30000);
            }
        }, 7000);
    }
}

// ============================================
// GESTION DES MENUS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM prêt');

    // Variables globales
    window.currentMenuPage = null;
    window.isInSelectedView = false;

    function updateMenuPanelInfo() {
        const kinfopaneltousContainer = document.getElementById('kinfopaneltousContainer');
        const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');

        if (!kinfopaneltousContainer || !kinfopaneltousContent) {
            console.error('Conteneurs manquants');
            return;
        }

        console.log('updateMenuPanelInfo, currentMenuPage =', window.currentMenuPage);

        // Activer le conteneur
        kinfopaneltousContainer.classList.add('active');

        // Si on est en selected view et menu-2, on ne fait rien (géré ailleurs)
        if (window.isInSelectedView && window.currentMenuPage === 'menu-2') {
            return;
        }

        // Gérer les différents menus
        switch(window.currentMenuPage) {
            case 'menu-1':
                loadMenu1Widgets();
                break;
            case 'menu-3':
                kinfopaneltousContent.innerHTML = '<div class="info-message">Menu 3 - Contenu à définir</div>';
                break;
            case 'menu-4':
                if (typeof window.getMoneyManagementData === 'function') window.getMoneyManagementData();
                if (typeof window.showResultPanel === 'function') window.showResultPanel();
                break;
            case 'menu-5':
                kinfopaneltousContent.innerHTML = '<div class="info-message">Menu 5 - Contenu à définir</div>';
                break;
            default:
                kinfopaneltousContainer.classList.remove('active');
                break;
        }
    }

    // Observer les changements de classe sur megaBox
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
                    else window.currentMenuPage = null;

                    console.log('Changement de classe megaBox:', window.currentMenuPage);
                    updateMenuPanelInfo();
                }
            });
        });

        observerMenuChange.observe(megaBox, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Vérifier la classe initiale
        const initialClasses = megaBox.classList;
        if (initialClasses.contains('menu-1')) window.currentMenuPage = 'menu-1';
        else if (initialClasses.contains('menu-2')) window.currentMenuPage = 'menu-2';
        else if (initialClasses.contains('menu-3')) window.currentMenuPage = 'menu-3';
        else if (initialClasses.contains('menu-4')) window.currentMenuPage = 'menu-4';
        else if (initialClasses.contains('menu-5')) window.currentMenuPage = 'menu-5';
        else window.currentMenuPage = null;

        // Premier appel
        setTimeout(() => {
            updateMenuPanelInfo();
        }, 300);
    } else {
        console.error('megaBox introuvable');
    }
});

// Polling pour menu-4 (si nécessaire)
setInterval(() => {
    if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
        if (typeof window.getMoneyManagementData === 'function' && typeof window.showResultPanel === 'function') {
            window.getMoneyManagementData();
            window.showResultPanel();
        }
    }
}, 300);

window.addEventListener('load', function() {
    setTimeout(() => {
        if (window.currentMenuPage === 'menu-4' && !window.isInSelectedView) {
            if (typeof window.getMoneyManagementData === 'function' && typeof window.showResultPanel === 'function') {
                window.getMoneyManagementData();
                window.showResultPanel();
            }
        }
    }, 300);
});
