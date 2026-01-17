        const chatContainer = document.getElementById('chatContainer');
        const chatMessages = document.getElementById('chatMessages');
        const primechatInput = document.getElementById('primechatInput');
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

        // Types de graphiques disponibles
        const GRAPH_TYPES = {
            LINE: 'PRIME Line Chart',
            BAR: 'PRIME Bar Chart',
            PIE: 'PRIME Pie Chart',
            DOUGHNUT: 'PRIME Doughnut Chart',
            RADAR: 'PRIME Radar Chart',
            POLAR: 'PRIME Polar Chart',
            SCATTER: 'PRIME Scatter Chart',
            BUBBLE: 'PRIME Bubble Chart'
        };

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
                graphBadge.textContent = 'PRIME Graph généré';
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
                '2024', '2025', '2026', '2023', '2022', '2021', '2020',
                'dernière', 'mise à jour', 'en ce moment', 'cours', 'prix',
                'bourse', 'météo', 'news', 'nouvelles', 'événement', 'concert',
                'film', 'série', 'sortie', 'live', 'score', 'résultat',
                'élection', 'sport', 'match', 'joueur', 'crypto', 'bitcoin',
                'ethereum', 'actions', 'marché', 'trend', 'tendance',
                'populaire', 'viral', 'vacances', 'férié', 'grève',
                'manifestation', 'politique', 'économie', 'inflation',
                'taux', 'intérêt', 'banque', 'définition', 'quoi', 'qui',
                'quand', 'où', 'pourquoi', 'comment', 'combien'
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
                'décroissance', 'tendance', 'historique', 'performance',
                'comparaison', 'tableau', 'diagramme', 'histogramme', 'camembert',
                'pomme', 'apple', 'iphone', 'macbook', 'produit', 'marché',
                'part de marché', 'évolution du prix', 'cours de', 'prix de',
                'évolution des ventes', 'ventes annuelles', 'chiffre d\'affaires',
                'visualisation', 'représentation', 'image', 'illustration',
                'carte', 'map', 'géographique', 'population', 'démographie',
                'température', 'climat', 'météo', 'précipitations',
                'budget', 'finance', 'dépenses', 'revenus', 'économique',
                'bitcoin', 'crypto', 'ethereum', 'solana', 'cardano',
                'tesla', 'microsoft', 'google', 'amazon', 'meta', 'netflix'
            ];
            
            const queryLower = query.toLowerCase();
            return chartTriggers.some(trigger => queryLower.includes(trigger));
        }

        // Déterminer le type de graphique approprié
        function determineGraphType(query, data) {
            const queryLower = query.toLowerCase();
            
            if (queryLower.includes('camembert') || queryLower.includes('part de marché') || 
                queryLower.includes('pourcentage') || queryLower.includes('répartition') ||
                queryLower.includes('distribution')) {
                return 'pie';
            } else if (queryLower.includes('histogramme') || queryLower.includes('barre') || 
                       queryLower.includes('ventes') || queryLower.includes('comparaison') ||
                       queryLower.includes('catégorie')) {
                return 'bar';
            } else if (queryLower.includes('radar') || queryLower.includes('spider')) {
                return 'radar';
            } else if (queryLower.includes('polar') || queryLower.includes('circulaire')) {
                return 'polarArea';
            } else if (queryLower.includes('nuage de points') || queryLower.includes('scatter')) {
                return 'scatter';
            } else if (queryLower.includes('bulles') || queryLower.includes('bubble')) {
                return 'bubble';
            } else {
                // Par défaut, utiliser line pour les séries temporelles
                if (data && data.labels && data.labels.some(label => 
                    /\d{4}/.test(label) || /jan|fév|mar|avr|mai|juin|juil|août|sep|oct|nov|déc/i.test(label))) {
                    return 'line';
                }
                return 'line';
            }
        }

        // Générer des données de graphique réalistes basées sur la requête
        function generateChartData(query) {
            const queryLower = query.toLowerCase();
            
            // Détecter l'année demandée
            const yearMatch = queryLower.match(/(\d{4})/);
            const targetYear = yearMatch ? parseInt(yearMatch[1]) : 2024;
            
            // Données pour Bitcoin
            if (queryLower.includes('bitcoin') || queryLower.includes('crypto') || queryLower.includes('btc')) {
                const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                let basePrice;
                
                // Ajuster le prix de base selon l'année
                if (targetYear === 2023) {
                    basePrice = 16500; // Début 2023
                } else if (targetYear === 2024) {
                    basePrice = 42000; // Début 2024
                } else {
                    basePrice = 30000; // Par défaut
                }
                
                // Générer des données réalistes pour Bitcoin
                const data = [];
                for (let i = 0; i < 12; i++) {
                    const variation = (Math.random() * 40 - 20); // Variation de -20% à +20%
                    const monthPrice = basePrice * (1 + variation / 100);
                    // Simuler une tendance à la hausse
                    const trend = targetYear === 2023 ? 0.8 : 0.5; // Plus forte hausse en 2023
                    const finalPrice = monthPrice * (1 + (i * trend) / 100);
                    data.push(Math.round(finalPrice));
                }
                
                return {
                    type: 'line',
                    title: `Cours du Bitcoin ${targetYear} (USD)`,
                    labels: labels,
                    datasets: [{
                        label: 'Bitcoin (USD)',
                        data: data,
                        borderColor: 'rgb(255, 205, 86)',
                        backgroundColor: 'rgba(255, 205, 86, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    }],
                    description: `Évolution mensuelle du prix du Bitcoin en ${targetYear}`
                };
            }
            
            // Données pour S&P 500
            else if (queryLower.includes('sp500') || queryLower.includes('s&p') || queryLower.includes('indice')) {
                const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
                let baseValue;
                
                if (targetYear === 2023) {
                    baseValue = 3800;
                } else if (targetYear === 2024) {
                    baseValue = 4800;
                } else {
                    baseValue = 4500;
                }
                
                const data = [];
                for (let i = 0; i < 4; i++) {
                    const growth = 2 + (Math.random() * 3); // Croissance de 2-5% par trimestre
                    baseValue = baseValue * (1 + growth / 100);
                    data.push(Math.round(baseValue));
                }
                
                return {
                    type: 'line',
                    title: `S&P 500 ${targetYear} (points)`,
                    labels: labels,
                    datasets: [{
                        label: 'S&P 500',
                        data: data,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    }],
                    description: `Performance trimestrielle du S&P 500 en ${targetYear}`
                };
            }
            
            // Données pour ventes Apple
            else if (queryLower.includes('apple') || queryLower.includes('iphone') || queryLower.includes('pomme')) {
                const years = ['2020', '2021', '2022', '2023', '2024'];
                const data = [195, 235, 225, 230, 245]; // Millions d'unités
                
                return {
                    type: 'bar',
                    title: 'Ventes d\'iPhone par année (millions)',
                    labels: years,
                    datasets: [{
                        label: 'Ventes (millions)',
                        data: data,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1
                    }],
                    description: 'Ventes annuelles d\'iPhone en millions d\'unités'
                };
            }
            
            // Données pour température
            else if (queryLower.includes('température') || queryLower.includes('météo') || queryLower.includes('climat')) {
                const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
                const parisTemp = [5, 6, 10, 14, 18, 21, 24, 23, 20, 15, 9, 6];
                
                return {
                    type: 'line',
                    title: 'Températures moyennes à Paris (°C)',
                    labels: labels,
                    datasets: [{
                        label: 'Température (°C)',
                        data: parisTemp,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    }],
                    description: 'Températures mensuelles moyennes à Paris'
                };
            }
            
            // Données génériques
            else {
                const labels = ['Donnée 1', 'Donnée 2', 'Donnée 3', 'Donnée 4', 'Donnée 5'];
                const data = [];
                
                for (let i = 0; i < 5; i++) {
                    data.push(Math.round(Math.random() * 100));
                }
                
                return {
                    type: 'bar',
                    title: 'PRIME Chart - Visualisation des données',
                    labels: labels,
                    datasets: [{
                        label: 'Valeurs',
                        data: data,
                        backgroundColor: 'rgba(153, 102, 255, 0.5)',
                        borderColor: 'rgb(153, 102, 255)',
                        borderWidth: 1
                    }],
                    description: 'Visualisation de données basée sur votre requête'
                };
            }
        }

        // Afficher un graphique
        async function showChart(chartData) {
            // Réduire la taille du chat à 350px
            chatContainer.classList.add('with-graph');
            
            // Afficher le conteneur de graphique
            graphContainer.classList.add('active');
            graphTitle.textContent = chartData.title || '📊 PRIME Graph';
            
            // Afficher le chargement
            graphContent.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #6b7280; gap: 15px;">
                    <div style="width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <div>Création du PRIME Graph...</div>
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
                // Déterminer le type de graphique final
                const finalType = determineGraphType(chartData.title, chartData);
                
                // Générer l'URL du graphique avec QuickChart
                const chartConfig = {
                    type: finalType,
                    data: {
                        labels: chartData.labels || [],
                        datasets: chartData.datasets || []
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: chartData.title || 'PRIME Graph',
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
                        scales: finalType !== 'pie' && finalType !== 'doughnut' ? {
                            y: {
                                beginAtZero: true,
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
                        } : {}
                    }
                };
                
                const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
                const chartUrl = `https://quickchart.io/chart?c=${encodedConfig}&width=310&height=250&backgroundColor=white`;
                
                // Afficher le graphique
                setTimeout(() => {
                    graphContent.innerHTML = `
                        <img src="${chartUrl}" alt="PRIME Graph" class="graph-image" style="animation: fadeIn 0.5s ease forwards;">
                        <div class="graph-data">
                            <h4>Données du PRIME Graph:</h4>
                            <ul>
                                ${chartData.labels.map((label, index) => {
                                    const dataset = chartData.datasets[0];
                                    const value = dataset?.data?.[index] || 'N/A';
                                    const labelName = dataset?.label || 'Valeur';
                                    return `<li><strong>${label}:</strong> ${labelName}: ${value}</li>`;
                                }).join('')}
                            </ul>
                            ${chartData.description ? `<p style="margin-top: 10px; font-size: 12px; color: #6b7280;">${chartData.description}</p>` : ''}
                        </div>
                    `;
                }, 800);
                
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
                const result = await queryGroqAPI(query, needsWeb, webContext);
                
                // Supprimer l'indicateur de frappe
                removeTypingIndicator();
                
                // Afficher la réponse de l'IA
                addMessage(result.response, 'ai', result.webSearch, needsGraph);
                
                // Afficher un graphique si nécessaire
                if (needsGraph) {
                    const chartData = generateChartData(query);
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
                addMessage("👋 **PRIME AI - Assistant Intelligent**\n\nBonjour ! Je suis PRIME AI, votre assistant personnel ultra-performant.\n\nJe peux :\n• Répondre à toutes vos questions avec précision\n• Rechercher des informations en temps réel\n• Générer des PRIME Graphs intelligents\n• Analyser et visualiser des données complexes\n\nExemples de questions avec PRIME Graphs :\n• \"Graphique du Bitcoin en 2023\"\n• \"Évolution du S&P 500\"\n• \"Ventes d'iPhone par année\"\n• \"Températures à Paris\"\n• \"Population mondiale par continent\"", 'ai', false, false);
            }, 500);
        }

        // Initialisation
        document.addEventListener('DOMContentLoaded', () => {
            loadFromStorage();
            
            if (displayedMessages.length === 0) {
                setTimeout(() => {
                    addMessage("👋 **PRIME AI - Assistant Intelligent**\n\nBonjour ! Je suis PRIME AI, votre assistant personnel ultra-performant.\n\nJe peux :\n• Répondre à toutes vos questions avec précision\n• Rechercher des informations en temps réel\n• Générer des PRIME Graphs intelligents\n• Analyser et visualiser des données complexes\n\nExemples de questions avec PRIME Graphs :\n• \"Graphique du Bitcoin en 2023\"\n• \"Évolution du S&P 500\"\n• \"Ventes d'iPhone par année\"\n• \"Températures à Paris\"\n• \"Population mondiale par continent\"", 'ai', false, false);
                }, 500);
            }
            
            console.log('✅ PRIME AI initialisé !');
            console.log('📊 Graphiques: PRIME Line Chart, PRIME Bar Chart, PRIME Pie Chart, etc.');
            console.log('💡 Utilisez #primechatInput pour poser vos questions');
        });

        // Exposer des fonctions utiles
        window.clearHistory = clearHistory;
        window.showPRIMEGraph = function() {
            const chartData = {
                type: 'line',
                title: 'PRIME Line Chart de démonstration',
                labels: ['2020', '2021', '2022', '2023', '2024'],
                datasets: [{
                    label: 'Croissance PRIME',
                    data: [100, 120, 115, 140, 160],
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }],
                description: 'Exemple de PRIME Graph Line Chart'
            };
            showChart(chartData);
        };
