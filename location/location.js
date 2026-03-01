  async function getAddress(lat, lon) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=fr`,
        {
          headers: {
            "User-Agent": "around-app/1.0 (test)",
            "Accept-Language": "fr"
          }
        }
      );
      if (!res.ok) throw new Error("Réponse HTTP invalide");
      const data = await res.json();

      // Quartier
      let suburb =
        data.address.suburb ||
        data.address.neighbourhood ||
        data.address.quarter ||
        "Quartier inconnu";

      // Borough / District
      let borough =
        data.address.borough ||
        data.address.city_district ||
        "Borough inconnu";

      // Ville
      let city =
        data.address.city ||
        data.address.town ||
        data.address.municipality ||
        data.address.county ||
        "Ville inconnue";

      document.getElementById("output").textContent =
        `Around: ${suburb}, ${borough}, ${city}`;
    } catch (e) {
      document.getElementById("output").textContent = "Erreur adresse : " + e;
    }
  }

  function success(pos) {
    const crd = pos.coords;
    getAddress(crd.latitude, crd.longitude);
  }

  function error(err) {
    document.getElementById("output").textContent =
      `Erreur (${err.code}): ${err.message}`;
  }

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
  } else {
    document.getElementById("output").textContent =
      "❌ Géolocalisation non supportée par ce navigateur.";
  }
