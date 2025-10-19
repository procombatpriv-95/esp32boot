import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.4";

const video = document.getElementById("camera");
const cursor = document.getElementById("cursor");

// Variables optimisées pour la précision
let smoothX = window.innerWidth / 2;
let smoothY = window.innerHeight / 2;
let isMouseDown = false;

// Paramètres de détection de pincement ultra-précis
const PINCH_CONFIG = {
  threshold: 0.045,        // Seuil très bas pour détection précise
  releaseThreshold: 0.065, // Hystérésis pour stabilité
  historyLength: 10,       // Historique long pour stabilité
  minFrames: 4,            // Plus de frames pour confirmation
  minReleaseFrames: 3      // Plus de frames pour confirmer le relâchement
};

// Paramètres de lissage et mouvement
const MOVEMENT_CONFIG = {
  baseLerp: 0.82,          // Lissage agressif pour stabilité
  slowLerp: 0.35,          // Lissage très fort près des éléments
  predictionStrength: 0.15, // Légère prédiction de mouvement
  slowDownRadius: 60,      // Grand rayon de détection
  maxSpeed: 50,            // Limite de vitesse pour éviter les saccades
  noiseReduction: 0.8      // Réduction du bruit
};

let pinchHistory = [];
let pinchFrames = 0;
let releaseFrames = 0;
let velocityX = 0;
let velocityY = 0;
let lastX = smoothX;
let lastY = smoothY;

// Lissage avancé avec courbe d'accélération
function advancedLerp(a, b, t) {
  // Courbe ease-out pour plus de naturel
  const easedT = 1 - Math.pow(1 - t, 2);
  return a + (b - a) * easedT;
}

// Filtre de Kalman simplifié pour réduction du bruit
class SimpleKalmanFilter {
  constructor(processNoise = 0.008, measurementNoise = 0.1) {
    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
    this.estimated = 0;
    this.error = 1;
  }
  
  update(measurement) {
    // Prédiction
    const predictedError = this.error + this.processNoise;
    
    // Mise à jour
    const kalmanGain = predictedError / (predictedError + this.measurementNoise);
    this.estimated = this.estimated + kalmanGain * (measurement - this.estimated);
    this.error = (1 - kalmanGain) * predictedError;
    
    return this.estimated;
  }
}

// Création des filtres pour chaque axe
const kalmanX = new SimpleKalmanFilter();
const kalmanY = new SimpleKalmanFilter();

// Setup caméra optimisé
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

