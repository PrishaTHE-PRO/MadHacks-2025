import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Slider,
  Chip,
} from "@mui/material";
import { BackButton } from "../components/BackButton";
import { getEventsNearby, joinEventInDb } from "../services/eventService";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
// no auth context needed on this read-only map page


function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function escapeHtml(s: any) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/\'/g, "&#039;");
}

export function MapEventsPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(2000);
  const [nearbyEvents, setNearbyEvents] = useState<any[]>([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // set token from env (Vite injects import.meta.env at build/dev time)
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

  useEffect(() => {
    if (mapRef.current) return; // already initialized
    if (!mapContainer.current) return;

    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    if (!token) {
      // eslint-disable-next-line no-console
      console.error("Mapbox token is missing (VITE_MAPBOX_TOKEN).");
    }

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [0, 0],
      zoom: 12,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // attach error handler and load handler
    map.on("error", (e: mapboxgl.ErrorEvent) => {
      console.error("Mapbox error:", e.error);
    });

    map.on("load", () => {
      // eslint-disable-next-line no-console
      console.debug("Mapbox loaded, style loaded:", map.isStyleLoaded && map.isStyleLoaded());
      try {
        map.resize();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("map.resize() failed on load:", e);
      }
    });

    // expose for interactive debugging (cleanup on unmount)
    try {
      // @ts-ignore
      (window as any).__MAD_MAP = map;
    } catch { }

    return () => {
      try {
        map.remove();
      } catch { }
      mapRef.current = null;
      try {
        // @ts-ignore
        delete (window as any).__MAD_MAP;
      } catch { }
    };
  }, []);

  // get location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLoc({ lat, lng });
        if (mapRef.current) {
          mapRef.current.setCenter([lng, lat]);
        }
      },
      () => { },
      { enableHighAccuracy: true }
    );
  }, []);

  // draw radius and load nearby events
  useEffect(() => {
    if (!userLoc || !mapRef.current) return;

    const map = mapRef.current;
    // helper that actually mutates the map (add source/layer/marker)
    const renderOnStyleReady = () => {
      // remove old layers if present
      try {
        if (map.getLayer("search-radius")) {
          map.removeLayer("search-radius");
        }
        if (map.getSource("search-radius-src")) {
          map.removeSource("search-radius-src");
        }
      } catch { }

      // create a circle polygon (approx) for display
      const points: [number, number][] = [];
      const steps = 64;
      const { lat, lng } = userLoc;
      for (let i = 0; i < steps; i++) {
        const theta = (i / steps) * 2 * Math.PI;
        const dx = (radiusMeters / 111320) * Math.cos(theta); // approx degrees
        const dy = (radiusMeters / 110540) * Math.sin(theta);
        points.push([lng + dx, lat + dy]);
      }

      // add source/layer safely (only when style is loaded)
      try {
        if (!map.getSource("search-radius-src")) {
          map.addSource("search-radius-src", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "Polygon",
                coordinates: [points],
              },
            },
          });
        } else {
          // update data if source already exists
          const src = map.getSource("search-radius-src") as mapboxgl.GeoJSONSource;
          try {
            src.setData({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [points] } });
          } catch { }
        }

        if (!map.getLayer("search-radius")) {
          map.addLayer({
            id: "search-radius",
            type: "fill",
            source: "search-radius-src",
            paint: { "fill-color": "#5b9bd5", "fill-opacity": 0.12 },
          });
        }
      } catch (err) {
        // If the style isn't done loading this will throw; ignore — we attach on 'load' below
        // console.warn("Failed to add source/layer now, will retry on style load", err);
      }

      // add or update user marker
      let userMarker: mapboxgl.Marker | undefined;
      try {
        userMarker = new mapboxgl.Marker({ color: "#1976d2" })
          .setLngLat([lng, lat])
          .addTo(map);
      } catch { }

      // fetch events and filter client-side (with debug logging)
      void (async () => {
        try {
          const events = await getEventsNearby();
          console.debug("MapEventsPage: fetched events count", events.length, events.slice(0, 5));

          // ensure events have numeric lat/lng: geocode any missing coords (non-persistent)
          const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
          const geocode = async (location: string) => {
            if (!token || !location) return null;
            try {
              const q = encodeURIComponent(location);
              const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&limit=1`
              );
              if (!res.ok) return null;
              const data = await res.json();
              const feat = data?.features?.[0];
              if (feat && feat.center && feat.center.length >= 2) {
                return { lng: Number(feat.center[0]), lat: Number(feat.center[1]) };
              }
            } catch (e) {
              console.warn("MapEventsPage: geocode failed for", location, e);
            }
            return null;
          };

          // resolve coords for events that lack them (in parallel, but allow failures)
          const eventsWithCoords = await Promise.all(
            events.map(async (ev) => {
              if (ev.lat != null && ev.lng != null) return ev;
              if (!ev.location) return ev;
              const coords = await geocode(ev.location);
              if (coords) {
                return { ...ev, lat: coords.lat, lng: coords.lng };
              }
              return ev;
            })
          );

          const filtered = eventsWithCoords.filter((e) => {
            // exclude private events from the public map
            if (e.isPrivate) return false;
            if (e.lat == null || e.lng == null) return false;
            const d = haversineDistance(lat, lng, e.lat, e.lng);
            return d <= radiusMeters;
          });

          console.debug("MapEventsPage: filtered events count", filtered.length, filtered.map((f) => ({ code: f.code, lat: f.lat, lng: f.lng })));

          setNearbyEvents(filtered);

          // remove stale markers (those not in the new filtered set)
          const filteredCodes = new Set(filtered.map((e) => e.code));
          Object.keys(markersRef.current).forEach((code) => {
            if (!filteredCodes.has(code)) {
              try {
                markersRef.current[code].remove();
              } catch (remErr) {
                console.warn("MapEventsPage: failed to remove marker", code, remErr);
              }
              delete markersRef.current[code];
            }
          });

          // create/update markers for filtered events
          filtered.forEach((ev) => {
            const code = ev.code as string;
            try {
              const latNum = Number(ev.lat);
              const lngNum = Number(ev.lng);
              if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
                console.warn("MapEventsPage: skipping event with invalid coords", code, ev.lat, ev.lng);
                return;
              }

              // remove existing marker for this code if present (we'll recreate/update)
              if (markersRef.current[code]) {
                try {
                  markersRef.current[code].remove();
                } catch (e) {
                  console.warn("MapEventsPage: error removing existing marker", code, e);
                }
                delete markersRef.current[code];
              }

              // Create popup content with a join button for public events
              const popupNode = document.createElement("div");
              popupNode.style.minWidth = "160px";
              popupNode.innerHTML = `
                <div style="font-weight:700;margin-bottom:6px">${escapeHtml(ev.name)}</div>
                <div style="font-size:12px;color:#444;margin-bottom:6px">${ev.date} ${formatTime(ev.time)}</div>
                <div style="font-size:12px;color:#444;margin-bottom:8px">${escapeHtml(ev.location || "")}</div>
                <button id="join-btn-${code}" style="background:#1976d2;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer">Join</button>
              `;

              const marker = new mapboxgl.Marker({ color: computeColorForEvent(ev) })
                .setLngLat([lngNum, latNum])
                .setPopup(new mapboxgl.Popup({ offset: 12 }).setDOMContent(popupNode))
                .addTo(map);

              // attach click handler for join button
              try {
                const btn = popupNode.querySelector(`#join-btn-${code}`) as HTMLButtonElement | null;
                if (btn) {
                  btn.addEventListener("click", async (e) => {
                    e.preventDefault();
                    // If user isn't signed in, send them to login
                    if (!user) {
                      navigate("/login");
                      return;
                    }
                    try {
                      // default role: attendee
                      await joinEventInDb(code, user.uid, "attendee");
                      // navigate to the event nearby page (dashboard will show joined event)
                      navigate(`/nearby/${code}`);
                    } catch (joinErr: any) {
                      console.error("MapEventsPage: failed to join event", joinErr);
                      // inform user
                      window.alert(joinErr?.message || "Failed to join event.");
                    }
                  });
                }
              } catch (attachErr) {
                console.warn("MapEventsPage: failed to attach join handler", attachErr);
              }

              markersRef.current[code] = marker;
              } catch (err) {
                console.error("MapEventsPage: failed to create marker for", code, err);
              }
          });

          console.debug("MapEventsPage: current markers", Object.keys(markersRef.current));

          // fit map bounds to include user location and event markers (only if there are markers)
          try {
            const bounds = new mapboxgl.LngLatBounds();
            if (userLoc) bounds.extend([userLoc.lng, userLoc.lat]);
            Object.values(markersRef.current).forEach((m) => {
              try {
                const ll = m.getLngLat();
                bounds.extend([ll.lng, ll.lat]);
              } catch (e) {
                console.warn("MapEventsPage: failed to read marker lnglat", e);
              }
            });
            // only fit if bounds have at least one point
            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 400 });
            }
          } catch (e) {
            console.warn("MapEventsPage: fitBounds failed", e);
          }
        } catch (fetchErr) {
          console.error("MapEventsPage: failed to fetch or render nearby events", fetchErr);
        }
      })();

      return () => {
        try {
          if (map.getLayer("search-radius")) map.removeLayer("search-radius");
          if (map.getSource("search-radius-src")) map.removeSource("search-radius-src");
        } catch { }
        try {
          if (userMarker) userMarker.remove();
        } catch { }
      };
    };

    // If the style is already loaded, render immediately. Otherwise wait for 'load'.
    if (map.isStyleLoaded && map.isStyleLoaded()) {
      // call immediately
      renderOnStyleReady();
    } else {
      const onceHandler = () => renderOnStyleReady();
      map.once("load", onceHandler);
    }

    // outer cleanup: remove any radius layers/sources if present
    return () => {
      try {
        if (map.getLayer("search-radius")) map.removeLayer("search-radius");
        if (map.getSource("search-radius-src")) map.removeSource("search-radius-src");
      } catch { }
    };
  }, [userLoc, radiusMeters]);

  function computeColorForEvent(ev: any) {
    // color code by time-left until start: green soon -> red far or already started
    // normalize startTimestamp which might be a Firestore Timestamp object
    let ts: number | undefined | null = ev.startTimestamp;
    if (ts && typeof ts === "object" && typeof (ts as any).toMillis === "function") {
      ts = (ts as any).toMillis();
    }

    // If we don't have a timestamp, try to compute from date+time fields (if present)
    if (!ts) {
      if (ev.date && ev.time && ev.time !== "TBD") {
        const dt = new Date(`${ev.date}T${ev.time}`);
        if (!isNaN(dt.getTime())) ts = dt.getTime();
      }
    }

    if (!ts) return "#1976d2"; // default (no start time)

    const now = Date.now();
    const diff = ts - now; // ms
    if (diff <= 0) return "#9e9e9e"; // started
    const hours = diff / (1000 * 60 * 60);
    if (hours <= 1) return "#2e7d32"; // green
    if (hours <= 6) return "#f57f17"; // amber
    return "#c62828"; // red (far in future)
  }

  function formatTime(t: string) {
    if (!t || t === "TBD") return "TBD";
    const m = String(t).match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return t;
    let hh = Number(m[1]);
    const mm = m[2];
    const period = hh >= 12 ? "PM" : "AM";
    hh = hh % 12;
    if (hh === 0) hh = 12;
    return `${hh}:${mm} ${period}`;
  }

  // attend handler removed — attendance is managed from the event page

  return (
    <Box sx={{ minHeight: "100vh", pt: 10, pb: 4, bgcolor: "background.default" }}>
      <BackButton />
      <Container maxWidth="lg">
        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>Search nearby events</Typography>
          <Chip label={`${Math.round(radiusMeters)}m radius`} size="medium" sx={{ fontSize: "1rem", px: 1, py: 2.5 }} />
        </Stack>

        <Paper sx={{ height: 600, position: "relative", overflow: "hidden", borderRadius: 3 }}>
          {/* Legend overlay */}
          <Box
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 2,
              bgcolor: "background.paper",
              boxShadow: 4,
              borderRadius: 2,
              p: 2,
              minWidth: 220,
              pointerEvents: "auto",
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 700, display: "block", mb: 1.5 }}>
              Legend
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 18, height: 18, bgcolor: "#9e9e9e", borderRadius: 1 }} />
                <Typography variant="body2">Started</Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 18, height: 18, bgcolor: "#2e7d32", borderRadius: 1 }} />
                <Typography variant="body2">Starts within 1 hour</Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 18, height: 18, bgcolor: "#f57f17", borderRadius: 1 }} />
                <Typography variant="body2">Starts within 6 hours</Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 18, height: 18, bgcolor: "#c62828", borderRadius: 1 }} />
                <Typography variant="body2">Starts in &gt; 6 hours</Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 18, height: 18, bgcolor: "#1976d2", borderRadius: 1 }} />
                <Typography variant="body2">No start time listed</Typography>
              </Stack>
            </Stack>
          </Box>

          <div ref={mapContainer} style={{ height: "100%" }} />
        </Paper>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mt: 3 }} alignItems="center">
          <Typography variant="h6" sx={{ minWidth: 180 }}>Radius (meters)</Typography>
          <Slider
            value={radiusMeters}
            min={200}
            max={20000}
            step={100}
            onChange={(_, v) => setRadiusMeters(v as number)}
            sx={{ width: 400 }}
            size="medium"
          />
        </Stack>

        <Typography variant="h4" sx={{ mt: 4, mb: 2, fontWeight: 700 }}>Events found</Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {nearbyEvents.map((ev) => (
            <Paper key={ev.code} sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 2 }}>
              <Stack spacing={0.5}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{ev.name}</Typography>
                <Typography variant="body1" color="text.secondary">{ev.date} {ev.time} — {ev.location}</Typography>
              </Stack>
              {/* actions removed — map page is read-only */}
            </Paper>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
