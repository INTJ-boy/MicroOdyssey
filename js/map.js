/* ============================================================
   MICROBIAL ODYSSEY -- interactive map (Leaflet, real coordinates)
   ============================================================ */

async function initOdysseyMap(){
  const mapEl = document.getElementById("odyssey-map");
  if(!mapEl || typeof L === "undefined") return;

  await loadLocations();
  const t = I18N[getLang()];

  const map = L.map("odyssey-map", { scrollWheelZoom: false, worldCopyJump: true }).setView([20, 10], 2);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 18
  }).addTo(map);

  const markerIcon = L.divIcon({
    className: "",
    html: '<div style="width:11px;height:11px;border-radius:50%;background:#c6ff3d;border:2px solid #0c0f0e;box-shadow:0 0 8px rgba(198,255,61,0.8);"></div>',
    iconSize: [11, 11],
    iconAnchor: [6, 6]
  });

  const bounds = [];
  LOCATIONS.forEach(loc => {
    if(loc.lat === undefined || loc.lng === undefined) return;
    const locT = localizedLocation(loc);
    const marker = L.marker([loc.lat, loc.lng], { icon: markerIcon }).addTo(map);
    marker.bindPopup(`
      <b>${loc.name}</b><br>
      <span style="color:var(--paper-dim);">${locT.country} &middot; ${loc.year}</span>
      <p style="margin:8px 0;">${locT.significance}</p>
      <a href="locations.html?q=${encodeURIComponent(loc.name)}" style="font-family:var(--mono); font-size:0.72rem;">${t.map_open_record || "Open full record →"}</a>
    `);
    bounds.push([loc.lat, loc.lng]);
  });

  if(bounds.length) map.fitBounds(bounds, { padding: [30,30], maxZoom: 5 });

  mapEl.addEventListener("click", () => map.scrollWheelZoom.enable());
  mapEl.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());
}
