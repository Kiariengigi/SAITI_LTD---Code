import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LocationResult {
  coords: LatLng;
  address: string;
}

interface LocationPickerProps {
  /** Your Google Maps JavaScript API key */
  apiKey: string;
  /** Called whenever the user finalises a location */
  onChange?: (result: LocationResult) => void;
  /** Initial map centre (defaults to world centre) */
  defaultCenter?: LatLng;
  /** Initial zoom level */
  defaultZoom?: number;
  /** Placeholder for the search input */
  placeholder?: string;
  /** Height of the map div */
  mapHeight?: string;
  /** Handler for next step */
  onNext?: () => void;
  /** Handler for back step */
  onBack?: () => void;
}

// ─── Loader helper ────────────────────────────────────────────────────────────

let scriptPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (typeof window !== "undefined" && window.google?.maps) {
    return (scriptPromise = Promise.resolve());
  }
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps API"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// ─── Component ────────────────────────────────────────────────────────────────

const LocationandReach: React.FC<LocationPickerProps> = ({
  apiKey,
  onChange,
  defaultCenter = { lat: 0, lng: 20 },
  defaultZoom = 2,
  placeholder = "Enter an address or use browser detection…",
  mapHeight = "420px",
  onNext
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [address, setAddress] = useState<string>("");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [mapsReady, setMapsReady] = useState(false);

  // ── Notify parent ────────────────────────────────────────────────────────
  const emit = useCallback(
    (c: LatLng, a: string) => {
      onChange?.({ coords: c, address: a });
    },
    [onChange]
  );

  // ── Move marker & reverse-geocode ────────────────────────────────────────
  const placeMarker = useCallback(
    (latLng: LatLng, skipReverseGeocode = false) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      setCoords(latLng);

      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          map,
          draggable: true,
          animation: google.maps.Animation.DROP,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#FF6B35",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2.5,
          },
        });

        // Drag-end → reverse geocode
        markerRef.current.addListener("dragend", () => {
          const pos = markerRef.current!.getPosition()!;
          const newLatLng = { lat: pos.lat(), lng: pos.lng() };
          setCoords(newLatLng);
          reverseGeocode(newLatLng);
        });
      }

      markerRef.current.setPosition(latLng);
      map.panTo(latLng);
      map.setZoom(15);

      if (!skipReverseGeocode) {
        reverseGeocode(latLng);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ── Reverse geocode ──────────────────────────────────────────────────────
  const reverseGeocode = useCallback(
    (latLng: LatLng) => {
      const geocoder = geocoderRef.current;
      if (!geocoder) return;
      geocoder.geocode({ location: latLng }, (results, gStatus) => {
        if (gStatus === "OK" && results?.[0]) {
          const formatted = results[0].formatted_address;
          setAddress(formatted);
          if (inputRef.current) inputRef.current.value = formatted;
          emit(latLng, formatted);
          setStatus("success");
          setStatusMsg("Location set");
        } else {
          const fallback = `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`;
          setAddress(fallback);
          if (inputRef.current) inputRef.current.value = fallback;
          emit(latLng, fallback);
        }
      });
    },
    [emit]
  );

  // ── Initialise map ───────────────────────────────────────────────────────
  useEffect(() => {
    loadGoogleMaps(apiKey)
      .then(() => {
        if (!mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: defaultZoom,
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { featureType: "all", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
            { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#9e9ea7" }] },
            { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
            { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#2d2d5a" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#16213e" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#0f3460" }] },
            { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#0f3460" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1b2a" }] },
            { featureType: "poi", elementType: "geometry", stylers: [{ color: "#16213e" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0d2137" }] },
            { featureType: "transit", elementType: "geometry", stylers: [{ color: "#16213e" }] },
            { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
          ],
        });

        mapInstanceRef.current = map;
        geocoderRef.current = new google.maps.Geocoder();

        // Click on map → place marker
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            placeMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
        });

        // Autocomplete
        if (inputRef.current) {
          const ac = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ["geometry", "formatted_address"],
          });
          ac.bindTo("bounds", map);
          autocompleteRef.current = ac;

          ac.addListener("place_changed", () => {
            const place = ac.getPlace();
            if (!place.geometry?.location) return;
            const latLng = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };
            const addr = place.formatted_address ?? "";
            setAddress(addr);
            placeMarker(latLng, true);
            emit(latLng, addr);
            setStatus("success");
            setStatusMsg("Location set");
          });
        }

        setMapsReady(true);
      })
      .catch(() => {
        setStatus("error");
        setStatusMsg("Could not load Google Maps. Check your API key.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // ── Browser geolocation ──────────────────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setStatusMsg("Geolocation is not supported by your browser.");
      return;
    }
    setStatus("loading");
    setStatusMsg("Detecting your location…");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        placeMarker(latLng);
        setStatus("loading");
        setStatusMsg("Resolving address…");
      },
      (err) => {
        setStatus("error");
        const msgs: Record<number, string> = {
          1: "Location access denied. Please allow location access or type your address.",
          2: "Position unavailable. Please type your address instead.",
          3: "Request timed out. Please try again.",
        };
        setStatusMsg(msgs[err.code] ?? "Unknown geolocation error.");
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  };

  // ── Manual input submit ──────────────────────────────────────────────────
  const handleManualSubmit = () => {
    const geocoder = geocoderRef.current;
    if (!geocoder || !address.trim()) return;
    setStatus("loading");
    setStatusMsg("Searching…");
    geocoder.geocode({ address: address.trim() }, (results, gStatus) => {
      if (gStatus === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const latLng = { lat: loc.lat(), lng: loc.lng() };
        const formatted = results[0].formatted_address;
        setAddress(formatted);
        if (inputRef.current) inputRef.current.value = formatted;
        placeMarker(latLng, true);
        emit(latLng, formatted);
        setStatus("success");
        setStatusMsg("Location set");
      } else {
        setStatus("error");
        setStatusMsg("Address not found. Try a different search.");
      }
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerDot} />
        <span style={styles.headerTitle}>Location Picker</span>
      </div>

      {/* Input row */}
      <div style={styles.form}>
        <div style={styles.inputRow}>
          <span style={styles.inputIcon}>⌖</span>
          <input
            ref={inputRef}
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => setAddress(e.target.value)}
            placeholder={placeholder}
            style={styles.input}
            disabled={!mapsReady}

          />
          {address && (
            <button
              type="button"
              onClick={() => {
                setAddress("");
                if (inputRef.current) inputRef.current.value = "";
              }}
              style={styles.clearBtn}
              aria-label="Clear"
            >
              ×
            </button>
          )}
          <button
            type="submit"
            style={{ ...styles.btn, ...styles.searchBtn }}
            disabled={!mapsReady || !address.trim()}
          >
            Search
          </button>
          <button
            onClick={onNext}
          >
            Next Step
          </button>
        </div>

        <div style={styles.orRow}>
          <span style={styles.orLine} />
          <span style={styles.orText}>or</span>
          <span style={styles.orLine} />
        </div>

        <button
          type="button"
          onClick={handleManualSubmit}
          style={{ ...styles.btn, ...styles.detectBtn }}
          disabled={!mapsReady || status === "loading"}
        >
          <span style={styles.detectIcon}>◎</span>
          {status === "loading" ? "Detecting…" : "Use my current location"}
        </button>
      </div>

      {/* Status */}
      {statusMsg && (
        <div
          style={{
            ...styles.statusBar,
            background:
              status === "error"
                ? "rgba(220,50,50,.15)"
                : status === "success"
                ? "rgba(50,220,120,.15)"
                : "rgba(255,255,255,.06)",
            borderColor:
              status === "error"
                ? "rgba(220,50,50,.4)"
                : status === "success"
                ? "rgba(50,220,120,.4)"
                : "rgba(255,255,255,.12)",
            color:
              status === "error"
                ? "#ff7070"
                : status === "success"
                ? "#6fffa8"
                : "#aaa",
          }}
        >
          {status === "loading" && <span style={styles.spinner} />}
          {statusMsg}
        </div>
      )}

      {/* Map */}
      <div style={{ ...styles.mapContainer, height: mapHeight }}>
        <div ref={mapRef} style={styles.map} />
        {!mapsReady && (
          <div style={styles.mapOverlay}>
            <span style={styles.spinner} />
            <span style={{ marginLeft: 10, color: "#aaa" }}>Loading map…</span>
          </div>
        )}
        <div style={styles.mapHint}>Click anywhere on the map to set a location</div>
      </div>

      {/* Coords readout */}
      {coords && (
        <div style={styles.coordsBar}>
          <span style={styles.coordLabel}>LAT</span>
          <span style={styles.coordValue}>{coords.lat.toFixed(6)}</span>
          <span style={styles.coordSep} />
          <span style={styles.coordLabel}>LNG</span>
          <span style={styles.coordValue}>{coords.lng.toFixed(6)}</span>
          <span style={styles.coordHint}>↕ Drag the marker to refine</span>
        </div>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    fontFamily: "'DM Mono', 'Fira Code', monospace",
    background: "#11111f",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 16,
    overflow: "hidden",
    maxWidth: 640,
    margin: "0 auto",
    boxShadow: "0 24px 80px rgba(0,0,0,.6)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "16px 22px 0",
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#FF6B35",
    boxShadow: "0 0 12px #FF6B35aa",
  },
  headerTitle: {
    color: "#FF6B35",
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  form: {
    padding: "14px 22px 0",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 10,
    padding: "0 6px 0 12px",
    gap: 6,
  },
  inputIcon: {
    color: "#555",
    fontSize: 18,
    lineHeight: 1,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e8e8e8",
    fontSize: 14,
    padding: "12px 0",
    fontFamily: "inherit",
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#555",
    cursor: "pointer",
    fontSize: 20,
    lineHeight: 1,
    padding: "0 4px",
  },
  btn: {
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 600,
    fontSize: 13,
    transition: "all .2s",
  },
  searchBtn: {
    background: "#FF6B35",
    color: "#fff",
    padding: "8px 16px",
    flexShrink: 0,
  },
  orRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "14px 0",
  },
  orLine: {
    flex: 1,
    height: 1,
    background: "rgba(255,255,255,.08)",
  },
  orText: {
    color: "#555",
    fontSize: 12,
    letterSpacing: "0.1em",
  },
  detectBtn: {
    background: "rgba(255,255,255,.05)",
    color: "#ccc",
    border: "1px solid rgba(255,255,255,.1)",
    padding: "12px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
    width: "100%",
    boxSizing: "border-box",
  },
  detectIcon: {
    fontSize: 16,
    color: "#FF6B35",
  },
  statusBar: {
    margin: "0 22px 12px",
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
    letterSpacing: "0.02em",
  },
  spinner: {
    display: "inline-block",
    width: 12,
    height: 12,
    border: "2px solid rgba(255,255,255,.15)",
    borderTopColor: "#FF6B35",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    flexShrink: 0,
  },
  mapContainer: {
    position: "relative",
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapOverlay: {
    position: "absolute",
    inset: 0,
    background: "#0d0d1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mapHint: {
    position: "absolute",
    bottom: 10,
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,.65)",
    backdropFilter: "blur(6px)",
    color: "#888",
    fontSize: 11,
    padding: "5px 12px",
    borderRadius: 20,
    letterSpacing: "0.04em",
    pointerEvents: "none",
    whiteSpace: "nowrap",
  },
  coordsBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 22px",
    borderTop: "1px solid rgba(255,255,255,.06)",
    fontSize: 12,
    flexWrap: "wrap",
  },
  coordLabel: {
    color: "#FF6B35",
    fontSize: 10,
    letterSpacing: "0.12em",
    fontWeight: 700,
  },
  coordValue: {
    color: "#e0e0e0",
    fontVariantNumeric: "tabular-nums",
  },
  coordSep: {
    width: 1,
    height: 12,
    background: "rgba(255,255,255,.12)",
    margin: "0 4px",
  },
  coordHint: {
    marginLeft: "auto",
    color: "#444",
    fontSize: 11,
    letterSpacing: "0.03em",
  },
};

export default LocationandReach;