        const mainButton = document.getElementById('mainButton');
        const subButtons = document.getElementById('subButtons');
        const restaurantContainer = document.getElementById('restaurantContainer');
        const restaurantsGrid = document.getElementById('restaurantsGrid');
        const proximityTitle = document.getElementById('proximityTitle');
        const restaurantLocationInfo = document.getElementById('restaurantLocationInfo');
        const f1Container = document.getElementById('f1Container');
        const transportContainer = document.getElementById('transportContainer');
        const expressPContent = document.getElementById('expressPContent');
        const expressTContent = document.getElementById('expressTContent');
        const transportLocationInfo = document.getElementById('transportLocationInfo');
        const distanceWarning = document.getElementById('distanceWarning');
        const fixedBusGrid = document.getElementById('fixedBusGrid');
        const dynamicBusGrid = document.getElementById('dynamicBusGrid');
        const trophyContainer = document.getElementById('trophyContainer');
        const footballContent = document.getElementById('footballContent');
        const f1TrophyContent = document.getElementById('f1TrophyContent');
        const ligue1Matches = document.getElementById('ligue1Matches');
        const laligaMatches = document.getElementById('laligaMatches');
        const newsContainer = document.getElementById('newsContainer');
        const newsScrollable = document.getElementById('newsScrollable');
        
        // Boutons D
        const restaurantDButton = document.getElementById('restaurantDButton');
        const f1DButton = document.getElementById('f1DButton');
        const transportDButton = document.getElementById('transportDButton');
        const trophyDButton = document.getElementById('trophyDButton');
        const newsDButton = document.getElementById('newsDButton');
        
        let isExpanded = false;
        let animationTimeout;
        let userLocation = null;
        let userCity = null;
        let transportRefreshInterval = null;
        let currentTransportTab = 'expressP';
        let expressTLastLocation = null;
        let currentTrophyTab = 'football';
        const apiKey = 'b97899dfc31d70bf41c43c5b865654e6';

        // Configuration des APIs TfL exactes pour Favorite
        const tflApis = {
            bus14: 'https://api.tfl.gov.uk/Line/14/Arrivals',
            bus49: 'https://api.tfl.gov.uk/Line/49/Arrivals', 
            bus430: 'https://api.tfl.gov.uk/Line/430/Arrivals',
            circleLine: 'https://api.tfl.gov.uk/Line/Circle/Arrivals'
        };

        // Gérer le clic sur le bouton principal
        mainButton.addEventListener('click', function(event) {
            event.stopPropagation();
            if (isExpanded) {
                closeMenu();
                return;
            }
            clearTimeout(animationTimeout);
            openMenu();
        });

        function openMenu() {
            mainButton.classList.add('expanded');
            isExpanded = true;
            animationTimeout = setTimeout(() => {
                subButtons.classList.add('visible');
            }, 100);
        }

        function closeMenu() {
            subButtons.classList.remove('visible');
            mainButton.classList.remove('expanded');
            mainButton.classList.remove('expanded-burger');
            mainButton.classList.remove('expanded-trophy');
            mainButton.classList.remove('expanded-news');
            isExpanded = false;
            subButtons.style.display = 'flex';
            restaurantContainer.style.display = 'none';
            f1Container.style.display = 'none';
            transportContainer.style.display = 'none';
            trophyContainer.style.display = 'none';
            newsContainer.style.display = 'none';
            proximityTitle.style.display = 'none';
            restaurantLocationInfo.style.display = 'none';
            transportLocationInfo.style.display = 'none';
            distanceWarning.style.display = 'none';
            
            if (transportRefreshInterval) {
                clearInterval(transportRefreshInterval);
                transportRefreshInterval = null;
            }
            
            clearTimeout(animationTimeout);
        }

        // Gérer les clics sur les boutons D


        // Clic sur le bouton info pour les actualités
        const infoButton = subButtons.querySelector('.sub-button:nth-child(1)');
        infoButton.addEventListener('click', async function(event) {
            event.stopPropagation();
            mainButton.classList.add('expanded-news');
            mainButton.classList.remove('expanded-burger');
            mainButton.classList.remove('expanded-trophy');
            subButtons.style.display = 'none';
            newsContainer.style.display = 'flex';
            restaurantContainer.style.display = 'none';
            transportContainer.style.display = 'none';
            trophyContainer.style.display = 'none';
            f1Container.style.display = 'none';
            
            await fetchNewsWithCorsProxy();
        });

        // Clic sur le burger pour les restaurants
        const burgerButton = subButtons.querySelector('.sub-button:nth-child(2)');
        burgerButton.addEventListener('click', async function(event) {
            event.stopPropagation();
            mainButton.classList.add('expanded-burger');
            mainButton.classList.remove('expanded-trophy');
            mainButton.classList.remove('expanded-news');
            subButtons.style.display = 'none';
            restaurantContainer.style.display = 'flex';
            f1Container.style.display = 'none';
            transportContainer.style.display = 'none';
            trophyContainer.style.display = 'none';
            newsContainer.style.display = 'none';
            
            proximityTitle.style.display = 'none';
            restaurantLocationInfo.style.display = 'none';
            showRestaurantLoadingAnimation();
            
            await getUserLocation();
            restaurantLocationInfo.style.display = 'block';
            restaurantLocationInfo.textContent = `📍 Recherche dans ${userCity || 'votre zone'}`;
            await findNearbyRestaurants();
        });

        // Clic sur le bus pour le transport
        const busButton = subButtons.querySelector('.sub-button:nth-child(3)');
        busButton.addEventListener('click', async function(event) {
            event.stopPropagation();
            mainButton.classList.add('expanded-burger');
            mainButton.classList.remove('expanded-trophy');
            mainButton.classList.remove('expanded-news');
            subButtons.style.display = 'none';
            transportContainer.style.display = 'flex';
            restaurantContainer.style.display = 'none';
            f1Container.style.display = 'none';
            trophyContainer.style.display = 'none';
            newsContainer.style.display = 'none';
            
            // Afficher le contenu selon l'onglet actif
            if (currentTransportTab === 'expressP') {
                showExpressPContent();
                await fetchRealTimeBusData();
            } else {
                showExpressTContent();
                transportLocationInfo.style.display = 'block';
                transportLocationInfo.textContent = '📍 Recherche de votre position...';
                await getUserLocation();
                transportLocationInfo.textContent = `📍 Position: ${userCity || 'votre zone'}`;
                expressTLastLocation = { ...userLocation };
                await findNearbyBusesWithRealAPI();
            }
            
            // Mise à jour automatique
            if (transportRefreshInterval) {
                clearInterval(transportRefreshInterval);
            }
            transportRefreshInterval = setInterval(() => {
                if (transportContainer.style.display === 'flex') {
                    if (currentTransportTab === 'expressP') {
                        fetchRealTimeBusData();
                    } else {
                        updateExpressTData();
                    }
                }
            }, 10000); // 10 secondes pour les deux
        });

        // Clic sur le trophée pour le contenu trophée
        const trophyButton = subButtons.querySelector('.sub-button:nth-child(4)');
        trophyButton.addEventListener('click', function(event) {
            event.stopPropagation();
            mainButton.classList.add('expanded-trophy');
            mainButton.classList.remove('expanded-burger');
            mainButton.classList.remove('expanded-news');
            subButtons.style.display = 'none';
            trophyContainer.style.display = 'flex';
            restaurantContainer.style.display = 'none';
            transportContainer.style.display = 'none';
            f1Container.style.display = 'none';
            newsContainer.style.display = 'none';
            
            // Charger les données de football
            fetchFootballData();
        });

        // ==============================================
        // FONCTIONS NEWS
        // ==============================================

        async function fetchNewsWithCorsProxy() {
            showNewsLoadingAnimation();
            
            try {
                const frUrl = `https://gnews.io/api/v4/top-headlines?country=fr&max=10&token=${apiKey}`;
                const gbUrl = `https://gnews.io/api/v4/top-headlines?country=gb&max=10&token=${apiKey}`;

                let frData = null;
                let gbData = null;

                // Essayer plusieurs proxies CORS
                const proxies = [
                    'https://api.allorigins.win/raw?url=',
                    'https://corsproxy.io/?',
                    'https://proxy.cors.sh/'
                ];

                for (const proxy of proxies) {
                    try {
                        if (!frData) {
                            const frResponse = await fetchWithTimeout(`${proxy}${encodeURIComponent(frUrl)}`, 5000);
                            if (frResponse.ok) {
                                frData = await frResponse.json();
                            }
                        }
                        
                        if (!gbData) {
                            const gbResponse = await fetchWithTimeout(`${proxy}${encodeURIComponent(gbUrl)}`, 5000);
                            if (gbResponse.ok) {
                                gbData = await gbResponse.json();
                            }
                        }

                        if (frData && gbData) break;
                        
                    } catch (error) {
                        console.log(`Proxy ${proxy} a échoué:`, error);
                        continue;
                    }
                }

                // Si les proxies échouent, utiliser les données de démonstration
                if (!frData || !gbData) {
                    displayFallbackNewsData();
                    return;
                }

                // Combiner et afficher les articles
                const allArticles = [
                    ...(frData.articles || []).slice(0, 6).map(article => ({...article, source: '🇫🇷 France'})),
                    ...(gbData.articles || []).slice(0, 6).map(article => ({...article, source: '🇬🇧 Angleterre'}))
                ];

                // Mélanger les articles
                const shuffledArticles = allArticles.sort(() => Math.random() - 0.5);
                
                displayNews(shuffledArticles.slice(0, 12));
                
            } catch (error) {
                console.error('Erreur générale récupération actualités:', error);
                displayFallbackNewsData();
            }
        }

        function displayFallbackNewsData() {
            const fallbackArticles = [
                {
                    title: "Nouvelle politique environnementale en France",
                    description: "Le gouvernement annonce un plan ambitieux pour la transition écologique avec des investissements records.",
                    source: "🇫🇷 France",
                    publishedAt: new Date().toISOString(),
                    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iNiIgZmlsbD0icmdiYSg3OCwgMjA1LCAxOTYsIDAuMSkiLz4KPHN2ZyB4PSIxNSIgeT0iMTUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0ZWNkYzQiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0yMSAxMC0zLjUtMy41TTMgMTBsMy41LTMuNU0xMCAzSDdNNCAxMGgxNk0xMCAyMWg0TTEyIDN2MTgiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4KPC9zdmc+"
                },
                {
                    title: "Innovations technologiques à Paris",
                    description: "Les startups françaises présentent des avancées majeures en intelligence artificielle et technologies vertes.",
                    source: "🇫🇷 France", 
                    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iNiIgZmlsbD0icmdiYSgyNTUsIDE5MywgNywgMC4xKSIvPgo8c3ZnIHg9IjE1IiB5PSIxNSIgd2lkdGgPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmMxMDciIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Ik0yIDEyaDIwTTEyIDJ2MjBNMjIgMTJNMTIgMjJjNS41MjMgMCAxMC00LjQ3NyAxMC0xMFMxNy41MjMgMiAxMiAyIDIgNi40NzcgMiAxMnM0LjQ3NyAxMCAxMCAxMHoiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4KPC9zdmc+"
                },
                {
                    title: "Tech sector growth in London",
                    description: "London's tech industry shows strong growth with new startups and major investments in AI sector.",
                    source: "🇬🇧 Angleterre",
                    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iNiIgZmlsbD0icmdiYSg3OCwgMjA1LCAxOTYsIDAuMSkiLz4KPHN2ZyB4PSIxNSIgeT0iMTUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0ZWNkYzQiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Ik0xMiAxMXY0TTEyIDhoLjAxTTIyIDEyYzAgNS41MjMtNC40NzcgMTAtMTAgMTBTMiAxNy41MjMgMiAxMiA2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTB6IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cjwvc3ZnPg=="
                },
                {
                    title: "Brexit trade agreements update",
                    description: "New trade agreements signed with European partners to facilitate economic exchanges.",
                    source: "🇬🇧 Angleterre",
                    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iNiIgZmlsbD0icmdiYSgyNTUsIDE5MywgNywgMC4xKSIvPgo8c3ZnIHg9IjE1IiB5PSIxNSIgd2lkdGgPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmMxMDciIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Ik04IDE2SDdtMTAgMGgtNU04IDEyaDEyTTcgOGgxMG0tMTAgNGgxNE02IDIwaDEyTTYgNGgxMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo8L3N2Zz4="
                }
            ];

            const fragment = document.createDocumentFragment();
            
            // Ajouter un avertissement CORS
            const warning = document.createElement('div');
            warning.className = 'cors-warning';
            warning.innerHTML = `
                <div style="font-size: 14px; margin-bottom: 3px;">⚠️</div>
                <div>Mode démonstration</div>
                <div style="font-size: 7px; margin-top: 3px;">Actualités simulées - API temporairement indisponible</div>
            `;
            fragment.appendChild(warning);
            
            // Ajouter les articles de fallback
            fallbackArticles.forEach(article => {
                const newsArticle = createNewsArticle(article, article.source);
                fragment.appendChild(newsArticle);
            });
            
            newsScrollable.innerHTML = '';
            newsScrollable.appendChild(fragment);
        }

        function displayNews(articles) {
            const fragment = document.createDocumentFragment();
            
            if (articles && articles.length > 0) {
                articles.forEach(article => {
                    const newsArticle = createNewsArticle(article, article.source);
                    fragment.appendChild(newsArticle);
                });
            } else {
                displayFallbackNewsData();
                return;
            }
            
            newsScrollable.innerHTML = '';
            newsScrollable.appendChild(fragment);
        }

        function createNewsArticle(article, source) {
            const newsArticle = document.createElement('div');
            newsArticle.className = 'news-article';
            
            const image = document.createElement('img');
            image.className = 'news-image';
            image.src = article.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iNiIgZmlsbD0icmdiYSg3OCwgMjA1LCAxOTYsIDAuMSkiLz4KPHN2ZyB4PSIxNSIgeT0iMTUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0ZWNkYzQiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Ik0xMiAxMXY0TTEyIDhoLjAxTTIyIDEyYzAgNS41MjMtNC40NzcgMTAtMTAgMTBTMiAxNy41MjMgMiAxMiA2LjQ3NyAyIDEyIDJzMTAgNC40NzcgMTAgMTB6IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cjwvc3ZnPg==';
            image.alt = article.title;
            image.onerror = function() {
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iNiIgZmlsbD0icmdiYSg3OCwgMjA1LCAxOTYsIDAuMSkiLz4KPHN2ZyB4PSIxNSIgeT0iMTUiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0ZWNkYzQiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Ik0xMiAxMXY0TTEyIDhoLjAxTTIyIDEyYzAgNS41MjMtNC40NzcgMTAtMTAgMTBTMiAxNy41MjMgMiAxMiA2LjQ3dyAyIDEyIDJzMTAgNC40NzcgMTAgMTB6IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cjwvc3ZnPg==';
            };
            
            const content = document.createElement('div');
            content.className = 'news-content';
            
            const title = document.createElement('div');
            title.className = 'news-title';
            title.textContent = article.title || 'Titre non disponible';
            
            const description = document.createElement('div');
            description.className = 'news-description';
            description.textContent = article.description || 'Aucune description disponible';
            
            const sourceElement = document.createElement('div');
            sourceElement.className = 'news-source';
            sourceElement.textContent = source;
            
            const date = document.createElement('div');
            date.className = 'news-date';
            date.textContent = formatNewsDate(article.publishedAt);
            
            content.appendChild(title);
            content.appendChild(description);
            content.appendChild(sourceElement);
            content.appendChild(date);
            
            newsArticle.appendChild(image);
            newsArticle.appendChild(content);
            
            return newsArticle;
        }

        function formatNewsDate(dateString) {
            if (!dateString) return 'Date inconnue';
            
            try {
                const date = new Date(dateString);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                
                if (diffMins < 60) {
                    return `Il y a ${diffMins} min`;
                } else if (diffHours < 24) {
                    return `Il y a ${diffHours} h`;
                } else {
                    return date.toLocaleDateString('fr-FR');
                }
            } catch (error) {
                return 'Date inconnue';
            }
        }

        function showNewsLoadingAnimation() {
            newsScrollable.innerHTML = `
                <div class="centered-loading">
                    <div class="wrapper">
                        <div class="circle"></div>
                        <div class="circle"></div>
                        <div class="circle"></div>
                        <div class="shadow"></div>
                        <div class="shadow"></div>
                        <div class="shadow"></div>
                    </div>
                </div>
            `;
        }

        // Fonction fetch avec timeout
        function fetchWithTimeout(url, timeout = 5000) {
            return Promise.race([
                fetch(url),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), timeout)
                )
            ]);
        }

        // ==============================================
        // FONCTIONS EXISTANTES (RESTAURANTS, TRANSPORTS, FOOTBALL)
        // ==============================================

        // Gestion du Segmented Control pour le transport
        document.querySelectorAll('.transport-segment').forEach(segment => {
            segment.addEventListener('click', function(event) {
                event.stopPropagation();
                const tab = this.getAttribute('data-tab');
                
                if (tab === currentTransportTab) return;
                
                switchTransportTab(tab);
            });
        });

        // Gestion du Segmented Control pour le trophée
        document.querySelectorAll('.trophy-segment').forEach(segment => {
            segment.addEventListener('click', function(event) {
                event.stopPropagation();
                const tab = this.getAttribute('data-tab');
                
                if (tab === currentTrophyTab) return;
                
                switchTrophyTab(tab);
            });
        });

        function switchTransportTab(tab) {
            document.querySelectorAll('.transport-segment').forEach(segment => {
                segment.classList.remove('active');
            });
            document.querySelector(`.transport-segment[data-tab="${tab}"]`).classList.add('active');
            
            if (tab === 'expressP') {
                showExpressPContent();
                fetchRealTimeBusData();
                transportLocationInfo.style.display = 'none';
                distanceWarning.style.display = 'none';
            } else if (tab === 'expressT') {
                showExpressTContent();
                transportLocationInfo.style.display = 'block';
                transportLocationInfo.textContent = '📍 Recherche de votre position...';
                getUserLocation().then(() => {
                    transportLocationInfo.textContent = `📍 Position: ${userCity || 'votre zone'}`;
                    expressTLastLocation = { ...userLocation };
                    findNearbyBusesWithRealAPI();
                });
            }
            
            currentTransportTab = tab;
        }

        function switchTrophyTab(tab) {
            document.querySelectorAll('.trophy-segment').forEach(segment => {
                segment.classList.remove('active');
            });
            document.querySelector(`.trophy-segment[data-tab="${tab}"]`).classList.add('active');
            
            if (tab === 'football') {
                footballContent.classList.add('active');
                f1TrophyContent.classList.remove('active');
                fetchFootballData();
            } else if (tab === 'f1') {
                footballContent.classList.remove('active');
                f1TrophyContent.classList.add('active');
            }
            
            currentTrophyTab = tab;
        }

        function showExpressPContent() {
            expressPContent.style.display = 'flex';
            expressTContent.style.display = 'none';
        }

        function showExpressTContent() {
            expressPContent.style.display = 'none';
            expressTContent.style.display = 'flex';
            expressTContent.classList.add('express-t-slide');
        }

        // API TfL pour ExpressP - MODIFIÉ POUR UTILISER LES VRAIES APIS
