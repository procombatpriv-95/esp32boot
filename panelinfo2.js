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

// Durées
const DURATION_PRIME = Infinity;          // jamais supprimée automatiquement
const DURATION_BIRTHDAY = 5 * 60 * 60 * 1000; // 5 heures
const DURATION_STATUS = 5 * 60 * 1000;    // 5 minutes

// ============================================
// GESTIONNAIRE DE NOTIFICATIONS AVEC FILE D'ATTENTE
// ============================================
class NotificationManager {
    constructor(containerSelector, maxSlots = 2) {
        this.container = document.querySelector(containerSelector);
        this.maxSlots = maxSlots;
        this.queue = [];           // toutes les notifications en attente (non affichées)
        this.displayed = [];        // notifications actuellement affichées
        this.nextId = 0;
        this.primeUpdateInterval = null;
    }

    // Ajouter une notification
    add(message, prefix, type, priority = false, duration = 30000) {
        if (!this.container) return;

        // Définir la durée selon le type
        if (type === 'prime') duration = DURATION_PRIME;
        else if (type === 'birthday') duration = DURATION_BIRTHDAY;
        else if (type === 'status') duration = DURATION_STATUS;

        const notif = {
            id: this.nextId++,
            message,
            prefix,
            type,
            priority,
            duration,
            createdAt: Date.now(),
            element: null,           // sera créé lors de l'affichage
            expandTimeout: null,
            textTimeout: null,
            removeTimeout: null,
            typingInterval: null,
        };

        this.queue.push(notif);
        this.processQueue();
    }

