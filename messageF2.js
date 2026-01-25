        class ChatManager {
            constructor() {
                this.session = 'fahim';
                this.messages = [];
                this.intervalId = null;
                this.isPolling = false;
                this.init();
            }
            
            init() {
                this.setupEventListeners();
                this.loadChatHistory();
                this.startPolling();
                console.log('ChatManager initialisé pour ' + this.session);
            }
            
            async loadChatHistory() {
                try {
                    console.log('📥 Chargement de l\'historique complet...');
                    
                    // 1. Charger les messages récents envoyés (depuis ESP32)
                    const recentResponse = await fetch(`/${this.session}recent`);
                    if (recentResponse.ok) {
                        const recentData = await recentResponse.json();
                        recentData.forEach((msg, index) => {
                            if (msg) {
                                this.addMessage(msg, true, false);
                            }
                        });
                    }
                    
                    // 2. Charger les messages non lus (reçus)
                    const unreadResponse = await fetch(`/${this.session}receive`);
                    if (unreadResponse.ok) {
                        const unreadText = await unreadResponse.text();
                        if (unreadText && unreadText.trim() !== '') {
                            this.addMessage(unreadText.trim(), false, false);
                            await fetch(`/${this.session}receive?clear=true`);
                        }
                    }
                    
                    // 3. Charger l'historique complet depuis le Mac
                    await this.loadCompleteHistory();
                    
                    console.log('✅ Historique chargé avec ' + this.messages.length + ' messages');
                    this.displayAllMessages();
                    this.scrollToBottom();
                    
                } catch (e) {
                    console.error('Erreur chargement historique:', e);
                }
            }
            
            async loadCompleteHistory() {
                try {
                    // Cette route doit être implémentée dans l'ESP32
                    const response = await fetch(`/${this.session}history`);
                    if (response.ok) {
                        const historyData = await response.json();
                        
                        // Filtrer pour éviter les doublons
                        historyData.forEach((msgObj, index) => {
                            if (msgObj && msgObj.text) {
                                const isDuplicate = this.messages.some(m => 
                                    m.text === msgObj.text && m.isSent === msgObj.isSent
                                );
                                
                                if (!isDuplicate) {
                                    this.messages.push({
                                        id: Date.now() + index,
                                        text: msgObj.text,
                                        timestamp: msgObj.timestamp || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                                        isSent: msgObj.isSent
                                    });
                                }
                            }
                        });
                        
                        // Trier par timestamp
                        this.messages.sort((a, b) => a.id - b.id);
                    }
                } catch (e) {
                    console.error('Erreur chargement historique complet:', e);
                }
            }
            
            addMessage(text, isSent, saveToServer = false) {
                const message = {
                    id: Date.now(),
                    text: text,
                    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    isSent: isSent
                };
                
                this.messages.push(message);
                
                // Garder seulement les 100 derniers messages en mémoire
                if (this.messages.length > 100) {
                    this.messages = this.messages.slice(-100);
                }
                
                this.displayMessage(message);
                this.scrollToBottom();
                
                return message;
            }
            
            displayMessage(message) {
                const container = document.getElementById('textdiv2');
                if (!container) return;
                
                const bubble = document.createElement('div');
                bubble.className = `message-bubble ${message.isSent ? 'sent' : 'received'}`;
                
                const textSpan = document.createElement('span');
                textSpan.style.cssText = `
                    display: block;
                    word-break: break-word;
                    white-space: pre-wrap;
                    line-height: 1.4;
                    max-width: 100%;
                `;
                textSpan.textContent = message.text;
                
                const timeSpan = document.createElement('span');
                timeSpan.className = 'timestamp';
                timeSpan.textContent = message.timestamp;
                
                bubble.appendChild(textSpan);
                bubble.appendChild(timeSpan);
                
                container.appendChild(bubble);
                
                // Limiter l'affichage à 50 messages pour éviter la surcharge
                const bubbles = container.getElementsByClassName('message-bubble');
                if (bubbles.length > 50) {
                    for (let i = 0; i < bubbles.length - 50; i++) {
                        bubbles[i].remove();
                    }
                }
            }
            
            displayAllMessages() {
                const container = document.getElementById('textdiv2');
                if (!container) return;
                
                container.innerHTML = '';
                this.messages.forEach(msg => this.displayMessage(msg));
            }
            
            scrollToBottom() {
                const container = document.getElementById('textdiv2');
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
                        console.log('✅ Message envoyé à Mohamed');
                    } else {
                        throw new Error('Erreur serveur');
                    }
                } catch (error) {
                    console.error('❌ Erreur d\'envoi:', error);
                    this.showError('Erreur de connexion');
                }
                
                input.value = '';
                input.focus();
            }
            
            showError(message) {
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
                }, 1000);
            }
            
            stopPolling() {
                this.isPolling = false;
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                }
            }
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            window.chatManager = new ChatManager();
            
            window.addEventListener('beforeunload', () => {
                if (window.chatManager) {
                    window.chatManager.stopPolling();
                }
            });
            
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && window.chatManager) {
                    window.chatManager.stopPolling();
                } else if (!document.hidden && window.chatManager && !window.chatManager.isPolling) {
                    window.chatManager.startPolling();
                }
            });
        });
        
        window.drawText2 = function() {
            if (window.chatManager) {
                window.chatManager.sendMessage();
            }
        };
