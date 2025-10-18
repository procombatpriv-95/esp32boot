import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.4";

const video = document.getElementById("camera");
const cursor = document.getElementById("cursor");
const status = document.getElementById("status");

let smoothX = window.innerWidth / 2;
let smoothY = window.innerHeight / 2;
let isMouseDown = false;
let pinchThreshold = 0.130; // Seuil de détection de pincement
let releaseThreshold = 0.085; // Seuil de relâchement
let pinchHistory = [];
let pinchHistoryMaxLength = 5;
let pinchFrames = 0;
let releaseFrames = 0;
let minPinchFrames = 2;
let minReleaseFrames = 2;

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
    status.textContent = "Erreur caméra: " + error.message;
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
  
  status.textContent = "Modèle chargé";
} catch (error) {
  status.textContent = "Erreur modèle: " + error.message;
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
    // Si on est déjà en état pincé, on reste pincé jusqu'à ce que la distance dépasse le seuil de relâchement
    pinchDetected = avgDistance < releaseThreshold;
  } else {
    // Si on n'est pas pincé, on déclenche seulement si la distance est inférieure au seuil de pincement
    pinchDetected = avgDistance < pinchThreshold;
  }
  
  if (pinchDetected) {
    pinchFrames++;
    releaseFrames = 0;
  } else {
    releaseFrames++;
    pinchFrames = 0;
  }
  
  // Ne déclencher le pincement qu'après plusieurs frames de détection
  if (pinchFrames >= minPinchFrames) {
    return true;
  }
  
  // Ne relâcher qu'après plusieurs frames sans détection
  if (releaseFrames >= minReleaseFrames) {
    return false;
  }
  
  // Maintenir l'état précédent pendant la période de transition
  return isMouseDown;
}

async function predict() {
  const nowInMs = performance.now();
  const result = handLandmarker.detectForVideo(video, nowInMs);

  if (result.landmarks && result.landmarks.length > 0) {
    const landmarks = result.landmarks[0];
    const index = landmarks[8];
    const thumb = landmarks[4];

    // Coordonnées curseur
    const x = window.innerWidth * (1 - index.x);
    const y = window.innerHeight * index.y;

    // Adoucissement
    smoothX = lerp(smoothX, x, 0.7);
    smoothY = lerp(smoothY, y, 0.7);
    cursor.style.left = smoothX + "px";
    cursor.style.top = smoothY + "px";

    // Détection du pincement (clic)
    const isPinching = detectPinch(thumb, index);
    
    const elUnderCursor = document.elementFromPoint(smoothX, smoothY);
    if (!elUnderCursor) {
      requestAnimationFrame(predict);
      return;
    }

    // Pointer move (toujours envoyé)
    elUnderCursor.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        cancelable: true,
        clientX: smoothX,
        clientY: smoothY,
        pointerType: "mouse"
      })
    );

    // Clic ou drag
    if (isPinching && !isMouseDown) {
      isMouseDown = true;
      cursor.style.background = "green";
      cursor.style.transform = "translate(-50%, -50%) scale(0.7)";
      status.textContent = "Pincement détecté";
      
      elUnderCursor.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY,
          pointerType: "mouse"
        })
      );
    } else if (!isPinching && isMouseDown) {
      isMouseDown = false;
      cursor.style.background = "rgba(0,128,255,0.9)";
      cursor.style.transform = "translate(-50%, -50%) scale(1)";
      status.textContent = "Main détectée";
      
      elUnderCursor.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY,
          pointerType: "mouse"
        })
      );
      
      // Déclencher un clic
      elUnderCursor.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          clientX: smoothX,
          clientY: smoothY
        })
      );
    }
    
  } else {
    status.textContent = "Aucune main détectée";
    // Réinitialiser les compteurs si on perd la main
    pinchFrames = 0;
    releaseFrames = 0;
  }

  requestAnimationFrame(predict);
}

predict();
