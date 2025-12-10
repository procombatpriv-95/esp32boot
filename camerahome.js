    let expanded = false;
    let isAnimating = false;
    let streamPreloaded = false;
    let isDragging = false;
    let isFrozen = false;
    let startX, startY, initialX, initialY;
    let camfreeze = null;
    let dragThreshold = 5; // Seuil de déplacement pour différencier clic/drag
    
    const button = document.getElementById("camButton");
    const emoji = button.querySelector('.emoji');
    const streamContent = document.getElementById("streamContent");
    const img = document.getElementById("camStream");
    
    // Fonction pour créer le bouton freeze
    function createFreezeButton() {
      if (camfreeze) return;
      
      camfreeze = document.createElement('button');
      camfreeze.className = 'camfreeze';
      camfreeze.innerHTML = '❄️';
      camfreeze.style.display = 'block';
      camfreeze.style.pointerEvents = 'auto';
      
      // Ajouter l'événement click directement
      camfreeze.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        toggleFreeze();
        return false;
      };
      
      streamContent.appendChild(camfreeze);
    }
    
    // Fonction pour supprimer le bouton freeze
    function removeFreezeButton() {
      if (camfreeze) {
        camfreeze.remove();
        camfreeze = null;
      }
    }
    
    // Fermer le stream quand on clique en dehors
    document.addEventListener('click', function(e) {
      // Si le stream est étendu et qu'on clique en dehors du bouton
      if (expanded && !isFrozen && !isAnimating && 
          e.target !== button && !button.contains(e.target)) {
        toggleCam();
      }
    });
    
    // DRAG & DROP - Version originale pour le bouton non étendu
    button.addEventListener('mousedown', startDrag);
    button.addEventListener('touchstart', startDrag, { passive: false });
    
    function startDrag(e) {
      // Si on est en mode frozen, on utilise le drag and drop amélioré
      if (isFrozen) {
        startFreezeDrag(e);
        return;
      }
      
      // Si expandé mais pas frozen, on ne fait rien (le clic sera géré par le document)
      if (expanded && !isFrozen) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      isDragging = true;
      button.classList.add('dragging');
      button.style.cursor = 'grabbing';
      
      const rect = button.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      if (e.type === 'mousedown') {
        startX = e.clientX;
        startY = e.clientY;
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
      } else if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
      }
    }
    
    function doDrag(e) {
      if (!isDragging || expanded) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      let clientX, clientY;
      
      if (e.type === 'mousemove') {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      
      // Calculer le déplacement
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      
      // Vérifier si le déplacement dépasse le seuil pour être considéré comme un drag
      if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
        // Appliquer la nouvelle position
        const newX = initialX + deltaX;
        const newY = initialY + deltaY;
        
        // Limites de l'écran
        const maxX = window.innerWidth - button.offsetWidth;
        const maxY = window.innerHeight - button.offsetHeight;
        
        button.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
        button.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
      }
    }
    
    function stopDrag(e) {
      if (!isDragging) return;
      
      isDragging = false;
      button.classList.remove('dragging');
      button.style.cursor = 'grab';
      
      // Nettoyer les événements
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('touchmove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
      
      // Vérifier si c'était un click (pas de mouvement significatif)
      if (!expanded) {
        let moved = false;
        if (e.type === 'mouseup') {
          moved = Math.abs(e.clientX - startX) > dragThreshold || Math.abs(e.clientY - startY) > dragThreshold;
        } else if (e.type === 'touchend') {
          moved = Math.abs(e.changedTouches[0].clientX - startX) > dragThreshold || 
                  Math.abs(e.changedTouches[0].clientY - startY) > dragThreshold;
        }
        
        if (!moved && !isAnimating) {
          toggleCam();
        }
      }
    }
    
    // DRAG & DROP pour le mode frozen (amélioré)
    function startFreezeDrag(e) {
      // Ne pas démarrer le drag si on clique sur le bouton freeze
      if (e.target === camfreeze || (camfreeze && camfreeze.contains(e.target))) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      isDragging = true;
      button.classList.add('dragging');
      button.style.zIndex = '8080';
      
      const rect = button.getBoundingClientRect();
      initialX = parseInt(button.style.left) || rect.left;
      initialY = parseInt(button.style.top) || rect.top;
      
      if (e.type === 'mousedown') {
        startX = e.clientX;
        startY = e.clientY;
        document.addEventListener('mousemove', doFreezeDrag);
        document.addEventListener('mouseup', stopFreezeDrag);
      } else if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        document.addEventListener('touchmove', doFreezeDrag, { passive: false });
        document.addEventListener('touchend', stopFreezeDrag);
      }
    }
    
    function doFreezeDrag(e) {
      if (!isDragging) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      let clientX, clientY;
      
      if (e.type === 'mousemove') {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      
      const dx = clientX - startX;
      const dy = clientY - startY;
      
      // En mode frozen, on déplace immédiatement sans seuil
      button.style.position = 'fixed';
      button.style.left = (initialX + dx) + 'px';
      button.style.top = (initialY + dy) + 'px';
    }
    
    function stopFreezeDrag() {
      isDragging = false;
      button.classList.remove('dragging');
      document.removeEventListener('mousemove', doFreezeDrag);
      document.removeEventListener('touchmove', doFreezeDrag);
      document.removeEventListener('mouseup', stopFreezeDrag);
      document.removeEventListener('touchend', stopFreezeDrag);
    }
    
    // Gestion du mode freeze
    function toggleFreeze() {
      isFrozen = !isFrozen;
      
      if (isFrozen) {
        camfreeze.style.background = 'rgba(0, 100, 255, 0.8)';
        button.classList.add('frozen');
        button.style.cursor = 'move';
      } else {
        camfreeze.style.background = 'rgba(0, 0, 0, 0.6)';
        button.classList.remove('frozen');
        button.style.cursor = 'default';
      }
    }
    
    // TOGGLE CAM FUNCTION
    function toggleCam() {
      if (isAnimating) return;
      
      isAnimating = true;
      expanded = !expanded;
      
      if (expanded) {
        // Ouvrir le stream
        if (!streamPreloaded) {
          preloadStream();
        }
        
        emoji.style.opacity = '0';
        
        setTimeout(() => {
          emoji.style.display = 'none';
          button.classList.add("expanded");
          
          // Créer le bouton freeze quand le stream s'ouvre
          setTimeout(() => {
            createFreezeButton();
            isAnimating = false;
          }, 50);
          
        }, 150);
        
      } else {
        // Fermer le stream
        button.classList.remove("expanded");
        
        // Supprimer le bouton freeze quand le stream se ferme
        removeFreezeButton();
        
        // Réinitialiser l'état frozen
        isFrozen = false;
        
        setTimeout(() => {
          emoji.style.display = 'flex';
          setTimeout(() => {
            emoji.style.opacity = '1';
            isAnimating = false;
          }, 50);
        }, 300);
      }
    }
    
    // Précharger le stream
    function preloadStream() {
      if (!streamPreloaded) {
        streamPreloaded = true;
        img.src = 'http://172.20.10.2:81/stream';
      }
    }
    
    // Précharger au chargement de la page
    window.addEventListener('load', function() {
      setTimeout(preloadStream, 500);
    });
    
    // Empêcher le menu contextuel
    button.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });
