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
  Avatar,
} from "@mui/material";
import { getEventsNearby, joinEventInDb, getMembersForEvent } from "../services/eventService";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

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

  useEffect(() => {
    if (!mapRef.current && mapContainer.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [0, 0],
        zoom: 12,
      });
    }
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

    map.addSource("search-radius-src", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [points],
        },
      },
    });

    map.addLayer({
      id: "search-radius",
      type: "fill",
      source: "search-radius-src",
      paint: { "fill-color": "#5b9bd5", "fill-opacity": 0.12 },
    });

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

      // render markers
      // remove previous markers (we'll keep refs on map as custom layers are trickier)
      // (simple approach) add markers and attach to event object for cleanup next run
      filtered.forEach((ev) => {
        if (!ev._marker) {
          ev._marker = new mapboxgl.Marker({ color: computeColorForEvent(ev) })
            .setLngLat([ev.lng, ev.lat])
            .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(`<strong>${ev.name}</strong><br/>${ev.date} ${ev.time}`))
            .addTo(map);
        }
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
  }, [userLoc, radiusMeters]);

  function computeColorForEvent(ev: any) {
    // color code by time-left until start: green soon -> red far or already started
    if (!ev.startTimestamp) return "#1976d2";
    const now = Date.now();
    const diff = ev.startTimestamp - now; // ms
    if (diff <= 0) return "#9e9e9e"; // started
    const hours = diff / (1000 * 60 * 60);
    if (hours <= 1) return "#2e7d32"; // green
    if (hours <= 6) return "#f57f17"; // amber
    return "#c62828"; // red (far in future)
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
    <Box sx={{ minHeight: "100vh", pt: 8, bgcolor: "background.default" }}>
      <Container maxWidth="lg">
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5">Search nearby events</Typography>
          <Chip label={`${Math.round(radiusMeters)}m radius`} />
        </Stack>

        <Paper sx={{ height: 520, position: "relative", overflow: "hidden" }}>
          <div ref={mapContainer} style={{ height: "100%" }} />
        </Paper>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }} alignItems="center">
          <Typography variant="body2">Radius (meters)</Typography>
          <Slider value={radiusMeters} min={200} max={20000} step={100} onChange={(_, v) => setRadiusMeters(v as number)} sx={{ width: 300 }} />
        </Stack>

        <Typography variant="h6" sx={{ mt: 2 }}>Events found</Typography>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {nearbyEvents.map((ev) => (
            <Paper key={ev.code} sx={{ p: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Stack>
                <Typography variant="subtitle1">{ev.name}</Typography>
                <Typography variant="caption" color="text.secondary">{ev.date} {ev.time} — {ev.location}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button size="small" variant="contained" onClick={() => handleAttend(ev)}>Attend</Button>
                <Button size="small" onClick={async () => { const members = await getMembersForEvent(ev.code); window.alert(`${members.filter(m=>m.role==='recruiter').length} recruiters attending.`); }}>See recruiters</Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