// API TfL pour ExpressP - MODIFIÉ POUR UTILISER LES VRAIES APIS
// API TfL pour ExpressP - MODIFIÉ POUR UTILISER LES VRAIES APIS
async function fetchRealTimeBusData() {
    try {
        fixedBusGrid.classList.add('refresh-animation');
        setTimeout(() => fixedBusGrid.classList.remove('refresh-animation'), 500);

        const allBusData = [];
        let circleLineData = null;
        
        // Récupérer les données pour chaque ligne de bus
        for (const [key, apiUrl] of Object.entries(tflApis)) {
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                
                // Filtrer pour South Kensington
                const southKensingtonData = data
                    .filter(item => 
                        item.stationName && 
                        item.stationName.toLowerCase().includes("south kensington") &&
                        !item.stationName.toLowerCase().includes("russell")
                    )
                    .sort((a, b) => a.timeToStation - b.timeToStation)
                    .slice(0, 2);
                
                if (key === 'circleLine') {
                    circleLineData = southKensingtonData[0]; // Prendre seulement le premier métro
                } else {
                    allBusData.push(...southKensingtonData);
                }
                
            } catch (error) {
                console.error(`Erreur pour ${key}:`, error);
            }
            
            // Petite pause entre les appels API
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Trier les données de bus
        allBusData.sort((a, b) => a.timeToStation - b.timeToStation);
        
        // Prendre seulement 3 bus (14, 49, 430) et ajouter la Circle Line
        const selectedBuses = allBusData.slice(0, 3);
        
        // Afficher les résultats : 3 bus + 1 métro
        displayRealTimeTransport(selectedBuses, circleLineData);
        
    } catch (error) {
        console.error('Erreur API TfL:', error);
        displayFallbackTransport();
    }
}

