import { useEffect, useRef, useCallback } from 'react';
import { Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSimulationStore, getInterpolatedPosition } from '@/stores/useSimulationStore';

/* ─── Icons ─── */
const TRUCK_ICON = L.divIcon({
  className: 'truck-simulation-icon',
  html: `<div style="
    background: linear-gradient(135deg, #2563eb, #1d4ed8); 
    border-radius: 50%; 
    width: 36px; height: 36px; 
    display: flex; align-items: center; justify-content: center;
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(37,99,235,0.4);
  ">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
      <rect x="16" y="8" width="7" height="8" rx="1" ry="1"></rect>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -22],
});

const STOP_ICON = L.divIcon({
  className: 'stop-point-icon',
  html: '<div style="width: 12px; height: 12px; background: white; border: 3px solid #2563eb; border-radius: 50%; box-shadow: 0 0 6px rgba(37,99,235,0.4);"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

/* ─── Component ─── */
export function SimulationLayer() {
  const isActive = useSimulationStore(s => s.isActive);
  const isPlaying = useSimulationStore(s => s.isPlaying);
  const activeRoute = useSimulationStore(s => s.activeRoute);
  const setTime = useSimulationStore(s => s.setTime);
  const setPlaying = useSimulationStore(s => s.setPlaying);
  
  const markerRef = useRef<L.Marker>(null);
  const map = useMap();
  const requestRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  // Stable reference for updating marker position
  const updateMarkerPosition = useCallback((time: number) => {
    const route = useSimulationStore.getState().activeRoute;
    if (route.length === 0) return;
    const pos = getInterpolatedPosition(route, time);
    if (markerRef.current) {
      markerRef.current.setLatLng([pos.lat, pos.lng]);
    }
  }, []);

  // Fit map bounds when simulation starts or route changes
  useEffect(() => {
    if (!isActive || activeRoute.length === 0) return;
    
    const bounds = L.latLngBounds(activeRoute.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    
    // Position marker at start
    updateMarkerPosition(0);
  }, [isActive, activeRoute, map, updateMarkerPosition]);

  // Animation loop
  useEffect(() => {
    if (!isActive || !isPlaying) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastFrameRef.current = null;
      return;
    }

    const animate = (frameTime: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = frameTime;
        requestRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const deltaSeconds = (frameTime - lastFrameRef.current) / 1000;
      lastFrameRef.current = frameTime;

      const state = useSimulationStore.getState();
      const maxTime = state.activeRoute.length > 0 
        ? state.activeRoute[state.activeRoute.length - 1].timeOffset 
        : 0;
      
      if (maxTime === 0) return;
      
      let newTime = state.currentTime + (deltaSeconds * state.playbackSpeed);
      
      if (newTime >= maxTime) {
        newTime = maxTime;
        setTime(newTime);
        updateMarkerPosition(newTime);
        setPlaying(false);
        lastFrameRef.current = null;
        return; // Stop the loop
      }
      
      setTime(newTime);
      updateMarkerPosition(newTime);
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isActive, isPlaying, setPlaying, setTime, updateMarkerPosition]);

  // Handle manual scrubbing (slider drag while paused)
  useEffect(() => {
    const unsub = useSimulationStore.subscribe((state, prevState) => {
      // Only update marker on manual scrub (not during animation playback)
      if (!state.isPlaying && state.currentTime !== prevState.currentTime) {
        updateMarkerPosition(state.currentTime);
      }
    });
    return unsub;
  }, [updateMarkerPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  if (!isActive || activeRoute.length === 0) return null;

  const routePolyline = activeRoute.map(p => [p.lat, p.lng] as [number, number]);
  
  // Unique stops for markers (deduplicate by stopName)
  const uniqueStops = activeRoute.filter((p, i, arr) => 
     p.isStop && p.stopName && arr.findIndex(x => x.stopName === p.stopName) === i
  );

  return (
    <>
      {/* Route polyline */}
      <Polyline 
        positions={routePolyline} 
        color="#3b82f6" 
        weight={4} 
        opacity={0.5}
        dashArray="8, 8" 
      />
      
      {/* Stop markers */}
      {uniqueStops.map((p, i) => (
         <Marker 
           key={`sim-stop-${i}`} 
           position={[p.lat, p.lng]} 
           icon={STOP_ICON}
         >
             <Popup>
                 <div style={{ textAlign: 'right', fontSize: '0.85rem', direction: 'rtl', padding: 4, minWidth: 120 }}>
                     <div style={{ fontWeight: 700, color: '#334155', marginBottom: 4 }}>{p.stopName}</div>
                     {p.waterDelivered != null && p.waterDelivered > 0 && (
                       <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
                         الكمية: {p.waterDelivered.toLocaleString()} لتر
                       </div>
                     )}
                 </div>
             </Popup>
         </Marker>
      ))}

      {/* Truck marker */}
      <Marker 
        ref={markerRef} 
        position={[activeRoute[0].lat, activeRoute[0].lng]}
        icon={TRUCK_ICON}
        zIndexOffset={1000}
      >
        <Popup>
            <div style={{ textAlign: 'right', direction: 'rtl', padding: 4 }}>
                <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.9rem', marginBottom: 2 }}>شاحنة توزيع</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>محاكاة خط السير</div>
            </div>
        </Popup>
      </Marker>
    </>
  );
}
