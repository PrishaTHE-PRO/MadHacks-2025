import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  Slider,
  Chip,
} from "@mui/material";
import { BackButton } from "../components/BackButton";
import { getEventsNearby, joinEventInDb, getMembersForEvent } from "../services/eventService";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";


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

export function MapEventsPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(2000);
  const [nearbyEvents, setNearbyEvents] = useState<any[]>([]);
  const { user } = useContext(AuthContext);

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
    map.on("error", (e) => {
      // eslint-disable-next-line no-console
      console.error("Mapbox error event:", e.error || e);
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
    } catch {}

    return () => {
      try {
        map.remove();
      } catch {}
      mapRef.current = null;
      try {
        // @ts-ignore
        delete (window as any).__MAD_MAP;
      } catch {}
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
      () => {},
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
      } catch {}

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
          } catch {}
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
      } catch {}

      // fetch events and filter client-side
      void (async () => {
        const events = await getEventsNearby();
        const filtered = events.filter((e) => {
          if (e.lat == null || e.lng == null) return false;
          const d = haversineDistance(lat, lng, e.lat, e.lng);
          return d <= radiusMeters;
        });

        setNearbyEvents(filtered);

        // render markers: remove existing and re-create so color reflects most recent start time
        filtered.forEach((ev) => {
          try {
            const existing = (ev as any)._marker as mapboxgl.Marker | undefined;
            if (existing) {
              existing.remove();
              (ev as any)._marker = undefined;
            }
          } catch {}

          (ev as any)._marker = new mapboxgl.Marker({ color: computeColorForEvent(ev) })
            .setLngLat([ev.lng!, ev.lat!])
            .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(`<strong>${ev.name}</strong><br/>${ev.date} ${formatTime(ev.time)}`))
            .addTo(map);
        });
      })();

      return () => {
        try {
          if (map.getLayer("search-radius")) map.removeLayer("search-radius");
          if (map.getSource("search-radius-src")) map.removeSource("search-radius-src");
        } catch {}
        try {
          if (userMarker) userMarker.remove();
        } catch {}
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
      } catch {}
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

  async function handleAttend(ev: any) {
    if (!user) return;
    try {
      await joinEventInDb(ev.code, user.uid, "attendee");
      // refresh members for popup maybe
      const members = await getMembersForEvent(ev.code);
      window.alert(`Joined ${ev.name}. ${members.length} people now attending.`);
    } catch (err: any) {
      window.alert(err?.message || "Error joining event");
    }
  }

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
              <Stack direction="row" spacing={2} alignItems="center">
                <Button size="large" variant="contained" onClick={() => handleAttend(ev)} sx={{ minWidth: 120 }}>Attend</Button>
                <Button size="large" onClick={async () => { const members = await getMembersForEvent(ev.code); window.alert(`${members.filter(m=>m.role==='recruiter').length} recruiters attending.`); }} sx={{ minWidth: 160 }}>See recruiters</Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
