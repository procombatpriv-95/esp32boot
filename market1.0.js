    // Configuration des marchés avec les widgets TradingView
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
                position: { x: 150, y: 0 }
            },
            { 
                id: 'eurusd', 
                name: 'EUR/USD', 
                symbol: 'EURUSD',
                width: 150,
                height: 90,
                colorTheme: 'dark',
                position: { x: 0, y: 90 }
            },
            { 
                id: 'bitcoin', 
                name: 'Bitcoin', 
                symbol: 'BITSTAMP:BTCUSD',
                width: 150,
                height: 90,
                colorTheme: 'dark',
                position: { x: 150, y: 90 }
            }
        ];

        // Initialiser le widget TradingView
        function initTradingViewWidget() {
            const widgetContainer = document.querySelector('.tradingview-widget');
            const canvas = widgetContainer.querySelector('.tradingview-canvas');
            const iframeContainer = widgetContainer.querySelector('.iframe-container');
            const ctx = canvas.getContext('2d');
            
            // Dessiner le fond
            ctx.fillStyle = '#111216';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Créer les cellules et iframes dynamiquement
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
                iframe.src = `https://www.tradingview.com/embed-widget/single-quote/?locale=fr&symbol=${market.symbol}&width=${market.width}&height=${market.height}&colorTheme=${market.colorTheme}&isTransparent=true`;
                iframe.frameBorder = '0';
                iframe.scrolling = 'no';
                iframe.allowtransparency = 'true';
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';
                iframe.style.display = 'block';
                iframe.style.pointerEvents = 'none';
                
                // Ajouter l'iframe à la cellule
                cell.appendChild(iframe);
                
                // Ajouter la cellule au conteneur
                iframeContainer.appendChild(cell);
            });

            // Ajuster le scale pour que les graphiques soient plus petits
            function adjustIFrameScale() {
                const cells = iframeContainer.querySelectorAll('.market-cell');
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

            // Fonction pour rendre le widget déplaçable


        // Initialiser le widget quand le DOM est chargé
        document.addEventListener('DOMContentLoaded', initTradingViewWidget);;
