import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.4";

const video = document.getElementById("camera");
const cursor = document.getElementById("cursor");

let smoothX = window.innerWidth / 2;
let smoothY = window.innerHeight / 2;
let isMouseDown = false;
let pinchThreshold = 0.08; // Seuil ajusté pour mieux fonctionner
let releaseThreshold = 0.12; // Seuil de relâchement ajusté
let pinchHistory = [];
let pinchHistoryMaxLength = 5;
let pinchFrames = 0;
let releaseFrames = 0;
let minPinchFrames = 2;
let minReleaseFrames = 2;

// Pour l'effet de ralentissement
let slowDownRadius = 40;
let currentSlowDownFactor = 1.0;

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

// Détection de pincement simplifiée et plus fiable
function detectPinch(thumb, index) {
  const distThumbIndex = Math.hypot(thumb.x - index.x, thumb.y - index.y);
  
  // Ajouter à l'historique
  pinchHistory.push(distThumbIndex);
  if (pinchHistory.length > pinchHistoryMaxLength) {
    pinchHistory.shift();
  }
  
  // Utiliser la moyenne pour plus de stabilité
  const avgDistance = pinchHistory.reduce((a, b) => a + b, 0) / pinchHistory.length;
  
  // Détection avec hystérésis simple
  if (isMouseDown) {
    // Relâcher seulement si la distance dépasse le seuil de relâchement
    return avgDistance < releaseThreshold;
  } else {
    // Pincer seulement si la distance est inférieure au seuil de pincement
    return avgDistance < pinchThreshold;
  }
}

// Fonction pour calculer le facteur de ralentissement
function calculateSlowDownFactor(x, y) {
  if (isMouseDown) return 1.0;
  
  const interactiveSelectors = ['button', 'input', 'textarea', 'select', 'a', '[onclick]', '[tabindex]'];
  let minDistance = slowDownRadius;
  
  interactiveSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      if (distance < minDistance) {
        minDistance = distance;
      }
    });
  });
  
  if (minDistance < slowDownRadius) {
    // Plus on est proche, plus on ralentit (de 1.0 à 0.3)
    return Math.max(0.3, 1.0 - (minDistance / slowDownRadius) * 0.7);
  }
  
  return 1.0;
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

    // Calculer le facteur de ralentissement
    currentSlowDownFactor = calculateSlowDownFactor(rawX, rawY);
    
    // Adoucissement avec ralentissement
    const lerpFactor = 0.7 * currentSlowDownFactor;
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

    // Changer la couleur du curseur selon l'état
    if (isMouseDown) {
      cursor.style.background = "green";
    } else {
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

    // Clic - logique simplifiée
    if (isPinching && !isMouseDown) {
      isMouseDown = true;
      pinchFrames = 0;
      releaseFrames = 0;
      cursor.style.background = "green";
      
      console.log("Pincement détecté - mousedown");
      
      // Émettre les événements de souris
      elUnderCursor.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY,
          button: 0
        })
      );
      
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
      pinchFrames = 0;
      releaseFrames = 0;
      cursor.style.background = "rgba(0,128,255,0.9)";
      
      console.log("Relâchement détecté - mouseup");
      
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
      
      // Déclencher un clic
      setTimeout(() => {
        elUnderCursor.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            clientX: smoothX,
            clientY: smoothY
          })
        );
        console.log("Clic émis");
      }, 10);
    }
    
  } else {
    // Réinitialiser si on perd la main
    pinchFrames = 0;
    releaseFrames = 0;
    if (isMouseDown) {
      isMouseDown = false;
      cursor.style.background = "rgba(0,128,255,0.9)";
    }
  }

  requestAnimationFrame(predict);
}

predict();
