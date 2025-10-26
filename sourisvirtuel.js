        import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.4";

        // Appliquer les styles directement via JavaScript


        const video = document.getElementById("camera");
        video.style.display = 'none';

        const cursor = document.getElementById("cursor");
        cursor.style.position = 'fixed';
        cursor.style.width = '15px';
        cursor.style.height = '15px';
        cursor.style.background = 'rgba(0, 200, 255, 0.95)';
        cursor.style.borderRadius = '50%';
        cursor.style.transform = 'translate(-50%, -50%)';
        cursor.style.pointerEvents = 'none';
        cursor.style.zIndex = '9970';
        cursor.style.transition = 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        cursor.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.9), 0 0 15px rgba(0, 200, 255, 0.8)';

        // Variables globales
        let smoothX = window.innerWidth / 2;
        let smoothY = window.innerHeight / 2;
        let isMouseDown = false;
        let isDragging = false;
        let currentDragElement = null;
        let dragStartX = 0, dragStartY = 0;
        let elementStartX = 0, elementStartY = 0;

        // Configuration
        const PINCH_CONFIG = {
            threshold: 0.04,
            releaseThreshold: 0.055,
            historyLength: 4,
            minFrames: 1,
            minReleaseFrames: 2
        };

        const SMOOTHING_CONFIG = {
            baseLerp: 0.7,
            slowLerp: 0.2,
            predictionStrength: 0.05,
            slowDownRadius: 100,
            maxSpeed: 30
        };

        // Variables d'état
        let pinchHistory = [];
        let pinchFrames = 0;
        let releaseFrames = 0;
        let velocityX = 0;
        let velocityY = 0;
        let lastX = smoothX;
        let lastY = smoothY;

        // Correction du décalage
        const CAMERA_CORRECTION = {
            xOffset: -30,
            yOffset: 0,
            scaleX: 1.0,
            scaleY: 1.0
        };

        // Fonctions de base
        function advancedLerp(a, b, t) {
            const easedT = 1 - Math.pow(1 - t, 2);
            return a + (b - a) * easedT;
        }

        function detectPinch(thumb, index) {
            const distThumbIndex = Math.hypot(thumb.x - index.x, thumb.y - index.y);
            
            pinchHistory.push(distThumbIndex);
            if (pinchHistory.length > PINCH_CONFIG.historyLength) {
                pinchHistory.shift();
            }
            
            const avgDistance = pinchHistory.reduce((a, b) => a + b, 0) / pinchHistory.length;
            
            let pinchDetected;
            
            if (isMouseDown) {
                pinchDetected = avgDistance < PINCH_CONFIG.releaseThreshold;
            } else {
                pinchDetected = avgDistance < PINCH_CONFIG.threshold;
            }
            
            if (pinchDetected) {
                pinchFrames++;
                releaseFrames = 0;
            } else {
                releaseFrames++;
                pinchFrames = 0;
            }
            
            if (pinchFrames >= PINCH_CONFIG.minFrames) {
                return true;
            }
            
            if (releaseFrames >= PINCH_CONFIG.minReleaseFrames) {
                return false;
            }
            
            return isMouseDown;
        }

        function calculateVelocity(x, y, deltaTime) {
            const deltaX = x - lastX;
            const deltaY = y - lastY;
            
            velocityX = (velocityX * 0.7 + deltaX / deltaTime * 0.3);
            velocityY = (velocityY * 0.7 + deltaY / deltaTime * 0.3);
            
            const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            if (speed > SMOOTHING_CONFIG.maxSpeed) {
                velocityX = (velocityX / speed) * SMOOTHING_CONFIG.maxSpeed;
                velocityY = (velocityY / speed) * SMOOTHING_CONFIG.maxSpeed;
            }
            
            lastX = x;
            lastY = y;
            
            return { vx: velocityX, vy: velocityY, speed: speed };
        }

        function updateCursorAppearance(state) {
            cursor.style.zIndex = '9970';
            
            switch(state) {
                case 'dragging':
                    cursor.style.background = 'rgba(255, 100, 100, 0.95)';
                    cursor.style.transform = 'translate(-50%, -50%) scale(1.6)';
                    cursor.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 100, 100, 0.8)';
                    break;
                case 'pinching':
                    cursor.style.background = 'rgba(0, 255, 100, 0.95)';
                    cursor.style.transform = 'translate(-50%, -50%) scale(1.4)';
                    cursor.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 1), 0 0 20px rgba(0, 255, 100, 0.8)';
                    break;
                default:
                    cursor.style.background = 'rgba(0, 200, 255, 0.95)';
                    cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                    cursor.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.9), 0 0 15px rgba(0, 200, 255, 0.8)';
            }
        }

        // FONCTIONS POUR LE DRAG UNIVERSEL
        function startUniversalDrag(element) {
            if (isDragging) return;
            
            isDragging = true;
            currentDragElement = element;
            
            // Sauvegarder la position de départ
            const rect = element.getBoundingClientRect();
            dragStartX = smoothX;
            dragStartY = smoothY;
            elementStartX = rect.left;
            elementStartY = rect.top;
            
            // Émettre l'événement mousedown pour déclencher les systèmes de drag personnalisés
            const mouseDownEvent = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                clientX: smoothX,
                clientY: smoothY,
                button: 0
            });
            
            try {
                element.dispatchEvent(mouseDownEvent);
                console.log("Universal drag started on:", element);
            } catch (error) {
                console.log("MouseDown error:", error);
            }
        }

        function updateUniversalDrag() {
            if (!isDragging || !currentDragElement) return;
            
            // Calculer le déplacement
            const deltaX = smoothX - dragStartX;
            const deltaY = smoothY - dragStartY;
            
            // Émettre l'événement mousemove pour les systèmes de drag personnalisés
            const mouseMoveEvent = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: smoothX,
                clientY: smoothY,
                button: 0
            });
            
            try {
                document.dispatchEvent(mouseMoveEvent);
                currentDragElement.dispatchEvent(mouseMoveEvent);
            } catch (error) {
                console.log("MouseMove error:", error);
            }
        }

        function stopUniversalDrag() {
            if (!isDragging) return;
            
            // Émettre l'événement mouseup pour terminer le drag
            const mouseUpEvent = new MouseEvent('mouseup', {
                bubbles: true,
                cancelable: true,
                clientX: smoothX,
                clientY: smoothY,
                button: 0
            });
            
            try {
                if (currentDragElement) {
                    currentDragElement.dispatchEvent(mouseUpEvent);
                    console.log("Universal drag stopped on:", currentDragElement);
                }
            } catch (error) {
                console.log("MouseUp error:", error);
            }
            
            isDragging = false;
            currentDragElement = null;
        }

        // DÉTECTION DES ÉLÉMENTS DRAGGABLES
        function isElementDraggable(element) {
            if (!element) return false;
            
            // Vérifier si l'élément a des attributs ou classes qui indiquent qu'il est draggable
            const draggableSelectors = [
                '[draggable="true"]',
                '[class*="drag"]',
                '[class*="movable"]',
                '[style*="position: absolute"]',
                '[style*="position: fixed"]',
                '[style*="position: relative"]',
                '[onmousedown]',
                '[ontouchstart]'
            ];
            
            for (const selector of draggableSelectors) {
                if (element.matches(selector) || element.closest(selector)) {
                    return true;
                }
            }
            
            // Vérifier les styles de position
            const style = window.getComputedStyle(element);
            if (style.position === 'absolute' || style.position === 'fixed' || style.position === 'relative') {
                return true;
            }
            
            // Vérifier les écouteurs d'événements
            if (element.onmousedown || element.ontouchstart) {
                return true;
            }
            
            return false;
        }

        function getDraggableElementAtPosition(x, y) {
            const elements = document.elementsFromPoint(x, y);
            
            for (let element of elements) {
                if (isElementDraggable(element)) {
                    return { element, type: 'draggable' };
                }
                if (element.tagName === 'BUTTON' || element.tagName === 'A' || element.onclick) {
                    return { element, type: 'clickable' };
                }
            }
            
            return { element: elements[0], type: 'other' };
        }

        // Initialisation de la caméra et du modèle
        let handLandmarker;

        async function setupCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        width: { ideal: 1280 },
                        height: { ideal: 720 }, 
                        frameRate: { ideal: 60 },
                        facingMode: "user" 
                    }
                });
                video.srcObject = stream;
                return new Promise(resolve => {
                    video.onloadedmetadata = () => {
                        video.play();
                        resolve(video);
                    };
                });
            } catch (error) {
                console.error("Erreur caméra:", error);
                throw error;
            }
        }

        async function initializeModel() {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.4/wasm"
                );
                handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1,
                    minHandDetectionConfidence: 0.7,
                    minHandPresenceConfidence: 0.7,
                    minTrackingConfidence: 0.7
                });
            } catch (error) {
                console.error("Erreur modèle:", error);
            }
        }

        // BOUCLE PRINCIPALE AVEC DRAG UNIVERSEL
        let lastTime = performance.now();

        async function predictHighRes() {
            const currentTime = performance.now();
            const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2.0);
            lastTime = currentTime;

            const nowInMs = performance.now();
            const result = handLandmarker.detectForVideo(video, nowInMs);

            if (result.landmarks && result.landmarks.length > 0) {
                const landmarks = result.landmarks[0];
                const index = landmarks[8];
                const thumb = landmarks[4];

                // Correction du décalage
                const rawX = window.innerWidth * (1 - index.x) * CAMERA_CORRECTION.scaleX + CAMERA_CORRECTION.xOffset;
                const rawY = window.innerHeight * index.y * CAMERA_CORRECTION.scaleY + CAMERA_CORRECTION.yOffset;

                // Lissage
                smoothX = smoothX * 0.7 + rawX * 0.3;
                smoothY = smoothY * 0.7 + rawY * 0.3;

                cursor.style.left = smoothX + "px";
                cursor.style.top = smoothY + "px";
                cursor.style.zIndex = '9970';

                // Détection de pincement
                const isPinching = detectPinch(thumb, index);
                
                // Détection de l'élément sous le curseur
                const { element: elUnderCursor, type: elementType } = getDraggableElementAtPosition(smoothX, smoothY);

                // GESTION DES ÉVÉNEMENTS AVEC DRAG UNIVERSEL
                if (isPinching && !isMouseDown) {
                    isMouseDown = true;
                    
                    if (elementType === 'draggable') {
                        // COMMENCER LE DRAG UNIVERSEL
                        startUniversalDrag(elUnderCursor);
                    } else {
                        // CLIC NORMAL
                        const downEvent = new MouseEvent("mousedown", {
                            bubbles: true,
                            cancelable: true,
                            clientX: smoothX,
                            clientY: smoothY,
                            button: 0
                        });
                        
                        try {
                            if (elUnderCursor) {
                                elUnderCursor.dispatchEvent(downEvent);
                            }
                        } catch (error) {
                            console.log("MouseDown error:", error);
                        }
                    }
                    
                } else if (!isPinching && isMouseDown) {
                    isMouseDown = false;
                    
                    if (isDragging) {
                        // ARRÊTER LE DRAG UNIVERSEL
                        stopUniversalDrag();
                    } else {
                        // CLIC NORMAL (mouseup + click)
                        const upEvent = new MouseEvent("mouseup", {
                            bubbles: true,
                            cancelable: true,
                            clientX: smoothX,
                            clientY: smoothY,
                            button: 0
                        });
                        
                        const clickEvent = new MouseEvent("click", {
                            bubbles: true,
                            cancelable: true,
                            clientX: smoothX,
                            clientY: smoothY
                        });
                        
                        try {
                            if (elUnderCursor) {
                                elUnderCursor.dispatchEvent(upEvent);
                                
                                setTimeout(() => {
                                    if (!isMouseDown) {
                                        elUnderCursor.dispatchEvent(clickEvent);
                                    }
                                }, 10);
                            }
                        } catch (error) {
                            console.log("MouseUp/Click error:", error);
                        }
                    }
                }

                // METTRE À JOUR LE DRAG EN COURS
                if (isDragging) {
                    updateUniversalDrag();
                }

                // Mise à jour de l'apparence du curseur
                if (isDragging) {
                    updateCursorAppearance('dragging');
                } else if (isMouseDown) {
                    updateCursorAppearance('pinching');
                } else if (elementType === 'draggable') {
                    updateCursorAppearance('hover-draggable');
                } else {
                    updateCursorAppearance('normal');
                }
                
            } else {
                // Pas de main détectée - réinitialiser
                if (isMouseDown) {
                    isMouseDown = false;
                    if (isDragging) {
                        stopUniversalDrag();
                    }
                    updateCursorAppearance('normal');
                }
                pinchFrames = 0;
                releaseFrames = 0;
                pinchHistory = [];
                cursor.style.zIndex = '9970';
            }

            requestAnimationFrame(predictHighRes);
        }

        // Fonction pour ajuster la correction de décalage
        function adjustCameraCorrection(xOffset = 0, yOffset = 0, scaleX = 1.0, scaleY = 1.0) {
            CAMERA_CORRECTION.xOffset = xOffset;
            CAMERA_CORRECTION.yOffset = yOffset;
            CAMERA_CORRECTION.scaleX = scaleX;
            CAMERA_CORRECTION.scaleY = scaleY;
            console.log('Correction caméra ajustée:', CAMERA_CORRECTION);
        }

        // Initialisation et démarrage
        async function main() {
            await setupCamera();
            await initializeModel();
            requestAnimationFrame(predictHighRes);
        }

        // Démarrer l'application
        main();

        // Exposer les fonctions globales
        window.adjustCameraCorrection = adjustCameraCorrection;
        
        // Fonction utilitaire pour forcer le drag sur un élément spécifique
        window.forceDragOnElement = function(element) {
            if (element) {
                startUniversalDrag(element);
            }
        };
