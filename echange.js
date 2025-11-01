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
            ctx.fillStyle = "#111216";
            ctx.globalAlpha = 0.7;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
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
            ctx.fillStyle = "white";
            ctx.fill();
            ctx.strokeStyle = activeField === "euro" ? "#00ff99" : "#888";
            ctx.stroke();
            ctx.fillStyle = "black";
            ctx.textAlign = "left";
            ctx.fillText(euroValue, 55, 85);

            // Champ Pound
            roundRect(170, 65, 80, 30, 10);
            ctx.fillStyle = "white";
            ctx.fill();
            ctx.strokeStyle = activeField === "pound" ? "#00aaff" : "#888";
            ctx.stroke();
            ctx.fillStyle = "black";
            ctx.fillText(poundValue, 175, 85);

            // Taux affiché
            ctx.fillStyle = "#aaa";
            ctx.font = "11px Arial";
            ctx.textAlign = "center";
            ctx.fillText(`1 EUR = ${rate.toFixed(2)} GBP`, canvas.width/2, 150);
        }

        function updateConversion() {
            if (activeField === "euro") {
                const euros = parseFloat(euroValue) || 0;
                poundValue = (euros * rate).toFixed(2);
            } else if (activeField === "pound") {
                const pounds = parseFloat(poundValue) || 0;
                euroValue = (pounds / rate).toFixed(2);
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

        window.addEventListener("keydown", e => {
            if (!activeField) return;
            if (e.key >= "0" && e.key <= "9" || e.key === ".") {
                if (activeField === "euro") euroValue += e.key;
                else poundValue += e.key;
            } else if (e.key === "Backspace") {
                if (activeField === "euro") euroValue = euroValue.slice(0, -1);
                else poundValue = poundValue.slice(0, -1);
            }
            updateConversion();
            drawUI();
        });

        window.addEventListener("load", async () => {
            await fetchRate();
            initDrag(); // Initialiser le drag and drop
            drawUI();
            setInterval(drawUI, 500);
        });
