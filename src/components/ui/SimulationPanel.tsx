import { Play, Pause, X, Navigation } from 'lucide-react';
import { useSimulationStore, getInterpolatedPosition } from '@/stores/useSimulationStore';
import { useEffect, useRef, useState } from 'react';

export function SimulationPanel() {
  const isActive = useSimulationStore(s => s.isActive);
  const isPlaying = useSimulationStore(s => s.isPlaying);
  const playbackSpeed = useSimulationStore(s => s.playbackSpeed);
  const activeRoute = useSimulationStore(s => s.activeRoute);
  const togglePlay = useSimulationStore(s => s.togglePlay);
  const stopSimulation = useSimulationStore(s => s.stopSimulation);
  const setTime = useSimulationStore(s => s.setTime);
  const setSpeed = useSimulationStore(s => s.setSpeed);
  
  const [sliderVal, setSliderVal] = useState(0);
  const [currentInfo, setCurrentInfo] = useState('');
  const isDragging = useRef(false);

  useEffect(() => {
    const unsub = useSimulationStore.subscribe((state) => {
        // Don't update slider while user is dragging
        if (!isDragging.current) {
          setSliderVal(state.currentTime); // Use exact float for smooth slider updates
        }
        
        if (state.activeRoute.length === 0) return;
        
        const pos = getInterpolatedPosition(state.activeRoute, state.currentTime);
        if (pos.isStop && pos.stopName) {
           setCurrentInfo(`متوقفة: ${pos.stopName}`);
        } else {
           setCurrentInfo('في الطريق...');
        }
    });
    return unsub;
  }, []);

  if (!isActive || activeRoute.length === 0) return null;
  
  const maxTime = activeRoute[activeRoute.length - 1].timeOffset;
  const progress = maxTime > 0 ? (sliderVal / maxTime) * 100 : 0;

  return (
     <div style={{
       position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
       width: '90%', maxWidth: 460,
       background: 'var(--bg-card, rgba(255,255,255,0.95))',
       backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
       border: '1px solid var(--glass-border, rgba(0,0,0,0.08))',
       borderRadius: 14,
       boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
       padding: '14px 16px',
       display: 'flex', flexDirection: 'column', gap: 10,
       zIndex: 1000,
       direction: 'rtl',
       fontFamily: 'inherit',
     }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ 
                  width: 8, height: 8, borderRadius: '50%', 
                  background: isPlaying ? '#10b981' : '#f59e0b',
                  boxShadow: isPlaying ? '0 0 8px rgba(16,185,129,0.5)' : '0 0 8px rgba(245,158,11,0.5)',
                }} />
                <Navigation size={16} style={{ color: 'var(--primary, #2563eb)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>
                  تتبع مسار الشاحنة
                </span>
            </div>
            <button onClick={stopSimulation} style={{
               background: 'transparent', border: 'none', cursor: 'pointer', 
               color: 'var(--text-muted, #94a3b8)',
               display: 'flex', alignItems: 'center', justifyContent: 'center', 
               padding: 4, borderRadius: 6, transition: 'all 0.15s'
            }} title="إغلاق"
               onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
               onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted, #94a3b8)'; }}
            >
                <X size={16} />
            </button>
        </div>

        {/* Status bar */}
        <div style={{
           display: 'flex', justifyContent: 'space-between', alignItems: 'center',
           fontSize: '0.72rem', fontWeight: 600, padding: '6px 10px',
           background: 'var(--bg-dark, rgba(0,0,0,0.03))', 
           border: '1px solid var(--border, rgba(0,0,0,0.05))',
           borderRadius: 6, color: 'var(--text-muted, #64748b)'
        }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
               الحالة: <span style={{ color: currentInfo.includes('متوقفة') ? '#d97706' : 'var(--primary, #2563eb)', fontWeight: 700 }}>{currentInfo}</span>
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary, #2563eb)', fontSize: '0.72rem', direction: 'ltr' }}>
               {formatTime(sliderVal)} / {formatTime(maxTime)}
            </span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
                onClick={togglePlay}
                style={{
                  width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: 'var(--primary, #2563eb)',
                  color: '#ffffff', 
                  boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                  transition: 'transform 0.1s',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
            </button>
            
            <div style={{ flex: 1, direction: 'ltr' }}>
                <input 
                    type="range" min={0} max={maxTime} step="any" value={sliderVal} 
                    onMouseDown={() => { isDragging.current = true; }}
                    onMouseUp={() => { isDragging.current = false; }}
                    onChange={(e) => {
                       const val = Number(e.target.value);
                       setSliderVal(val);
                       setTime(val);
                    }}
                    style={{
                       width: '100%', height: 5, borderRadius: 3, 
                       appearance: 'none', WebkitAppearance: 'none',
                       cursor: 'pointer',
                       background: `linear-gradient(to right, var(--primary, #2563eb) ${progress}%, rgba(0,0,0,0.1) ${progress}%)`,
                       outline: 'none',
                    }}
                />
            </div>

            <select 
               value={playbackSpeed}
               onChange={(e) => setSpeed(Number(e.target.value))}
               style={{
                  background: 'var(--bg-dark, rgba(0,0,0,0.03))', 
                  border: '1px solid var(--border, rgba(0,0,0,0.08))', 
                  borderRadius: 6,
                  fontSize: '0.7rem', fontWeight: 700, padding: '4px 6px', 
                  color: 'var(--text-main, #334155)',
                  outline: 'none', cursor: 'pointer',
               }}
            >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={5}>5x</option>
                <option value={10}>10x</option>
                <option value={20}>20x</option>
            </select>
        </div>
     </div>
  );
}

function formatTime(seconds: number) {
    if (!seconds || !isFinite(seconds) || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
