import { create } from 'zustand';
import { useDataStore } from './useDataStore';
import type { Trip } from '@/types';

export interface RoutePoint {
  lng: number;
  lat: number;
  timeOffset: number;
  isStop?: boolean;
  stopName?: string;
  waterDelivered?: number;
}

/**
 * Generates a time-series route from a Trip's path data.
 * Each path coordinate becomes a RoutePoint with a calculated timeOffset.
 * Stops are matched by proximity and include a dwell time.
 */
const generateTripRoute = (trip: Trip): RoutePoint[] => {
  if (!trip || !trip.path || trip.path.length === 0) return [];
  
  const points: RoutePoint[] = [];
  let currentTime = 0;
  const speed = 20 * (1000 / 3600); // 20 km/h (converted to meters/second)
  
  // Haversine-lite distance in meters between two [lng, lat] coords
  const dist = (p1: [number, number], p2: [number, number]) => {
     const dx = (p2[0] - p1[0]) * 111320 * Math.cos(p1[1] * Math.PI / 180);
     const dy = (p2[1] - p1[1]) * 111320;
     return Math.sqrt(dx * dx + dy * dy);
  };

  // First point = departure station
  points.push({
    lng: trip.path[0][0],
    lat: trip.path[0][1],
    timeOffset: 0,
    isStop: true,
    stopName: trip.station?.name || 'الانطلاق'
  });

  // Track which stops have already been matched to avoid duplicates
  const matchedStops = new Set<string>();

  for (let i = 1; i < trip.path.length; i++) {
     const prev = trip.path[i - 1];
     const curr = trip.path[i];
     const d = dist(prev, curr);
     
     // Skip negligible segments (< 3m) unless it's the final point
     if (d < 3 && i !== trip.path.length - 1) continue;

     currentTime += d / speed;
     
     // Try to match this path node to a delivery stop (within ~17m radius)
     const stop = trip.stops?.find(s => 
       !matchedStops.has(s.id || s.name) &&
       Math.abs(s.lat - curr[1]) < 0.00015 && 
       Math.abs(s.lng - curr[0]) < 0.00015
     );
     
     // Arrival point (moving, not a stop)
     points.push({
        lng: curr[0],
        lat: curr[1],
        timeOffset: currentTime,
        isStop: false,
     });

     if (stop) {
        matchedStops.add(stop.id || stop.name);
        // Dwell at stop for water delivery (45 seconds)
        currentTime += 45;
        points.push({
            lng: curr[0],
            lat: curr[1],
            timeOffset: currentTime,
            isStop: true,
            stopName: stop.name,
            waterDelivered: stop.demand
        });
     }
  }

  return points;
};

/**
 * Returns the interpolated position along the route at a given time.
 * BUG FIX: 
 * - Returns LAST point (not first) when time exceeds route duration
 * - Clears isStop/stopName during interpolation (truck is moving between points)
 */
export const getInterpolatedPosition = (points: RoutePoint[], time: number): RoutePoint => {
  if (!points || points.length === 0) return { lat: 0, lng: 0, timeOffset: 0 };
  
  // Clamp: if time is past the end, return the last point
  if (time >= points[points.length - 1].timeOffset) {
    return points[points.length - 1];
  }
  
  // Clamp: if time is before start, return first point
  if (time <= 0) return points[0];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    if (time >= p1.timeOffset && time <= p2.timeOffset) {
      // Exact match on a keyframe
      if (time === p1.timeOffset) return p1;
      if (time === p2.timeOffset) return p2;
      
      const segmentDuration = p2.timeOffset - p1.timeOffset;
      // Safety: avoid division by zero for duplicate timestamps
      if (segmentDuration === 0) return p2;
      
      const factor = (time - p1.timeOffset) / segmentDuration;
      
      // If both points have the same coords (dwell at stop), inherit stop info
      const isSamePosition = p1.lat === p2.lat && p1.lng === p2.lng;
      
      return {
        lng: p1.lng + (p2.lng - p1.lng) * factor,
        lat: p1.lat + (p2.lat - p1.lat) * factor,
        timeOffset: time,
        // Only show "stopped" if truck is dwelling at same location
        isStop: isSamePosition ? (p1.isStop || p2.isStop) : false,
        stopName: isSamePosition ? (p1.stopName || p2.stopName) : undefined,
      };
    }
  }
  
  return points[points.length - 1]; 
};

interface SimulationState {
  isActive: boolean;
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  activeTripId: string | null;
  activeRoute: RoutePoint[];
  
  startSimulation: (tripId: string) => void;
  stopSimulation: () => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setTime: (time: number) => void;
  setSpeed: (speed: number) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  isActive: false,
  isPlaying: false,
  currentTime: 0,
  playbackSpeed: 20, // Default to 20x for better UX
  activeTripId: null,
  activeRoute: [],

  startSimulation: (tripId: string) => {
    // Stop any existing simulation first
    set({ isActive: false, isPlaying: false, currentTime: 0, activeRoute: [] });

    const trip = useDataStore.getState().trips.find(t => t.id === tripId);
    
    if (!trip || !trip.path || trip.path.length === 0) {
      return;
    }

    const route = generateTripRoute(trip);
    if (route.length < 2) return; // Need at least 2 points for a route
    
    set({
        isActive: true,
        isPlaying: true,
        currentTime: 0,
        activeTripId: tripId,
        activeRoute: route
    });
  },
  
  stopSimulation: () => set({ 
    isActive: false, 
    isPlaying: false, 
    currentTime: 0,
    activeTripId: null,
    activeRoute: []
  }),
  togglePlay: () => set(state => ({ isPlaying: !state.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setTime: (time) => set({ currentTime: time }),
  setSpeed: (speed) => set({ playbackSpeed: speed }),
}));