function displayRealTimeTransport(busData, tubeData) {
    const fragment = document.createDocumentFragment();
    
    // Afficher les 3 premiers bus
    busData.forEach(bus => {
        const busCard = document.createElement('div');
        busCard.className = 'bus-card';
        busCard.style.minHeight = '120px'; // Forcer la même hauteur
        busCard.style.display = 'flex';
        busCard.style.flexDirection = 'column';
        busCard.style.justifyContent = 'space-between';
        
        const header = document.createElement('div');
        header.className = 'bus-header';
        
        const busInfo = document.createElement('div');
        busInfo.className = 'bus-info';
        
        const routeElement = document.createElement('div');
        routeElement.className = 'bus-route';
        routeElement.textContent = `Bus ${bus.lineName}`;
        
        const destinationElement = document.createElement('div');
        destinationElement.className = 'bus-destination';
        destinationElement.textContent = bus.destinationName || 'Destination inconnue';
        destinationElement.style.minHeight = '20px'; // Hauteur fixe pour la destination
        
        busInfo.appendChild(routeElement);
        busInfo.appendChild(destinationElement);
        
        const timeElement = document.createElement('div');
        timeElement.className = 'bus-time';
        const arrivalMinutes = Math.round(bus.timeToStation / 60);
        
        if (arrivalMinutes <= 1) {
            timeElement.textContent = 'Due';
            timeElement.classList.add('due');
        } else {
            timeElement.textContent = `${arrivalMinutes} min`;
            
            if (arrivalMinutes <= 3) {
                timeElement.classList.add('time-soon');
            } else if (arrivalMinutes <= 8) {
                timeElement.classList.add('time-medium');
            } else {
                timeElement.classList.add('time-realistic');
            }
        }
        
        header.appendChild(busInfo);
        header.appendChild(timeElement);
        busCard.appendChild(header);
        
        const stationElement = document.createElement('div');
        stationElement.className = 'bus-destination';
        stationElement.textContent = bus.stationName || 'South Kensington Station';
        stationElement.style.fontSize = '9px';
        stationElement.style.color = '#888';
        stationElement.style.marginTop = 'auto'; // Pousser en bas
        busCard.appendChild(stationElement);
        
        fragment.appendChild(busCard);
    });
    
    // Afficher la Circle Line comme 4ème élément
    if (tubeData) {
        const tubeCard = document.createElement('div');
        tubeCard.className = 'bus-card';
        tubeCard.style.borderColor = '#ffd700';
        tubeCard.style.background = 'rgba(255, 215, 0, 0.1)';
        tubeCard.style.minHeight = '120px'; // Même hauteur que les bus
        tubeCard.style.display = 'flex';
        tubeCard.style.flexDirection = 'column';
        tubeCard.style.justifyContent = 'space-between';
        
        const header = document.createElement('div');
        header.className = 'bus-header';
        
        const tubeInfo = document.createElement('div');
        tubeInfo.className = 'bus-info';
        
        const routeElement = document.createElement('div');
        routeElement.className = 'bus-route';
        routeElement.textContent = 'Circle Line';
        routeElement.style.color = '#ffd700';
        
        const destinationElement = document.createElement('div');
        destinationElement.className = 'bus-destination';
        destinationElement.textContent = 'Via Paddington';
        destinationElement.style.color = '#ffd700';
        destinationElement.style.minHeight = '20px'; // Même hauteur que les bus
        
        tubeInfo.appendChild(routeElement);
        tubeInfo.appendChild(destinationElement);
        
        const timeElement = document.createElement('div');
        timeElement.className = 'bus-time';
        const arrivalMinutes = Math.round(tubeData.timeToStation / 60);
        
        if (arrivalMinutes <= 1) {
            timeElement.textContent = 'Due';
            timeElement.classList.add('due');
        } else {
            timeElement.textContent = `${arrivalMinutes} min`;
            timeElement.classList.add('time-medium');
        }
        
        header.appendChild(tubeInfo);
        header.appendChild(timeElement);
        tubeCard.appendChild(header);
        
        const stationElement = document.createElement('div');
        stationElement.className = 'bus-destination';
        stationElement.textContent = tubeData.stationName || 'South Kensington Station';
        stationElement.style.fontSize = '9px';
        stationElement.style.color = '#888';
        stationElement.style.marginTop = 'auto'; // Pousser en bas
        tubeCard.appendChild(stationElement);
        
        fragment.appendChild(tubeCard);
    }
    
    fixedBusGrid.innerHTML = '';
    fixedBusGrid.appendChild(fragment);
}

