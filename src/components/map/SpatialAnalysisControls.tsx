import { useState, useMemo } from 'react'
import { Cpu, Box, Map as MapIcon, X, Trophy, Zap, Eye, CheckCircle2, LocateFixed } from 'lucide-react'
import { LayerGroup, Circle, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { useDataStore } from '@/stores/useDataStore'
import { useUIStore } from '@/stores/useUIStore'
import { useMapStore } from '@/stores/useMapStore'
import { createIcon } from './MapIcons'
import { GAZA_BOUNDS } from '@/lib/constants/geography'
import { snapToNearestStreetSegment } from '@/lib/engine/routing'
import { pointInGeoJSONGeometry } from '@/lib/spatial'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export function SpatialAnalysisControls() {
  const [isVisible] = useState(true)
  const [showCoverage, setShowCoverage] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{lat: number, lng: number, score: number, coverage: number}[]>([])

  const addNotification = useUIStore((s) => s.addNotification)
  const stations = useDataStore((s) => s.stations)
  const points = useDataStore((s) => s.points)
  const addStation = useDataStore((s) => s.addStation)
  const graph = useMapStore((s) => s.graph)
  const bufferZoneFeature = useMapStore((s) => s.bufferZoneFeature)
  const map = useMapStore((s) => s.map)
  
  // 1. Coverage Arrays (Buffers)
  const coverageBuffers = useMemo(() => {
    if (!showCoverage) return []
    return stations.map((st, i) => ({
      station: st,
      color: COLORS[i % COLORS.length]
    }))
  }, [showCoverage, stations])

  // 2. Spatial Analysis (Spider links to nearest station)
  const spatialLinks = useMemo(() => {
    if (!showAnalysis || stations.length === 0 || points.length === 0) return []
    const links: { point: typeof points[0]; station: typeof stations[0] }[] = []

    points.forEach(p => {
      // Exclude points inside yellow line
      if (bufferZoneFeature?.geometry && pointInGeoJSONGeometry(p.lat, p.lng, bufferZoneFeature.geometry)) {
        return
      }

      let minDist = Infinity
      let nearestSt: typeof stations[0] | null = null
      
      stations.forEach(st => {
        const d = haversine(p.lat, p.lng, st.lat, st.lng)
        if (d < minDist) {
          minDist = d
          nearestSt = st
        }
      })

      // Only show links that satisfy the 3km coverage constraint
      if (nearestSt && minDist <= 3.0) {
        links.push({ point: p, station: nearestSt })
      }
    })
    return links
  }, [showAnalysis, stations, points, bufferZoneFeature])

  // 3. AI Prediction Logic
  const runAiPrediction = () => {
    if (showAi) {
      setShowAi(false)
      setAiSuggestions([])
      return
    }

    if (points.length < 2) {
      addNotification('يرجى إضافة نقاط توزيع أولاً لإجراء التوقع', 'warning')
      return
    }

    addNotification('جاري تحليل مواقع الطلب لاقتراح محطات...', 'info')
    
    // Quick pseudo-kmeans / centroid algorithm
    const suggestions: {lat: number, lng: number, score: number, coverage: number}[] = []
    
    // More advanced placement: Find underserved areas avoiding buffer zone
    const underserved = points.filter(p => {
      // Exclude points inside yellow line
      if (bufferZoneFeature?.geometry && pointInGeoJSONGeometry(p.lat, p.lng, bufferZoneFeature.geometry)) {
        return false
      }
      if (stations.length === 0) return true
      const minDist = Math.min(...stations.map(s => haversine(p.lat, p.lng, s.lat, s.lng)))
      return minDist > 3.0 // > 3km
    })

    const targetPoints = underserved.length > 0 ? underserved : points.filter(p => !(bufferZoneFeature?.geometry && pointInGeoJSONGeometry(p.lat, p.lng, bufferZoneFeature.geometry)))

    if (targetPoints.length > 0) {
      // 1. Calculate density (number of nearby underserved points) for each target point
      const densities = targetPoints.map(p => {
        const coveredCount = targetPoints.filter(other => haversine(p.lat, p.lng, other.lat, other.lng) <= 3.0).length;
        return { point: p, count: coveredCount };
      });

      // 2. Sort points by highest density (most needs)
      densities.sort((a, b) => b.count - a.count);

      // 3. Select top distinct locations (up to 3) that are at least 3km apart from each other
      const selectedCenters: {lat: number, lng: number}[] = [];
      for (const item of densities) {
        if (selectedCenters.length >= 3) break; // Limit to max 3 suggestions
        
        const isFarEnough = selectedCenters.every(c => haversine(item.point.lat, item.point.lng, c.lat, c.lng) > 3.0);
        if (isFarEnough) {
          selectedCenters.push({ lat: item.point.lat, lng: item.point.lng });
        }
      }

      // Fallback
      if (selectedCenters.length === 0 && densities.length > 0) {
        selectedCenters.push({ lat: densities[0].point.lat, lng: densities[0].point.lng });
      }

      // 4. Transform centers by snapping to streets and calculating final score
      selectedCenters.forEach(center => {
        let finalLat = center.lat;
        let finalLng = center.lng;

        // Snap the suggested point to the nearest street segment!
        if (graph) {
          const snap = snapToNearestStreetSegment(graph, finalLat, finalLng);
          if (snap.snapped) {
            finalLat = snap.lat;
            finalLng = snap.lng;
          }
        }

        // التحقق من وجود الموقع داخل حي (منع المقترحات خارج الحدود)
        const findNeigh = useMapStore.getState().findNeighborhood;
        if (findNeigh && !findNeigh(finalLat, finalLng)) {
          return; // Skip this suggestion if outside neighborhoods
        }

        // Calculate final coverage using all valid points
        const nearbyCount = points.filter(p => 
          haversine(finalLat, finalLng, p.lat, p.lng) <= 3.0 && 
          !(bufferZoneFeature?.geometry && pointInGeoJSONGeometry(p.lat, p.lng, bufferZoneFeature.geometry))
        ).length;
        
        suggestions.push({
          lat: finalLat,
          lng: finalLng,
          score: Math.min(99, Math.round((nearbyCount / points.length) * 100)),
          coverage: nearbyCount
        });
      });

      // Sort top suggestions by coverage so the absolute best is first
      suggestions.sort((a, b) => b.coverage - a.coverage);
    }

    setAiSuggestions(suggestions)
    setShowAi(true)
    if (suggestions.length > 0) {
      const msg = suggestions.length > 1 
        ? `تم إيجاد ${suggestions.length} مواقع مقترحة حسب أولوية الكثافة والاحتياج!` 
        : `تم إيجاد موقع مقترح وملائم لطبقة الطرق!`;
      addNotification(msg, 'success')
      if (map) map.flyTo([suggestions[0].lat, suggestions[0].lng], 15, { animate: true, duration: 1.5 })
    } else {
      addNotification(`التغطية الحالية ممتازة، لا حاجة لمحطات جديدة.`, 'success')
    }
  }

  const handleAcceptAi = (sug: {lat: number, lng: number}) => {
    const findNeigh = useMapStore.getState().findNeighborhood
    const findGov = useMapStore.getState().findGovernorate
    
    const neigh = findNeigh ? (findNeigh(sug.lat, sug.lng) || 'غير محدد') : 'غير محدد'
    const gov = findGov ? (findGov(sug.lat, sug.lng) || 'غير محدد') : 'غير محدد'

    addStation({
      id: `st_ai_${Date.now()}`,
      name: `محطة مقترحة (AI)`,
      lat: sug.lat,
      lng: sug.lng,
      institutions: [],
      dailyCapacity: 50000,
      usedCapacity: 0,
      remainingCapacity: 50000,
      governorate: gov,
      neighborhood: neigh,
      trucks: 0
    })
    addNotification('تم اعتماد وإنشاء المحطة المقترحة في ' + neigh, 'success')
    setShowAi(false)
    setAiSuggestions([])
  }

  if (!isVisible) return null

  const handlePreviewAi = (lat: number, lng: number) => {
    if (map) map.flyTo([lat, lng], 15, { animate: true, duration: 1 })
  }

  return (
    <>
      {/* 1. Left Vertical Action Toolbar (like Leaflet Zoom controls) */}
      <div style={{
        position: 'absolute', top: 90, left: 10, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 8
      }}>
        {/* Coverage Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setShowCoverage(!showCoverage);
              if (!showCoverage) addNotification('عرض التغطية المكانية للمحطات...', 'info');
            }}
            title="نطاقات التغطية"
            style={{
              width: 36, height: 36, borderRadius: 8,
              border: `1.5px solid ${showCoverage ? 'rgba(16, 185, 129, 0.8)' : 'rgba(16, 185, 129, 0.4)'}`,
              background: showCoverage ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-card, #ffffff)',
              color: 'rgb(16, 185, 129)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <MapIcon size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Spatial Analysis Button (Spider links) */}
        <button
          onClick={() => {
            setShowAnalysis(!showAnalysis);
            if (!showAnalysis) addNotification('إظهار التحليل المكاني للارتباطات...', 'info');
          }}
          title="تحليل مكاني حول التبعية"
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: `1.5px solid ${showAnalysis ? 'rgba(100, 116, 139, 0.8)' : 'rgba(100, 116, 139, 0.4)'}`,
            background: showAnalysis ? 'rgba(100, 116, 139, 0.2)' : 'var(--bg-card, #ffffff)',
            color: 'rgb(71, 85, 105)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        >
          <Box size={18} strokeWidth={2.5} />
        </button>

        {/* AI Prediction Button */}
        <button
          onClick={runAiPrediction}
          title="توقع مكان أفضل محطة جديدة"
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: `1.5px solid ${showAi ? 'rgba(139, 92, 246, 0.8)' : 'rgba(139, 92, 246, 0.4)'}`,
            background: showAi ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-card, #ffffff)',
            color: 'rgb(139, 92, 246)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        >
          <Cpu size={18} strokeWidth={2.5} />
        </button>

        <div style={{ width: '100%', height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />

        {/* Recenter Map Button */}
        <button
          onClick={() => {
            if (map) {
              map.flyTo(GAZA_BOUNDS.center as L.LatLngExpression, 12, { animate: true, duration: 1.5 });
              addNotification('تم إعادة تعيين مركز الخريطة', 'info');
            }
          }}
          title="إعادة تعيين مركز الخريطة"
          style={{
            width: 36, height: 36, borderRadius: 8,
            border: '1.5px solid rgba(100, 116, 139, 0.4)',
            background: 'var(--bg-card, #ffffff)',
            color: 'rgb(71, 85, 105)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        >
          <LocateFixed size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* 2. Floating AI Results Card - Redesigned to match System UI */}
      {showAi && aiSuggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 24, left: 60, zIndex: 1000,
          width: 350, 
          background: 'var(--bg-card, #ffffff)', 
          backdropFilter: 'blur(12px)',
          borderRadius: 12, 
          border: '1px solid var(--border, rgba(0, 0, 0, 0.1))',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)', 
          display: 'flex', flexDirection: 'column',
          animation: 'fadeIn 0.3s ease',
          overflow: 'hidden'
        }}>
          {/* Main header block */}
          <div style={{
            background: 'var(--bg-elevated, #f8fafc)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border, rgba(0, 0, 0, 0.05))',
            borderTop: '3px solid #8b5cf6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: 'rgba(139, 92, 246, 0.15)', padding: '8px',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Cpu size={18} color="#8b5cf6" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main, #1e293b)', fontWeight: 700 }}>التحليل المكاني للشبكة</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>اقتراح موضع محطة جديدة</div>
              </div>
            </div>
            <button
              onClick={() => { setShowAi(false); setAiSuggestions([]) }}
              style={{
                background: 'transparent', border: 'none', 
                color: 'var(--text-muted, #64748b)', width: 28, height: 28, borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted, #64748b)' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ 
              fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', 
              lineHeight: 1.6, background: 'var(--bg-dark, #f1f5f9)',
              padding: '12px 14px', borderRadius: '8px', border: '1px dashed var(--border, rgba(0,0,0,0.1))'
            }}>
              تمت مطابقة التوزيع الجغرافي للعجز الحالي، وجرى توجيه الإحداثيات لتنطبق تماماً مع <b style={{color: 'var(--text-main, #334155)'}}>شبكة الشوارع المتاحة</b> بعيداً عن <b style={{color: 'var(--text-main, #334155)'}}>المناطق العازلة</b>.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {aiSuggestions.map((sug, idx) => (
                <div key={idx} style={{
                  border: idx === 0 ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border, rgba(0, 0, 0, 0.05))',
                  borderRadius: 10, padding: 16, 
                  background: idx === 0 ? 'rgba(139, 92, 246, 0.03)' : 'var(--bg-elevated, #ffffff)',
                  position: 'relative', overflow: 'hidden',
                  transition: 'transform 0.2s',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* subtle accent line for the top suggestion */}
                  {idx === 0 && <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: '#8b5cf6' }} />}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ 
                      fontWeight: 700, fontSize: '0.85rem', color: idx === 0 ? '#8b5cf6' : 'var(--text-main, #334155)', 
                      display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      <Trophy size={16} color={idx === 0 ? "#8b5cf6" : "var(--text-muted, #94a3b8)"} />
                      {idx === 0 ? 'الخيار الأفضل' : `اقتراح بديل ${idx}`}
                    </div>
                    <div style={{ 
                      padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.1)', color: '#059669', 
                      display: 'flex', alignItems: 'center', gap: 6,
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <Zap size={12} fill="currentColor" /> التغطية: {sug.score}%
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    background: 'var(--bg-dark, #f8fafc)', padding: '10px 14px', borderRadius: '8px',
                    marginBottom: 16, border: '1px solid var(--border, rgba(0, 0, 0, 0.05))'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>الاستيعاب المحتمل</span>
                    <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 800 }}>{sug.coverage} <span style={{fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)'}}>نقطة</span></span>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button 
                      onClick={() => handlePreviewAi(sug.lat, sug.lng)}
                      style={{
                        flex: 1, padding: '10px', background: 'var(--bg-dark, #f1f5f9)', 
                        color: 'var(--text-main, #334155)',
                        border: '1px solid var(--border, rgba(0, 0, 0, 0.1))', borderRadius: 8, fontSize: '0.8rem',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated, #e2e8f0)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-dark, #f1f5f9)'; }}
                    >
                       <Eye size={16} color="var(--primary, #64748b)" /> معاينة
                    </button>
                    <button 
                      onClick={() => handleAcceptAi(sug)}
                      style={{
                        flex: 1.5, padding: '10px', background: idx === 0 ? '#8b5cf6' : 'transparent', color: idx === 0 ? '#fff' : '#8b5cf6',
                        border: idx === 0 ? '1px solid #7c3aed' : '1px solid rgba(139, 92, 246, 0.5)', borderRadius: 8, fontSize: '0.8rem',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', 
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                        boxShadow: idx === 0 ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
                      }}
                      onMouseEnter={(e) => { 
                        if (idx === 0) {
                          e.currentTarget.style.background = '#7c3aed';
                        } else {
                          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => { 
                        if (idx === 0) {
                          e.currentTarget.style.background = '#8b5cf6';
                        } else {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                       <CheckCircle2 size={16} /> اعتماد المحطة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Map Interlays --- */}

      {/* 1. Coverage Buffers */}
      {showCoverage && coverageBuffers.map((item, i) => (
        <LayerGroup key={"cov-"+i}>
          <Circle center={[item.station.lat, item.station.lng]} radius={1500} pathOptions={{ color: item.color, weight: 1, fillColor: item.color, fillOpacity: 0.08 }} />
          <Circle center={[item.station.lat, item.station.lng]} radius={3000} pathOptions={{ color: item.color, weight: 1.5, dashArray: '4,6', fillColor: item.color, fillOpacity: 0.04 }} />
        </LayerGroup>
      ))}

      {/* 2. Spatial Analysis Links (Spider lines) */}
      {showAnalysis && spatialLinks.map((link, i) => (
        <Polyline 
          key={"link-"+i} 
          positions={[[link.point.lat, link.point.lng], [link.station.lat, link.station.lng]]} 
          pathOptions={{ color: '#64748b', weight: 1.5, opacity: 0.6, dashArray: '4,4' }} 
        />
      ))}

      {/* 3. AI Prediction Markers */}
      {showAi && aiSuggestions.map((sug, i) => (
        <LayerGroup key={"ai-marker-"+i}>
          <Circle center={[sug.lat, sug.lng]} radius={1500} pathOptions={{ color: '#8b5cf6', weight: 2, dashArray: '8,8', fillColor: '#8b5cf6', fillOpacity: 0.1 }} />
          <Marker position={[sug.lat, sug.lng]} icon={createIcon('station', '#8b5cf6', 24)}>
            {/* Kept popup as fallback, but UI card handles actions now */}
            <Popup>
              <div style={{ textAlign: 'right', direction: 'rtl' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#8b5cf6' }}>الموقع المقترح</h4>
              </div>
            </Popup>
          </Marker>
        </LayerGroup>
      ))}
    </>
  )
}