    // Traiter la file d'attente : afficher autant que possible (maxSlots) en priorité
    processQueue() {
        // Trier la file : d'abord les prioritaires, puis les primes, puis les autres, puis par date
        this.queue.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority ? -1 : 1;
            if (a.type === 'prime' && b.type !== 'prime') return -1;
            if (b.type === 'prime' && a.type !== 'prime') return 1;
            return a.createdAt - b.createdAt;
        });

        // Tant qu'il y a des places libres et des notifications en file
        while (this.displayed.length < this.maxSlots && this.queue.length > 0) {
            const next = this.queue.shift();
            this.displayNotification(next);
        }
    }

    // Afficher une notification (créer l'élément DOM et lancer les animations)
    displayNotification(notif) {
        if (!this.container) return;

        const element = document.createElement('div');
        element.className = 'notification-item';
        if (notif.priority) element.classList.add('priority');
        element.dataset.id = notif.id;

        this.container.appendChild(element);
        notif.element = element;
        this.displayed.push(notif);

        // Expansion après 3s
        const expandTimeout = setTimeout(() => {
            if (element.parentNode) {
                element.classList.add('expanded');
            }
        }, 3000);

        // Texte avec effet machine à écrire après 6s (3+3)
        const textTimeout = setTimeout(() => {
            if (element.parentNode) {
                this.typeText(element, notif.message, notif.prefix);
            }
        }, 6000);

        notif.expandTimeout = expandTimeout;
        notif.textTimeout = textTimeout;

        // Timeout de fin de vie (sauf si durée infinie)
        if (notif.duration !== Infinity) {
            const removeTimeout = setTimeout(() => {
                this.removeNotification(notif, true); // true = expiration naturelle
            }, notif.duration);
            notif.removeTimeout = removeTimeout;
        }
    }

    // Effet machine à écrire sur 4 secondes
    typeText(element, fullMessage, prefix) {
        // Arrêter tout intervalle précédent sur cet élément
        if (element.typingInterval) clearInterval(element.typingInterval);

        const fullText = `<span class="prime-label">${prefix}:</span> ${fullMessage}`;
        const htmlMode = false; // on écrit du texte simple (pas de HTML)
        let index = 0;
        const speed = 4000 / fullText.length; // ms par caractère

        // Vider le contenu
        element.innerHTML = '';

        const interval = setInterval(() => {
            if (index < fullText.length) {
                element.innerHTML += fullText.charAt(index);
                index++;
            } else {
                clearInterval(interval);
                element.typingInterval = null;
            }
        }, speed);

        element.typingInterval = interval;
    }

    // Retirer une notification (soit expiration, soit pour faire de la place)
    removeNotification(notif, expired = false) {
        // Nettoyer les timeouts
        if (notif.expandTimeout) clearTimeout(notif.expandTimeout);
        if (notif.textTimeout) clearTimeout(notif.textTimeout);
        if (notif.removeTimeout) clearTimeout(notif.removeTimeout);
        if (notif.element && notif.element.typingInterval) clearInterval(notif.element.typingInterval);

        // Retirer du DOM
        if (notif.element && notif.element.parentNode) {
            notif.element.remove();
        }

        // Retirer du tableau displayed
        const index = this.displayed.indexOf(notif);
        if (index !== -1) this.displayed.splice(index, 1);

        // Si ce n'est pas une expiration (i.e. on l'a retirée pour faire de la place), on la remet dans la file ?
        // En fait, on ne la remet pas : elle est supprimée définitivement. Pour les primes, on veut qu'elles reviennent.
        // Donc on va gérer ça différemment : les primes ne sont jamais retirées de la file, seulement mises en "attente".
        // Ici on a un problème : notre modèle actuel supprime la notification de la file quand elle est affichée.
        // Pour que les primes reviennent, il faut les garder dans la file et les marquer comme "en attente" quand elles ne sont pas affichées.
        // Révisons la logique.

        // Nouvelle approche : on a une file unique de toutes les notifications, avec un état 'displayed' ou 'waiting'.
        // Lorsqu'on veut afficher, on prend les premières en attente.
        // Lorsqu'une notification est retirée (expiration), on la supprime de la file.
        // Pour les primes, on ne veut jamais les supprimer. Donc on ne doit pas les retirer de la file à expiration.
        // Mais elles ont une durée infinie, donc elles n'expirent jamais. Seul cas où elles sont retirées : quand on les remplace par une prioritaire.
        // Dans ce cas, on doit les remettre en attente.

        // Donc il faut distinguer deux types de retrait :
        // - retrait définitif (expiration d'une notification temporaire) : on supprime de la file.
        // - retrait temporaire (pour faire de la place) : on remet dans la file en attente.

        // Pour simplifier, on va créer deux méthodes :
        //   - removePermanently(notif) : pour les expirations.
        //   - moveToWaiting(notif) : pour libérer un slot sans supprimer.

        // Mais dans notre code actuel, removeNotification est appelée pour les deux. On va ajouter un paramètre permanent.
    }

    // Retirer définitivement (expiration)
    removePermanently(notif) {
        // Nettoyer
        if (notif.expandTimeout) clearTimeout(notif.expandTimeout);
        if (notif.textTimeout) clearTimeout(notif.textTimeout);
        if (notif.removeTimeout) clearTimeout(notif.removeTimeout);
        if (notif.element && notif.element.typingInterval) clearInterval(notif.element.typingInterval);

        if (notif.element && notif.element.parentNode) {
            notif.element.remove();
        }

        // Retirer du tableau displayed
        const dispIndex = this.displayed.indexOf(notif);
        if (dispIndex !== -1) this.displayed.splice(dispIndex, 1);

        // Retirer de la file (si elle y est encore)
        const queueIndex = this.queue.indexOf(notif);
        if (queueIndex !== -1) this.queue.splice(queueIndex, 1);

        // Ne pas appeler processQueue ici, car on vient de libérer un slot, il faut le faire
        this.processQueue();
    }

    // Mettre en attente (pour libérer un slot sans perdre la notification)
    moveToWaiting(notif) {
        // Nettoyer les timeouts (mais pas le removeTimeout car il ne doit pas se déclencher)
        if (notif.expandTimeout) clearTimeout(notif.expandTimeout);
        if (notif.textTimeout) clearTimeout(notif.textTimeout);
        if (notif.element && notif.element.typingInterval) clearInterval(notif.element.typingInterval);

        if (notif.element && notif.element.parentNode) {
            notif.element.remove();
        }

        // Retirer du tableau displayed
        const dispIndex = this.displayed.indexOf(notif);
        if (dispIndex !== -1) this.displayed.splice(dispIndex, 1);

        // Remettre dans la file (en gardant sa date de création)
        this.queue.push(notif);
        // Pas de processQueue immédiat, car on l'appellera après avoir retiré
    }

    // Nouvelle méthode pour ajouter une notification avec priorité et gestion des slots
    addWithPriority(message, prefix, type, priority = false) {
        // Créer la notification
        let duration;
        if (type === 'prime') duration = Infinity;
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
            expandTimeout: null,
            textTimeout: null,
            removeTimeout: null,
            typingInterval: null,
        };

        // Si c'est une notification prioritaire et que tous les slots sont occupés
        if (priority && this.displayed.length === this.maxSlots) {
            // Chercher une notification non prioritaire à déplacer
            const nonPriorityIndex = this.displayed.findIndex(n => !n.priority);
            if (nonPriorityIndex !== -1) {
                // Déplacer celle-ci en attente
                const toMove = this.displayed[nonPriorityIndex];
                this.moveToWaiting(toMove);
                // Maintenant on a une place libre
            } else {
                // Toutes sont prioritaires, on ignore la nouvelle (ou on remplace la plus ancienne ? On choisit de remplacer la plus ancienne prioritaire)
                const oldest = this.displayed.reduce((a, b) => a.createdAt < b.createdAt ? a : b);
                this.moveToWaiting(oldest);
            }
        }

        // Si ce n'est pas prioritaire mais que tous les slots sont occupés par des non prioritaires, on peut remplacer la plus ancienne non prioritaire
        // (optionnel, mais on peut le faire pour éviter de perdre des notifications)
        // Indon' t do it automatically; we'll just push to queue and process later.

        // Ajouter à la file
        this.queue.push(notif);
        this.processQueue();
    }

    // Mise à jour périodique des notifications PRIME IA (toutes les minutes)
    startPrimeUpdate() {
        if (this.primeUpdateInterval) clearInterval(this.primeUpdateInterval);
        this.primeUpdateInterval = setInterval(() => {
            // Parcourir toutes les notifications de type 'prime' dans la file et dans displayed
            const allPrimes = [...this.queue, ...this.displayed].filter(n => n.type === 'prime');
            allPrimes.forEach(notif => {
                const newMessage = NOTIF_PHRASES[Math.floor(Math.random() * NOTIF_PHRASES.length)];
                notif.message = newMessage;
                // Si elle est affichée, on met à jour le texte avec effet machine à écrire
                if (notif.element) {
                    // On arrête l'intervalle d'écriture en cours
                    if (notif.element.typingInterval) clearInterval(notif.element.typingInterval);
                    // On efface le contenu et on relance l'effet
                    notif.element.innerHTML = ''; // vide
                    this.typeText(notif.element, newMessage, notif.prefix);
                }
            });
        }, 60000); // toutes les minutes
    }

    // Nettoyer tout (quand on change de menu)
    clearAll() {
        // Supprimer tous les éléments DOM
        [...this.displayed].forEach(notif => {
            if (notif.element && notif.element.parentNode) {
                notif.element.remove();
            }
            if (notif.expandTimeout) clearTimeout(notif.expandTimeout);
            if (notif.textTimeout) clearTimeout(notif.textTimeout);
            if (notif.removeTimeout) clearTimeout(notif.removeTimeout);
            if (notif.element && notif.element.typingInterval) clearInterval(notif.element.typingInterval);
        });
        this.displayed = [];
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
                notifManager?.addWithPriority(
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
                notifManager?.addWithPriority("Detector is Online !", "STATUS", 'status', true);
            } else {
                notifManager?.addWithPriority("Detector is Offline !", "STATUS", 'status', true);
            }
            lastDetectorOnline = data.esp2.online;
        }

        if (data.esp3.online !== lastCameraOnline) {
            if (data.esp3.online) {
                notifManager?.addWithPriority("Camera is Online !", "STATUS", 'status', true);
            } else {
                notifManager?.addWithPriority("Camera is Offline !", "STATUS", 'status', true);
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

    // Initialiser le gestionnaire de notifications
    if (notifManager) {
        notifManager.clearAll();
    }
    notifManager = new NotificationManager('#notification-container', 2);
    notifManager.startPrimeUpdate();

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
            // Ajouter deux notifications PRIME IA
            for (let i = 0; i < 2; i++) {
                const randomPhrase = NOTIF_PHRASES[Math.floor(Math.random() * NOTIF_PHRASES.length)];
                notifManager?.addWithPriority(randomPhrase, "PRIME IA", 'prime', false);
            }
        }, 7000);
    } else {
        // Si déjà visité, on ajoute quand même les deux primes (au cas où)
        for (let i = 0; i < 2; i++) {
            const randomPhrase = NOTIF_PHRASES[Math.floor(Math.random() * NOTIF_PHRASES.length)];
            notifManager?.addWithPriority(randomPhrase, "PRIME IA", 'prime', false);
        }
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
