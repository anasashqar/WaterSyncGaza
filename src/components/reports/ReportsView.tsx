/**
 * WaterSync — Enterprise Reports View
 * نظام التقارير والبيانات التفصيلية - متوافق مع تصميم المشروع
 */
import { useState, useMemo } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { TYPE_LABELS, STATUS_LABELS } from "@/lib/constants/colors";
import type { Station, Point, Trip } from "@/types";
import {
  FileText,
  Database,
  MapPin,
  Activity,
  X,
  Factory,
  Droplet,
  Navigation,
  LayoutList,
  Layers,
  ChevronLeft,
} from "lucide-react";

export function ReportsView({ onClose }: { onClose: () => void }) {
  const stations = useDataStore((s) => s.stations);
  const points = useDataStore((s) => s.points);
  const trips = useDataStore((s) => s.trips);

  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null,
  );

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) ?? null,
    [stations, selectedStationId],
  );

  const primaryColor = "var(--primary)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "var(--bg-dark)",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "inherit",
        animation: "fadeIn 0.2s ease",
      }}
    >
      {/* ──── Header ──── */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.95) 0%, rgba(15,23,42,0.95) 100%)",
          backdropFilter: "blur(10px)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: 64,
          flexShrink: 0,
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <FileText size={22} className="opacity-90" />
          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            مركز التقارير والبيانات
          </span>
          <div
            style={{
              marginLeft: 16,
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: "0.75rem",
              fontWeight: 600,
              background: "rgba(255,255,255,0.15)",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {selectedStation
              ? `تقرير محطة: ${selectedStation.name || selectedStation.id.slice(0, 4)}`
              : "الملخص العام"}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            padding: 6,
            borderRadius: 10,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
        >
          <X size={20} />
        </button>
      </div>

      {/* ──── Body ──── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {/* ──── Station Selector (Sidebar) ──── */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            background: "var(--bg-card)",
            borderLeft: "1px solid var(--glass-border)",
            overflow: "auto",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            <Database size={18} color={primaryColor} />
            <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>
              سجل المحطات
            </span>
          </div>

          <button
            onClick={() => setSelectedStationId(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 12,
              cursor: "pointer",
              background:
                selectedStationId === null
                  ? "var(--primary-soft)"
                  : "var(--bg-elevated)",
              border: `1px solid ${selectedStationId === null ? "var(--primary)" : "var(--glass-border)"}`,
              color:
                selectedStationId === null ? "var(--primary)" : "var(--text)",
              fontSize: "0.9rem",
              fontWeight: 700,
              fontFamily: "inherit",
              textAlign: "right",
              transition: "all 0.2s",
              width: "100%",
              boxShadow:
                selectedStationId === null ? "var(--shadow-sm)" : "none",
            }}
          >
            <LayoutList size={20} />
            <span style={{ flex: 1, textAlign: "right" }}>
              الملخص العام للمنظومة
            </span>
          </button>

          <div
            style={{
              height: 1,
              background: "var(--glass-border)",
              margin: "8px 0",
            }}
          />

          {stations.length === 0 ? (
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                textAlign: "center",
                padding: 32,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Layers size={24} style={{ opacity: 0.3 }} />
              لا توجد محطات مسجلة
            </div>
          ) : (
            stations.map((st) => {
              const isActive = selectedStationId === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStationId(st.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: isActive
                      ? "var(--primary-soft)"
                      : "transparent",
                    border: `1px solid ${isActive ? "var(--primary)" : "transparent"}`,
                    color: isActive ? "var(--primary)" : "var(--text-muted)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    textAlign: "right",
                    transition: "all 0.2s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: isActive
                        ? "var(--primary)"
                        : "var(--bg-dark)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isActive ? "#fff" : "var(--text-muted)",
                      border: isActive
                        ? "none"
                        : "1px solid var(--glass-border)",
                    }}
                  >
                    <Factory size={18} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: isActive ? "var(--primary)" : "var(--text)",
                      }}
                    >
                      {st.name || `محطة ${st.id.slice(0, 6)}`}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.8,
                        fontWeight: 500,
                      }}
                    >
                      {st.governorate} • {st.trucks} شاحنات
                    </span>
                  </div>
                  {isActive && <ChevronLeft size={18} color="var(--primary)" />}
                </button>
              );
            })
          )}
        </div>

        {/* ──── Report Content Area ──── */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: 32,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1000,
              display: "flex",
              flexDirection: "column",
              gap: 32,
            }}
          >
            {selectedStation ? (
              <StationReport
                station={selectedStation}
                points={points}
                trips={trips}
              />
            ) : (
              <OverallSummary
                stations={stations}
                points={points}
                trips={trips}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Overall Summary ─── */
function OverallSummary({
  stations,
  points,
  trips,
}: {
  stations: Station[];
  points: Point[];
  trips: Trip[];
}) {
  const formatNum = (n: number) =>
    new Intl.NumberFormat("en-US").format(Math.round(n));
  const getStatusArabic = (status: string) =>
    status === "supplied" ? "مزوّد" : status === "warning" ? "تحذير" : "حرج";
  const getStatusColor = (status: string) =>
    status === "supplied"
      ? "var(--success)"
      : status === "warning"
        ? "var(--warning)"
        : "var(--danger)";

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "2px solid var(--glass-border)",
          paddingBottom: 16,
        }}
      >
        <div
          style={{
            background: "var(--primary-soft)",
            padding: 10,
            borderRadius: 12,
            color: "var(--primary)",
          }}
        >
          <LayoutList size={28} />
        </div>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
            السجلات الشاملة للمنظومة
          </h2>
          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            جداول البيانات التفصيلية لجميع العناصر الجغرافية واللوجستية
          </span>
        </div>
      </div>

      {/* Per-station Detailed Table */}
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 16,
        }}
      >
        <Database size={18} color="var(--primary)" /> سجل المحطات التفصيلي (
        {stations.length})
      </h3>
      <DataGrid
        headers={[
          "المحطة",
          "المحافظة",
          "الشاحنات",
          "المؤسسات",
          "السعة الكلية",
          "الاستهلاك",
          "المتبقي",
          "نسبة",
        ]}
      >
        {stations.length === 0 ? (
          <tr>
            <td
              colSpan={8}
              style={{
                textAlign: "center",
                padding: 24,
                color: "var(--text-muted)",
              }}
            >
              لا توجد محطات مسجلة
            </td>
          </tr>
        ) : (
          stations.map((st) => {
            const usedPct =
              st.dailyCapacity > 0
                ? (((st.usedCapacity || 0) / st.dailyCapacity) * 100).toFixed(1)
                : "0";
            return (
              <tr
                key={st.id}
                style={{
                  borderBottom: "1px solid var(--glass-border)",
                  transition: "background 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-elevated)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                  {st.name || st.id.slice(0, 6)}
                </td>
                <td
                  style={{ padding: "14px 16px", color: "var(--text-muted)" }}
                >
                  {st.governorate}
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                  {st.trucks}
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                  {st.institutions.length}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    color: "var(--text)",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                  }}
                >
                  {formatNum(st.dailyCapacity)}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    color: "var(--warning)",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                  }}
                >
                  {formatNum(st.usedCapacity ?? 0)}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    color: "var(--primary)",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                  }}
                >
                  {formatNum(st.remainingCapacity ?? st.dailyCapacity ?? 0)}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    color:
                      Number(usedPct) > 90 ? "var(--danger)" : "var(--text)",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                  }}
                >
                  {usedPct}%
                </td>
              </tr>
            );
          })
        )}
      </DataGrid>

      {/* Points Detailed Table */}
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 16,
        }}
      >
        <MapPin size={18} color="var(--primary)" /> سجل نقاط التوزيع (
        {points.length})
      </h3>
      <DataGrid
        headers={[
          "اسم النقطة",
          "النوع",
          "المحافظة / الحي",
          "الكمية المطلوبة (L)",
          "محطة التغذية",
          "الحالة السجلية",
        ]}
      >
        {points.length === 0 ? (
          <tr>
            <td
              colSpan={6}
              style={{
                textAlign: "center",
                padding: 24,
                color: "var(--text-muted)",
              }}
            >
              لا توجد نقاط توزيع
            </td>
          </tr>
        ) : (
          points.map((pt) => {
            const supplier = stations.find((s) => s.id === pt.stationId);
            return (
              <tr
                key={pt.id}
                style={{
                  borderBottom: "1px solid var(--glass-border)",
                  transition: "background 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-elevated)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                  {pt.name}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  {TYPE_LABELS[pt.type] || pt.type}
                </td>
                <td
                  style={{ padding: "14px 16px", color: "var(--text-muted)" }}
                >
                  {pt.governorate} - {pt.neighborhood}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    color: "var(--text)",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  {formatNum(pt.demand)}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    color: supplier ? "var(--primary)" : "var(--text-muted)",
                  }}
                >
                  {supplier
                    ? supplier.name || supplier.id.slice(0, 6)
                    : "غير محدد"}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    color: getStatusColor(pt.status),
                    fontWeight: 700,
                  }}
                >
                  {getStatusArabic(pt.status)}
                </td>
              </tr>
            );
          })
        )}
      </DataGrid>

      {/* Trips Detailed Table */}
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 16,
        }}
      >
        <Navigation size={18} color="var(--primary)" /> سجل رحلات الشاحنات (
        {trips.length})
      </h3>
      <DataGrid
        headers={[
          "معرف الرحلة",
          "المحطة المزودة",
          "عدد المحطات (Stops)",
          "المسافة الإجمالية (كم)",
          "إجمالي الحمولة الموزعة (L)",
        ]}
      >
        {trips.length === 0 ? (
          <tr>
            <td
              colSpan={5}
              style={{
                textAlign: "center",
                padding: 24,
                color: "var(--text-muted)",
              }}
            >
              لا توجد رحلات مجدولة
            </td>
          </tr>
        ) : (
          trips.map((trip) => (
            <tr
              key={trip.id}
              style={{
                borderBottom: "1px solid var(--glass-border)",
                transition: "background 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-elevated)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                {trip.name || trip.id.slice(0, 8)}
              </td>
              <td style={{ padding: "14px 16px", color: "var(--text-muted)" }}>
                {trip.station?.name || trip.station?.id.slice(0, 8)}
              </td>
              <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                {trip.stops.length}
              </td>
              <td
                style={{
                  padding: "14px 16px",
                  color: "var(--text)",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                }}
              >
                {(trip.distance / 1000).toFixed(2)}
              </td>
              <td
                style={{
                  padding: "14px 16px",
                  color: "var(--success)",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                {formatNum(trip.demand)}
              </td>
            </tr>
          ))
        )}
      </DataGrid>
    </>
  );
}

/* ─── Single Station Report ─── */
function StationReport({
  station,
  points,
  trips,
}: {
  station: Station;
  points: Point[];
  trips: Trip[];
}) {
  const stationPoints = useMemo(
    () => points.filter((p) => p.stationId === station.id),
    [points, station.id],
  );
  const stationTrips = useMemo(
    () => trips.filter((t) => t.station?.id === station.id),
    [trips, station.id],
  );
  const totalPointDemand = stationPoints.reduce((s, p) => s + p.demand, 0);
  const supplied = stationPoints.filter((p) => p.status === "supplied").length;
  const formatNum = (n: number) =>
    new Intl.NumberFormat("en-US").format(Math.round(n));

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "2px solid var(--glass-border)",
          paddingBottom: 16,
        }}
      >
        <div
          style={{
            background: "var(--primary-soft)",
            padding: 10,
            borderRadius: 12,
            color: "var(--primary)",
          }}
        >
          <Factory size={28} />
        </div>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
            تقرير محطة: {station.name || station.id.slice(0, 6)}
          </h2>
          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            محافظة {station.governorate} — {station.neighborhood || "موقع عام"}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(300px, 1.2fr) minmax(300px, 1fr)",
          gap: 32,
        }}
      >
        {/* Station Metrics */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Activity size={18} color="var(--primary)" /> الأداء التشغيلي للمحطة
          </h3>
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      width: "40%",
                      background: "var(--bg-elevated)",
                    }}
                  >
                    إحداثيات الموقع (GPS)
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {station.lat.toFixed(5)}, {station.lng.toFixed(5)}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      width: "40%",
                      background: "var(--bg-elevated)",
                    }}
                  >
                    القدرة الإنتاجية اليومية
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {formatNum(station.dailyCapacity)} لتر
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      width: "40%",
                      background: "var(--bg-elevated)",
                    }}
                  >
                    المياه المصروفة (مستهلك)
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontWeight: 600,
                      color: "var(--warning)",
                    }}
                  >
                    {formatNum(station.usedCapacity ?? 0)} لتر
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      width: "40%",
                      background: "var(--bg-elevated)",
                    }}
                  >
                    الاحتياطي المتبقي بالمحطة
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontWeight: 600,
                      color: "var(--primary)",
                    }}
                  >
                    {formatNum(
                      station.remainingCapacity ?? station.dailyCapacity ?? 0,
                    )}{" "}
                    لتر
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      width: "40%",
                      background: "var(--bg-elevated)",
                    }}
                  >
                    قوة أسطول الشاحنات
                  </td>
                  <td
                    style={{
                      padding: "14px 20px",
                      fontWeight: 700,
                      color: "var(--success)",
                    }}
                  >
                    {station.trucks} شاحنات عاملة
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Institutions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Layers size={18} color="var(--primary)" /> الهيئات والمؤسسات
            المتعاقدة
          </h3>
          {station.institutions.length === 0 ? (
            <div
              style={{
                color: "var(--text-muted)",
                background: "var(--bg-card)",
                padding: 24,
                borderRadius: 16,
                border: "1px dashed var(--glass-border)",
                textAlign: "center",
                fontSize: "0.9rem",
              }}
            >
              لا توجد مؤسسات مخصصة
            </div>
          ) : (
            <DataGrid
              headers={["اسم المؤسسة", "تخصيص الشاحنات", "التمييز اللوني"]}
            >
              {station.institutions.map((inst) => (
                <tr
                  key={inst.id}
                  style={{ borderBottom: "1px solid var(--glass-border)" }}
                >
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                    {inst.name}
                  </td>
                  <td
                    style={{ padding: "12px 16px", color: "var(--text-muted)" }}
                  >
                    {inst.trucks} شاحنة
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: inst.color,
                        border: "2px solid var(--border)",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    />
                  </td>
                </tr>
              ))}
            </DataGrid>
          )}
        </div>
      </div>

      {/* Served Points */}
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 16,
        }}
      >
        <MapPin size={20} color="var(--primary)" /> سجل التوزيع للنقاط (
        {stationPoints.length})
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "var(--text-muted)",
            marginRight: 12,
            background: "var(--bg-elevated)",
            padding: "4px 10px",
            borderRadius: 20,
            border: "1px solid var(--glass-border)",
          }}
        >
          تم التغطية: {supplied} • إجمالي الطلب: {formatNum(totalPointDemand)}{" "}
          لتر
        </span>
      </h3>

      {stationPoints.length > 0 ? (
        <DataGrid
          headers={[
            "النقطة المستهدفة",
            "التصنيف",
            "كثافة سكانية",
            "كمية الطلب (لتر)",
            "الحالة",
          ]}
        >
          {stationPoints.map((p) => {
            const statusColor =
              p.status === "supplied"
                ? "var(--success)"
                : p.status === "warning"
                  ? "var(--warning)"
                  : "var(--danger)";
            const statusBg =
              p.status === "supplied"
                ? "var(--success-soft)"
                : p.status === "warning"
                  ? "var(--warning-soft)"
                  : "var(--danger-soft)";
            return (
              <tr
                key={p.id}
                style={{
                  borderBottom: "1px solid var(--glass-border)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-elevated)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td
                  style={{
                    padding: "14px 16px",
                    fontWeight: 600,
                    maxWidth: 220,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.name}
                </td>
                <td
                  style={{ padding: "14px 16px", color: "var(--text-muted)" }}
                >
                  {TYPE_LABELS[p.type] || p.type}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    color: "var(--text-muted)",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                  }}
                >
                  {formatNum(p.population)}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    fontWeight: 600,
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                  }}
                >
                  {formatNum(p.demand)}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      background: statusBg,
                      color: statusColor,
                      display: "inline-block",
                    }}
                  >
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </DataGrid>
      ) : (
        <div
          style={{
            color: "var(--text-muted)",
            background: "var(--bg-card)",
            padding: 32,
            borderRadius: 16,
            border: "1px dashed var(--glass-border)",
            textAlign: "center",
            fontSize: "0.95rem",
          }}
        >
          لا توجد مهام توزيع مسندة لهذه المحطة حالياً
        </div>
      )}

      {/* Trips */}
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 16,
        }}
      >
        <Navigation size={20} color="var(--primary)" /> خطوط سير الرحلات (
        {stationTrips.length})
      </h3>
      {stationTrips.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {stationTrips.map((trip, idx) => (
            <div
              key={trip.id}
              style={{
                background: "var(--bg-card)",
                borderRadius: 16,
                padding: "20px 24px",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "transform 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: `${trip.color}1a`,
                  border: `2px solid ${trip.color}50`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  color: trip.color,
                  boxShadow: `0 4px 12px ${trip.color}20`,
                }}
              >
                {idx + 1}
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: "var(--text)",
                  }}
                >
                  {trip.name}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <MapPin size={12} /> {trip.stops.length} محطات
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Droplet size={12} /> {formatNum(trip.demand)} L
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Navigation size={12} /> {(trip.distance / 1000).toFixed(1)}{" "}
                    km
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            color: "var(--text-muted)",
            background: "var(--bg-card)",
            padding: 32,
            borderRadius: 16,
            border: "1px dashed var(--glass-border)",
            textAlign: "center",
            fontSize: "0.95rem",
          }}
        >
          لم يتم تخطيط مسارات رحلات لهذه المحطة
        </div>
      )}
    </>
  );
}

/* ─── Shared Enterprise UI Components ─── */


function DataGrid({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table
          style={{
            width: "100%",
            minWidth: Math.max(headers.length * 120, 600),
            borderCollapse: "collapse",
            fontSize: "0.85rem",
            textAlign: "right",
          }}
        >
          <thead>
            <tr style={{ background: "var(--bg-elevated)" }}>
              {headers.map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 14px",
                    fontWeight: 700,
                    color: "var(--text)",
                    borderBottom: "2px solid var(--glass-border)",
                    borderLeft:
                      i < headers.length - 1
                        ? "1px solid var(--glass-border)"
                        : "none",
                    whiteSpace: "nowrap",
                    fontSize: "0.82rem",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
