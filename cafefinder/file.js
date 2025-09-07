let map;
let geocoder;
let infoWindow;
let markers = [];
let service;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 22.9734, lng: 78.6569 },
    zoom: 5,
  });

  geocoder = new google.maps.Geocoder();
  infoWindow = new google.maps.InfoWindow();
  service = new google.maps.places.PlacesService(map);

  document.getElementById("searchBtn").addEventListener("click", findCity);
  document.getElementById("nearbyBtn").addEventListener("click", NearbyCafes);

  // ✅ Default load: nearby cafes
  NearbyCafes();
}

// ---- Search cafes by city ----
function findCity() {
  const city = document.getElementById("city-input").value.trim();
  if (!city) {
    NearbyCafes(); // fallback
    return;
  }

  geocoder.geocode({ address: city }, (results, status) => {
    if (status === "OK" && results[0]) {
      const cityLocation = results[0].geometry.location;
      map.setCenter(cityLocation);
      map.setZoom(14);
      clearMarkers(); 
      searchCafes(cityLocation);
    } else {
      alert("City not found: " + status);
    }
  });
}

// ---- Find cafes near user ----
function NearbyCafes() {
  const radius = parseInt(document.getElementById("radiusSelect")?.value || "5000");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const userposition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        new google.maps.Marker({
          map,
          position: userposition,
          title: "You are here",
          icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        });

        map.setCenter(userposition);
        map.setZoom(15);

        clearMarkers();
        searchCafes(userposition, radius);
      },
      error => {
        alert("Unable to retrieve your location. Please enable GPS.");
        console.error(error);
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

// ---- Search cafes & show in sidebar ----
function searchCafes(location, radius = 5000) {
  const request = {
    location,
    radius,
    type: "cafe",
  };

  service.nearbySearch(request, (results, status) => {
    const panel = document.getElementById("panel");
    panel.innerHTML = ""; 

    if (status === google.maps.places.PlacesServiceStatus.OK && results.length) {
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0)); 

      results.forEach(place => {
        if (!place.geometry || !place.geometry.location) return;

        const marker = new google.maps.Marker({
          map,
          position: place.geometry.location,
          title: place.name,
          icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        });

        // ✅ InfoWindow styled via CSS
        marker.addListener("click", () => {
          infoWindow.setContent(`
            <div class="info-window">
              <h3>${place.name}</h3>
              <p class="rating">⭐ ${place.rating !== undefined ? place.rating : "N/A"}</p>
              <p class="address">${place.vicinity || ""}</p>
            </div>
          `);
          infoWindow.open(map, marker);
        });

        markers.push(marker);

        // ✅ Sidebar block
        const stars = place.rating 
          ? "⭐".repeat(Math.floor(place.rating)) + (place.rating % 1 >= 0.5 ? "✦" : "") 
          : "No rating";

        const cafeBlock = document.createElement("div");
        cafeBlock.classList.add("cafe-block");
        cafeBlock.innerHTML = `
          <h4>${place.name}</h4>
          <p class="rating">${stars}</p>
          <p class="address">${place.vicinity || ""}</p>
        `;

        cafeBlock.addEventListener("click", () => {
          map.panTo(place.geometry.location);
          map.setZoom(16);
          google.maps.event.trigger(marker, "click");
        });

        panel.appendChild(cafeBlock);
      });
    } else {
      panel.innerHTML = "<p style='color:#f87171; font-weight:bold;'>No cafes found near this location.</p>";
    }
  });
}

function clearMarkers() {
  markers.forEach(m => m.setMap(null));
  markers = [];
}
