        const canvas = document.getElementById("echange");
        const ctx = canvas.getContext("2d");

        let rate = 0.85;
        let euroValue = "";
        let poundValue = "";
        let activeField = null;

        // Variables pour le drag and drop
        let isDragging = false;
        let startX, startY;
        let startLeft = 0, startTop = 0;

        // --- Fonction drag and drop ---
        function initDrag() {
            canvas.addEventListener('mousedown', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Vérifier si on clique sur un champ de saisie
                if ((x >= 50 && x <= 130 && y >= 65 && y <= 95) || 
                    (x >= 170 && x <= 250 && y >= 65 && y <= 95)) {
                    return; // Ne pas drag si on clique sur un champ
                }

                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                
                startLeft = parseInt(canvas.style.left) || 0;
                startTop = parseInt(canvas.style.top) || 0;
                
                canvas.classList.add('dragging');
                document.addEventListener('mousemove', onDrag);
                document.addEventListener('mouseup', stopDrag);
                e.preventDefault();
            });

            function onDrag(e) {
                if (!isDragging) return;
                
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                canvas.style.position = 'absolute';
                canvas.style.left = (startLeft + dx) + 'px';
                canvas.style.top = (startTop + dy) + 'px';
            }

            function stopDrag() {
                isDragging = false;
                canvas.classList.remove('dragging');
                document.removeEventListener('mousemove', onDrag);
                document.removeEventListener('mouseup', stopDrag);
            }
        }

        // --- Nouvel event listener pour la touche Escape ---
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Réinitialiser la position du canvas
                canvas.style.position = 'relative';
                canvas.style.left = '0px';
                canvas.style.top = '0px';
                
                // Quitter le mode édition si actif
                activeField = null;
                drawUI();
            }
            
            // Touche Entrée pour switcher entre les champs
            if (e.key === 'Enter' && activeField) {
                if (activeField === 'euro') {
                    activeField = 'pound';
                } else {
                    activeField = 'euro';
                }
                drawUI();
            }
        });

        async function fetchRate() {
            try {
                const res = await fetch("https://api.exchangerate.host/latest?base=EUR&symbols=GBP");
                const data = await res.json();
                rate = data.rates.GBP;
            } catch (e) {
                console.error("Erreur taux:", e);
            }
        }

        function roundRect(x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }

        function drawUI() {
            // Fond avec transparence
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#111216";
            ctx.globalAlpha = 0.7;
            roundRect(0, 0, canvas.width, canvas.height, 15);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Titre
            ctx.fillStyle = "white";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Echange EUR ↔ GBP", canvas.width/2, 25);

            // Labels
            ctx.font = "12px Arial";
            ctx.fillText("Euro (€)", 90, 55);
            ctx.fillText("Pound (£)", 210, 55);

            // Champ Euro
            roundRect(50, 65, 80, 30, 10);
            ctx.fillStyle = activeField === "euro" ? "#f0f8ff" : "white";
            ctx.fill();
            ctx.strokeStyle = activeField === "euro" ? "#00ff99" : "#888";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = "black";
            ctx.textAlign = "left";
            ctx.font = "12px Arial";
            ctx.fillText(euroValue || "0", 60, 85);

            // Champ Pound
            roundRect(170, 65, 80, 30, 10);
            ctx.fillStyle = activeField === "pound" ? "#f0f8ff" : "white";
            ctx.fill();
            ctx.strokeStyle = activeField === "pound" ? "#00aaff" : "#888";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = "black";
            ctx.font = "12px Arial";
            ctx.fillText(poundValue || "0", 180, 85);

            // Taux affiché
            ctx.fillStyle = "#ddd";
            ctx.font = "11px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`1 EUR = ${rate.toFixed(4)} GBP`, canvas.width/2, 150);

            // Instructions
            ctx.fillStyle = "#888";
            ctx.font = "9px Arial";
            ctx.fillText("ESC: Reset position | Enter: Switch field", canvas.width/2, 165);
        }

        function updateConversion() {
            if (activeField === "euro") {
                const euros = parseFloat(euroValue) || 0;
                poundValue = (euros * rate).toFixed(4);
            } else if (activeField === "pound") {
                const pounds = parseFloat(poundValue) || 0;
                euroValue = (pounds / rate).toFixed(4);
            }
        }

        canvas.addEventListener("click", e => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (x >= 50 && x <= 130 && y >= 65 && y <= 95) {
                activeField = "euro";
            } else if (x >= 170 && x <= 250 && y >= 65 && y <= 95) {
                activeField = "pound";
            } else {
                activeField = null;
            }
            drawUI();
        });

        // Event listener pour la saisie clavier existant
        window.addEventListener("keydown", e => {
            if (!activeField) return;
            
            // Empêcher la saisie de multiple points décimaux
            if (e.key === '.' && (activeField === "euro" ? euroValue : poundValue).includes('.')) {
                return;
            }
            
            if (e.key >= "0" && e.key <= "9" || e.key === ".") {
                if (activeField === "euro") euroValue += e.key;
                else poundValue += e.key;
            } else if (e.key === "Backspace") {
                if (activeField === "euro") euroValue = euroValue.slice(0, -1);
                else poundValue = poundValue.slice(0, -1);
            } else if (e.key === "Delete") {
                if (activeField === "euro") euroValue = "";
                else poundValue = "";
            }
            updateConversion();
            drawUI();
        });

        // Event listener pour le redimensionnement de la fenêtre
        window.addEventListener('resize', () => {
            // Recentrer le canvas si nécessaire
            drawUI();
        });

        // Initialisation
        window.addEventListener("load", async () => {
            await fetchRate();
            initDrag();
            drawUI();
            
            // Mettre à jour le taux périodiquement
            setInterval(async () => {
                await fetchRate();
                updateConversion();
                drawUI();
            }, 30000); // Toutes les 30 secondes
            
            // Rafraîchissement UI
            setInterval(drawUI, 500);
        });