function displayFallbackTransport() {
    const fallbackData = [
        { type: 'bus', line: '14', destination: 'Putney Heath', time: 4 },
        { type: 'bus', line: '49', destination: 'White City', time: 7 },
        { type: 'bus', line: '430', destination: 'Roehampton Danebury Avenue', time: 11 },
        { type: 'tube', line: 'Circle', destination: 'Via Paddington', time: 3 }
    ];
    
    const fragment = document.createDocumentFragment();
    
    fallbackData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bus-card';
        card.style.minHeight = '120px'; // Même hauteur pour tous
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.justifyContent = 'space-between';
        
        if (item.type === 'tube') {
            card.style.borderColor = '#ffd700';
            card.style.background = 'rgba(255, 215, 0, 0.1)';
        }
        
        const header = document.createElement('div');
        header.className = 'bus-header';
        
        const info = document.createElement('div');
        info.className = 'bus-info';
        
        const routeElement = document.createElement('div');
        routeElement.className = 'bus-route';
        routeElement.textContent = item.type === 'bus' ? `Bus ${item.line}` : 'Circle Line';
        if (item.type === 'tube') {
            routeElement.style.color = '#ffd700';
        }
        
        const destinationElement = document.createElement('div');
        destinationElement.className = 'bus-destination';
        destinationElement.textContent = item.destination;
        destinationElement.style.minHeight = '20px'; // Hauteur fixe
        if (item.type === 'tube') {
            destinationElement.style.color = '#ffd700';
        }
        
        info.appendChild(routeElement);
        info.appendChild(destinationElement);
        
        const timeElement = document.createElement('div');
        timeElement.className = 'bus-time';
        timeElement.textContent = `${item.time} min`;
        timeElement.classList.add('time-medium');
        
        header.appendChild(info);
        header.appendChild(timeElement);
        card.appendChild(header);
        
        const stationElement = document.createElement('div');
        stationElement.className = 'bus-destination';
        stationElement.textContent = 'South Kensington Station';
        stationElement.style.fontSize = '9px';
        stationElement.style.color = '#888';
        stationElement.style.marginTop = 'auto'; // Pousser en bas
        card.appendChild(stationElement);
        
        fragment.appendChild(card);
    });
    
    fixedBusGrid.innerHTML = '';
    fixedBusGrid.appendChild(fragment);
}
        // ExpressT avec vraie API TfL - RESTÉ IDENTIQUE
        async function findNearbyBusesWithRealAPI() {
            if (!userLocation) return;

            showBusLoadingAnimation('ExpressT');

            try {
                const { lat, lon } = userLocation;
                const radius = 500;
                
                const busStopsQuery = `
                    [out:json][timeout:25];
                    (
                        node["highway"="bus_stop"](around:${radius},${lat},${lon});
                        way["highway"="bus_stop"](around:${radius},${lat},${lon});
                    );
                    out body;
                    >;
                    out skel qt;
                `;

                const stopsResponse = await fetch('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    },
                    body: 'data=' + encodeURIComponent(busStopsQuery)
                });

                const stopsData = await stopsResponse.json();
                
                if (!stopsData.elements || stopsData.elements.length === 0) {
                    displayNoBusesFound();
                    return;
                }

                const busLines = new Set();

                for (const element of stopsData.elements) {
                    if (element.tags && element.tags['route_ref']) {
                        const routes = element.tags['route_ref'].split(';');
                        routes.forEach(route => {
                            const cleanRoute = route.trim();
                            if (cleanRoute && !isNaN(cleanRoute)) {
                                busLines.add(cleanRoute);
                            }
                        });
                    }
                }

                if (busLines.size === 0) {
                    busLines.add('14');
                    busLines.add('49');
                    busLines.add('430');
                    busLines.add('C1');
                }

                const allBusData = [];
                const busLinesArray = Array.from(busLines);

                for (const line of busLinesArray) {
                    try {
                        const apiUrl = `https://api.tfl.gov.uk/Line/${line}/Arrivals`;
                        const response = await fetch(apiUrl);
                        
                        if (!response.ok) continue;
                        
                        const busData = await response.json();
                        
                        const southKensingtonBuses = busData
                            .filter(bus => 
                                bus.stationName && 
                                bus.stationName.toLowerCase().includes("south kensington") &&
                                !bus.stationName.toLowerCase().includes("russell")
                            )
                            .sort((a, b) => a.timeToStation - b.timeToStation)
                            .slice(0, 2);
                        
                        allBusData.push(...southKensingtonBuses);
                        
                    } catch (error) {
                        console.error(`Erreur pour la ligne ${line}:`, error);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                if (allBusData.length === 0) {
                    displayFallbackExpressTBuses();
                } else {
                    displayRealTimeExpressTBuses(allBusData.slice(0, 4));
                }

            } catch (error) {
                console.error('Erreur générale ExpressT:', error);
                displayFallbackExpressTBuses();
            }
        }

        function updateExpressTData() {
            if (!userLocation) return;

            const positionChanged = expressTLastLocation && 
                (Math.abs(userLocation.lat - expressTLastLocation.lat) > 0.001 || 
                 Math.abs(userLocation.lon - expressTLastLocation.lon) > 0.001);

            if (positionChanged) {
                expressTLastLocation = { ...userLocation };
                transportLocationInfo.textContent = `📍 Position: ${userCity || 'votre zone'}`;
                findNearbyBusesWithRealAPI();
            } else {
                updateExpressTTimes();
            }
        }

        function updateExpressTTimes() {
            const timeElements = dynamicBusGrid.querySelectorAll('.bus-time');
            timeElements.forEach(element => {
                if (element.textContent === 'Due') {
                    return;
                }
                
                const currentTime = parseInt(element.textContent);
                if (currentTime <= 1) {
                    element.textContent = 'Due';
                    element.className = 'bus-time due';
                } else {
                    const newTime = currentTime - 1;
                    element.textContent = `${newTime} min`;
                    
                    element.classList.remove('time-soon', 'time-medium', 'time-realistic');
                    if (newTime <= 3) {
                        element.classList.add('time-soon');
                    } else if (newTime <= 8) {
                        element.classList.add('time-medium');
                    } else {
                        element.classList.add('time-realistic');
                    }
                }
            });
        }

        function displayRealTimeExpressTBuses(busData) {
            const fragment = document.createDocumentFragment();
            
            busData.forEach(bus => {
                const busCard = document.createElement('div');
                busCard.className = 'bus-card';
                
                const header = document.createElement('div');
                header.className = 'bus-header';
                
                const busInfo = document.createElement('div');
                busInfo.className = 'express-t-bus-info';
                
                const routeElement = document.createElement('div');
                routeElement.className = 'express-t-bus-route';
                routeElement.textContent = `Bus ${bus.lineName}`;
                
                const terminusElement = document.createElement('div');
                terminusElement.className = 'express-t-bus-terminus';
                terminusElement.textContent = `Vers ${bus.destinationName || 'South Kensington'}`;
                
                busInfo.appendChild(routeElement);
                busInfo.appendChild(terminusElement);
                
                const timeElement = document.createElement('div');
                timeElement.className = 'bus-time';
                const arrivalMinutes = Math.round(bus.timeToStation / 60);
                
                if (arrivalMinutes <= 1) {
                    timeElement.textContent = 'Due';
                    timeElement.classList.add('due');
                } else {
                    timeElement.textContent = `${arrivalMinutes} min`;
                    
                    if (arrivalMinutes <= 3) {
                        timeElement.classList.add('time-soon');
                    } else if (arrivalMinutes <= 8) {
                        timeElement.classList.add('time-medium');
                    } else {
                        timeElement.classList.add('time-realistic');
                    }
                }
                
                header.appendChild(busInfo);
                header.appendChild(timeElement);
                busCard.appendChild(header);
                
                const nextBusElement = document.createElement('div');
                nextBusElement.className = 'bus-details';
                nextBusElement.textContent = `Prochain bus à South Kensington`;
                busCard.appendChild(nextBusElement);
                
                const stationElement = document.createElement('div');
                stationElement.className = 'express-t-station-name';
                stationElement.textContent = bus.stationName || 'South Kensington Station';
                busCard.appendChild(stationElement);
                
                fragment.appendChild(busCard);
            });
            
            dynamicBusGrid.innerHTML = '';
            dynamicBusGrid.appendChild(fragment);
        }

        function displayFallbackExpressTBuses() {
            const fragment = document.createDocumentFragment();
            const defaultBuses = [
                { lineName: "14", destination: "Putney Heath", time: 5 },
                { lineName: "49", destination: "White City", time: 8 },
                { lineName: "430", destination: "Roehampton", time: 12 },
                { lineName: "C1", destination: "Victoria", time: 7 }
            ];
            
            defaultBuses.forEach(bus => {
                const busCard = document.createElement('div');
                busCard.className = 'bus-card';
                
                const header = document.createElement('div');
                header.className = 'bus-header';
                
                const busInfo = document.createElement('div');
                busInfo.className = 'express-t-bus-info';
                
                const routeElement = document.createElement('div');
                routeElement.className = 'express-t-bus-route';
                routeElement.textContent = `Bus ${bus.lineName}`;
                
                const terminusElement = document.createElement('div');
                terminusElement.className = 'express-t-bus-terminus';
                terminusElement.textContent = `Vers ${bus.destination}`;
                
                busInfo.appendChild(routeElement);
                busInfo.appendChild(terminusElement);
                
                const timeElement = document.createElement('div');
                timeElement.className = 'bus-time';
                timeElement.textContent = `${bus.time} min`;
                timeElement.classList.add('time-medium');
                
                header.appendChild(busInfo);
                header.appendChild(timeElement);
                busCard.appendChild(header);
                
                const nextBusElement = document.createElement('div');
                nextBusElement.className = 'bus-details';
                nextBusElement.textContent = `Prochain bus à South Kensington`;
                busCard.appendChild(nextBusElement);
                
                const stationElement = document.createElement('div');
                stationElement.className = 'express-t-station-name';
                stationElement.textContent = 'South Kensington Station';
                busCard.appendChild(stationElement);
                
                fragment.appendChild(busCard);
            });
            
            dynamicBusGrid.innerHTML = '';
            dynamicBusGrid.appendChild(fragment);
        }

        function displayNoBusesFound() {
            dynamicBusGrid.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #aaa; grid-column: 1 / -1;">
                    <div style="font-size: 24px; margin-bottom: 10px;">🚍</div>
                    <div>Aucun arrêt de bus trouvé à proximité</div>
                    <div style="font-size: 10px; margin-top: 10px; color: #666;">Essayez de vous déplacer ou utilisez ExpressP</div>
                </div>
            `;
        }

        // Restaurants
        async function findNearbyRestaurants() {
            if (!userLocation) {
                displayFallbackRestaurants();
                return;
            }

            showRestaurantLoadingAnimation();

            try {
                const { lat, lon } = userLocation;
                await findRestaurantsWithOpenStreetMap(lat, lon);
                
            } catch (error) {
                console.error('Erreur recherche restaurants:', error);
                displayFallbackRestaurants();
            }
        }

        async function findRestaurantsWithOpenStreetMap(lat, lon) {
            try {
                const radius = 500;
                const query = `
                    [out:json][timeout:25];
                    (
                        node["amenity"="restaurant"](around:${radius},${lat},${lon});
                        node["amenity"="fast_food"](around:${radius},${lat},${lon});
                        node["amenity"="cafe"](around:${radius},${lat},${lon});
                        node["amenity"="bar"](around:${radius},${lat},${lon});
                        node["amenity"="pub"](around:${radius},${lat},${lon});
                    );
                    out body;
                `;

                const response = await fetch('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    body: 'data=' + encodeURIComponent(query)
                });

                const data = await response.json();
                
                if (data.elements && data.elements.length > 0) {
                    displayRealRestaurants(data.elements);
                } else {
                    displayFallbackRestaurants();
                }

            } catch (error) {
                console.error('Erreur OpenStreetMap:', error);
                displayFallbackRestaurants();
            }
        }

        function displayRealRestaurants(restaurants) {
            const restaurantsWithDistance = restaurants.map(restaurant => {
                const distance = calculateDistance(userLocation.lat, userLocation.lon, restaurant.lat, restaurant.lon);
                return { ...restaurant, distance: distance };
            });

            restaurantsWithDistance.sort((a, b) => a.distance - b.distance);
            const nearbyRestaurants = restaurantsWithDistance.slice(0, 4);

            proximityTitle.style.display = 'block';
            restaurantLocationInfo.textContent = `📍 ${nearbyRestaurants.length} restaurants près de vous`;
            
            const fragment = document.createDocumentFragment();
            
            nearbyRestaurants.forEach(restaurant => {
                const restaurantCard = document.createElement('div');
                restaurantCard.className = 'restaurant-card';
                
                const header = document.createElement('div');
                header.className = 'restaurant-header';
                
                const nameElement = document.createElement('div');
                nameElement.className = 'restaurant-name';
                nameElement.textContent = restaurant.tags?.name || 'Restaurant';
                
                const addressElement = document.createElement('div');
                addressElement.className = 'restaurant-address';
                addressElement.textContent = getCompleteAddress(restaurant);
                
                header.appendChild(nameElement);
                header.appendChild(addressElement);
                restaurantCard.appendChild(header);
                
                const infoRow = document.createElement('div');
                infoRow.className = 'restaurant-info-row';
                
                const distanceElement = document.createElement('div');
                distanceElement.className = 'bus-distance';
                const distanceMeters = Math.round(restaurant.distance * 1000);
                
                if (distanceMeters <= 100) {
                    distanceElement.style.color = '#ff6b6b';
                    distanceElement.innerHTML = `🚶‍♂️ ${distanceMeters}m`;
                } else if (distanceMeters <= 300) {
                    distanceElement.style.color = '#4ecdc4';
                    distanceElement.innerHTML = `🚶 ${distanceMeters}m`;
                } else {
                    distanceElement.textContent = `${distanceMeters}m`;
                }
                
                const cuisineElement = document.createElement('div');
                cuisineElement.className = 'price-level';
                cuisineElement.textContent = getRealCuisineType(restaurant);
                
                infoRow.appendChild(distanceElement);
                infoRow.appendChild(cuisineElement);
                restaurantCard.appendChild(infoRow);
                
                fragment.appendChild(restaurantCard);
            });
            
            restaurantsGrid.innerHTML = '';
            restaurantsGrid.appendChild(fragment);
        }

        function getCompleteAddress(restaurant) {
            const tags = restaurant.tags || {};
            
            let addressParts = [];
            
            if (tags['addr:housenumber']) {
                addressParts.push(tags['addr:housenumber']);
            }
            if (tags['addr:street']) {
                addressParts.push(tags['addr:street']);
            }
            
            if (addressParts.length > 0) {
                return addressParts.join(' ');
            }
            
            if (tags['address']) {
                return tags['address'];
            }
            if (tags['addr:full']) {
                return tags['addr:full'];
            }
            
            return "Adresse non précisée";
        }

        function getRealCuisineType(restaurant) {
            const tags = restaurant.tags || {};
            
            if (tags.cuisine) {
                const cuisines = {
                    'pizza': '🍕 Italien',
                    'burger': '🍔 Fast-food',
                    'chinese': '🥡 Chinois',
                    'indian': '🍛 Indien',
                    'japanese': '🍣 Japonais',
                    'french': '🥖 Français',
                    'italian': '🍝 Italien',
                    'mexican': '🌯 Mexicain',
                    'thai': '🍜 Thaï',
                    'vietnamese': '🍜 Vietnamien',
                    'lebanese': '🥙 Libanais',
                    'greek': '🥙 Grec',
                    'turkish': '🥙 Turc',
                    'spanish': '🥘 Espagnol'
                };
                return cuisines[tags.cuisine] || tags.cuisine;
            }
            
            const name = (tags.name || '').toLowerCase();
            if (name.includes('pizza') || name.includes('pasta')) return '🍕 Italien';
            if (name.includes('burger')) return '🍔 Fast-food';
            if (name.includes('sushi')) return '🍣 Japonais';
            if (name.includes('china') || name.includes('wok')) return '🥡 Chinois';
            if (name.includes('india') || name.includes('curry')) return '🍛 Indien';
            if (name.includes('bistro') || name.includes('brasserie')) return '🥖 Français';
            if (name.includes('mexic')) return '🌯 Mexicain';
            if (name.includes('cafe') || name.includes('coffee')) return '☕ Café';
            if (name.includes('pub')) return '🍺 Pub';
            if (name.includes('bar')) return '🍸 Bar';
            
            if (tags.amenity === 'fast_food') return '🍔 Fast-food';
            if (tags.amenity === 'cafe') return '☕ Café';
            if (tags.amenity === 'bar') return '🍸 Bar';
            if (tags.amenity === 'pub') return '🍺 Pub';
            
            return '🍽️ Restaurant';
        }

        function displayFallbackRestaurants() {
            const fallbackRestaurants = [
                {
                    name: "Bistro Local",
                    address: "Rue principale",
                    distance: 50,
                    type: "🥖 Français"
                },
                {
                    name: "Café Central", 
                    address: "Grande rue",
                    distance: 120,
                    type: "☕ Café"
                },
                {
                    name: "Pizza Italia",
                    address: "Place du marché",
                    distance: 200,
                    type: "🍕 Italien"
                },
                {
                    name: "Burger House",
                    address: "Avenue centrale",
                    distance: 180,
                    type: "🍔 Fast-food"
                }
            ];

            proximityTitle.style.display = 'block';
            restaurantLocationInfo.textContent = "📍 Restaurants populaires";
            
            const fragment = document.createDocumentFragment();
            
            fallbackRestaurants.forEach(restaurant => {
                const restaurantCard = document.createElement('div');
                restaurantCard.className = 'restaurant-card';
                
                const header = document.createElement('div');
                header.className = 'restaurant-header';
                
                const nameElement = document.createElement('div');
                nameElement.className = 'restaurant-name';
                nameElement.textContent = restaurant.name;
                
                const addressElement = document.createElement('div');
                addressElement.className = 'restaurant-address';
                addressElement.textContent = restaurant.address;
                
                header.appendChild(nameElement);
                header.appendChild(addressElement);
                restaurantCard.appendChild(header);
                
                const infoRow = document.createElement('div');
                infoRow.className = 'restaurant-info-row';
                
                const distanceElement = document.createElement('div');
                distanceElement.className = 'bus-distance';
                distanceElement.style.color = '#4ecdc4';
                distanceElement.innerHTML = `🚶 ${restaurant.distance}m`;
                
                const typeElement = document.createElement('div');
                typeElement.className = 'price-level';
                typeElement.textContent = restaurant.type;
                
                infoRow.appendChild(distanceElement);
                infoRow.appendChild(typeElement);
                restaurantCard.appendChild(infoRow);
                
                fragment.appendChild(restaurantCard);
            });
            
            restaurantsGrid.innerHTML = '';
            restaurantsGrid.appendChild(fragment);
        }

        // Football
        async function fetchFootballData() {
            showFootballLoadingAnimation();
            
            try {
                const ligue1Teams = ['133602', '133738'];
                const laligaTeams = ['133714', '133739'];

                const ligue1Promises = ligue1Teams.map(teamId => 
                    fetch(`https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`)
                        .then(response => response.json())
                        .catch(error => null)
                );

                const laligaPromises = laligaTeams.map(teamId => 
                    fetch(`https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`)
                        .then(response => response.json())
                        .catch(error => null)
                );

                const [ligue1Data1, ligue1Data2] = await Promise.all(ligue1Promises);
                const [laligaData1, laligaData2] = await Promise.all(laligaPromises);

                const ligue1Matches = [];
                const laligaMatches = [];

                if (ligue1Data1 && ligue1Data1.results) ligue1Matches.push(ligue1Data1.results[0]);
                if (ligue1Data2 && ligue1Data2.results) ligue1Matches.push(ligue1Data2.results[0]);
                
                if (laligaData1 && laligaData1.results) laligaMatches.push(laligaData1.results[0]);
                if (laligaData2 && laligaData2.results) laligaMatches.push(laligaData2.results[0]);

                displayFootballMatches(ligue1Matches, laligaMatches);
                
            } catch (error) {
                console.error('Erreur API football:', error);
                displayErrorFootballData();
            }
        }

        function displayFootballMatches(ligue1Matches, laligaMatches) {
            let ligue1HTML = '';
            if (ligue1Matches.length > 0) {
                ligue1Matches.forEach(match => {
                    if (match) {
                        ligue1HTML += `
                            <div class="match-container">
                                <div class="match-date">${formatDate(match.dateEvent)}</div>
                                <div class="match-teams">
                                    <div class="team">
                                        <div class="team-logo">
                                            <img src="${match.strHomeTeamBadge}" alt="${match.strHomeTeam}" onerror="this.style.display='none'">
                                        </div>
                                        <div class="team-name">${match.strHomeTeam}</div>
                                    </div>
                                    <div class="match-score">${match.intHomeScore || '0'} - ${match.intAwayScore || '0'}</div>
                                    <div class="team">
                                        <div class="team-logo">
                                            <img src="${match.strAwayTeamBadge}" alt="${match.strAwayTeam}" onerror="this.style.display='none'">
                                        </div>
                                        <div class="team-name">${match.strAwayTeam}</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                });
            }
            
            if (!ligue1HTML) {
                ligue1HTML = '<div class="error-message">Aucun match récent</div>';
            }
            document.getElementById('ligue1Matches').innerHTML = ligue1HTML;

            let laligaHTML = '';
            if (laligaMatches.length > 0) {
                laligaMatches.forEach(match => {
                    if (match) {
                        laligaHTML += `
                            <div class="match-container">
                                <div class="match-date">${formatDate(match.dateEvent)}</div>
                                <div class="match-teams">
                                    <div class="team">
                                        <div class="team-logo">
                                            <img src="${match.strHomeTeamBadge}" alt="${match.strHomeTeam}" onerror="this.style.display='none'">
                                        </div>
                                        <div class="team-name">${match.strHomeTeam}</div>
                                    </div>
                                    <div class="match-score">${match.intHomeScore || '0'} - ${match.intAwayScore || '0'}</div>
                                    <div class="team">
                                        <div class="team-logo">
                                            <img src="${match.strAwayTeamBadge}" alt="${match.strAwayTeam}" onerror="this.style.display='none'">
                                        </div>
                                        <div class="team-name">${match.strAwayTeam}</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                });
            }
            
            if (!laligaHTML) {
                laligaHTML = '<div class="error-message">Aucun match récent</div>';
            }
            document.getElementById('laligaMatches').innerHTML = laligaHTML;
        }

        function displayErrorFootballData() {
            ligue1Matches.innerHTML = '<div class="error-message">Error API</div>';
            laligaMatches.innerHTML = '<div class="error-message">Error API</div>';
        }

        function formatDate(dateString) {
            const options = { day: 'numeric', month: 'short' };
            return new Date(dateString).toLocaleDateString('fr-FR', options);
        }

        function showFootballLoadingAnimation() {
            ligue1Matches.innerHTML = `
                <div class="centered-loading">
                    <div class="wrapper">
                        <div class="circle"></div>
                        <div class="circle"></div>
                        <div class="circle"></div>
                        <div class="shadow"></div>
                        <div class="shadow"></div>
                        <div class="shadow"></div>
                    </div>
                </div>
            `;
            laligaMatches.innerHTML = '';
        }

        // Fonctions utilitaires
        function calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }

        async function getUserLocation() {
            return new Promise((resolve) => {
                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            userLocation = {
                                lat: position.coords.latitude,
                                lon: position.coords.longitude
                            };
                            userCity = await getCityName(userLocation.lat, userLocation.lon);
                            resolve();
                        },
                        async (error) => {
                            userLocation = { lat: 51.4907, lon: -0.1744 };
                            userCity = "South Kensington";
                            resolve();
                        }
                    );
                } else {
                    userLocation = { lat: 51.4907, lon: -0.1744 };
                    userCity = "South Kensington";
                    resolve();
                }
            });
        }

        async function getCityName(lat, lon) {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
                const data = await response.json();
                return data.address.city || data.address.town || data.address.village || data.address.suburb || 'votre zone';
            } catch (error) {
                return 'votre zone';
            }
        }

        function showBusLoadingAnimation(type = 'ExpressT') {
            if (type === 'ExpressT') {
                dynamicBusGrid.innerHTML = `
                    <div class="centered-loading"  style="grid-column: 1 / -1;">
                        <div class="wrapper">
                            <div class="circle"></div>
                            <div class="circle"></div>
                            <div class="circle"></div>
                            <div class="shadow"></div>
                            <div class="shadow"></div>
                            <div class="shadow"></div>
                        </div>
                    </div>
                `;
            }
        }

        function showRestaurantLoadingAnimation() {
            restaurantsGrid.innerHTML = `
                <div class="centered-loading" >
                    <div class="wrapper" style="left:16px; top: 100px;">
                        <div class="circle"></div>
                        <div class="circle"></div>
                        <div class="circle"></div>
                        <div class="shadow"></div>
                        <div class="shadow"></div>
                        <div class="shadow"></div>
                    </div>
                </div>
            `;
        }

        // Initialisation
        window.addEventListener("load", () => {
            fetchRealTimeBusData();
        });

        // Clic sur le document pour revenir à la taille normale
        document.addEventListener('click', function() {
            if (isExpanded || mainButton.classList.contains('expanded-burger') || mainButton.classList.contains('expanded-trophy') || mainButton.classList.contains('expanded-news')) {
                closeMenu();
            }
        });

        // Empêcher la fermeture quand on clique sur les sous-boutons
        subButtons.addEventListener('click', function(event) {
            event.stopPropagation();
            event.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            setTimeout(() => {
                event.target.style.backgroundColor = '';
            }, 300);
        });
        // Variables pour gérer l'état de verrouillage
let isLocked = false;
let lockedContainer = null;

// Fonction pour verrouiller/déverrouiller
// Fonction pour verrouiller/déverrouiller
function toggleLock(container) {
    if (isLocked && lockedContainer === container) {
        // Déverrouiller - on permet la fermeture
        isLocked = false;
        lockedContainer = null;
        resetButtonAppearance(container);
        console.log('Déverrouillé');
    } else {
        // Verrouiller - on empêche la fermeture
        isLocked = true;
        lockedContainer = container;
        applyLockedAppearance(container);
        console.log('Verrouillé');
    }
}

// Appliquer l'apparence verrouillée
function applyLockedAppearance(container) {
    const dButton = container.querySelector('.d-button');
    if (dButton) {
        dButton.style.backgroundColor = 'rgba(17, 18, 22, 0.3)';
        dButton.style.color = 'rgba(255, 255, 255, 0.7)';
        dButton.style.border = '2px solid rgba(255, 255, 255, 0.2)';
        dButton.textContent = '❄️'; // Optionnel: changer le texte pour un cadenas
    }
}

// Réinitialiser l'apparence du bouton
function resetButtonAppearance(container) {
    const dButton = container.querySelector('.d-button');
    if (dButton) {
        dButton.style.backgroundColor = '';
        dButton.style.color = '';
        dButton.style.border = '';
        dButton.textContent = '❄️';
    }
}

// Modifier la fonction closeMenu pour vérifier le verrouillage

function closeMenu() {
    if (isLocked) {
        return; // Ne pas fermer si verrouillé
    }
    
    subButtons.classList.remove('visible');
    mainButton.classList.remove('expanded');
    mainButton.classList.remove('expanded-burger');
    mainButton.classList.remove('expanded-trophy');
    mainButton.classList.remove('expanded-news');
    isExpanded = false;
    subButtons.style.display = 'flex';
    restaurantContainer.style.display = 'none';
    f1Container.style.display = 'none';
    transportContainer.style.display = 'none';
    trophyContainer.style.display = 'none';
    newsContainer.style.display = 'none';
    proximityTitle.style.display = 'none';
    restaurantLocationInfo.style.display = 'none';
    transportLocationInfo.style.display = 'none';
    distanceWarning.style.display = 'none';
    
    if (transportRefreshInterval) {
        clearInterval(transportRefreshInterval);
        transportRefreshInterval = null;
    }
    
    clearTimeout(animationTimeout);
}
// Modifier les écouteurs d'événements des boutons D existants
restaurantDButton.addEventListener('click', function(event) {
    event.stopPropagation();
    toggleLock(restaurantContainer);
});

f1DButton.addEventListener('click', function(event) {
    event.stopPropagation();
    toggleLock(f1Container);
});



trophyDButton.addEventListener('click', function(event) {
    event.stopPropagation();
    toggleLock(trophyContainer);
});

newsDButton.addEventListener('click', function(event) {
    event.stopPropagation();
    toggleLock(newsContainer);
});
