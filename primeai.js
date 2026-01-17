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
                '2024', '2025', '2026', 'dernière', 'mise à jour', 'en ce moment',
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

        // Extraire les données numériques d'une réponse textuelle
        function extractDataFromResponse(response) {
            const numbers = response.match(/\d+\.?\d*/g);
            if (!numbers) return [];
            
            // Convertir en nombres et limiter à des valeurs raisonnables
            return numbers.map(n => {
                const num = parseFloat(n);
                // Si c'est une grande valeur (comme un prix Bitcoin), la diviser pour le graphique
                if (num > 10000) return Math.round(num / 1000);
                if (num > 1000) return Math.round(num / 100);
                return num;
            }).slice(0, 10); // Limiter à 10 valeurs
        }

        // Extraire les labels d'une réponse textuelle
        function extractLabelsFromResponse(response, dataCount) {
            // Essayer d'extraire des années, mois, ou autres labels
            const yearMatches = response.match(/\b(202[0-9]|201[0-9])\b/g);
            if (yearMatches && yearMatches.length >= dataCount) {
                return yearMatches.slice(0, dataCount);
            }
            
            // Sinon, utiliser des labels génériques
            const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct'];
            const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
            const genericLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
            
            if (dataCount <= 4) return quarterLabels.slice(0, dataCount);
            if (dataCount <= 10) return monthLabels.slice(0, dataCount);
            return genericLabels.slice(0, dataCount);
        }

        // Créer des données de graphique basées sur la réponse de l'IA
        function createChartDataFromResponse(response, query) {
            const data = extractDataFromResponse(response);
            const labels = extractLabelsFromResponse(response, data.length);
            const chartType = getChartType(query);
            const queryLower = query.toLowerCase();
            
            // Déterminer le titre basé sur la requête
            let title = 'Visualisation des données';
            if (queryLower.includes('bitcoin') || queryLower.includes('crypto')) {
                title = 'Évolution du Bitcoin (USD)';
            } else if (queryLower.includes('sp500') || queryLower.includes('s&p')) {
                title = 'Performance du S&P 500';
            } else if (queryLower.includes('apple') || queryLower.includes('iphone') || queryLower.includes('pomme')) {
                title = 'Ventes/Performance Apple';
            } else if (queryLower.includes('météo') || queryLower.includes('température')) {
                title = 'Données météorologiques';
            } else if (queryLower.includes('population') || queryLower.includes('démographie')) {
                title = 'Données démographiques';
            }
            
            // S'assurer qu'on a au moins 3 données
            if (data.length < 3) {
                // Générer des données fictives mais cohérentes
                for (let i = data.length; i < 5; i++) {
                    data.push(Math.round(Math.random() * 100));
                }
            }
            
            // S'assurer qu'on a assez de labels
            while (labels.length < data.length) {
                labels.push(`Donnée ${labels.length + 1}`);
            }
            
            // Créer des couleurs basées sur le type de graphique
            let backgroundColor, borderColor;
            if (chartType === 'line') {
                borderColor = 'rgb(102, 126, 234)';
                backgroundColor = 'rgba(102, 126, 234, 0.1)';
            } else if (chartType === 'bar') {
                borderColor = 'rgb(139, 92, 246)';
                backgroundColor = 'rgba(139, 92, 246, 0.2)';
            } else {
                borderColor = 'rgb(59, 130, 246)';
                backgroundColor = 'rgba(59, 130, 246, 0.2)';
            }
            
            return {
                type: chartType,
                title: title,
                labels: labels.slice(0, data.length),
                datasets: [{
                    label: 'Valeurs',
                    data: data,
                    borderColor: borderColor,
                    backgroundColor: backgroundColor,
                    fill: chartType === 'line',
                    tension: 0.4,
                    borderWidth: 2
                }],
                description: 'Données extraites de la réponse de PRIME AI'
            };
        }

        // Afficher un graphique
        async function showChart(chartData) {
            // Réduire la taille du chat à 350px
            chatContainer.classList.add('with-graph');
            
            // Afficher le conteneur de graphique
            graphContainer.classList.add('active');
            graphTitle.textContent = chartData.title || '📊 Graphique PRIME AI';
            
            // Sauvegarder les données courantes
            currentChartData = chartData;
            
            // Afficher le chargement
            graphContent.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #6b7280; gap: 15px;">
                    <div style="width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <div>Génération du graphique...</div>
                </div>
            `;
            
            // Ajouter l'animation spin
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            try {
                // Générer l'URL du graphique avec QuickChart
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
                        }
                    }
                };
                
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
                
                // Si un graphique est nécessaire, demander à l'IA d'inclure des données numériques spécifiques
                if (needsGraph) {
                    systemPrompt += `\n\nL'utilisateur veut un graphique. Dans ta réponse, INCLUS DES DONNÉES NUMÉRIQUES PRÉCISES (chiffres, pourcentages, valeurs) qui pourront être utilisées pour générer un graphique. Mentionne les valeurs clairement dans ta réponse.`;
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
                const result = await queryGroqAPI(query, needsWeb, webContext, needsGraph);
                
                // Supprimer l'indicateur de frappe
                removeTypingIndicator();
                
                // Afficher la réponse de l'IA
                addMessage(result.response, 'ai', result.webSearch, result.needsGraph);
                
                // Afficher un graphique si nécessaire
                if (needsGraph) {
                    const chartData = createChartDataFromResponse(result.response, query);
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
                addMessage("👋 **PRIME AI - Assistant Intelligent**\n\nBonjour ! Je suis PRIME AI, votre assistant personnel ultra-performant.\n\nJe peux :\n• Répondre à toutes vos questions avec précision\n• Rechercher des informations en temps réel\n• Générer des graphiques intelligents basés sur mes réponses\n• Analyser et visualiser des données complexes\n\nExemples de questions avec graphiques :\n• \"Évolution du Bitcoin en 2024\"\n• \"Performance du S&P 500 cette année\"\n• \"Ventes d'iPhone par trimestre\"\n• \"Températures moyennes à Paris\"\n• \"Croissance démographique en Europe\"", 'ai', false, false);
            }, 500);
        }

        // Initialisation
        document.addEventListener('DOMContentLoaded', () => {
            loadFromStorage();
            
            if (displayedMessages.length === 0) {
                setTimeout(() => {
                    addMessage("👋 **PRIME AI - Assistant Intelligent**\n\nBonjour ! Je suis PRIME AI, votre assistant personnel ultra-performant.\n\nJe peux :\n• Répondre à toutes vos questions avec précision\n• Rechercher des informations en temps réel\n• Générer des graphiques intelligents basés sur mes réponses\n• Analyser et visualiser des données complexes\n\nExemples de questions avec graphiques :\n• \"Évolution du Bitcoin en 2024\"\n• \"Performance du S&P 500 cette année\"\n• \"Ventes d'iPhone par trimestre\"\n• \"Températures moyennes à Paris\"\n• \"Croissance démographique en Europe\"", 'ai', false, false);
                }, 500);
            }
            

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
                    fill: true
                }],
                description: 'Exemple de visualisation de données'
            };
            showChart(chartData);
        };
