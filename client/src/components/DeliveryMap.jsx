
import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

// Allow customers to move the marker by clicking the map
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(event) {
      setPosition([
        event.latlng.lat,
        event.latlng.lng
      ]);
    }
  });

  return position ? <Marker position={position} /> : null;
}

// Move the map when a searched location is selected
function MapController({ position }) {
  const map = useMap();

  React.useEffect(() => {
    if (position) {
      map.flyTo(position, 16);
    }
  }, [position, map]);

  return null;
}

export default function DeliveryMap({ onConfirm, initialPosition }) {
  const [position, setPosition] = useState(
    initialPosition || [12.9716, 77.5946]
  );

  const [address, setAddress] = useState("");
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  async function searchAddress() {
    if (!address.trim()) {
      setMessage("Please enter a delivery address.");
      return;
    }

    setSearching(true);
    setMessage("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        throw new Error("Address search failed");
      }

      const results = await response.json();

      if (!results.length) {
        setMessage(
          "Address not found. Try adding the area and city."
        );
        return;
      }

      const result = results[0];

      setPosition([
        Number(result.lat),
        Number(result.lon)
      ]);

      setAddress(result.display_name);
      setMessage("Location found! Check the pin on the map.");
    } catch {
      setMessage(
        "Could not find the address. Please try again."
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <section className="delivery-map-section">
      <h3>Choose your delivery location</h3>

      <p>
        Enter your address to locate it on the map, or click the map
        to move the pin.
      </p>

      {/* Use a div, not a nested form, inside Checkout */}
      <div className="delivery-address-search">
        <input
          type="text"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Enter house, street, area and city"
          aria-label="Search delivery address"
        />

        <button
          type="button"
          className="btn btn-outline"
          disabled={searching}
          onClick={searchAddress}
        >
          {searching ? "Searching..." : "Find address"}
        </button>
      </div>

      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}

      <div className="delivery-map">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "350px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController position={position} />

          <LocationMarker
            position={position}
            setPosition={setPosition}
          />
        </MapContainer>
      </div>

      <p>
        Selected coordinates: {position[0].toFixed(5)},{" "}
        {position[1].toFixed(5)}
      </p>

      <button
        type="button"
        className="btn btn-primary"
        onClick={() => onConfirm?.(position)}
      >
        Confirm delivery location
      </button>
    </section>
  );
}
