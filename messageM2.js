        class ChatManager {
            constructor() {
                this.session = 'mohamed';
                this.messages = [];
                this.intervalId = null;
                this.isPolling = false;
                this.retryInterval = null;
                this.pendingMessages = [];
                this.init();
            }
            
            init() {
                this.loadFromStorage();
                this.loadPendingMessages();
                this.loadRecentMessages();
                this.setupEventListeners();
                this.startPolling();
                this.startRetryInterval();
                this.scrollToBottom();
                console.log('ChatManager initialisé pour ' + this.session);
            }
            
            loadFromStorage() {
                try {
                    const stored = localStorage.getItem(`${this.session}_messages`);
                    if (stored) {
                        this.messages = JSON.parse(stored);
                        this.displayAllMessages();
                    }
                } catch (e) {
                    console.error('Erreur de chargement:', e);
                }
            }
            
            loadPendingMessages() {
                try {
                    const stored = localStorage.getItem(`${this.session}_pending`);
                    if (stored) {
                        this.pendingMessages = JSON.parse(stored);
                        console.log(`${this.pendingMessages.length} messages en attente`);
                    }
                } catch (e) {
                    console.error('Erreur de chargement messages en attente:', e);
                }
            }
            
            async loadRecentMessages() {
                try {
                    const response = await fetch(`/${this.session}recent`);
                    if (!response.ok) throw new Error('Erreur réseau');
                    
                    const data = await response.json();
                    
                    // Ajouter les messages récents s'ils ne sont pas déjà présents
                    data.forEach((msg, index) => {
                        if (msg && !this.messages.some(m => m.text === msg && m.isSent)) {
                            this.addMessage(msg, true, true);
                        }
                    });
                } catch (e) {
                    console.error('Erreur chargement récent:', e);
                }
            }
            
            saveToStorage() {
                try {
                    // Garder seulement les 3 derniers messages dans le localStorage
                    const toSave = this.messages.slice(-3);
                    localStorage.setItem(`${this.session}_messages`, JSON.stringify(toSave));
                } catch (e) {
                    console.error('Erreur de sauvegarde:', e);
                }
            }
            
            savePendingMessages() {
                try {
                    localStorage.setItem(`${this.session}_pending`, JSON.stringify(this.pendingMessages));
                } catch (e) {
                    console.error('Erreur sauvegarde messages en attente:', e);
                }
            }
            
            addMessage(text, isSent, save = true) {
                const message = {
                    id: Date.now(),
                    text: text,
                    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    isSent: isSent
                };
                
                this.messages.push(message);
                
                // Garder seulement les 3 derniers messages en mémoire
                if (this.messages.length > 3) {
                    this.messages = this.messages.slice(-3);
                }
                
                if (save) {
                    this.saveToStorage();
                }
                
                this.displayMessage(message);
                this.scrollToBottom();
                
                return message;
            }
            
            displayMessage(message) {
                const container = document.getElementById('textdiv');
                if (!container) return;
                
                const bubble = document.createElement('div');
                bubble.className = `message-bubble ${message.isSent ? 'sent' : 'received'}`;
                
                // Créer un span pour le texte
                const textSpan = document.createElement('span');
                textSpan.style.cssText = `
                    display: block;
                    word-break: break-word;
                    white-space: pre-wrap;
                    line-height: 1.4;
                    max-width: 100%;
                `;
                textSpan.textContent = message.text;
                
                // Créer un span pour l'horodatage
                const timeSpan = document.createElement('span');
                timeSpan.className = 'timestamp';
                timeSpan.textContent = message.timestamp;
                
                bubble.appendChild(textSpan);
                bubble.appendChild(timeSpan);
                
                container.appendChild(bubble);
                
                // Limiter le nombre de messages affichés
                const bubbles = container.getElementsByClassName('message-bubble');
                if (bubbles.length > 30) {
                    for (let i = 0; i < bubbles.length - 30; i++) {
                        bubbles[i].remove();
                    }
                }
            }
            
            displayAllMessages() {
                const container = document.getElementById('textdiv');
                if (!container) return;
                
                container.innerHTML = '';
                this.messages.forEach(msg => this.displayMessage(msg));
            }
            
            scrollToBottom() {
                const container = document.getElementById('textdiv');
                if (container) {
                    setTimeout(() => {
                        container.scrollTop = container.scrollHeight;
                    }, 100);
                }
            }
            
            setupEventListeners() {
                const sendButton = document.getElementById('sendButton');
                const noteInput = document.getElementById('noteInput');
                
                if (sendButton && noteInput) {
                    sendButton.addEventListener('click', () => this.sendMessage());
                    
                    noteInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            this.sendMessage();
                        }
                    });
                    
                    // Focus automatique sur l'input
                    noteInput.focus();
                }
            }
            
            async sendMessage() {
                const input = document.getElementById('noteInput');
                if (!input || !input.value.trim()) return;
                
                const messageText = input.value.trim();
                
                // Ajouter visuellement le message
                this.addMessage(messageText, true);
                
                // Envoyer au serveur
                try {
                    const response = await fetch(`/${this.session}send?message=${encodeURIComponent(messageText)}`);
                    if (response.ok) {
                        console.log('✅ Message envoyé avec succès');
                        
                        // Vérifier s'il y a des messages en attente à renvoyer
                        if (this.pendingMessages.length > 0) {
                            console.log('📤 Tentative d\'envoi des messages en attente...');
                            this.retryPendingMessages();
                        }
                    } else {
                        throw new Error('Erreur serveur');
                    }
                } catch (error) {
                    console.error('❌ Erreur d\'envoi:', error);
                    
                    // Sauvegarder le message en attente
                    this.pendingMessages.push(messageText);
                    this.savePendingMessages();
                    
                    // Afficher un indicateur de message en attente
                    this.showPendingIndicator();
                }
                
                // Réinitialiser l'input
                input.value = '';
                input.focus();
            }
            
            async retryPendingMessages() {
                if (this.pendingMessages.length === 0) return;
                
                console.log(`🔄 Tentative d'envoi de ${this.pendingMessages.length} messages en attente...`);
                
                const successMessages = [];
                
                for (let i = 0; i < this.pendingMessages.length; i++) {
                    const message = this.pendingMessages[i];
                    try {
                        const response = await fetch(`/${this.session}send?message=${encodeURIComponent(message)}`);
                        if (response.ok) {
                            successMessages.push(i);
                            console.log(`✅ Message en attente envoyé: ${message.substring(0, 30)}...`);
                        }
                    } catch (error) {
                        console.error(`❌ Échec d'envoi du message en attente: ${message.substring(0, 30)}...`);
                    }
                }
                
                // Supprimer les messages envoyés avec succès
                if (successMessages.length > 0) {
                    this.pendingMessages = this.pendingMessages.filter((_, index) => !successMessages.includes(index));
                    this.savePendingMessages();
                    
                    if (this.pendingMessages.length === 0) {
                        this.hidePendingIndicator();
                    }
                }
            }
            
            showPendingIndicator() {
                let indicator = document.getElementById('pending-indicator');
                if (!indicator) {
                    indicator = document.createElement('div');
                    indicator.id = 'pending-indicator';
                    indicator.style.cssText = `
                        position: fixed;
                        bottom: 70px;
                        right: 20px;
                        background: #ff9800;
                        color: white;
                        padding: 5px 10px;
                        border-radius: 15px;
                        font-size: 12px;
                        z-index: 1000;
                        cursor: pointer;
                    `;
                    indicator.textContent = '📤 Messages en attente';
                    indicator.title = 'Cliquez pour réessayer';
                    indicator.addEventListener('click', () => this.retryPendingMessages());
                    document.body.appendChild(indicator);
                }
                indicator.textContent = `📤 ${this.pendingMessages.length} message(s) en attente`;
            }
            
            hidePendingIndicator() {
                const indicator = document.getElementById('pending-indicator');
                if (indicator) {
                    indicator.remove();
                }
            }
            
            async checkForNewMessages() {
                try {
                    const response = await fetch(`/${this.session}receive`);
                    if (!response.ok) throw new Error('Erreur réseau');
                    
                    const text = await response.text();
                    
                    if (text && text.trim() !== '') {
                        // Vérifier si c'est un nouveau message
                        const isNew = !this.messages.some(msg => 
                            msg.text === text.trim() && !msg.isSent
                        );
                        
                        if (isNew) {
                            this.addMessage(text.trim(), false);
                            
                            // Effacer le message côté serveur
                            await fetch(`/${this.session}receive?clear=true`);
                        }
                    }
                } catch (error) {
                    if (!this.isPolling) return;
                    console.error('Erreur de récupération:', error);
                }
            }
            
            startPolling() {
                this.isPolling = true;
                this.intervalId = setInterval(() => {
                    this.checkForNewMessages();
                }, 1000); // Polling toutes les secondes
            }
            
            startRetryInterval() {
                this.retryInterval = setInterval(() => {
                    if (this.pendingMessages.length > 0) {
                        this.retryPendingMessages();
                    }
                }, 30000); // Toutes les 30 secondes
            }
            
            stopPolling() {
                this.isPolling = false;
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                }
                if (this.retryInterval) {
                    clearInterval(this.retryInterval);
                }
            }
        }
        
        // Initialiser quand la page est chargée
        document.addEventListener('DOMContentLoaded', () => {
            window.chatManager = new ChatManager();
            
            // Gestionnaire pour la fermeture de la page
            window.addEventListener('beforeunload', () => {
                if (window.chatManager) {
                    window.chatManager.stopPolling();
                }
            });
            
            // Détecter la visibilité de la page
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && window.chatManager) {
                    window.chatManager.stopPolling();
                } else if (!document.hidden && window.chatManager && !window.chatManager.isPolling) {
                    window.chatManager.startPolling();
                }
            });
            
            // Vérifier la connexion au serveur Mac
            setTimeout(async () => {
                try {
                    const response = await fetch('/checkMac');
                    const data = await response.json();
                    if (data.status === 'connected') {
                        console.log('✅ Connecté au serveur Mac');
                    } else {
                        console.log('❌ Non connecté au serveur Mac');
                    }
                } catch (e) {
                    console.error('Erreur de vérification du serveur Mac:', e);
                }
            }, 2000);
        });
        
        // Fonction globale pour le bouton
        window.drawText = function() {
            if (window.chatManager) {
                window.chatManager.sendMessage();
            }
        };
