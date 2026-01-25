        class ChatManager {
            constructor() {
                this.session = 'mohamed';
                this.messages = [];
                this.intervalId = null;
                this.isPolling = false;
                this.init();
            }
            
            init() {
                this.loadFromStorage();
                this.loadRecentMessages();
                this.setupEventListeners();
                this.startPolling();
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
                        console.log('✅ Message envoyé avec succès à Fahim');
                    } else {
                        throw new Error('Erreur serveur');
                    }
                } catch (error) {
                    console.error('❌ Erreur d\'envoi:', error);
                    this.showError('Erreur de connexion, réessayez');
                }
                
                // Réinitialiser l'input
                input.value = '';
                input.focus();
            }
            
            showError(message) {
                // Créer une notification d'erreur
                const errorDiv = document.createElement('div');
                errorDiv.textContent = message;
                errorDiv.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: #ff4444;
                    color: white;
                    padding: 10px 15px;
                    border-radius: 5px;
                    z-index: 10000;
                    font-size: 14px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                `;
                
                document.body.appendChild(errorDiv);
                
                // Supprimer après 3 secondes
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.parentNode.removeChild(errorDiv);
                    }
                }, 3000);
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
            
            stopPolling() {
                this.isPolling = false;
                if (this.intervalId) {
                    clearInterval(this.intervalId);
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
                        console.log('⚠️ Non connecté au serveur Mac');
                        this.showError('Serveur Mac non connecté');
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
