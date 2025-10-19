import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.4";

const video = document.getElementById("camera");
const cursor = document.getElementById("cursor");

let smoothX = window.innerWidth / 2;
let smoothY = window.innerHeight / 2;
let isMouseDown = false;
let pinchThreshold = 0.07; // Seuil plus bas pour plus de précision
let releaseThreshold = 0.10; // Seuil de relâchement ajusté
let pinchHistory = [];
let pinchHistoryMaxLength = 7; // Historique plus long pour plus de stabilité
let pinchFrames = 0;
let releaseFrames = 0;
let minPinchFrames = 2;
let minReleaseFrames = 2;

// Pour l'effet de ralentissement
let slowDownRadius = 50; // Rayon plus large
let currentSlowDownFactor = 1.0;
let isNearInteractiveElement = false;

// Lissage des mouvements avec différentes vitesses
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Setup caméra
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" }
    });
    video.srcObject = stream;
    return new Promise(resolve => {
      video.onloadedmetadata = () => resolve(video);
    });
  } catch (error) {
    console.error("Erreur caméra:", error);
    throw error;
  }
}

// Charger MediaPipe
let handLandmarker;
try {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.4/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
    },
    runningMode: "VIDEO",
    numHands: 1
  });
} catch (error) {
  console.error("Erreur modèle:", error);
}

await setupCamera();

// Détection de pincement améliorée avec stabilité
function detectPinch(thumb, index) {
  const distThumbIndex = Math.hypot(thumb.x - index.x, thumb.y - index.y);
  
  // Ajouter à l'historique
  pinchHistory.push(distThumbIndex);
  if (pinchHistory.length > pinchHistoryMaxLength) {
    pinchHistory.shift();
  }
  
  // Utiliser la médiane pour plus de stabilité
  const sortedHistory = [...pinchHistory].sort((a, b) => a - b);
  const medianDistance = sortedHistory[Math.floor(sortedHistory.length / 2)];
  
  // Détection avec hystérésis
  let pinchDetected;
  
  if (isMouseDown) {
    pinchDetected = medianDistance < releaseThreshold;
  } else {
    pinchDetected = medianDistance < pinchThreshold;
  }
  
  if (pinchDetected) {
    pinchFrames++;
    releaseFrames = 0;
  } else {
    releaseFrames++;
    pinchFrames = 0;
  }
  
  if (pinchFrames >= minPinchFrames) {
    return true;
  }
  
  if (releaseFrames >= minReleaseFrames) {
    return false;
  }
  
  return isMouseDown;
}

// Fonction pour calculer le facteur de ralentissement amélioré
function calculateSlowDownFactor(x, y) {
  if (isMouseDown) return 1.0;
  
  const interactiveSelectors = ['button', '.draggable', 'canvas', 'input', 'textarea', 'select', 'a', '[onclick]', '[tabindex]'];
  let minDistance = slowDownRadius;
  isNearInteractiveElement = false;
  
  interactiveSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      
      // Vérifier si le curseur est dans l'élément
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        isNearInteractiveElement = true;
        minDistance = 0;
        return;
      }
      
      // Calculer la distance au centre
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      if (distance < minDistance) {
        minDistance = distance;
        isNearInteractiveElement = true;
      }
    });
  });
  
  if (isNearInteractiveElement) {
    // Ralentissement progressif et plus prononcé
    const slowDownIntensity = 1 - (minDistance / slowDownRadius);
    return Math.max(0.2, 1.0 - slowDownIntensity * 0.8); // De 1.0 à 0.2
  }
  
  return 1.0;
}

// Système de drag and drop fluide
function makeElementDraggable(element) {
  let isDragging = false;
  let startX, startY;
  let startLeft = 0, startTop = 0;

  // Initialiser la position
  const rect = element.getBoundingClientRect();
  if (element.style.position !== 'absolute') {
    element.style.position = 'absolute';
    element.style.left = rect.left + 'px';
    element.style.top = rect.top + 'px';
  }

  function startDrag(e) {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    
    // Récupérer la position actuelle
    startLeft = parseInt(element.style.left) || 0;
    startTop = parseInt(element.style.top) || 0;
    
    element.classList.add('dragging');
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    e.preventDefault();
  }

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

  // Écouter les événements
  element.addEventListener('mousedown', startDrag);
  element.addEventListener('pointerdown', startDrag);
}

// Initialiser les éléments draggables
function initDraggableElements() {
  const draggables = document.querySelectorAll('.draggable');
  draggables.forEach(makeElementDraggable);
  
  const canvas = document.getElementById('myCanvas');
  makeElementDraggable(canvas);
}

