import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.4";

const video = document.getElementById("camera");
const cursor = document.getElementById("cursor");

let smoothX = window.innerWidth / 2;
let smoothY = window.innerHeight / 2;
let isMouseDown = false;
let pinchThreshold = 0.130;
let releaseThreshold = 0.085;
let pinchHistory = [];
let pinchHistoryMaxLength = 5;
let pinchFrames = 0;
let releaseFrames = 0;
let minPinchFrames = 2;
let minReleaseFrames = 2;

// Pour l'aimant des boutons
let magnetActive = true;
let magnetRadius = 30; // Rayon d'attraction en pixels
let lastElementUnderCursor = null;
let isOverInteractiveElement = false;

// Lissage des mouvements
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

// Détection du pincement avec hystérésis
function detectPinch(thumb, index) {
  const distThumbIndex = Math.hypot(thumb.x - index.x, thumb.y - index.y);
  
  // Ajouter à l'historique
  pinchHistory.push(distThumbIndex);
  if (pinchHistory.length > pinchHistoryMaxLength) {
    pinchHistory.shift();
  }
  
  // Utiliser la moyenne pour plus de stabilité
  const avgDistance = pinchHistory.reduce((a, b) => a + b, 0) / pinchHistory.length;
  
  // Détection avec hystérésis - deux seuils différents
  let pinchDetected;
  
  if (isMouseDown) {
    pinchDetected = avgDistance < releaseThreshold;
  } else {
    pinchDetected = avgDistance < pinchThreshold;
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

// Fonction pour trouver l'élément interactif le plus proche
function findNearestInteractiveElement(x, y) {
  const interactiveSelectors = ['button', 'input', 'textarea', 'select', 'a', '[onclick]', '[tabindex]'];
  let nearestElement = null;
  let minDistance = magnetRadius;
  
  interactiveSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestElement = element;
      }
    });
  });
  
  return nearestElement;
}

// Fonction pour calculer la position avec aimant
function applyMagnetEffect(x, y) {
  if (!magnetActive || isMouseDown) return { x, y };
  
  const nearestElement = findNearestInteractiveElement(x, y);
  if (nearestElement) {
    const rect = nearestElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Appliquer un effet d'aimant progressif
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    const magnetStrength = 1 - (distance / magnetRadius);
    
    if (magnetStrength > 0) {
      const newX = lerp(x, centerX, magnetStrength * 0.7);
      const newY = lerp(y, centerY, magnetStrength * 0.7);
      return { x: newX, y: newY };
    }
  }
  
  return { x, y };
}

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

    // Appliquer l'effet d'aimant
    const magnetCoords = applyMagnetEffect(rawX, rawY);
    
    // Adoucissement
    smoothX = lerp(smoothX, magnetCoords.x, 0.7);
    smoothY = lerp(smoothY, magnetCoords.y, 0.7);
    
    cursor.style.left = smoothX + "px";
    cursor.style.top = smoothY + "px";

    // Détection du pincement
    const isPinching = detectPinch(thumb, index);
    
    const elUnderCursor = document.elementFromPoint(smoothX, smoothY);
    if (!elUnderCursor) {
      requestAnimationFrame(predict);
      return;
    }

    // Vérifier si on est sur un élément interactif
    const isInteractive = elUnderCursor.matches('button, input, textarea, select, a, [onclick], [tabindex]');
    
    // Changer l'apparence du curseur selon l'élément
    if (isInteractive && !isMouseDown) {
      cursor.style.transform = "translate(-50%, -50%) scale(1.3)";
      cursor.style.background = "rgba(255,165,0,0.9)"; // Orange pour indiquer l'interaction
    } else if (isMouseDown) {
      cursor.style.transform = "translate(-50%, -50%) scale(0.7)";
      cursor.style.background = "green";
    } else {
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
      cursor.style.background = "rgba(0,128,255,0.9)";
    }

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

    // Mouse move (pour compatibilité avec les anciens systèmes)
    elUnderCursor.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        clientX: smoothX,
        clientY: smoothY
      })
    );

    // Clic
    if (isPinching && !isMouseDown) {
      isMouseDown = true;
      cursor.style.background = "green";
      cursor.style.transform = "translate(-50%, -50%) scale(0.7)";
      
      // Émettre les événements de souris pour le drag
      elUnderCursor.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY,
          button: 0
        })
      );
      
      // Émettre aussi l'événement pointerdown
      elUnderCursor.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY,
          pointerType: "mouse",
          button: 0
        })
      );
      
    } else if (!isPinching && isMouseDown) {
      isMouseDown = false;
      cursor.style.background = "rgba(0,128,255,0.9)";
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
      
      // Émettre les événements de souris pour le relâchement
      elUnderCursor.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY,
          button: 0
        })
      );
      
      // Émettre aussi l'événement pointerup
      elUnderCursor.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY,
          pointerType: "mouse",
          button: 0
        })
      );
      
      // Déclencher un clic seulement si ce n'est pas un drag
      setTimeout(() => {
        if (!isMouseDown) {
          elUnderCursor.dispatchEvent(
            new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              clientX: smoothX,
              clientY: smoothY
            })
          );
        }
      }, 10);
    }
    
  } else {
    // Réinitialiser les compteurs si on perd la main
    pinchFrames = 0;
    releaseFrames = 0;
  }

  requestAnimationFrame(predict);
}

predict();
