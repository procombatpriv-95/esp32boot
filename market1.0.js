        const canvas = document.getElementById('marketCanvas');
        const ctx = canvas.getContext('2d');
        
        // Dessiner le fond du canvas UNIQUEMENT (pas de bordures)
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Créer les cellules et iframes dynamiquement
        const overlayContainer = document.getElementById('overlayContainer');

        markets.forEach((market, index) => {
            // Créer la cellule
            const cell = document.createElement('div');
            cell.className = 'market-cell';
            cell.style.left = market.position.x + 'px';
            cell.style.top = market.position.y + 'px';
            cell.style.width = market.width + 'px';
            cell.style.height = market.height + 'px';
            
            // Créer l'iframe TradingView
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.tradingview.com/embed-widget/single-quote/?locale=fr&symbol=${market.symbol}&width=${market.width}&height=${market.height}&colorTheme=${market.colorTheme}&isTransparent=false`;
            iframe.frameBorder = '0';
            iframe.scrolling = 'no';
            iframe.allowtransparency = 'true';
            
            // Ajouter l'iframe à la cellule
            cell.appendChild(iframe);
            
            // Ajouter la cellule au conteneur
            overlayContainer.appendChild(cell);
        });

        // Ajuster le scale pour que les graphiques soient plus petits
        function adjustIFrameScale() {
            const cells = overlayContainer.querySelectorAll('.market-cell');
            cells.forEach(cell => {
                const iframe = cell.querySelector('iframe');
                if (iframe) {
                    // Appliquer un scale pour réduire la taille du contenu
                    iframe.style.transform = 'scale(0.8)';
                    iframe.style.transformOrigin = 'top left';
                    iframe.style.width = '125%';
                    iframe.style.height = '125%';
                }
            });
        }

        // Ajuster la taille au chargement
        window.addEventListener('load', () => {
            setTimeout(adjustIFrameScale, 1000);
        });

        // Fonction pour rendre le canvas déplaçable et créer le widgetContainer
        function makeCanvasDraggable(canvasElement) {
            let isDragging = false;
            let startX, startY;
            let startLeft = 0, startTop = 0;
            
            // Créer le widgetContainer
            const widgetContainer = document.createElement('div');
            widgetContainer.id = 'widgetContainer';
            
            // Positionner le widgetContainer au même endroit que le canvas
            const rect = canvasElement.getBoundingClientRect();
            widgetContainer.style.left = rect.left + 'px';
            widgetContainer.style.top = rect.top + 'px';
            
            // Déplacer le canvas et l'overlayContainer dans le widgetContainer
            document.body.removeChild(canvasElement);
            document.body.removeChild(overlayContainer);
            
            widgetContainer.appendChild(canvasElement);
            widgetContainer.appendChild(overlayContainer);
            document.body.appendChild(widgetContainer);
            
            // Ajuster la position du canvas et overlayContainer dans le widgetContainer
            canvasElement.style.position = 'absolute';
            canvasElement.style.left = '0';
            canvasElement.style.top = '0';
            
            overlayContainer.style.position = 'absolute';
            overlayContainer.style.left = '0';
            overlayContainer.style.top = '0';

            widgetContainer.addEventListener('mousedown', (e) => {
                // Vérifier si on clique sur le canvas
                if (e.target === canvasElement) {
                    isDragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    
                    // Récupérer la position actuelle
                    startLeft = parseInt(widgetContainer.style.left) || 0;
                    startTop = parseInt(widgetContainer.style.top) || 0;
                    
                    widgetContainer.classList.add('dragging');
                    document.addEventListener('mousemove', onDrag);
                    document.addEventListener('mouseup', stopDrag);
                    e.preventDefault();
                }
            });

            function onDrag(e) {
                if (!isDragging) return;
                
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                widgetContainer.style.left = (startLeft + dx) + 'px';
                widgetContainer.style.top = (startTop + dy) + 'px';
                
                e.preventDefault();
            }

            function stopDrag() {
                if (isDragging) {
                    isDragging = false;
                    widgetContainer.classList.remove('dragging');
                    document.removeEventListener('mousemove', onDrag);
                    document.removeEventListener('mouseup', stopDrag);
                }
            }

            document.addEventListener('dragstart', (e) => {
                if (e.target.tagName === 'IFRAME') {
                    e.preventDefault();
                    return false;
                }
            });
        }

        // Rendre le canvas déplaçable
        makeCanvasDraggable(canvas);
