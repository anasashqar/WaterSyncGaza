import { useState, useMemo } from 'react'
import { Cpu, Box, Map as MapIcon, X, Trophy, Zap, Eye, CheckCircle2, LocateFixed } from 'lucide-react'
import { LayerGroup, Circle, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { useDataStore } from '@/stores/useDataStore'
import { useUIStore } from '@/stores/useUIStore'
import { useMapStore } from '@/stores/useMapStore'
import { createIcon } from './MapIcons'
import { GAZA_BOUNDS } from '@/lib/constants/geography'

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
    return points.map(p => {
      let minDist = Infinity
      let nearestSt = stations[0]
      stations.forEach(st => {
        const d = haversine(p.lat, p.lng, st.lat, st.lng)
        if (d < minDist) {
          minDist = d
          nearestSt = st
        }
      })
      return { point: p, station: nearestSt, distance: minDist }
    })
  }, [showAnalysis, stations, points])

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
    
    // Find clusters of points far from stations
    const underserved = points.filter(p => {
      if (stations.length === 0) return true
      const minDist = Math.min(...stations.map(s => haversine(p.lat, p.lng, s.lat, s.lng)))
      return minDist > 1.5 // more than 1.5km away
    })

    const targetPoints = underserved.length > 0 ? underserved : points

    if (targetPoints.length > 0) {
      // Find geographical center of target points
      let avgLat = 0, avgLng = 0
      targetPoints.forEach(p => { avgLat += p.lat; avgLng += p.lng })
      avgLat /= targetPoints.length
      avgLng /= targetPoints.length

      const nearbyCount = points.filter(p => haversine(avgLat, avgLng, p.lat, p.lng) < 2.0).length
      
      suggestions.push({
        lat: avgLat,
        lng: avgLng,
        score: Math.min(99, Math.round((nearbyCount / points.length) * 100)),
        coverage: nearbyCount
      })
    }

    setAiSuggestions(suggestions)
    setShowAi(true)
    if (suggestions.length > 0) {
      addNotification(`تم إيجاد ${suggestions.length} موقع مقترح!`, 'success')
    } else {
      addNotification(`التغطية الحالية ممتازة، لا حاجة لمحطات جديدة.`, 'success')
    }
  }

  const handleAcceptAi = (sug: {lat: number, lng: number}) => {
    addStation({
      id: `st_ai_${Date.now()}`,
      name: `محطة مقترحة (AI)`,
      lat: sug.lat,
      lng: sug.lng,
      institutions: [],
      dailyCapacity: 50000,
      usedCapacity: 0,
      remainingCapacity: 50000,
      governorate: '',
      trucks: 0
    })
    addNotification('تم اعتماد وإنشاء المحطة المقترحة', 'success')
    setShowAi(false)
    setAiSuggestions([])
  }

  if (!isVisible) return null

  const map = useMapStore((s) => s.map)

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
          {stations.length > 0 && (
            <span style={{
              position: 'absolute', top: -5, right: -5, background: '#ff4b4b', color: 'white',
              fontSize: '10px', fontWeight: 'bold', padding: '1px 5px', borderRadius: 10,
              border: '2px solid white', pointerEvents: 'none'
            }}>{stations.length}</span>
          )}
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

      {/* 2. Floating AI Results Card on the Right */}
      {showAi && aiSuggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 20, right: 380, zIndex: 1000, // right 380 stays clear of the sidebar
          width: 340, background: 'var(--bg-card, #ffffff)', 
          borderRadius: 12, border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)', padding: '16px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 4, height: 24, background: 'linear-gradient(180deg, #8b5cf6, #a78bfa)', borderRadius: 2 }} />
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={18} color="#8b5cf6" /> 
              نتائج توقع المـحطات (AI)
            </h3>
            <button
              onClick={() => { setShowAi(false); setAiSuggestions([]) }}
              style={{ background: 'none', border: 'none', marginRight: 'auto', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            تم تحليل نقاط التوزيع الحالية المسجلة لاكتشاف فجوات التغطية. إليك أفضل موقع مقترح:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {aiSuggestions.map((sug, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-dark)', border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: 8, padding: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 4 }}><Trophy size={16} color="#f59e0b" /> الموقع الأفضل</div>
                  <div style={{ 
                    padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <Zap size={14} /> {sug.score}%
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <strong>نقاط يمكن خدمتها:</strong> {sug.coverage} نقطة
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button 
                    onClick={() => handlePreviewAi(sug.lat, sug.lng)}
                    style={{
                      flex: 1, padding: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6',
                      border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 6, fontSize: '0.8rem',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4
                    }}
                  >
                     <Eye size={14} /> معاينة
                  </button>
                  <button 
                    onClick={() => handleAcceptAi(sug)}
                    style={{
                      flex: 1, padding: '8px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff',
                      border: 'none', borderRadius: 6, fontSize: '0.8rem',
                      fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4
                    }}
                  >
                     <CheckCircle2 size={14} /> اعتماد
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Map Interlays --- */}

      {/* 1. Coverage Buffers */}
      {showCoverage && coverageBuffers.map((item, i) => (
        <LayerGroup key={"cov-"+i}>
          <Circle center={[item.station.lat, item.station.lng]} radius={1000} pathOptions={{ color: item.color, weight: 1, fillColor: item.color, fillOpacity: 0.2 }} />
          <Circle center={[item.station.lat, item.station.lng]} radius={3000} pathOptions={{ color: item.color, weight: 1.5, dashArray: '4,6', fillColor: item.color, fillOpacity: 0.1 }} />
          <Circle center={[item.station.lat, item.station.lng]} radius={5000} pathOptions={{ color: item.color, weight: 1, dashArray: '2,8', fillColor: item.color, fillOpacity: 0.05 }} />
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
