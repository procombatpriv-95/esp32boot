// ============================================
// VARIABLES GLOBALES AJOUTÉES
// ============================================
window.firstVisitNotifTriggered = false;
window.notificationsCreated = false;
const NOTIF_PHRASES = [
    "bonjour mohamed",
    "aussi appel de papa",
    "meteo a 10 degree"
];
const GNEWS_API_KEY = 'b97899dfc31d70bf41c43c5b865654e6';
const CORS_PROXY = 'https://api.allorigins.win/raw?url='; // Proxy CORS fiable

// ============================================
// FONCTIONS AJOUTÉES (NOTIFICATIONS + NEWS)
// ============================================

/**
 * Crée deux notifications avec des phrases aléatoires
 */
function createNotifications(container) {
    if (!container || window.notificationsCreated) return;
    container.innerHTML = '';
    for (let i = 0; i < 2; i++) {
        const notif = document.createElement('div');
        notif.className = 'notification-item';
        const randomPhrase = NOTIF_PHRASES[Math.floor(Math.random() * NOTIF_PHRASES.length)];
        notif.innerHTML = `<span class="prime-label">PRIME IA:</span> ${randomPhrase}`;
        container.appendChild(notif);
    }
    window.notificationsCreated = true;
}

/**
 * Récupère les news depuis GNews (FR, GB, US) via un proxy CORS
 */
function fetchNews() {
    const urls = [
        `https://gnews.io/api/v4/top-headlines?country=fr&max=10&token=${GNEWS_API_KEY}`,
        `https://gnews.io/api/v4/top-headlines?country=gb&max=10&token=${GNEWS_API_KEY}`,
        `https://gnews.io/api/v4/top-headlines?country=us&max=10&token=${GNEWS_API_KEY}`
    ];

    Promise.all(urls.map(url =>
        fetch(CORS_PROXY + encodeURIComponent(url))
            .then(res => res.ok ? res.json() : Promise.reject('Erreur réseau'))
            .then(data => data.articles || [])
            .catch(err => {
                console.error('Erreur fetch news:', err);
                return [];
            })
    )).then(results => {
        // Fusionner tous les articles
        let allArticles = [];
        results.forEach(articles => {
            allArticles = allArticles.concat(articles);
        });

        // Déduplication basée sur le titre
        const unique = [];
        const titles = new Set();
        allArticles.forEach(article => {
            if (!titles.has(article.title)) {
                titles.add(article.title);
                unique.push(article);
            }
        });

        // Tri du plus récent au plus ancien
        unique.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        // Garder les 10 premiers
        const top10 = unique.slice(0, 10);
        renderNews(top10);
    }).catch(error => {
        console.error('Erreur lors du chargement des news:', error);
        renderNewsError();
    });
}

/**
 * Affiche les articles dans le bloc news
 */
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
        html += `
            <div class="news-item">
                <div class="news-title">${escapeHTML(title)}</div>
                <div class="news-source">
                    <span>${escapeHTML(source)}</span>
                    <span>${time}</span>
                </div>
            </div>
        `;
    });
    html += '</div>';
    newsContainer.innerHTML = html;
}

/**
 * Affiche un message d'erreur dans le bloc news
 */
function renderNewsError() {
    const newsContainer = document.querySelector('#kinfopaneltousContent .news-block-container');
    if (newsContainer) {
        newsContainer.innerHTML = '<div class="news-error">Erreur de chargement des actualités</div>';
    }
}

/**
 * Échappe les caractères HTML pour éviter les injections
 */
function escapeHTML(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================
// FONCTIONS ET VARIABLES SPÉCIFIQUES AUX MENUS (MODIFIÉES)
// ============================================

// === WIDGETS MENU-1 (MODIFIÉ POUR INTÉGRER NOTIFICATIONS + NEWS) ===
function loadMenu1Widgets() {
    const kinfopaneltousContent = document.getElementById('kinfopaneltousContent');
    if (!kinfopaneltousContent) return;

    // Vider le conteneur
    kinfopaneltousContent.innerHTML = '';

    // === NOUVEAU : Layout principal avec scroll si nécessaire ===
    const layoutWrapper = document.createElement('div');
    layoutWrapper.style.display = 'flex';
    layoutWrapper.style.flexDirection = 'column';
    layoutWrapper.style.gap = '15px';
    layoutWrapper.style.height = '100%';
    layoutWrapper.style.width = '100%';
    layoutWrapper.style.overflowY = 'auto';   // Permet de scroller si le contenu dépasse 620px
    layoutWrapper.style.maxHeight = '100%';
    layoutWrapper.style.paddingRight = '5px'; // Évite le chevauchement scrollbar

    // 1. Conteneur des notifications (sera rempli plus tard)
    const notifContainer = document.createElement('div');
    notifContainer.className = 'notifications-container';
    layoutWrapper.appendChild(notifContainer);

    // 2. Bloc news (avec hauteur fixe de 370px demandée)
    const newsContainer = document.createElement('div');
    newsContainer.className = 'news-block-container';
    newsContainer.innerHTML = '<div class="news-loading">Chargement des actualités...</div>';
    layoutWrapper.appendChild(newsContainer);

    // 3. Widget TradingView en bas
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

    // Charger le script TradingView s'il n'est pas déjà présent
    if (!document.querySelector('script[src*="tv-ticker-tape.js"]')) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://widgets.tradingview-widget.com/w/en/tv-ticker-tape.js';
        document.head.appendChild(script);
    }

    // Lancer le chargement des news
    fetchNews();

    // Afficher les notifications si le délai de 7s est déjà passé
    if (window.firstVisitNotifTriggered && !window.notificationsCreated) {
        createNotifications(notifContainer);
    }
}

// === AUTRES MENUS (inchangés) ===
// (Les fonctions pour menu-2, menu-3, menu-4, menu-5 restent identiques)

// ============================================
// GESTION DES MENUS ET PANELINFO (INCHANGÉE)
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
                window.getMoneyManagementData();
                window.showResultPanel();
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

// ============================================
// NOUVEAU : DÉCLENCHEMENT DES NOTIFICATIONS 7s APRÈS ARRIVÉE
// ============================================
window.addEventListener('load', function() {
    setTimeout(function() {
        window.firstVisitNotifTriggered = true;
        // Si le menu-1 est déjà actif, on crée les notifications immédiatement
        if (window.currentMenuPage === 'menu-1' && !window.notificationsCreated) {
            const notifContainer = document.querySelector('#kinfopaneltousContent .notifications-container');
            if (notifContainer) {
                createNotifications(notifContainer);
            }
        }
    }, 7000); // 7 secondes
});
