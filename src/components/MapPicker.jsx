import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT = [27.7172, 85.3240];

export default function MapPicker({ lat, lng, onConfirm, onClose }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const posRef = useRef(
    lat && lng ? [parseFloat(lat), parseFloat(lng)] : null
  );
  const [display, setDisplay] = useState(
    lat && lng ? `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}` : "Getting your location..."
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setReady(true); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const coords = [p.coords.latitude, p.coords.longitude];
        posRef.current = coords;
        setDisplay(`${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`);
        setReady(true);
      },
      () => setReady(true),
      { timeout: 8000, enableHighAccuracy: false },
    );
  }, []);

  useEffect(() => {
    if (!ready || mapRef.current) return;

    const center = posRef.current || DEFAULT;
    const map = L.map(containerRef.current, {
      center,
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    const marker = L.marker(center, { draggable: true }).addTo(map);

    const sync = () => {
      const p = marker.getLatLng();
      posRef.current = [p.lat, p.lng];
      setDisplay(`${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`);
    };

    marker.on("dragend", sync);
    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      sync();
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [ready]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-4 w-[90vw] max-w-lg">
        <h3 className="text-sm font-semibold mb-2">Choose location on map</h3>
        <div ref={containerRef} className="w-full h-64 rounded-lg overflow-hidden" />
        <p className="text-xs text-muted mt-2">{display}</p>
        <div className="flex gap-2 mt-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-cream-alt text-muted hover:text-dark">Cancel</button>
          <button onClick={() => {
            if (!posRef.current) return;
            onConfirm(posRef.current[0], posRef.current[1]);
          }} className="px-4 py-2 text-sm rounded-lg bg-dark text-cream hover:opacity-90">Confirm</button>
        </div>
      </div>
    </div>
  );
}
