    let expanded = false;
    let isAnimating = false;
    let streamPreloaded = false;
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    const button = document.getElementById("camButton");
    const emoji = button.querySelector('.emoji');
    const streamContent = document.getElementById("streamContent");
    const img = document.getElementById("camStream");
    
    // DRAG & DROP - Version simplifiée et corrigée
    button.addEventListener('mousedown', startDrag);
    button.addEventListener('touchstart', startDrag, { passive: false });
    
    function startDrag(e) {
      if (expanded) {
        // Si expandé, on permet de fermer avec un click
        if (!isAnimating) {
          toggleCam();
        }
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
      
      // Appliquer la nouvelle position
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      // Limites de l'écran
      const maxX = window.innerWidth - button.offsetWidth;
      const maxY = window.innerHeight - button.offsetHeight;
      
      button.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
      button.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
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
          moved = Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5;
        } else if (e.type === 'touchend') {
          moved = Math.abs(e.changedTouches[0].clientX - startX) > 5 || 
                  Math.abs(e.changedTouches[0].clientY - startY) > 5;
        }
        
        if (!moved && !isAnimating) {
          toggleCam();
        }
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
          
          setTimeout(() => {
            streamContent.classList.remove('hidden');
            streamContent.classList.add('visible');
            isAnimating = false;
          }, 300);
        }, 150);
        
      } else {
        // Fermer le stream
        streamContent.classList.remove('visible');
        streamContent.classList.add('hidden');
        button.classList.remove("expanded");
        
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
        img.src = ')rawliteral" + String(cam_url) + R"rawliteral(';
      }
    }
    
    // Précharger au chargement de la page
    window.addEventListener('load', function() {
      setTimeout(preloadStream, 500);
    });
    
    // Double click pour fermer
    button.addEventListener('dblclick', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (expanded && !isAnimating) {
        toggleCam();
      }
    });
    
    // Empêcher le menu contextuel
    button.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });
