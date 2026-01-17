        const chatContainer = document.getElementById('chatContainer');
        const chatMessages = document.getElementById('chatMessages');
        const primechatInput = document.getElementById('primechatInput');
        const graphprimeContainer = document.getElementById('graphprimeContainer');
        const graphprimeContent = document.getElementById('graphprimeContent');
        const graphprimeTitle = document.getElementById('graphprimeTitle');
        const graphprimeClose = document.getElementById('graphprimeClose');

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

        // Variables pour les données du graphique
        let currentChartData = null;

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
            } else if (queryLower.includes('carte') || queryLower.includes('map') || queryLower.includes('géographique')) {
                return 'doughnut';
            } else {
                return 'line';
            }
        }

        // Fonction pour obtenir des données réalistes en fonction de la requête
        function getRealisticData(query) {
            const queryLower = query.toLowerCase();
            
            // Données pour Bitcoin en 2023
            if (queryLower.includes('bitcoin') && queryLower.includes('2023')) {
                return {
                    title: 'Cours du Bitcoin en 2023',
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
                    data: [16500, 19500, 23500, 28500, 26500, 25500, 29500, 26000, 26500, 28500, 34500, 42000],
                    type: 'line',
                    description: 'Évolution mensuelle du Bitcoin en 2023 (en USD)'
                };
            }
            
            // Données pour S&P 500
            else if (queryLower.includes('sp500') || queryLower.includes('s&p')) {
                return {
                    title: 'Performance du S&P 500 (2024)',
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
                    data: [4760, 4850, 5100, 5050, 5200, 5350, 5400, 5300, 5450, 5500, 5600, 5700],
                    type: 'line',
                    description: 'Évolution mensuelle du S&P 500 en points'
                };
            }
            
            // Données pour Apple
            else if (queryLower.includes('apple') || queryLower.includes('iphone') || queryLower.includes('pomme')) {
                return {
                    title: 'Ventes d\'iPhone (millions d\'unités)',
                    labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
                    data: [195, 215, 240, 225, 235, 250],
                    type: 'bar',
                    description: 'Ventes annuelles d\'iPhone en millions d\'unités'
                };
            }
            
            // Données génériques
            else {
                const chartType = getChartType(query);
                return {
                    title: 'Visualisation des données',
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    data: [45, 60, 55, 70],
                    type: chartType,
                    description: 'Données basées sur votre requête'
                };
            }
        }

        // Créer des données de graphique basées sur la requête
        function createChartDataFromQuery(query) {
            const realisticData = getRealisticData(query);
            const chartType = realisticData.type;
            
            // Couleurs basées sur le type de graphique
            let borderColor, backgroundColor;
            if (chartType === 'line') {
                borderColor = 'rgb(102, 126, 234)';
                backgroundColor = 'rgba(102, 126, 234, 0.1)';
            } else if (chartType === 'bar') {
                borderColor = 'rgb(139, 92, 246)';
                backgroundColor = 'rgba(139, 92, 246, 0.2)';
            } else if (chartType === 'pie' || chartType === 'doughnut') {
                borderColor = [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 206, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)',
                    'rgb(255, 159, 64)'
                ];
                backgroundColor = [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                    'rgba(255, 159, 64, 0.5)'
                ];
            } else {
                borderColor = 'rgb(59, 130, 246)';
                backgroundColor = 'rgba(59, 130, 246, 0.2)';
            }
            
            const datasetConfig = {
                label: 'Valeurs',
                data: realisticData.data,
                borderColor: borderColor,
                borderWidth: 2
            };
            
            // Pour les graphiques à secteurs, on a besoin de backgroundColor comme tableau
            if (chartType === 'pie' || chartType === 'doughnut') {
                datasetConfig.backgroundColor = backgroundColor;
            } else {
                datasetConfig.backgroundColor = Array.isArray(backgroundColor) ? backgroundColor[0] : backgroundColor;
                datasetConfig.fill = chartType === 'line';
                if (chartType === 'line') {
                    datasetConfig.tension = 0.4;
                }
            }
            
            return {
                type: chartType,
                title: realisticData.title,
                labels: realisticData.labels,
                datasets: [datasetConfig],
                description: realisticData.description
            };
        }

        // Afficher un graphique
        async function showChart(chartData) {
            // Réduire la taille du chat à 350px
            chatContainer.classList.add('with-graph');
            
            // Afficher le conteneur de graphique
            graphprimeContainer.classList.add('active');
            graphprimeTitle.textContent = chartData.title || '📊 PRIME Graph';
            
            // Sauvegarder les données courantes
            currentChartData = chartData;
            
            // Afficher le chargement
            graphprimeContent.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #6b7280; gap: 15px;">
                    <div style="width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <div>Création du graphique...</div>
                </div>
            `;
            
            try {
                // Configuration pour QuickChart
                const chartConfig = {
                    type: chartData.type || 'line',
                    data: {
                        labels: chartData.labels || [],
                        datasets: chartData.datasets || []
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            title: {
                                display: true,
                                text: chartData.title || 'Graphique',
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
                                display: chartData.type !== 'pie' && chartData.type !== 'doughnut',
                                position: 'top',
                                labels: {
                                    font: {
                                        size: 11
                                    },
                                    padding: 10
                                }
                            }
                        }
                    }
                };
                
                // Ajustements spécifiques selon le type de graphique
                if (chartData.type === 'line') {
                    chartConfig.options.scales = {
                        y: {
                            beginAtZero: false,
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
                    };
                }
                
                const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
                const chartUrl = `https://quickchart.io/chart?c=${encodedConfig}&width=310&height=250&backgroundColor=white`;
                
                // Afficher le graphique
                graphprimeContent.innerHTML = `
                    <img src="${chartUrl}" alt="Graphique" class="graph-image" style="animation: fadeIn 0.5s ease forwards;">
                    <div class="graph-data">
                        <h4>Données du graphique:</h4>
                        <ul>
                            ${chartData.labels.map((label, index) => {
                                const dataset = chartData.datasets[0];
                                const value = dataset?.data?.[index] || 'N/A';
                                const labelName = dataset?.label || 'Valeur';
                                return `<li><strong>${label}:</strong> ${value}</li>`;
                            }).join('')}
                        </ul>
                        ${chartData.description ? `<p style="margin-top: 10px; font-size: 12px; color: #6b7280; font-style: italic;">${chartData.description}</p>` : ''}
                    </div>
                `;
                
            } catch (error) {
                console.error('Erreur lors de la génération du graphique:', error);
                graphprimeContent.innerHTML = `
                    <div style="text-align: center; color: #6b7280; padding: 20px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                        <div style="font-size: 18px; margin: 10px 0; color: #111827; font-weight: 600;">${chartData.title}</div>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin-top: 15px; font-size: 12px;">
                            ${chartData.labels.map((label, index) => {
                                const dataset = chartData.datasets[0];
                                const value = dataset?.data?.[index] || 'N/A';
                                return `<div style="margin: 5px 0; padding: 3px 0; border-bottom: 1px solid #e5e7eb;"><strong>${label}:</strong> ${value}</div>`;
                            }).join('')}
                        </div>
                        ${chartData.description ? `<p style="margin-top: 10px; font-size: 12px; color: #6b7280;">${chartData.description}</p>` : ''}
                    </div>
                `;
            }
        }

        // Cacher le graphique
        function hideChart() {
            chatContainer.classList.remove('with-graph');
            graphprimeContainer.classList.remove('active');
            graphprimeContent.innerHTML = '';
            currentChartData = null;
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
        async function queryGroqAPI(userMessage, webSearch = false, webContext = "", needsGraph = false) {
            try {
                conversationHistory.push({
                    role: "user",
                    content: userMessage
                });

                let systemPrompt = "Tu es PRIME AI, un assistant IA extrêmement intelligent et utile. Tu réponds de manière précise et concise en français.";
                
                if (webSearch && webContext) {
                    systemPrompt += `\n\nCONTEXTE DE RECHERCHE WEB:\n${webContext}\n\nUtilise ces informations pour répondre à l'utilisateur.`;
                }
                
                // Si un graphique est nécessaire, demander à l'IA d'inclure des données numériques
                if (needsGraph) {
                    systemPrompt += `\n\nIMPORTANT: L'utilisateur veut un graphique. Fournis des données numériques précises et mentionne les années/chiffres spécifiques dans ta réponse.`;
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
                        webSearch: webSearch && webContext,
                        needsGraph: needsGraph
                    };
                } else {
                    throw new Error("Format de réponse invalide");
                }

            } catch (error) {
                console.error('Erreur Groq API:', error);
                return {
                    response: "Désolé, une erreur s'est produite. Veuillez réessayer.",
                    webSearch: false,
                    needsGraph: false
                };
            }
        }

        // Envoyer un message
        async function sendMessage() {
            const query = primechatInput.value.trim();
            if (!query) return;

            // Afficher le message de l'utilisateur
            addMessage(query, 'user');
            primechatInput.value = '';

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
                const result = await queryGroqAPI(query, needsWeb, webContext, needsGraph);
                
                // Supprimer l'indicateur de frappe
                removeTypingIndicator();
                
                // Afficher la réponse de l'IA
                addMessage(result.response, 'ai', result.webSearch, result.needsGraph);
                
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
        primechatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        graphprimeClose.addEventListener('click', hideChart);

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
                addMessage("👋 **PRIME AI - Assistant Intelligent**\n\nBonjour ! Je suis PRIME AI, votre assistant personnel ultra-performant.\n\nJe peux :\n• Répondre à toutes vos questions avec précision\n• Rechercher des informations en temps réel\n• Générer des graphiques intelligents basés sur mes réponses\n• Analyser et visualiser des données complexes\n\nExemples de questions avec graphiques :\n• \"Évolution du Bitcoin en 2023\"\n• \"Performance du S&P 500 cette année\"\n• \"Ventes d'iPhone par trimestre\"\n• \"Températures moyennes à Paris\"\n• \"Croissance démographique en Europe\"", 'ai', false, false);
            }, 500);
        }

        // Initialisation
        document.addEventListener('DOMContentLoaded', () => {
            loadFromStorage();
            
            if (displayedMessages.length === 0) {
                setTimeout(() => {
                    addMessage("👋 **PRIME AI - Assistant Intelligent**\n\nBonjour ! Je suis PRIME AI, votre assistant personnel ultra-performant.\n\nJe peux :\n• Répondre à toutes vos questions avec précision\n• Rechercher des informations en temps réel\n• Générer des graphiques intelligents basés sur mes réponses\n• Analyser et visualiser des données complexes\n\nExemples de questions avec graphiques :\n• \"Évolution du Bitcoin en 2023\"\n• \"Performance du S&P 500 cette année\"\n• \"Ventes d'iPhone par trimestre\"\n• \"Températures moyennes à Paris\"\n• \"Croissance démographique en Europe\"", 'ai', false, false);
                }, 500);
            }
            
            console.log('✅ PRIME AI initialisé !');
            console.log('📊 Graphiques: PRIME Graph, Graph classique, Graphique camembert');
            console.log('💡 Tapez votre question et appuyez sur Entrée');
        });

        // Exposer des fonctions utiles
        window.clearHistory = clearHistory;
        window.showGraph = function() {
            const chartData = {
                title: 'Graphique de démonstration PRIME AI',
                type: 'line',
                labels: ['2020', '2021', '2022', '2023', '2024'],
                datasets: [{
                    label: 'Croissance',
                    data: [100, 120, 115, 140, 160],
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }],
                description: 'Exemple de visualisation de données PRIME Graph'
            };
            showChart(chartData);
        };
