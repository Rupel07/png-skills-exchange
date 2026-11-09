import { Coords } from "../services/location";

export type MapPin = {
  id: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
};

type MapData = {
  user: Coords | null;
  pins: MapPin[];
  center: Coords;
  zoom: number;
};

// OpenStreetMap's tile servers expect requests to identify the app, so the
// page is loaded with the project's repository as its origin.
export const MAP_BASE_URL = "https://github.com/Rupel07/png-skills-exchange";

// The data is embedded as JSON; escaping "<" stops skill text from closing the script tag.
const safeJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

export function buildMapHtml(data: MapData): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
<meta name="referrer" content="unsafe-url" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  .popup-category { color: #5B6470; margin: 2px 0 8px; }
  .popup-button { background: #1F6FEB; color: #fff; border: 0; border-radius: 6px; padding: 6px 10px; font-weight: 600; }
</style>
<script>
  function send(message) { window.ReactNativeWebView.postMessage(JSON.stringify(message)); }
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
</head>
<body>
<div id="map"></div>
<script>
  var data = ${safeJson(data)};
  if (typeof L === "undefined") {
    send({ type: "error" });
  } else {
    var map = L.map("map").setView([data.center.latitude, data.center.longitude], data.zoom);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    var markers = {};
    data.pins.forEach(function (pin) {
      // Built with textContent so skill names can never inject HTML.
      var box = document.createElement("div");
      var title = document.createElement("strong");
      title.textContent = pin.title;
      var category = document.createElement("div");
      category.className = "popup-category";
      category.textContent = pin.category;
      var button = document.createElement("button");
      button.className = "popup-button";
      button.textContent = "View details";
      button.onclick = function () { send({ type: "open", id: pin.id }); };
      box.appendChild(title);
      box.appendChild(category);
      box.appendChild(button);
      markers[pin.id] = L.marker([pin.latitude, pin.longitude]).addTo(map).bindPopup(box);
    });

    if (data.user) {
      L.circleMarker([data.user.latitude, data.user.longitude], {
        radius: 8, color: "#ffffff", weight: 3, fillColor: "#1F6FEB", fillOpacity: 1
      }).addTo(map);
    }

    window.focusSkill = function (id) {
      var marker = markers[id];
      if (marker) { map.setView(marker.getLatLng(), 16); marker.openPopup(); }
    };

    send({ type: "ready" });
  }
</script>
</body>
</html>`;
}
