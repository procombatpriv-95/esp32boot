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
        // Votre fonction pour ajouter du texte
        console.log("Bouton cliqué");
    }
