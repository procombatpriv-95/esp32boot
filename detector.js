let lastDetectorOnline = null;
let lastCameraOnline = null;

async function updateStatusDiv() {
    try {
        const res = await fetch("/status");
        const data = await res.json();

        const detectorSpan = document.getElementById("detectorStatus");
        const cameraSpan = document.getElementById("cameraStatus");

        // Style du rond
        const onlineStyle = "display:inline-block; width:10px; height:10px; border-radius:50%; background-color:lime;";
        const offlineStyle = "display:inline-block; width:10px; height:10px; border-radius:50%; background-color:red;";

        // Detector
        if (data.esp2.online) {
            detectorSpan.innerHTML = `<span style="${onlineStyle}"></span>`;
            if (lastDetectorOnline === false) addNotification("Detector is Online !");
        } else {
            detectorSpan.innerHTML = `<span style="${offlineStyle}"></span>`;
            if (lastDetectorOnline === true) addNotification("Detector is Offline !");
        }

        // Camera
        if (data.esp3.online) {
            cameraSpan.innerHTML = `<span style="${onlineStyle}"></span>`;
            if (lastCameraOnline === false) addNotification("Camera is Online !");
        } else {
            cameraSpan.innerHTML = `<span style="${offlineStyle}"></span>`;
            if (lastCameraOnline === true) addNotification("Camera is Offline !");
        }

        lastDetectorOnline = data.esp2.online;
        lastCameraOnline = data.esp3.online;

    } catch (e) {
        console.error("Erreur status fetch", e);
    }
}
     

setInterval(updateStatusDiv, 1000);
updateStatusDiv();
