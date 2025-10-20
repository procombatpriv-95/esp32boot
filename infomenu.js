    document.addEventListener('DOMContentLoaded', function() {
        const navItems = document.querySelectorAll('.nav-item');
        const slider = document.querySelector('.sliderpetitpage');
        const highlight2 = document.querySelector('.highlight2');
        
        // Initialiser la position du surlignage
        updateHighlightPosition();
        
        // Ajouter des écouteurs d'événements pour chaque élément de navigation
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                const targetIndex = parseInt(this.getAttribute('data-target'));
                
                // Mettre à jour la classe active
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
                
                // Mettre à jour la position du surlignage
                updateHighlightPosition();
                
                // Faire glisser le contenu
                slider.style.transform = `translateX(-${targetIndex * 100}%)`;
            });
        });
        
        function updateHighlightPosition() {
            const activeItem = document.querySelector('.nav-item.active');
            if (activeItem) {
                const itemRect = activeItem.getBoundingClientRect();
                const navRect = activeItem.parentElement.getBoundingClientRect();
                
                highlight2.style.width = `${itemRect.width}px`;
                highlight2.style.height = `${itemRect.height}px`;
                highlight2.style.left = `${itemRect.left - navRect.left}px`;
                highlight2.style.top = `${itemRect.top - navRect.top}px`;
            }
        }
        
        // Ajuster la position du surlignage lors du redimensionnement de la fenêtre
        window.addEventListener('resize', updateHighlightPosition);
    });

    function drawText() {
        const noteInput = document.getElementById('noteInput');
        const text = noteInput.value.trim();
        
        if (text) {
            // Ajouter le message de l'utilisateur
            addMessage(text, 'user');
            
            // Simuler une réponse après un délai
            setTimeout(() => {
                addMessage('Message gris de getText', 'other');
            }, 1000);
            
            // Vider le champ de saisie
            noteInput.value = '';
        }
    }

    function addMessage(text, type) {
        const messageContainer = document.querySelector('.message-container');
        const messageDiv = document.createElement('div');
        
        messageDiv.className = `message message-${type}`;
        
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');
        
        messageDiv.innerHTML = `
            <div>${text}</div>
            <div class="message-time">${timeString}</div>
        `;
        
        messageContainer.appendChild(messageDiv);
        
        // Scroll vers le bas
        const textdiv = document.getElementById('textdiv');
        textdiv.scrollTop = textdiv.scrollHeight;
    }

    // Fonction pour simuler getText()
    function getText() {
        return "Message gris de getText";
    }
