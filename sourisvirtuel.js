import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.4";

const video = document.getElementById("camera");
const cursor = document.getElementById("cursor");
const dragBox = document.getElementById("dragBox");

let smoothX = window.innerWidth/2, smoothY = window.innerHeight/2;
let lastClick = 0;
let dragActive = false, dragOffsetX = 0, dragOffsetY = 0;

// Fonction lerp pour adoucir les mouvements
function lerp(a,b,t){ return a + (b-a)*t; }

// Setup caméra
async function setupCamera(){
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width:640, height:480, facingMode:"user" }
    });
    video.srcObject = stream;
    return new Promise(resolve=>{video.onloadedmetadata=()=>resolve(video)});
}

// Charger MediaPipe
const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.4/wasm"
);

const handLandmarker = await HandLandmarker.createFromOptions(vision,{
    baseOptions:{ modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task" },
    runningMode:"VIDEO",
    numHands:1
});

await setupCamera();

// Boucle principale
async function predict(){
    const nowInMs = performance.now();
    const result = handLandmarker.detectForVideo(video, nowInMs);

    if(result.landmarks && result.landmarks.length>0){
        const landmarks = result.landmarks[0];
        const index = landmarks[8];
        const middle = landmarks[12];
        const ring = landmarks[16];
        const pinky = landmarks[20];
        const thumb = landmarks[4];

        // Coordonnées curseur
        const x = window.innerWidth*(1 - index.x);
        const y = window.innerHeight*index.y;
        smoothX = lerp(smoothX, x, 0.4);
        smoothY = lerp(smoothY, y, 0.4);
        cursor.style.left = smoothX+"px";
        cursor.style.top = smoothY+"px";

        // --- Clic pincement pouce-index ---
        const distThumbIndex = Math.hypot(thumb.x-index.x, thumb.y-index.y);
        if(distThumbIndex < 0.05 && !dragActive){
            if(Date.now()-lastClick>400){
                lastClick = Date.now();
                const el = document.elementFromPoint(smoothX, smoothY);
                if(el){
                    ["pointerdown","pointerup","click"].forEach(type=>{
                        el.dispatchEvent(new PointerEvent(type,{
                            bubbles:true, cancelable:true,
                            clientX:smoothX, clientY:smoothY, pointerType:"touch"
                        }));
                    });
                }
                cursor.style.background="red";
            }
        } else if(!dragActive){
            cursor.style.background="rgba(0,128,255,0.9)";
        }

        // --- Drag & Drop : 4 doigts bien rapprochés ---
        const fingers = [index, middle, ring, pinky];
        let avgDist = 0;
        for(let f of fingers){
            avgDist += Math.hypot(f.x - thumb.x, f.y - thumb.y);
        }
        avgDist /= fingers.length;
        const DRAG_THRESHOLD = 0.10; // stricte pour éviter déclenchements intempestifs

        const elUnderCursor = document.elementFromPoint(smoothX, smoothY);

        if(avgDist < DRAG_THRESHOLD && elUnderCursor === dragBox){
            if(!dragActive){
                dragActive = true;
                dragOffsetX = smoothX - dragBox.offsetLeft;
                dragOffsetY = smoothY - dragBox.offsetTop;
                cursor.style.background="green";
            }
        }

        // Suivi du drag si actif
        if(dragActive){
            dragBox.style.left = lerp(dragBox.offsetLeft, smoothX - dragOffsetX, 0.7) + "px";
            dragBox.style.top  = lerp(dragBox.offsetTop, smoothY - dragOffsetY, 0.7) + "px";
            // Relâchement uniquement si poing ouvert
            if(avgDist >= DRAG_THRESHOLD){
                dragActive = false;
                cursor.style.background="rgba(0,128,255,0.9)";
            }
        }
    }

    requestAnimationFrame(predict);
}

predict();
