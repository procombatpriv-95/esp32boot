        const markets = [
            { 
                id: 'cac40', 
                name: 'CAC 40', 
                symbol: 'CAC40',
                width: 150,
                height: 90,
                colorTheme: 'dark',
                position: { x: 0, y: 0 }
            },
            { 
                id: 'gold', 
                name: 'Or', 
                symbol: 'XAUUSD',
                width: 150,
                height: 90,
                colorTheme: 'dark',
                position: { x: 151, y: 0 }
            },
            { 
                id: 'eurusd', 
                name: 'EUR/USD', 
                symbol: 'EURUSD',
                width: 150,
                height: 90,
                colorTheme: 'dark',
                position: { x: 0, y: 91 }
            },
            { 
                id: 'bitcoin', 
                name: 'Bitcoin', 
                symbol: 'BITSTAMP:BTCUSD',
                width: 150,
                height: 90,
                colorTheme: 'dark',
                position: { x: 151, y: 91 }
            }
        ];

        // Récupérer le canvas depuis le HTML
        const canvas = document.getElementById('marketCanvas');
        const ctx = canvas.getContext('2d');
        
        // Dessiner un fond semi-transparent sur le canvas (presque invisible)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Créer le widgetContainer en JavaScript
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'widgetContainer';
        widgetContainer.style.position = 'fixed';
        widgetContainer.style.left = 'calc(50% - 150px)';
        widgetContainer.style.top = 'calc(50% - 90px)';
        widgetContainer.style.width = '300px';
        widgetContainer.style.height = '180px';
        widgetContainer.style.borderRadius = '25px';
        widgetContainer.style.overflow = 'hidden';
        widgetContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        widgetContainer.style.backgroundColor = 'transparent';
        widgetContainer.style.zIndex = '1';

        // Créer l'overlayContainer en JavaScript
        const overlayContainer = document.createElement('div');
        overlayContainer.id = 'overlayContainer';
        overlayContainer.style.position = 'absolute';
        overlayContainer.style.top = '0';
        overlayContainer.style.left = '0';
        overlayContainer.style.width = '100%';
        overlayContainer.style.height = '100%';
        overlayContainer.style.zIndex = '2';
        overlayContainer.style.pointerEvents = 'none';
                overlayContainer.style.borderRadius = '25px';

        // Ajouter overlayContainer au widgetContainer
        widgetContainer.appendChild(overlayContainer);
        
        // Positionner le canvas pour qu'il recouvre le widgetContainer
        canvas.style.left = widgetContainer.style.left;
        canvas.style.top = widgetContainer.style.top;
        
        // Ajouter le widgetContainer au body (sous le canvas)
        document.body.appendChild(widgetContainer);

        // Créer les cellules et iframes dynamiquement
        markets.forEach((market, index) => {
            // Créer la cellule
            const cell = document.createElement('div');
            cell.className = 'market-cell';
            cell.style.position = 'absolute';
            cell.style.left = market.position.x + 'px';
            cell.style.top = market.position.y + 'px';
            cell.style.width = market.width + 'px';
            cell.style.height = market.height + 'px';
            cell.style.overflow = 'hidden';
            cell.style.pointerEvents = 'none';
            
            // Créer l'iframe TradingView
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.tradingview.com/embed-widget/single-quote/?locale=fr&symbol=${market.symbol}&width=${market.width}&height=${market.height}&colorTheme=${market.colorTheme}&isTransparent=true`;
            iframe.frameBorder = '0';
            iframe.scrolling = 'no';
            iframe.allowtransparency = 'true';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.style.display = 'block';
            iframe.style.pointerEvents = 'none';
            iframe.style.borderRadius = '25px';
            
            // Ajouter l'iframe à la cellule
            cell.appendChild(iframe);
            
            // Ajouter la cellule à l'overlayContainer
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

        // Fonction pour rendre le canvas déplaçable
        function makeCanvasDraggable(canvasElement, container) {
            let isDragging = false;
            let startX, startY;
            let startLeft = 0, startTop = 0;

            canvasElement.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                
                // Récupérer la position actuelle du canvas et du container
                const canvasStyle = window.getComputedStyle(canvasElement);
                const containerStyle = window.getComputedStyle(container);
                
                startLeft = parseInt(canvasStyle.left) || 0;
                startTop = parseInt(canvasStyle.top) || 0;
                
                canvasElement.classList.add('dragging');
                document.addEventListener('mousemove', onDrag);
                document.addEventListener('mouseup', stopDrag);
                e.preventDefault();
            });

            function onDrag(e) {
                if (!isDragging) return;
                
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                const newLeft = startLeft + dx;
                const newTop = startTop + dy;
                
                // Déplacer le canvas
                canvasElement.style.left = newLeft + 'px';
                canvasElement.style.top = newTop + 'px';
                
                // Déplacer le widgetContainer également
                container.style.left = newLeft + 'px';
                container.style.top = newTop + 'px';
                
                e.preventDefault();
            }

            function stopDrag() {
                if (isDragging) {
                    isDragging = false;
                    canvasElement.classList.remove('dragging');
                    document.removeEventListener('mousemove', onDrag);
                    document.removeEventListener('mouseup', stopDrag);
                }
            }

            // Empêcher le drag des iframes
            document.addEventListener('dragstart', (e) => {
                if (e.target.tagName === 'IFRAME') {
                    e.preventDefault();
                    return false;
                }
            });
        }

        // Synchroniser la position initiale
        const updatePositions = () => {
            const rect = canvas.getBoundingClientRect();
            widgetContainer.style.left = rect.left + 'px';
            widgetContainer.style.top = rect.top + 'px';
        };

        // Initialiser la synchronisation des positions
        setTimeout(updatePositions, 100);

        // Rendre le canvas déplaçable
        makeCanvasDraggable(canvas, widgetContainer);