// Chargement optimisé de MediaPipe
let handLandmarker;
try {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.4/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
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

await setupCamera();

// Détection de pincement ultra-précise avec validation multiple
function detectPinch(thumb, index, landmarks) {
  const distThumbIndex = Math.hypot(thumb.x - index.x, thumb.y - index.y);
  
  // Ajout à l'historique avec gestion de la taille
  pinchHistory.push(distThumbIndex);
  if (pinchHistory.length > PINCH_CONFIG.historyLength) {
    pinchHistory.shift();
  }
  
  // Utilisation de la médiane tronquée pour plus de robustesse
  const sorted = [...pinchHistory].sort((a, b) => a - b);
  const trimCount = Math.floor(pinchHistory.length * 0.2);
  const trimmed = sorted.slice(trimCount, -trimCount);
  const medianDistance = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  
  // Validation supplémentaire avec d'autres points de la main
  const thumbMcp = landmarks[2];  // Base du pouce
  const indexMcp = landmarks[5];  // Base de l'index
  const palmDistance = Math.hypot(thumbMcp.x - indexMcp.x, thumbMcp.y - indexMcp.y);
  const relativeDistance = medianDistance / (palmDistance + 0.001);
  
  // Détection avec hystérésis et validation multiple
  let pinchDetected;
  
  if (isMouseDown) {
    pinchDetected = medianDistance < PINCH_CONFIG.releaseThreshold && relativeDistance < 0.25;
  } else {
    pinchDetected = medianDistance < PINCH_CONFIG.threshold && relativeDistance < 0.18;
  }
  
  // Comptage de frames pour stabilité
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

// Calcul de vitesse pour lissage adaptatif
function calculateVelocity(x, y, deltaTime) {
  const deltaX = x - lastX;
  const deltaY = y - lastY;
  
  velocityX = (velocityX * 0.7 + deltaX / deltaTime * 0.3) * MOVEMENT_CONFIG.noiseReduction;
  velocityY = (velocityY * 0.7 + deltaY / deltaTime * 0.3) * MOVEMENT_CONFIG.noiseReduction;
  
  // Limitation de vitesse
  const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
  if (speed > MOVEMENT_CONFIG.maxSpeed) {
    velocityX = (velocityX / speed) * MOVEMENT_CONFIG.maxSpeed;
    velocityY = (velocityY / speed) * MOVEMENT_CONFIG.maxSpeed;
  }
  
  lastX = x;
  lastY = y;
  
  return { vx: velocityX, vy: velocityY };
}

// Détection de proximité avancée
function calculateSlowDownFactor(x, y) {
  if (isMouseDown) return { factor: 1.0, isNear: false };
  
  const elements = document.elementsFromPoint(x, y);
  let isNear = false;
  let minDistance = MOVEMENT_CONFIG.slowDownRadius;
  
  for (const element of elements) {
    if (element.matches('button, input, textarea, select, a, [onclick], [tabindex], [role="button"]')) {
      const rect = element.getBoundingClientRect();
      
      // Distance au bord le plus proche
      const distLeft = Math.abs(x - rect.left);
      const distRight = Math.abs(x - rect.right);
      const distTop = Math.abs(y - rect.top);
      const distBottom = Math.abs(y - rect.bottom);
      
      const minEdgeDist = Math.min(distLeft, distRight, distTop, distBottom);
      
      if (minEdgeDist < minDistance) {
        minDistance = minEdgeDist;
        isNear = true;
      }
      
      // Si directement sur l'élément, ralentissement maximum
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        minDistance = 0;
        isNear = true;
        break;
      }
    }
  }
  
  if (isNear) {
    const intensity = 1 - (minDistance / MOVEMENT_CONFIG.slowDownRadius);
    const factor = Math.max(0.15, 1.0 - intensity * 0.85);
    return { factor, isNear };
  }
  
  return { factor: 1.0, isNear: false };
}

let lastTime = performance.now();

async function predict() {
  const currentTime = performance.now();
  const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2.0); // Normalisé à ~60FPS
  lastTime = currentTime;

  const nowInMs = performance.now();
  const result = handLandmarker.detectForVideo(video, nowInMs);

  if (result.landmarks && result.landmarks.length > 0) {
    const landmarks = result.landmarks[0];
    const index = landmarks[8];
    const thumb = landmarks[4];

    // Coordonnées brutes avec inversion horizontale
    const rawX = window.innerWidth * (1 - index.x);
    const rawY = window.innerHeight * index.y;

    // Application du filtre de Kalman
    const filteredX = kalmanX.update(rawX);
    const filteredY = kalmanY.update(rawY);

    // Calcul de la vitesse
    calculateVelocity(filteredX, filteredY, deltaTime);

    // Calcul du ralentissement
    const { factor: slowDownFactor, isNear } = calculateSlowDownFactor(filteredX, filteredY);

    // Lissage adaptatif avec prédiction
    let lerpFactor = isNear ? MOVEMENT_CONFIG.slowLerp : MOVEMENT_CONFIG.baseLerp;
    
    // Ajustement dynamique basé sur la vitesse
    const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    lerpFactor = Math.max(lerpFactor, 0.5 - speed * 0.01);
    
    // Application du lissage avec prédiction
    const predictedX = filteredX + velocityX * MOVEMENT_CONFIG.predictionStrength;
    const predictedY = filteredY + velocityY * MOVEMENT_CONFIG.predictionStrength;
    
    smoothX = advancedLerp(smoothX, predictedX, lerpFactor * slowDownFactor);
    smoothY = advancedLerp(smoothY, predictedY, lerpFactor * slowDownFactor);
    
    // Mise à jour position curseur
    cursor.style.left = smoothX + "px";
    cursor.style.top = smoothY + "px";

    // Détection de pincement
    const isPinching = detectPinch(thumb, index, landmarks);
    
    const elUnderCursor = document.elementFromPoint(smoothX, smoothY);
    if (!elUnderCursor) {
      requestAnimationFrame(predict);
      return;
    }

    // Gestion des états du curseur
    cursor.classList.toggle('pinching', isMouseDown);
    cursor.classList.toggle('slowing', isNear && !isMouseDown);

    // Émission des événements avec optimisation
    if (!isMouseDown || (isMouseDown && slowDownFactor < 0.5)) {
      const moveEvents = [
        new MouseEvent("mousemove", {
          bubbles: true, cancelable: true,
          clientX: smoothX, clientY: smoothY
        }),
        new PointerEvent("pointermove", {
          bubbles: true, cancelable: true,
          clientX: smoothX, clientY: smoothY,
          pointerType: "mouse"
        })
      ];
      
      moveEvents.forEach(event => elUnderCursor.dispatchEvent(event));
    }

    // Gestion précise du clic
    if (isPinching && !isMouseDown) {
      isMouseDown = true;
      
      const downEvents = [
        new MouseEvent("mousedown", {
          bubbles: true, cancelable: true,
          clientX: smoothX, clientY: smoothY, button: 0
        }),
        new PointerEvent("pointerdown", {
          bubbles: true, cancelable: true,
          clientX: smoothX, clientY: smoothY,
          pointerType: "mouse", button: 0
        })
      ];
      
      downEvents.forEach(event => elUnderCursor.dispatchEvent(event));
      
    } else if (!isPinching && isMouseDown) {
      isMouseDown = false;
      
      const upEvents = [
        new MouseEvent("mouseup", {
          bubbles: true, cancelable: true,
          clientX: smoothX, clientY: smoothY, button: 0
        }),
        new PointerEvent("pointerup", {
          bubbles: true, cancelable: true,
          clientX: smoothX, clientY: smoothY,
          pointerType: "mouse", button: 0
        })
      ];
      
      upEvents.forEach(event => elUnderCursor.dispatchEvent(event));
      
      // Émission du clic avec vérification
      setTimeout(() => {
        if (!isMouseDown) {
          elUnderCursor.dispatchEvent(new MouseEvent("click", {
            bubbles: true, cancelable: true,
            clientX: smoothX, clientY: smoothY
          }));
        }
      }, 8);
    }
    
    // Événements pendant le maintien
    if (isMouseDown) {
      const dragEvents = [
        new MouseEvent("mousemove", {
          bubbles: true, cancelable: true,
          clientX: smoothX, clientY: smoothY
        }),
        new PointerEvent("pointermove", {
          bubbles: true, cancelable: true,
          clientX: smoothX, clientY: smoothY,
          pointerType: "mouse"
        })
      ];
      
      dragEvents.forEach(event => document.dispatchEvent(event));
    }
    
  } else {
    // Reset en cas de perte de main
    if (isMouseDown) {
      isMouseDown = false;
      cursor.classList.remove('pinching');
    }
    pinchFrames = 0;
    releaseFrames = 0;
  }

  requestAnimationFrame(predict);
}

// Démarrage
predict();
  requestAnimationFrame(predict);
}

predict();
