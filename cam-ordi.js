        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const video = document.getElementById('cameraFeed');
                video.srcObject = stream;
            } catch (err) {
                console.error("Erreur d'accès à la caméra: ", err);
            }
        }

        // Rendre le conteneur déplaçable
        function makeElementDraggable(element) {
            let isDragging = false;
            let startX, startY;
            let startLeft, startTop;

            element.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                
                // Récupérer la position actuelle depuis getBoundingClientRect()
                const rect = element.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;
                
                // S'assurer que l'élément utilise left/top au lieu de bottom/left
                element.style.bottom = 'auto';
                element.style.left = startLeft + 'px';
                element.style.top = startTop + 'px';
                
                element.classList.add('dragging');
                document.addEventListener('mousemove', onDrag);
                document.addEventListener('mouseup', stopDrag);
                e.preventDefault();
            });

            function onDrag(e) {
                if (!isDragging) return;
                
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                element.style.left = (startLeft + dx) + 'px';
                element.style.top = (startTop + dy) + 'px';
            }

            function stopDrag() {
                isDragging = false;
                element.classList.remove('dragging');
                document.removeEventListener('mousemove', onDrag);
                document.removeEventListener('mouseup', stopDrag);
            }
        }

        // Initialisation
        window.addEventListener('DOMContentLoaded', () => {
            startCamera();
            makeElementDraggable(document.getElementById('cameraContainer'));
        });