// Initialiser le drag and drop
initDraggableElements();

async function predict() {
  const nowInMs = performance.now();
  const result = handLandmarker.detectForVideo(video, nowInMs);

  if (result.landmarks && result.landmarks.length > 0) {
    const landmarks = result.landmarks[0];
    const index = landmarks[8];
    const thumb = landmarks[4];

    // Coordonnées curseur brutes
    const rawX = window.innerWidth * (1 - index.x);
    const rawY = window.innerHeight * index.y;

    // Calculer le facteur de ralentissement
    currentSlowDownFactor = calculateSlowDownFactor(rawX, rawY);
    
    // Adoucissement adaptatif avec ralentissement
    let lerpFactor;
    if (isNearInteractiveElement) {
      // Ralentissement important près des éléments interactifs
      lerpFactor = 0.4 * currentSlowDownFactor;
    } else {
      // Vitesse normale ailleurs
      lerpFactor = 0.7;
    }
    
    smoothX = lerp(smoothX, rawX, lerpFactor);
    smoothY = lerp(smoothY, rawY, lerpFactor);
    
    cursor.style.left = smoothX + "px";
    cursor.style.top = smoothY + "px";

    // Détection du pincement
    const isPinching = detectPinch(thumb, index);
    
    const elUnderCursor = document.elementFromPoint(smoothX, smoothY);
    if (!elUnderCursor) {
      requestAnimationFrame(predict);
      return;
    }

    // Feedback visuel amélioré
    if (isMouseDown) {
      cursor.style.background = "green";
      cursor.style.transform = "translate(-50%, -50%) scale(0.8)";
    } else if (isNearInteractiveElement) {
      cursor.style.background = "rgba(255, 165, 0, 0.9)";
      cursor.style.transform = "translate(-50%, -50%) scale(1.2)";
    } else {
      cursor.style.background = "rgba(0, 128, 255, 0.9)";
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
    }

    // Émettre les événements de souris seulement si nécessaire
    if (!isMouseDown || (isMouseDown && currentSlowDownFactor < 0.5)) {
      // Mouse move
      elUnderCursor.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY
        })
      );

      // Pointer move
      elUnderCursor.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY,
          pointerType: "mouse"
        })
      );
    }

    // Gestion du clic et du drag
    if (isPinching && !isMouseDown) {
      isMouseDown = true;
      cursor.style.background = "green";
      cursor.style.transform = "translate(-50%, -50%) scale(0.8)";
      
      // Émettre les événements de souris pour commencer le drag
      const mouseDownEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        clientX: smoothX,
        clientY: smoothY,
        button: 0
      });
      
      const pointerDownEvent = new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        clientX: smoothX,
        clientY: smoothY,
        pointerType: "mouse",
        button: 0
      });
      
      elUnderCursor.dispatchEvent(mouseDownEvent);
      elUnderCursor.dispatchEvent(pointerDownEvent);
      
    } else if (!isPinching && isMouseDown) {
      isMouseDown = false;
      cursor.style.background = isNearInteractiveElement ? 
        "rgba(255, 165, 0, 0.9)" : "rgba(0, 128, 255, 0.9)";
      cursor.style.transform = isNearInteractiveElement ? 
        "translate(-50%, -50%) scale(1.2)" : "translate(-50%, -50%) scale(1)";
      
      // Émettre les événements de souris pour terminer le drag
      const mouseUpEvent = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: true,
        clientX: smoothX,
        clientY: smoothY,
        button: 0
      });
      
      const pointerUpEvent = new PointerEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        clientX: smoothX,
        clientY: smoothY,
        pointerType: "mouse",
        button: 0
      });
      
      elUnderCursor.dispatchEvent(mouseUpEvent);
      elUnderCursor.dispatchEvent(pointerUpEvent);
      
      // Déclencher un clic seulement si ce n'est pas un drag
      setTimeout(() => {
        const clickEvent = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY
        });
        elUnderCursor.dispatchEvent(clickEvent);
      }, 10);
    }
    
    // Pendant le drag, continuer à émettre des événements de mouvement
    if (isMouseDown) {
      document.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY
        })
      );
      
      document.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY,
          pointerType: "mouse"
        })
      );
    }
    
  } else {
    // Réinitialiser si on perd la main
    if (isMouseDown) {
      isMouseDown = false;
      cursor.style.background = "rgba(0, 128, 255, 0.9)";
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
    }
  }

  requestAnimationFrame(predict);
}

predict();
