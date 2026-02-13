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
const DURATION_PRIME = 2 * 60 * 1000; // 2 minutes 
const DURATION_BIRTHDAY = 5 * 60 * 60 * 1000; // 5 heures
const DURATION_STATUS = 5 * 60 * 1000;    // 5 minutes

// ============================================
// GESTIONNAIRE DE NOTIFICATIONS AVEC SLOTS
// ============================================
class NotificationManager {
    constructor(containerSelector, maxSlots = 2) {
        this.container = document.querySelector(containerSelector);
        this.maxSlots = maxSlots;
        this.slots = new Array(maxSlots).fill(null); // notifications actuellement affichées
        this.queue = []; // notifications en attente (non affichées)
        this.nextId = 0;
        this.primeUpdateInterval = null;
    }

    // Ajouter une notification
    add(message, prefix, type, priority = false) {
        // Déterminer la durée
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
            element: null,          // sera créé lors de l'affichage
            slotIndex: null,         // index du slot où elle est affichée
            timeouts: {},            // pour stocker les timeouts
            typingInterval: null,
            messageSpan: null,       // référence au span du message
        };

        // Si c'est une notification prioritaire, on essaie de l'afficher immédiatement
        if (priority) {
            this.tryDisplayPriority(notif);
        } else {
            // Non prioritaire : on met en file d'attente
            this.queue.push(notif);
            this.processQueue();
        }
    }

    // Essayer d'afficher une notification prioritaire
    tryDisplayPriority(notif) {
        // Chercher un slot vide
        const emptySlot = this.slots.findIndex(s => s === null);
        if (emptySlot !== -1) {
            this.displayInSlot(notif, emptySlot);
            return;
        }

        // Tous les slots occupés : chercher un slot avec une notification non prioritaire
        const nonPrioritySlot = this.slots.findIndex(s => s && !s.priority);
        if (nonPrioritySlot !== -1) {
            // Remplacer : mettre l'ancienne en attente
            const oldNotif = this.slots[nonPrioritySlot];
            this.moveToQueue(oldNotif);
            this.displayInSlot(notif, nonPrioritySlot);
            return;
        }

        // Tous les slots sont prioritaires : on met la nouvelle en attente (ou on ignore)
        // Pour éviter de perdre des notifs, on met en queue
        this.queue.push(notif);
        // On ne process pas tout de suite car rien ne changera tant qu'un slot ne se libère pas
    }

    // Afficher une notification dans un slot donné
    displayInSlot(notif, slotIndex) {
        if (!this.container) return;

        // Créer l'élément DOM
        const element = document.createElement('div');
        element.className = 'notification-item';
        if (notif.priority) element.classList.add('priority');
        element.dataset.id = notif.id;

        // Structure interne : label + message
        const labelSpan = document.createElement('span');
        labelSpan.className = 'prime-label';
        labelSpan.textContent = notif.prefix + ':';
        const messageSpan = document.createElement('span');
        messageSpan.className = 'notification-message';
        element.appendChild(labelSpan);
        element.appendChild(messageSpan);

        this.container.appendChild(element);

        notif.element = element;
        notif.messageSpan = messageSpan;
        notif.slotIndex = slotIndex;
        this.slots[slotIndex] = notif;

        // Planifier l'expansion après 4s
        notif.timeouts.expand = setTimeout(() => {
            if (element.parentNode) {
                element.classList.add('expanded');
            }
        }, 4000);

        // Planifier le début de l'écriture après 8s (4s d'expansion + 4s)
        notif.timeouts.text = setTimeout(() => {
            this.startTyping(notif);
        }, 8000);

        // Si la durée n'est pas infinie, planifier la suppression
        if (notif.duration !== Infinity) {
            notif.timeouts.remove = setTimeout(() => {
                this.removeNotification(notif, true); // expiration
            }, notif.duration);
        }
    }

    // Démarrer l'effet machine à écrire sur une notification
    startTyping(notif) {
        if (!notif.messageSpan || !notif.element.parentNode) return;

        // Arrêter un éventuel intervalle précédent
        if (notif.typingInterval) clearInterval(notif.typingInterval);

        const fullText = notif.message;
        const messageSpan = notif.messageSpan;
        messageSpan.textContent = ''; // vider
        let index = 0;
        const speed = 4000 / fullText.length; // ms par caractère

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

    // Déplacer une notification de son slot vers la file d'attente
    moveToQueue(notif) {
        if (!notif) return;

        // Nettoyer les timeouts et l'intervalle
        this.cleanupNotification(notif);

        // Retirer du DOM
        if (notif.element && notif.element.parentNode) {
            notif.element.remove();
        }

        // Retirer du slot
        if (notif.slotIndex !== null) {
            this.slots[notif.slotIndex] = null;
            notif.slotIndex = null;
        }

        // Remettre dans la queue
        this.queue.push(notif);
    }

    // Supprimer définitivement une notification (expiration)
    removeNotification(notif, expired = false) {
        if (!notif) return;

        this.cleanupNotification(notif);

        if (notif.element && notif.element.parentNode) {
            notif.element.remove();
        }

        if (notif.slotIndex !== null) {
            this.slots[notif.slotIndex] = null;
        }

        // Si ce n'est pas une notification PRIME IA (qui ne doit jamais être supprimée définitivement),
        // on la laisse disparaître. Pour les PRIME, on ne devrait jamais appeler removeNotification
        // car leur durée est Infinity. Mais au cas où, on les remet dans la queue.
        if (notif.type === 'prime') {
            // Une PRIME ne devrait pas être supprimée, mais si ça arrive, on la remet en queue
            notif.slotIndex = null;
            this.queue.push(notif);
        }

        // Après suppression, essayer de remplir le slot libéré avec une notification en attente
        this.processQueue();
    }

    // Nettoyer les timers d'une notification
    cleanupNotification(notif) {
        if (notif.timeouts.expand) clearTimeout(notif.timeouts.expand);
        if (notif.timeouts.text) clearTimeout(notif.timeouts.text);
        if (notif.timeouts.remove) clearTimeout(notif.timeouts.remove);
        if (notif.typingInterval) clearInterval(notif.typingInterval);
        notif.typingInterval = null;
    }

    // Traiter la file d'attente : pour chaque slot vide, prendre la première notification éligible
    processQueue() {
        for (let i = 0; i < this.maxSlots; i++) {
            if (this.slots[i] === null && this.queue.length > 0) {
                // On prend la première notification de la file (qui peut être prioritaire ou non)
                // Mais on veut respecter un ordre : d'abord les prioritaires, puis les autres.
                // On trie la queue avant de piocher.
                this.queue.sort((a, b) => {
                    if (a.priority !== b.priority) return a.priority ? -1 : 1;
                    return a.createdAt - b.createdAt;
                });
                const next = this.queue.shift();
                this.displayInSlot(next, i);
            }
        }
    }

    // Mettre à jour le message d'une notification PRIME (appelé toutes les minutes)
    updatePrimeMessages() {
        // Chercher toutes les notifications PRIME dans slots et queue
        const allPrimes = [
            ...this.slots.filter(s => s && s.type === 'prime'),
            ...this.queue.filter(q => q.type === 'prime')
        ];

        allPrimes.forEach(notif => {
            // Choisir une nouvelle phrase différente de l'actuelle si possible
            let newMessage;
            do {
                newMessage = NOTIF_PHRASES[Math.floor(Math.random() * NOTIF_PHRASES.length)];
            } while (NOTIF_PHRASES.length > 1 && newMessage === notif.message);
            notif.message = newMessage;

            // Si elle est affichée, relancer l'écriture
            if (notif.element && notif.messageSpan) {
                this.startTyping(notif);
            }
        });
    }

    // Démarrer la mise à jour périodique des PRIME
    startPrimeUpdate() {
        if (this.primeUpdateInterval) clearInterval(this.primeUpdateInterval);
        this.primeUpdateInterval = setInterval(() => {
            this.updatePrimeMessages();
        }, 60000); // toutes les minutes
    }

    // Nettoyer tout (changement de menu)
    clearAll() {
        // Supprimer toutes les notifications affichées
        this.slots.forEach((notif, index) => {
            if (notif) {
                this.cleanupNotification(notif);
                if (notif.element && notif.element.parentNode) {
                    notif.element.remove();
                }
                this.slots[index] = null;
            }
        });
        // Vider la queue
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

    // Ajouter immédiatement les deux notifications PRIME IA (cercle visible tout de suite)
    // On s'assure qu'elles aient des phrases différentes
    let phrases = [...NOTIF_PHRASES];
    if (phrases.length > 1) {
        // Mélanger pour avoir deux différentes
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

    // Lancer le polling des statuts (toutes les secondes)
    if (!window.statusInterval) {
        window.statusInterval = setInterval(updateStatusAndNotify, 1000);
        updateStatusAndNotify();
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
