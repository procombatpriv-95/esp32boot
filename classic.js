        const actubarContainer = document.getElementById('actubarContainer');
        const currentTime = document.getElementById('currentTime');
        const currentDate = document.getElementById('currentDate');
        const timezoneInfo = document.getElementById('timezoneInfo');
        const temperatureClose = document.getElementById('temperatureClose');
        const temperature = document.getElementById('temperature');
        const weatherDetails = document.getElementById('weatherDetails');
        const locationInfo = document.getElementById('locationInfo');
        const newsContainer = document.getElementById('newsContainer');
        
        // Variables pour la localisation
        let userLat = null;
        let userLon = null;
        let userCity = "Localisation...";
        let userTimezone = "Fuseau horaire local";
        
        // Animation du actubar
        actubarContainer.addEventListener('click', function(e) {
            if (e.target !== temperatureClose && !temperatureClose.contains(e.target)) {
                this.classList.add('expanded');
                if (!window.weatherLoaded) {
                    getLocationAndWeather();
                    window.weatherLoaded = true;
                }
                if (!window.newsLoaded) {
                    getNewsData();
                    window.newsLoaded = true;
                }
            }
        });
        
        // Fermer en cliquant sur la température
        temperatureClose.addEventListener('click', function(e) {
            e.stopPropagation();
            actubarContainer.classList.remove('expanded');
        });
        
        // Fermer en cliquant n'importe où ailleurs
        document.addEventListener('click', function(e) {
            if (actubarContainer.classList.contains('expanded') && !actubarContainer.contains(e.target)) {
                actubarContainer.classList.remove('expanded');
            }
        });
        
        // Mise à jour de l'heure et de la date AVEC FUSEAU HORAIRE
        function updateDateTime() {
            const now = new Date();
            
            // Format de l'heure avec fuseau horaire local
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            currentTime.textContent = `${hours}:${minutes}:${seconds}`;
            
            // Format de la date xx/xx/xxxx
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            currentDate.textContent = `${day}/${month}/${year}`;
            
            // Afficher le fuseau horaire si on a la localisation
            if (userTimezone && userTimezone !== "Fuseau horaire local") {
                timezoneInfo.textContent = userTimezone;
            }
        }
        
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        // Obtenir la localisation de l'utilisateur
        function getLocationAndWeather() {
            locationInfo.textContent = "Obtention de la localisation...";
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        userLat = position.coords.latitude;
                        userLon = position.coords.longitude;
                        await getCityName(userLat, userLon);
                        getWeatherData(userLat, userLon);
                    },
                    (error) => {
                        console.error("Erreur de géolocalisation:", error);
                        userLat = 51.509865;
                        userLon = -0.118092;
                        userCity = "Londres";
                        userTimezone = "GMT+0 (Londres)";
                        locationInfo.textContent = "Londres (par défaut)";
                        timezoneInfo.textContent = userTimezone;
                        getWeatherData(userLat, userLon);
                    }
                );
            } else {
                userLat = 51.509865;
                userLon = -0.118092;
                userCity = "Londres";
                userTimezone = "GMT+0 (Londres)";
                locationInfo.textContent = "Londres (par défaut)";
                timezoneInfo.textContent = userTimezone;
                getWeatherData(userLat, userLon);
            }
        }
        
        // Obtenir le nom de la ville et le fuseau horaire
        async function getCityName(lat, lon) {
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`);
                const data = await response.json();
                userCity = data.city || data.locality || "Position actuelle";
                locationInfo.textContent = userCity;
                
                // Obtenir le fuseau horaire
                await getTimezone(lat, lon);
            } catch (error) {
                console.error("Erreur nom de ville:", error);
                locationInfo.textContent = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
            }
        }
        
        // Obtenir le fuseau horaire
        async function getTimezone(lat, lon) {
            try {
                const response = await fetch(`https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_API_KEY&format=json&by=position&lat=${lat}&lng=${lon}`);
                const data = await response.json();
                if (data.status === "OK") {
                    userTimezone = `${data.abbreviation} (${data.zoneName.split('/').pop()})`;
                    timezoneInfo.textContent = userTimezone;
                }
            } catch (error) {
                // Fallback: utiliser le fuseau horaire du navigateur
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const offset = -new Date().getTimezoneOffset() / 60;
                userTimezone = `GMT${offset >= 0 ? '+' : ''}${offset} (${timezone.split('/').pop()})`;
                timezoneInfo.textContent = userTimezone;
            }
        }
        
        // Obtenir les données météo via l'API MET Norway
        async function getWeatherData(lat, lon) {
            try {
                weatherDetails.textContent = "Chargement météo...";
                
                const response = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`);
                
                if (!response.ok) {
                    throw new Error('Erreur de chargement des données météo');
                }
                
                const data = await response.json();
                const currentWeather = data.properties.timeseries[0].data.instant.details;
                const nextHour = data.properties.timeseries[1].data;
                
                const currentTemp = Math.round(currentWeather.air_temperature);
                temperature.textContent = `${currentTemp}°C`;
                
                if (nextHour.next_1_hours) {
                    const weatherDesc = nextHour.next_1_hours.summary.symbol_code;
                    weatherDetails.textContent = formatWeatherDescription(weatherDesc);
                } else {
                    weatherDetails.textContent = "Données limitées";
                }
                
            } catch (error) {
                console.error('Erreur météo:', error);
                temperature.textContent = `${Math.floor(Math.random() * 15) + 10}°C`;
                weatherDetails.textContent = "Données météo indisponibles";
            }
        }
        
        // Formater la description météo
        function formatWeatherDescription(code) {
            const descriptions = {
                'clearsky': 'Ciel dégagé',
                'fair': 'Beau temps',
                'partlycloudy': 'Partiellement nuageux',
                'cloudy': 'Nuageux',
                'lightrain': 'Pluie légère',
                'rain': 'Pluie',
                'heavyrain': 'Forte pluie',
                'lightsnow': 'Neige légère',
                'snow': 'Neige',
                'heavysnow': 'Forte neige',
                'fog': 'Brouillard',
                'lightrainshowers': 'Averses légères',
                'rainshowers': 'Averses',
                'heavyrainshowers': 'Forte averses'
            };
            
            const baseCode = code.replace(/_day|_night|_polartwilight/g, '');
            return descriptions[baseCode] || code;
        }
        
        // Obtenir les actualités via GNews API avec proxy CORS
        async function getNewsData() {
            try {
                const apiKey = 'b97899dfc31d70bf41c43c5b865654e6';
                const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
                const frUrl = `https://gnews.io/api/v4/top-headlines?country=fr&max=3&token=${apiKey}`;
                const gbUrl = `https://gnews.io/api/v4/top-headlines?country=gb&max=2&token=${apiKey}`;
                
                const [responseFr, responseGb] = await Promise.all([
                    fetch(proxyUrl + frUrl),
                    fetch(proxyUrl + gbUrl)
                ]);
                
                if (!responseFr.ok || !responseGb.ok) {
                    throw new Error('Erreur de chargement des actualités');
                }
                
                const dataFr = await responseFr.json();
                const dataGb = await responseGb.json();
                const allArticles = [...(dataFr.articles || []), ...(dataGb.articles || [])];
                
                if (allArticles.length === 0) {
                    throw new Error('Aucun article trouvé');
                }
                
                displayNews(allArticles);
                
            } catch (error) {
                console.error('Erreur actualités:', error);
                displayDemoNews();
            }
        }
        
        function displayDemoNews() {
            const demoNews = [
                {
                    title: "France : Réforme des retraites adoptée",
                    description: "Le Parlement a finalement adopté la réforme controversée des retraites après des semaines de débats.",
                    image: "https://images.unsplash.com/photo-1593115057322-e94b77572f20?w=70&h=70&fit=crop"
                },
                {
                    title: "Londres : Sommet économique international",
                    description: "Les leaders mondiaux se réunissent à Londres pour discuter de la stabilité économique mondiale.",
                    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=70&h=70&fit=crop"
                },
                {
                    title: "Tech : Nouvelle innovation en intelligence artificielle",
                    description: "Une startup française annonce une percée majeure dans le domaine de l'IA générative.",
                    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=70&h=70&fit=crop"
                },
                {
                    title: "Culture : Festival de Cannes 2024",
                    description: "Préparatifs en cours pour le célèbre festival de cinéma sur la Croisette.",
                    image: "https://images.unsplash.com/photo-1598894595350-70d67c1d8e8b?w=70&h=70&fit=crop"
                },
                {
                    title: "Sports : Coupe du Monde de Rugby",
                    description: "Les équipes française et anglaise se préparent pour le tournoi international.",
                    image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=70&h=70&fit=crop"
                }
            ];
            displayNews(demoNews);
        }
        
        function displayNews(articles) {
            newsContainer.innerHTML = '';
            
            articles.forEach((article) => {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                
                newsItem.innerHTML = `
                    <div class="news-image">
                        <img src="${article.image}" alt="${article.title}" 
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/70x70/1e3c72/ffffff?text=📰'">
                    </div>
                    <div class="news-content">
                        <div class="news-title-item">${article.title}</div>
                        <div class="news-description">${article.description}</div>
                    </div>
                `;
                
                newsContainer.appendChild(newsItem);
            });
        }
        
        // Charger les données au chargement de la page
        window.addEventListener('DOMContentLoaded', () => {
            getLocationAndWeather();
            getNewsData();
        });
actubarContainer.addEventListener('click', function(e) {
    if (e.target !== temperatureClose && !temperatureClose.contains(e.target)) {
        this.classList.add('expanded');
        
        if (!window.weatherLoaded) {
            getLocationAndWeather();
            window.weatherLoaded = true;
        }
        if (!window.newsLoaded) {
            getNewsData();
            window.newsLoaded = true;
        }
        // Les notifications se chargeront automatiquement via votre code existant
    }
});
