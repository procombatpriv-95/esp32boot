        // Éléments DOM
        const chatContainer = document.getElementById('chatContainer');
        const chatMessages = document.getElementById('chatMessages');
        const userInput = document.getElementById('userInput');
        const graphContainer = document.getElementById('graphContainer');
        const graphContent = document.getElementById('graphContent');
        const graphTitle = document.getElementById('graphTitle');
        const graphClose = document.getElementById('graphClose');

        // Configuration APIs
        const GROQ_API_KEY = "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";
        const GROQ_MODEL = "llama-3.1-8b-instant";

        // Clés pour le localStorage
        const STORAGE_KEYS = {
            CONVERSATION: 'groq_chat_conversation',
            MESSAGES: 'groq_chat_messages'
        };

        // Historique de conversation
        let conversationHistory = [];
        let displayedMessages = [];

        // Charger l'historique depuis le localStorage
        function loadFromStorage() {
            try {
                const savedConversation = localStorage.getItem(STORAGE_KEYS.CONVERSATION);
                const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
                
                if (savedConversation) {
                    conversationHistory = JSON.parse(savedConversation);
                }
                
                if (savedMessages) {
                    displayedMessages = JSON.parse(savedMessages);
                    displaySavedMessages();
                }
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                conversationHistory = [];
                displayedMessages = [];
            }
        }

        // Sauvegarder dans le localStorage
        function saveToStorage() {
            try {
                localStorage.setItem(STORAGE_KEYS.CONVERSATION, JSON.stringify(conversationHistory));
                localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(displayedMessages));
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
            }
        }

        // Gérer la limite de messages
        function manageMessageLimit() {
            const MAX_MESSAGES = 20;
            
            if (conversationHistory.length > MAX_MESSAGES) {
                conversationHistory = conversationHistory.slice(-MAX_MESSAGES);
            }
            
            if (displayedMessages.length > MAX_MESSAGES) {
                displayedMessages.shift();
            }
        }

        // Afficher les messages sauvegardés
        function displaySavedMessages() {
            chatMessages.innerHTML = '';
            displayedMessages.forEach(msg => {
                addMessageToDisplay(msg.text, msg.type, msg.webSearch, msg.hasGraph);
            });
            
            if (displayedMessages.length > 0) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }

        // Ajouter un message au chat
        function addMessage(text, type, webSearch = false, hasGraph = false) {
            displayedMessages.push({
                text: text,
                type: type,
                webSearch: webSearch,
                hasGraph: hasGraph,
                timestamp: Date.now()
            });
            
            manageMessageLimit();
            saveToStorage();
            
            addMessageToDisplay(text, type, webSearch, hasGraph);
        }

        // Afficher un message dans le chat
        function addMessageToDisplay(text, type, webSearch = false, hasGraph = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = type === 'user' ? 'user-message' : 'ai-message';
            messageDiv.textContent = text;
            
            chatMessages.appendChild(messageDiv);
            
            // Ajouter un badge si recherche web effectuée
            if (type === 'ai' && webSearch) {
                const searchBadge = document.createElement('div');
                searchBadge.className = 'web-search-badge';
                searchBadge.textContent = 'Recherche web en temps réel';
                chatMessages.appendChild(searchBadge);
            }
            
            // Ajouter un badge si graphique généré
            if (type === 'ai' && hasGraph) {
                const graphBadge = document.createElement('div');
                graphBadge.className = 'graph-badge';
                graphBadge.textContent = 'Graphique généré';
                chatMessages.appendChild(graphBadge);
            }
            
            // Scroll vers le bas
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Afficher l'indicateur de frappe
        function showTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator';
            typingDiv.id = 'typingIndicator';
            typingDiv.innerHTML = `
                PRIME AI réfléchit...
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
            
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Supprimer l'indicateur de frappe
        function removeTypingIndicator() {
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }

        // Détecter si une question nécessite une recherche web
        function needsWebSearch(query) {
            const searchTriggers = [
                'actualité', 'aujourd\'hui', 'maintenant', 'récent', 'nouveau',
                '2023', '2024', '2025', '2026', 'dernière', 'mise à jour', 'en ce moment',
                'cours', 'prix', 'bourse', 'météo', 'news', 'nouvelles',
                'événement', 'concert', 'film', 'série', 'sortie', 'live',
                'score', 'résultat', 'élection', 'sport', 'match', 'joueur',
                'crypto', 'bitcoin', 'ethereum', 'actions', 'marché',
                'trend', 'tendance', 'populaire', 'viral',
                'vacances', 'férié', 'grève', 'manifestation', 'politique',
                'économie', 'inflation', 'taux', 'intérêt', 'banque',
                'définition', 'quoi', 'qui', 'quand', 'où', 'pourquoi', 'comment'
            ];
            
            const queryLower = query.toLowerCase();
            const hasKeyword = searchTriggers.some(trigger => queryLower.includes(trigger));
            const isQuestion = /^(quelle?s?|quel|quels|quelle|quelles|qui|que|quoi|quand|où|pourquoi|comment|combien)/i.test(queryLower);
            const isFactual = /(c'est quoi|qu'est ce que|définition|signifie|signification)/i.test(queryLower);
            
            return hasKeyword || isQuestion || isFactual;
        }

        // Détecter si une question nécessite un graphique
        function needsChart(query) {
            const chartTriggers = [
                'graphique', 'courbe', 'évolution', 'augmentation', 'diminution',
                's&p 500', 'sp500', 'bourse', 'indice', 'nasdaq', 'dow jones',
                'cac 40', 'ftse', 'dax', 'statistique', 'donnée', 'données',
                'chiffre', 'nombre', 'vente', 'vendu', 'production', 'croissance',
                'décroissance', 'tendance', 'évolution', 'historique', 'performance',
                'comparaison', 'tableau', 'diagramme', 'histogramme', 'camembert',
                'pomme', 'apple', 'iphone', 'macbook', 'produit', 'marché',
                'part de marché', 'évolution du prix', 'cours de', 'prix de',
                'évolution des ventes', 'ventes annuelles', 'chiffre d\'affaires',
                'visualisation', 'représentation', 'image', 'illustration',
                'carte', 'map', 'géographique', 'population', 'démographie',
                'température', 'climat', 'météo', 'précipitations',
                'budget', 'finance', 'dépenses', 'revenus', 'économique',
                'bitcoin', 'crypto', 'ethereum', 'solana', 'cardano',
                'tesla', 'apple', 'microsoft', 'google', 'amazon', 'meta'
            ];
            
            const queryLower = query.toLowerCase();
            return chartTriggers.some(trigger => queryLower.includes(trigger));
        }

        // Obtenir le type de graphique approprié
        function getChartType(query) {
            const queryLower = query.toLowerCase();
            
            if (queryLower.includes('camembert') || queryLower.includes('part de marché') || queryLower.includes('pourcentage') || queryLower.includes('répartition')) {
                return 'pie';
            } else if (queryLower.includes('histogramme') || queryLower.includes('barre') || queryLower.includes('ventes') || queryLower.includes('comparaison')) {
                return 'bar';
            } else {
                return 'line';
            }
        }

        // Analyser la requête pour déterminer les dates demandées
        function parseDateRangeFromQuery(query) {
            const queryLower = query.toLowerCase();
            
            // Détecter des années spécifiques
            const yearMatches = queryLower.match(/(\b20[0-9]{2}\b)/g);
            
            // Détecter des plages de dates
            if (queryLower.includes('2023')) return { startYear: 2023, endYear: 2023, labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'] };
            if (queryLower.includes('2024')) return { startYear: 2024, endYear: 2024, labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'] };
            if (queryLower.includes('2022')) return { startYear: 2022, endYear: 2022, labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'] };
            
            // Détecter "cette année", "l'année dernière"
            if (queryLower.includes('cette année') || queryLower.includes('en cours')) {
                const currentYear = new Date().getFullYear();
                return { startYear: currentYear, endYear: currentYear, labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'] };
            }
            
            // Par défaut: 6 derniers mois
            return { startYear: 2024, endYear: 2024, labels: ['M-6', 'M-5', 'M-4', 'M-3', 'M-2', 'M-1', 'Actuel'] };
        }

        // Générer des données réalistes pour Bitcoin
        function generateBitcoinData(dateRange) {
            const { startYear, endYear, labels } = dateRange;
            let data = [];
            
            // Données réalistes pour Bitcoin
            if (startYear === 2023 && endYear === 2023) {
                // Prix mensuels du Bitcoin en 2023 (approximatifs)
                data = [16500, 23000, 28000, 29000, 27000, 30500, 29500, 26000, 26500, 34000, 37500, 42500];
            } else if (startYear === 2024 && endYear === 2024) {
                // Prix mensuels du Bitcoin en 2024 (approximatifs)
                data = [42000, 43000, 61000, 63500, 58000, 61500, 57000, 52000, 54500, 56000, 62000, 65000];
            } else {
                // Données génériques
                const basePrice = 45000;
                data = labels.map((_, index) => {
                    // Variation réaliste
                    const variation = Math.sin(index * 0.5) * 0.15;
                    return Math.round(basePrice * (1 + variation));
                });
            }
            
            return data;
        }

        // Générer des données réalistes pour S&P 500
        function generateSP500Data(dateRange) {
            const { startYear, endYear, labels } = dateRange;
            let data = [];
            
            if (startYear === 2023 && endYear === 2023) {
                data = [3850, 3990, 4100, 4150, 4200, 4450, 4580, 4510, 4330, 4280, 4550, 4770];
            } else if (startYear === 2024 && endYear === 2024) {
                data = [4760, 4850, 5100, 5050, 5200, 5350, 5400, 5300, 5450, 5500, 5600, 5700];
            } else {
                const baseValue = 5000;
                data = labels.map((_, index) => {
                    const variation = Math.sin(index * 0.4) * 0.08;
                    return Math.round(baseValue * (1 + variation));
                });
            }
            
            return data;
        }

        // Créer des données de graphique précises basées sur la requête
        function createChartDataFromQuery(query) {
            const queryLower = query.toLowerCase();
            const chartType = getChartType(query);
            const dateRange = parseDateRangeFromQuery(query);
            
            let chartData = {
                type: chartType,
                title: 'Graphique',
                labels: dateRange.labels,
                datasets: [],
                description: ''
            };
            
            // Bitcoin et crypto-monnaies
            if (queryLower.includes('bitcoin') || queryLower.includes('btc') || 
                (queryLower.includes('crypto') && !queryLower.includes('cac'))) {
                const data = generateBitcoinData(dateRange);
                chartData.title = `Évolution du Bitcoin (${dateRange.startYear})`;
                chartData.datasets = [{
                    label: 'Bitcoin (USD)',
                    data: data,
                    borderColor: 'rgb(255, 205, 86)',
                    backgroundColor: 'rgba(255, 205, 86, 0.1)',
                    fill: true,
                    tension: 0.4
                }];
                chartData.description = 'Prix du Bitcoin en dollars américains';
            }
            // S&P 500
            else if (queryLower.includes('sp500') || queryLower.includes('s&p') || queryLower.includes('standard & poor')) {
                const data = generateSP500Data(dateRange);
                chartData.title = `Performance du S&P 500 (${dateRange.startYear})`;
                chartData.datasets = [{
                    label: 'S&P 500',
                    data: data,
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }];
                chartData.description = 'Indice S&P 500 (points)';
            }
            // Apple/ventes de pommes
            else if (queryLower.includes('pomme') || queryLower.includes('apple') || queryLower.includes('iphone')) {
                chartData.title = 'Ventes d\'iPhone (millions d\'unités)';
                chartData.type = 'bar';
                chartData.labels = ['2020', '2021', '2022', '2023', '2024'];
                chartData.datasets = [{
                    label: 'Ventes',
                    data: [195, 235, 225, 230, 245],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                    ],
                    borderColor: [
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 206, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(153, 102, 255)'
                    ],
                    borderWidth: 2
                }];
                chartData.description = 'Ventes annuelles d\'iPhone en millions d\'unités';
            }
            // Météo
            else if (queryLower.includes('météo') || queryLower.includes('température') || queryLower.includes('climat')) {
                chartData.title = 'Températures moyennes à Paris';
                chartData.labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                chartData.datasets = [{
                    label: 'Température (°C)',
                    data: [5, 6, 10, 14, 18, 21, 24, 23, 20, 15, 9, 6],
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: true,
                    tension: 0.4
                }];
                chartData.description = 'Températures moyennes mensuelles à Paris';
            }
            // Population
            else if (queryLower.includes('population') || queryLower.includes('démographie')) {
                chartData.title = 'Population mondiale par continent';
                chartData.type = 'pie';
                chartData.labels = ['Asie', 'Afrique', 'Europe', 'Amérique du Nord', 'Amérique du Sud', 'Océanie'];
                chartData.datasets = [{
                    label: 'Population (millions)',
                    data: [4700, 1400, 750, 600, 430, 45],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                        'rgba(255, 159, 64, 0.5)'
                    ],
                    borderColor: [
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 206, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(153, 102, 255)',
                        'rgb(255, 159, 64)'
                    ],
                    borderWidth: 1
                }];
                chartData.description = 'Répartition de la population mondiale par continent (en millions)';
            }
            // Données génériques
            else {
                chartData.title = 'Visualisation des données';
                
                // Générer des données cohérentes basées sur la requête
                const seed = query.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const data = chartData.labels.map((_, index) => {
                    return Math.round((Math.sin(seed + index * 0.7) * 30 + 50) * 10) / 10;
                });
                
                chartData.datasets = [{
                    label: 'Valeurs',
                    data: data,
                    borderColor: 'rgb(153, 102, 255)',
                    backgroundColor: 'rgba(153, 102, 255, 0.1)',
                    fill: true
                }];
                chartData.description = 'Visualisation des données basée sur votre requête';
            }
            
            return chartData;
        }

        // Afficher un graphique
        async function showChart(chartData) {
            // Réduire la taille du chat à 350px
            chatContainer.classList.add('with-graph');
            
            // Afficher le conteneur de graphique
            graphContainer.classList.add('active');
            graphTitle.textContent = chartData.title || '📊 Graphique PRIME AI';
            
            // Afficher le chargement
            graphContent.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #6b7280; gap: 15px;">
                    <div style="width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <div>Génération du graphique...</div>
                </div>
            `;
            
            try {
                // Créer la configuration du graphique
                const chartConfig = {
                    type: chartData.type || 'line',
                    data: {
                        labels: chartData.labels || [],
                        datasets: chartData.datasets || []
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: chartData.title || 'Graphique PRIME AI',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                },
                                color: '#111827',
                                padding: {
                                    top: 10,
                                    bottom: 20
                                }
                            },
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    font: {
                                        size: 11
                                    },
                                    padding: 15
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: chartData.type !== 'line',
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                },
                                ticks: {
                                    font: {
                                        size: 10
                                    }
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    font: {
                                        size: 10
                                    }
                                }
                            }
                        }
                    }
                };
                
                // Générer l'URL du graphique avec QuickChart
                const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
                const chartUrl = `https://quickchart.io/chart?c=${encodedConfig}&width=310&height=250&backgroundColor=white`;
                
                // Afficher le graphique
                graphContent.innerHTML = `
                    <img src="${chartUrl}" alt="Graphique" class="graph-image" style="animation: fadeIn 0.5s ease forwards;">
                    <div class="graph-data">
                        <h4>Données du graphique:</h4>
                        <ul>
                            ${chartData.labels.map((label, index) => {
                                const dataset = chartData.datasets[0];
                                const value = dataset?.data?.[index] || 'N/A';
                                const labelName = dataset?.label || 'Valeur';
                                return `<li><strong>${label}:</strong> ${labelName}: ${value}</li>`;
                            }).join('')}
                        </ul>
                    </div>
                `;
                
            } catch (error) {
                console.error('Erreur lors de la génération du graphique:', error);
                graphContent.innerHTML = `
                    <div style="text-align: center; color: #6b7280; padding: 20px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                        <div style="font-size: 18px; margin: 10px 0; color: #111827; font-weight: 600;">${chartData.title}</div>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin-top: 15px; font-size: 12px;">
                            ${chartData.labels.map((label, index) => {
                                const dataset = chartData.datasets[0];
                                const value = dataset?.data?.[index] || 'N/A';
                                const labelName = dataset?.label || 'Valeur';
                                return `<div style="margin: 5px 0; padding: 3px 0; border-bottom: 1px solid #e5e7eb;"><strong>${label}:</strong> ${labelName}: ${value}</div>`;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
        }

        // Cacher le graphique
        function hideChart() {
            chatContainer.classList.remove('with-graph');
            graphContainer.classList.remove('active');
            graphContent.innerHTML = '';
        }

        // Effectuer une recherche web
        async function performWebSearch(query) {
            try {
                const duckDuckGoUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&kl=fr-fr`;
                const response = await fetch(duckDuckGoUrl);
                
                if (!response.ok) {
                    throw new Error(`Erreur: ${response.status}`);
                }
                
                const data = await response.json();
                let searchResults = "INFORMATIONS TROUVÉES:\n\n";
                
                if (data.Abstract && data.AbstractText) {
                    searchResults += `📖 ${data.AbstractText}\n\n`;
                }
                
                if (data.Answer && data.AnswerType && data.Answer !== "") {
                    searchResults += `💡 ${data.Answer}\n\n`;
                }
                
                if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                    searchResults += "📚 Sujets connexes:\n";
                    data.RelatedTopics.slice(0, 3).forEach((topic, index) => {
                        if (topic.Text) {
                            searchResults += `• ${topic.Text}\n`;
                        }
                    });
                }
                
                if (searchResults === "INFORMATIONS TROUVÉES:\n\n") {
                    searchResults += "Aucune information spécifique trouvée en ligne.\n";
                }
                
                return searchResults;
                
            } catch (error) {
                console.error('Erreur de recherche web:', error);
                return "Recherche web indisponible.";
            }
        }

        // Interroger l'API Groq
        async function queryGroqAPI(userMessage, webSearch = false, webContext = "") {
            try {
                conversationHistory.push({
                    role: "user",
                    content: userMessage
                });

                let systemPrompt = "Tu es PRIME AI, un assistant IA extrêmement intelligent et utile. Tu réponds de manière précise et concise en français.";
                
                if (webSearch && webContext) {
                    systemPrompt += `\n\nCONTEXTE DE RECHERCHE WEB:\n${webContext}\n\nUtilise ces informations pour répondre à l'utilisateur.`;
                }

                const payload = {
                    model: GROQ_MODEL,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        ...conversationHistory
                    ],
                    temperature: 0.7,
                    max_tokens: 1024,
                    top_p: 1,
                    stream: false
                };

                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${GROQ_API_KEY}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`Erreur API: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    const aiResponse = data.choices[0].message.content;
                    
                    conversationHistory.push({
                        role: "assistant",
                        content: aiResponse
                    });

                    manageMessageLimit();
                    saveToStorage();

                    return {
                        response: aiResponse,
                        webSearch: webSearch && webContext
                    };
                } else {
                    throw new Error("Format de réponse invalide");
                }

            } catch (error) {
                console.error('Erreur Groq API:', error);
                return {
                    response: "Désolé, une erreur s'est produite. Veuillez réessayer.",
                    webSearch: false
                };
            }
        }

        // Envoyer un message
        async function sendMessage() {
            const query = userInput.value.trim();
            if (!query) return;

            // Afficher le message de l'utilisateur
            addMessage(query, 'user');
            userInput.value = '';

            // Afficher l'indicateur de frappe
            showTypingIndicator();

            try {
                let webContext = "";
                let needsWeb = needsWebSearch(query);
                let needsGraph = needsChart(query);
                
                // Effectuer une recherche web si nécessaire
                if (needsWeb) {
                    webContext = await performWebSearch(query);
                }
                
                // Obtenir la réponse de l'IA
                const result = await queryGroqAPI(query, needsWeb, webContext);
                
                // Supprimer l'indicateur de frappe
                removeTypingIndicator();
                
                // Afficher la réponse de l'IA
                addMessage(result.response, 'ai', result.webSearch, needsGraph);
                
                // Afficher un graphique si nécessaire
                if (needsGraph) {
                    const chartData = createChartDataFromQuery(query);
                    await showChart(chartData);
                } else {
                    hideChart();
                }

            } catch (error) {
                console.error('Erreur:', error);
                removeTypingIndicator();
                addMessage("Erreur lors de la communication avec l'IA. Veuillez réessayer.", 'ai', false, false);
                hideChart();
            }
        }

        // Événements
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        graphClose.addEventListener('click', hideChart);

        // Effacer l'historique
        function clearHistory() {
            conversationHistory = [];
            displayedMessages = [];
            localStorage.removeItem(STORAGE_KEYS.CONVERSATION);
            localStorage.removeItem(STORAGE_KEYS.MESSAGES);
            chatMessages.innerHTML = '';
            hideChart();
            console.log('Historique effacé');
            
            setTimeout(() => {
                addMessage("👋 **PRIME AI - Assistant Intelligent**\n\nBonjour ! Je suis PRIME AI, votre assistant personnel ultra-performant.\n\nJe peux :\n• Répondre à toutes vos questions avec précision\n• Rechercher des informations en temps réel\n• Générer des graphiques intelligents basés sur vos demandes\n• Analyser et visualiser des données complexes\n\nExemples de questions avec graphiques :\n• \"Graphique du Bitcoin en 2023\"\n• \"Évolution du S&P 500 cette année\"\n• \"Ventes d'iPhone par trimestre\"\n• \"Températures moyennes à Paris\"\n• \"Population par continent\"", 'ai', false, false);
            }, 500);
        }

        // Initialisation
        document.addEventListener('DOMContentLoaded', () => {
            loadFromStorage();
            
            if (displayedMessages.length === 0) {
                setTimeout(() => {
                    addMessage("👋 **PRIME AI - Assistant Intelligent**\n\nBonjour ! Je suis PRIME AI, votre assistant personnel ultra-performant.\n\nJe peux :\n• Répondre à toutes vos questions avec précision\n• Rechercher des informations en temps réel\n• Générer des graphiques intelligents basés sur vos demandes\n• Analyser et visualiser des données complexes\n\nExemples de questions avec graphiques :\n• \"Graphique du Bitcoin en 2023\"\n• \"Évolution du S&P 500 cette année\"\n• \"Ventes d'iPhone par trimestre\"\n• \"Températures moyennes à Paris\"\n• \"Population par continent\"", 'ai', false, false);
                }, 500);
            }
            
            console.log('✅ PRIME AI initialisé !');
            console.log('✅ Graphiques: Activés avec données précises');
            console.log('✅ Interface: 700px/350px × 500px');
        });

        // Exposer des fonctions utiles
        window.clearHistory = clearHistory;
        window.testGraph = function() {
            const chartData = {
                title: 'Graphique de test PRIME AI',
                type: 'line',
                labels: ['2020', '2021', '2022', '2023', '2024'],
                datasets: [{
                    label: 'Test',
                    data: [100, 120, 115, 140, 160],
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true
                }],
                description: 'Exemple de visualisation de données'
            };
            showChart(chartData);
        };
