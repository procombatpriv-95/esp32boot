// Déclarer fetchBalanceAndTransactions en global pour qu'elle soit accessible partout
let fetchBalanceAndTransactions;

function makeCanvasDraggable(canvas) {
    let isDragging = false;
    let startX, startY;
    let startLeft = 0, startTop = 0;

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        // Récupérer la position actuelle
        const computedStyle = getComputedStyle(canvas);
        startLeft = parseInt(computedStyle.left) || 0;
        startTop = parseInt(computedStyle.top) || 0;
        
        canvas.classList.add('dragging');
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
        e.preventDefault();
    });

    function onDrag(e) {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        canvas.style.position = 'relative';
        canvas.style.left = (startLeft + dx) + 'px';
        canvas.style.top = (startTop + dy) + 'px';
    }

    function stopDrag() {
        isDragging = false;
        canvas.classList.remove('dragging');
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
    }

    // Double-click pour ouvrir le menu de configuration
    canvas.addEventListener('dblclick', (e) => {
        e.preventDefault();
        showConfigForm();
    });
}

function showConfigForm() {
    const overlay = document.getElementById('monzoConfigOverlay');
    if (!overlay) {
        const configHTML = `
            <div id="monzoConfigOverlay">
                <div id="monzoConfigForm">
                    <div id="monzoTitle">Monzo</div>
                    <input type="text" id="accountId" class="config-input" placeholder="account_id" required>
                    <input type="text" id="authToken" class="config-input" placeholder="Authorization: Bearer ..." required>
                    <button type="button" id="configSubmit">OK</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', configHTML);
        
        document.getElementById('configSubmit').addEventListener('click', saveConfig);
        
        // Fermer le overlay quand on clique à l'extérieur du formulaire
        document.getElementById('monzoConfigOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'monzoConfigOverlay') {
                e.target.style.display = 'none';
            }
        });

        // Pré-remplir avec les valeurs existantes si disponibles
        const existingAccountId = localStorage.getItem('monzo_account_id');
        const existingAuthToken = localStorage.getItem('monzo_auth_token');
        if (existingAccountId) document.getElementById('accountId').value = existingAccountId;
        if (existingAuthToken) document.getElementById('authToken').value = existingAuthToken;
    } else {
        overlay.style.display = 'flex';
    }
}

function saveConfig() {
    const accountId = document.getElementById('accountId').value;
    const authToken = document.getElementById('authToken').value;
    
    if (accountId && authToken) {
        // Stocker les informations
        localStorage.setItem('monzo_account_id', accountId);
        localStorage.setItem('monzo_auth_token', authToken);
        
        // Masquer le formulaire
        document.getElementById('monzoConfigOverlay').style.display = 'none';
        
        // Recharger les données IMMÉDIATEMENT
        if (typeof fetchBalanceAndTransactions === 'function') {
            fetchBalanceAndTransactions();
        }
    }
}

window.addEventListener("load", () => {
    const canvas = document.getElementById("balanceCanvas");
    
    // Rendre le canvas draggable
    makeCanvasDraggable(canvas);

    const ctx = canvas.getContext("2d");

    let transactions = [];
    let scrollOffset = 0;
    let scrollAccumulator = 0;
    let currentBalance = null;
    let monthlyTotalSpent = 0;
    let hasError = false;

function drawBackground() {
    const radius = 20;
    
    // Convertir #14233C en rgba avec opacité 0.7
    ctx.fillStyle = "rgba(20, 35, 60, 0.7)";
    
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(canvas.width - radius, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
    ctx.lineTo(canvas.width, canvas.height - radius);
    ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
    ctx.lineTo(radius, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
}

    function drawDashboard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();

        // === Logo texte Monzo ===
        ctx.fillStyle = "#ccc";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Monzo", 12, 25);

        // === Balance ===
        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Balance", canvas.width / 2, 45);
        ctx.font = "24px Arial bold";
        if (typeof currentBalance === "number") {
            ctx.fillText("£" + (currentBalance / 100).toFixed(2), canvas.width / 2, 72);
        } else {
            ctx.fillText("—", canvas.width / 2, 72);
        }

        // === Monthly spent ===
        ctx.textAlign = "right";
        ctx.font = "12px Arial";
        ctx.fillStyle = "#ccc";
        ctx.fillText("Monthly spent", canvas.width - 10, 25);
        ctx.font = "16px Arial";
        ctx.fillStyle = "white";
        ctx.fillText("£" + (monthlyTotalSpent / 100).toFixed(2), canvas.width - 10, 42);

        // === Transactions ===
        const listY = 105;
        const rowHeight = 30;

        if (transactions.length === 0) {
            ctx.fillStyle = "#ccc";
            ctx.textAlign = "center";
            ctx.font = "13px Arial";
            if (hasError) {
                ctx.fillText("Double-cliquez pour configurer", canvas.width / 2, listY + 20);
            } else {
                ctx.fillText("Aucune transaction", canvas.width / 2, listY + 20);
            }
            return;
        }

        const visibleTransactions = transactions.slice(scrollOffset, scrollOffset + 3);
        visibleTransactions.forEach((t, i) => {
            const yPos = listY + i * rowHeight;

            // Date
            const d = new Date(t.created);
            const dateLabel = `${d.getDate()}/${d.getMonth() + 1}`;
            ctx.fillStyle = "#aaa";
            ctx.font = "11px Arial";
            ctx.textAlign = "right";
            ctx.fillText(dateLabel, canvas.width - 55, yPos);

            // Montant
            ctx.fillStyle = t.amount < 0 ? "red" : "lime";
            ctx.font = "13px Arial";
            ctx.textAlign = "center";
            const amount = (t.amount / 100).toFixed(2);
            const sign = t.amount < 0 ? "-" : "+";
            ctx.fillText(`${sign}£${Math.abs(amount)}`, canvas.width / 2, yPos);

            // Logo
            const size = 18;
            const logoX = 40;

            if (t.logoImg && t.logoImg.complete && t.logoImg.naturalWidth > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(logoX + size/2, yPos, size/2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(t.logoImg, logoX, yPos - size/2, size, size);
                ctx.restore();
            } else {
                ctx.fillStyle = "#3ba4ff";
                ctx.beginPath();
                ctx.arc(logoX + size/2, yPos, size/2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = "white";
                ctx.font = "11px Arial bold";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(t.initial, logoX + size/2, yPos);
            }
        });
    }

    // Définir la fonction fetchBalanceAndTransactions
    fetchBalanceAndTransactions = async function() {
        try {
            // Récupérer les informations stockées ou utiliser les valeurs par défaut
            const accountId = localStorage.getItem('monzo_account_id') || "acc_0000Aq361rIPbwKyOmHZSs";
            const authToken = localStorage.getItem('monzo_auth_token') || "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJlYiI6ImQrdUpzbjI4QzhtcmQyTVQxSXl1IiwianRpIjoiYWNjdG9rXzAwMDBBeWJ1MVpsc2pyWDBaSkxSM3IiLCJ0eXAiOiJhdCIsInYiOiI2In0.Ly9ADsEtP9tXvSuKegEzyQkcA4vX1ygFOfOqXwv_ep5EXsr5F4UcYdw-zPFXSIcdycxTg8H2ipNqnMHHIusOEg";

            const balanceRes = await fetch(`https://api.monzo.com/balance?account_id=${accountId}`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });
            
            if (!balanceRes.ok) {
                throw new Error('Erreur API Monzo');
            }
            
            const balanceData = await balanceRes.json();
            currentBalance = typeof balanceData.balance === "number" ? balanceData.balance : null;

            const txRes = await fetch(`https://api.monzo.com/transactions?account_id=${accountId}`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });
            
            if (!txRes.ok) {
                throw new Error('Erreur API Monzo');
            }
            
            const txData = await txRes.json();

            transactions = (txData.transactions || [])
                .sort((a, b) => new Date(b.created) - new Date(a.created))
                .map(t => {
                    let name = "Transaction";
                    if (t.counterparty && t.counterparty.name) name = t.counterparty.name;
                    else if (t.merchant && t.merchant.name) name = t.merchant.name;
                    else if (t.description) name = t.description;

                    name = name.replace(/,\s*London.*/i, "");

                    const initial = name.charAt(0).toUpperCase();
                    let logoImg = null;
                    if (t.merchant && t.merchant.logo) {
                        logoImg = new Image();
                        logoImg.crossOrigin = "Anonymous";
                        logoImg.src = t.merchant.logo;
                    }
                    return { name, amount: t.amount, created: t.created, initial, logoImg };
                });

            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            monthlyTotalSpent = transactions
                .filter(t => {
                    const d = new Date(t.created);
                    return d.getMonth() === thisMonth && d.getFullYear() === thisYear && t.amount < 0;
                })
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            hasError = false;
            drawDashboard();
        } catch (err) {
            console.error("Erreur API:", err);
            currentBalance = null;
            transactions = [];
            monthlyTotalSpent = 0;
            hasError = true;
            drawDashboard();
        }
    };

    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        scrollAccumulator += e.deltaY;
        if (scrollAccumulator >= 40) {
            if (scrollOffset < transactions.length - 3) scrollOffset++;
            scrollAccumulator = 0;
        } else if (scrollAccumulator <= -40) {
            if (scrollOffset > 0) scrollOffset--;
            scrollAccumulator = 0;
        }
        drawDashboard();
    }, { passive: false });

    // Charger les données au démarrage
    fetchBalanceAndTransactions();
    setInterval(fetchBalanceAndTransactions, 30000);
});
