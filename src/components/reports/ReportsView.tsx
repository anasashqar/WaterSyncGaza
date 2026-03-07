/**
 * WaterSync — Enterprise Reports View
 * نظام التقارير والبيانات التفصيلية - عرض بالمؤسسات (ملخص عام لكل مؤسسة)
 */
import { useState, useMemo } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { TYPE_LABELS } from "@/lib/constants/colors";
import type { Station, Point, Trip, DeliveryRecord } from "@/types";
import {
  FileText,
  MapPin,
  Activity,
  X,
  Factory,
  Building2,
  Droplet,
  Navigation,
  LayoutList,
  Layers,
  ChevronLeft,
  Users,
  Clock,
  Truck,
  CheckCircle2,
  Package,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

/* ─── Helper: aggregate unique institutions across all stations ─── */
interface AggregatedInstitution {
  id: string;
  name: string;
  color: string;
  /** total trucks across all stations */
  totalTrucks: number;
  /** station IDs this institution is contracted with */
  stationIds: string[];
}

function aggregateInstitutions(stations: Station[]): AggregatedInstitution[] {
  const map = new Map<string, AggregatedInstitution>();
  for (const st of stations) {
    for (const inst of st.institutions) {
      const existing = map.get(inst.id);
      if (existing) {
        existing.totalTrucks += inst.trucks;
        if (!existing.stationIds.includes(st.id)) {
          existing.stationIds.push(st.id);
        }
      } else {
        map.set(inst.id, {
          id: inst.id,
          name: inst.name,
          color: inst.color,
          totalTrucks: inst.trucks,
          stationIds: [st.id],
        });
      }
    }
  }
  return Array.from(map.values());
}

export function ReportsView({ onClose }: { onClose: () => void }) {
  const stations = useDataStore((s) => s.stations);
  const points = useDataStore((s) => s.points);
  const trips = useDataStore((s) => s.trips);
  const deliveries = useDataStore((s) => s.deliveries);

  const allInstitutions = useMemo(
    () => aggregateInstitutions(stations),
    [stations],
  );

  const role = useAuthStore((s) => s.role);
  const userInstitutionId = useAuthStore((s) => s.institutionId);
  const isAdmin = role === "admin";

  // If user is NGO, lock selection to their own ID
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<
    string | null
  >(isAdmin ? null : userInstitutionId ?? null);

  const selectedInstitution = useMemo(
    () => allInstitutions.find((i) => i.id === selectedInstitutionId) ?? null,
    [allInstitutions, selectedInstitutionId],
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
            {selectedInstitution
              ? `تقرير مؤسسة: ${selectedInstitution.name}`
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
        {/* ──── Institution Selector (Sidebar) ──── */}
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
            <Building2 size={18} color={primaryColor} />
            <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>
              سجل المؤسسات
            </span>
          </div>

          {isAdmin && (
            <>
              <button
                onClick={() => setSelectedInstitutionId(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 12,
                  cursor: "pointer",
                  background:
                    selectedInstitutionId === null
                      ? "var(--primary-soft)"
                      : "var(--bg-elevated)",
                  border: `1px solid ${selectedInstitutionId === null ? "var(--primary)" : "var(--glass-border)"}`,
                  color:
                    selectedInstitutionId === null
                      ? "var(--primary)"
                      : "var(--text)",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  fontFamily: "inherit",
                  textAlign: "right",
                  transition: "all 0.2s",
                  width: "100%",
                  boxShadow:
                    selectedInstitutionId === null ? "var(--shadow-sm)" : "none",
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
            </>
          )}

          {allInstitutions.filter(inst => isAdmin || inst.id === userInstitutionId).length === 0 ? (
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
              لا توجد مؤسسات مسجلة
            </div>
          ) : (
            allInstitutions
              .filter(inst => isAdmin || inst.id === userInstitutionId)
              .map((inst) => {
              const isActive = selectedInstitutionId === inst.id;
              return (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInstitutionId(inst.id)}
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
                    <Building2 size={18} />
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
                      {inst.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        opacity: 0.8,
                        fontWeight: 500,
                      }}
                    >
                      {inst.stationIds.length} محطات • {inst.totalTrucks}{" "}
                      شاحنات
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
            {selectedInstitution ? (
              <InstitutionReport
                institution={selectedInstitution}
                stations={stations}
                points={points}
                trips={trips}
                deliveries={deliveries}
              />
            ) : (
              <OverallSummary
                stations={stations}
                institutions={allInstitutions}
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
  institutions,
  points,
  trips,
}: {
  stations: Station[];
  institutions: AggregatedInstitution[];
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
            جداول البيانات التفصيلية لجميع المؤسسات والعناصر اللوجستية
          </span>
        </div>
      </div>

      {/* Per-institution Detailed Table */}
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
        <Building2 size={18} color="var(--primary)" /> سجل المؤسسات التفصيلي (
        {institutions.length})
      </h3>
      <DataGrid
        headers={[
          "المؤسسة",
          "التمييز اللوني",
          "عدد المحطات",
          "إجمالي الشاحنات",
          "إجمالي السعة (لتر)",
          "إجمالي الاستهلاك",
          "إجمالي المتبقي",
        ]}
      >
        {institutions.length === 0 ? (
          <tr>
            <td
              colSpan={7}
              style={{
                textAlign: "center",
                padding: 24,
                color: "var(--text-muted)",
              }}
            >
              لا توجد مؤسسات مسجلة
            </td>
          </tr>
        ) : (
          institutions.map((inst) => {
            const instStations = stations.filter((s) =>
              inst.stationIds.includes(s.id),
            );
            const totalCapacity = instStations.reduce(
              (sum, s) => sum + s.dailyCapacity,
              0,
            );
            const totalUsed = instStations.reduce(
              (sum, s) => sum + (s.usedCapacity || 0),
              0,
            );
            const totalRemaining = instStations.reduce(
              (sum, s) => sum + (s.remainingCapacity ?? s.dailyCapacity ?? 0),
              0,
            );
            return (
              <tr
                key={inst.id}
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
                  {inst.name}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: inst.color,
                      border: "2px solid var(--border)",
                      boxShadow: "var(--shadow-sm)",
                      display: "inline-block",
                    }}
                  />
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                  {inst.stationIds.length}
                </td>
                <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                  {inst.totalTrucks}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    color: "var(--text)",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                  }}
                >
                  {formatNum(totalCapacity)}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    color: "var(--warning)",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                  }}
                >
                  {formatNum(totalUsed)}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    color: "var(--primary)",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                  }}
                >
                  {formatNum(totalRemaining)}
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

/* ─── Drivers Demo Data ─── */
interface SimDriver {
  id: string;
  name: string;
  status: "idle" | "delivering" | "returning";
  currentPointId: string | null;
  completedToday: number;
  totalLiters: number;
  avatar: string;
}

const DEMO_DRIVERS: Record<string, SimDriver[]> = {
  "ngo-unrwa": [
    { id: "drv-u1", name: "محمد العبد", status: "delivering", currentPointId: null, completedToday: 3, totalLiters: 45000, avatar: "👨‍✈️" },
    { id: "drv-u2", name: "أحمد السعيد", status: "idle", currentPointId: null, completedToday: 5, totalLiters: 75000, avatar: "👨" },
    { id: "drv-u3", name: "خالد عمر", status: "returning", currentPointId: null, completedToday: 2, totalLiters: 30000, avatar: "🧑" },
  ],
  "ngo-islamic-relief": [
    { id: "drv-i1", name: "يوسف حسن", status: "delivering", currentPointId: null, completedToday: 4, totalLiters: 60000, avatar: "👨‍✈️" },
    { id: "drv-i2", name: "عمر ناصر", status: "idle", currentPointId: null, completedToday: 6, totalLiters: 90000, avatar: "👨" },
  ],
};

/* ─── Single Institution Report ─── */
function InstitutionReport({
  institution,
  stations,
  points,
  trips,
  deliveries,
}: {
  institution: AggregatedInstitution;
  stations: Station[];
  points: Point[];
  trips: Trip[];
  deliveries: DeliveryRecord[];
}) {
  const [tab, setTab] = useState<"overview" | "field">("overview");
  /** Stations this institution is contracted with */
  const contractedStations = useMemo(
    () => stations.filter((s) => institution.stationIds.includes(s.id)),
    [stations, institution.stationIds],
  );

  /** Points served by the contracted stations */
  const institutionPoints = useMemo(
    () =>
      points.filter((p) =>
        institution.stationIds.includes(p.stationId ?? ""),
      ),
    [points, institution.stationIds],
  );

  /** Trips of the contracted stations */
  const institutionTrips = useMemo(
    () =>
      trips.filter(
        (t) =>
          t.institutionId === institution.id ||
          institution.stationIds.includes(t.station?.id ?? ""),
      ),
    [trips, institution],
  );

  const totalCapacity = contractedStations.reduce(
    (s, st) => s + st.dailyCapacity,
    0,
  );
  const totalUsed = contractedStations.reduce(
    (s, st) => s + (st.usedCapacity || 0),
    0,
  );
  const totalPointDemand = institutionPoints.reduce(
    (s, p) => s + p.demand,
    0,
  );
  const supplied = institutionPoints.filter(
    (p) => p.status === "supplied",
  ).length;
  const formatNum = (n: number) =>
    new Intl.NumberFormat("en-US").format(Math.round(n));

  return (
    <>
      {/* Header */}
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
          <Building2 size={28} />
        </div>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
            تقرير مؤسسة: {institution.name}
          </h2>
          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {institution.stationIds.length} محطات متعاقد معها —{" "}
            {institution.totalTrucks} شاحنات
          </span>
        </div>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: institution.color,
            border: "2px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
            marginRight: "auto",
          }}
        />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 16,
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => setTab("overview")}
          style={{
            padding: "8px 24px",
            borderRadius: 8,
            background: tab === "overview" ? "var(--primary)" : "var(--bg-elevated)",
            color: tab === "overview" ? "#fff" : "var(--text-muted)",
            border: `1px solid ${tab === "overview" ? "var(--primary)" : "var(--glass-border)"}`,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}
        >
          الملخص التشغيلي
        </button>
        <button
          onClick={() => setTab("field")}
          style={{
            padding: "8px 24px",
            borderRadius: 8,
            background: tab === "field" ? "var(--primary)" : "var(--bg-elevated)",
            color: tab === "field" ? "#fff" : "var(--text-muted)",
            border: `1px solid ${tab === "field" ? "var(--primary)" : "var(--glass-border)"}`,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "inherit",
          }}
        >
          <Activity size={16} /> المتابعة الميدانية
        </button>
      </div>

      {tab === "overview" ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(300px, 1.2fr) minmax(300px, 1fr)",
              gap: 32,
            }}
          >
            {/* Institution Metrics */}
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
                <Layers size={18} color="var(--primary)" /> المؤشرات اللوجستية
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    background: "var(--bg-card)",
                    padding: 20,
                    borderRadius: 16,
                    border: "1px solid var(--glass-border)",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    السعة المتاحة للمحطات
                  </span>
                  <span style={{ fontSize: "1.6rem", fontWeight: 800 }}>
                    {formatNum(totalCapacity)} L
                  </span>
                </div>
                <div
                  style={{
                    background: "var(--bg-card)",
                    padding: 20,
                    borderRadius: 16,
                    border: "1px solid var(--glass-border)",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    السعة المستغلة
                  </span>
                  <span
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 800,
                      color: "var(--primary)",
                    }}
                  >
                    {formatNum(totalUsed)} L
                  </span>
                </div>
                <div
                  style={{
                    background: "var(--bg-card)",
                    padding: 20,
                    borderRadius: 16,
                    border: "1px solid var(--glass-border)",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    احتياج النقاط الكلي
                  </span>
                  <span style={{ fontSize: "1.6rem", fontWeight: 800 }}>
                    {formatNum(totalPointDemand)} L
                  </span>
                </div>
                <div
                  style={{
                    background: "var(--bg-card)",
                    padding: 20,
                    borderRadius: 16,
                    border: "1px solid var(--glass-border)",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    النقاط المكتملة
                  </span>
                  <span
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 800,
                      color: "var(--success)",
                    }}
                  >
                    {supplied}{" "}
                    <span
                      style={{
                        fontSize: "1rem",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                      }}
                    >
                      / {institutionPoints.length}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Contracted Stations */}
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
                <Building2 size={18} color="var(--primary)" /> المحطات المتعاقد
                معها ({contractedStations.length})
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  maxHeight: 250,
                  overflowY: "auto",
                  paddingRight: 8,
                }}
              >
                {contractedStations.length === 0 ? (
                  <div
                    style={{
                      color: "var(--text-muted)",
                      background: "var(--bg-card)",
                      padding: 24,
                      borderRadius: 12,
                      border: "1px dashed var(--glass-border)",
                      textAlign: "center",
                      fontSize: "0.9rem",
                    }}
                  >
                    لا توجد محطات مسندة لهذه المؤسسة
                  </div>
                ) : (
                  contractedStations.map((st) => (
                    <div
                      key={st.id}
                      style={{
                        background: "var(--bg-card)",
                        padding: "16px 20px",
                        borderRadius: 14,
                        border: "1px solid var(--glass-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: "var(--shadow-sm)",
                        transition: "transform 0.2s, background 0.2s",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(-4px)";
                        e.currentTarget.style.background = "var(--bg-elevated)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.background = "var(--bg-card)";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: "var(--primary-soft)",
                            color: "var(--primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Factory size={20} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "0.95rem",
                              marginBottom: 2,
                            }}
                          >
                            {st.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              fontWeight: 600,
                              display: "flex",
                              gap: 12,
                            }}
                          >
                            <span>📌 {st.governorate}</span>
                            <span>🚚 {st.trucks} شاحنات إجمالية</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div
                          style={{
                            fontWeight: 800,
                            color: "var(--text)",
                            fontSize: "0.95rem",
                          }}
                        >
                          {formatNum(st.dailyCapacity)} L
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--primary)",
                            fontWeight: 600,
                          }}
                        >
                          المستغل: {formatNum(st.usedCapacity || 0)} L
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Assigned Delivery Points */}
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
            <MapPin size={20} color="var(--primary)" /> نقاط توزيع المؤسسة (
            {institutionPoints.length})
          </h3>
          {institutionPoints.length > 0 ? (
            <DataGrid
              headers={[
                "النقطة",
                "المحافظة / الحي",
                "الاحتياج (لتر)",
                "الكمية المسلّمة",
                "المتبقي للسعة",
                "زيارات الشاحنات",
                "الحالة",
              ]}
            >
              {institutionPoints.map((p) => {
                const STATUS_LABELS: Record<string, string> = {
                  critical: "حرج",
                  warning: "تحذير",
                  supplied: "مزوّد",
                };
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
                      {p.name}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {p.governorate}
                      {p.neighborhood ? ` — ${p.neighborhood}` : ""}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "var(--text)",
                        fontFamily: "monospace",
                      }}
                    >
                      {formatNum(p.demand)}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "var(--primary)",
                        fontFamily: "monospace",
                        fontWeight: 600,
                      }}
                    >
                      {formatNum(p.totalReceived)}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        color: "var(--danger)",
                        fontFamily: "monospace",
                      }}
                    >
                      {formatNum(
                        p.remainingCapacity ??
                          (p.capacity || 20000) - (p.currentFill || 0),
                      )}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          background: "var(--bg-dark)",
                          padding: "4px 8px",
                          borderRadius: 8,
                          fontSize: "0.8rem",
                          border: "1px solid var(--glass-border)",
                          fontWeight: 700,
                        }}
                      >
                        {p.visitedByTrucks?.length || 0}
                      </span>
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
              لا توجد مهام توزيع مسندة لهذه المؤسسة حالياً
            </div>
          )}

          {/* Recommended (Unserved) Points for this NGO */}
          {(() => {
            const recommendedPoints = points.filter(p => !p.reservedBy && p.suggestedNgoId === institution.id && p.remainingCapacity > 0);
            if (recommendedPoints.length === 0) return null;

            return (
              <div style={{ marginTop: 24, padding: 24, background: 'rgba(245,158,11,0.05)', borderRadius: 16, border: '1px solid rgba(245,158,11,0.2)' }}>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                    color: '#f59e0b',
                  }}
                >
                  <AlertTriangle size={20} /> نقاط غير مغطاة مقترحة للتدخل ({recommendedPoints.length})
                </h3>
                <DataGrid
                  headers={[
                    "النقطة",
                    "المحافظة / الحي",
                    "الاحتياج المتأخر (لتر)",
                    "مدة الانقطاع المتوقعة",
                    "الحالة",
                  ]}
                >
                  {recommendedPoints.map((p) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "1px solid rgba(245,158,11,0.1)",
                        transition: "background 0.2s",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(245,158,11,0.1)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                        {p.name}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "var(--text-muted)",
                        }}
                      >
                        {p.governorate}
                        {p.neighborhood ? ` — ${p.neighborhood}` : ""}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "var(--danger)",
                          fontFamily: "monospace",
                          fontWeight: 600,
                        }}
                      >
                        {formatNum(p.remainingCapacity)}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "var(--text-muted)",
                          fontSize: '0.85rem'
                        }}
                      >
                        {p.missedCount * 4} أيام
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            background: "var(--danger-soft)",
                            color: "var(--danger)",
                            display: "inline-block",
                          }}
                        >
                          تتطلب تدخل
                        </span>
                      </td>
                    </tr>
                  ))}
                </DataGrid>
              </div>
            );
          })()}

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
            {institutionTrips.length})
          </h3>
          {institutionTrips.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              {institutionTrips.map((trip, idx) => (
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
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "none")
                  }
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
                        <Navigation size={12} />{" "}
                        {(trip.distance / 1000).toFixed(1)} km
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
              لم يتم تخطيط مسارات رحلات لهذه المؤسسة
            </div>
          )}
        </>
      ) : (
        <FieldTrackingTab institution={institution} points={points} deliveries={deliveries} />
      )}
    </>
  );
}

/* ─── Field Tracking Tab ─── */
function FieldTrackingTab({
  institution,
  points,
  deliveries,
}: {
  institution: AggregatedInstitution;
  points: Point[];
  deliveries: DeliveryRecord[];
}) {
  const myPoints = useMemo(() => {
    return points.filter((p) => p.reservedBy === institution.id);
  }, [points, institution.id]);

  const myDeliveries = useMemo(() => {
    return deliveries.filter((d) => d.institutionId === institution.id);
  }, [deliveries, institution.id]);

  const stats = useMemo(() => {
    const pending = myPoints.filter(p => p.reservationStatus === 'reserved')
    const inTransit = myPoints.filter(p => p.reservationStatus === 'in_transit')
    const delivered = myPoints.filter(p => p.reservationStatus === 'delivered' || p.reservationStatus === 'verified')
    const verified = myPoints.filter(p => p.reservationStatus === 'verified')
    const totalDemand = myPoints.reduce((s, p) => s + p.demand, 0)
    const deliveredLiters = myDeliveries.reduce((s, d) => s + d.liters, 0)
    return { pending, inTransit, delivered, verified, totalDemand, deliveredLiters, total: myPoints.length }
  }, [myPoints, myDeliveries]);

  const completionRate = stats.total > 0 ? Math.round((stats.delivered.length / stats.total) * 100) : 0;

  const myDrivers = useMemo(() => {
    const drivers = DEMO_DRIVERS[institution.id] || [];
    const transitPoints = myPoints.filter(p => p.reservationStatus === 'in_transit');
    return drivers.map((d, i) => ({
      ...d,
      status: (transitPoints.length > 0 && i === 0 ? 'delivering' : d.status) as SimDriver['status'],
      currentPointId: transitPoints[i]?.id || null,
      completedToday: d.completedToday + stats.delivered.length,
    }));
  }, [institution.id, myPoints, stats.delivered.length]);

  const timeline = useMemo(() => {
    return [...myDeliveries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map(d => {
        const point = points.find(p => p.id === d.pointId);
        return { delivery: d, point };
      });
  }, [myDeliveries, points]);
  
  const formatNum = (n: number) =>
    new Intl.NumberFormat("en-US").format(Math.round(n));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, animation: "fadeIn 0.2s ease" }}>
      {/* KPI Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 16, border: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(56,189,248,0.1)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={24} /></div>
          <div><div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>إجمالي المهام</div><div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{stats.total}</div></div>
        </div>
        <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 16, border: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(59,130,246,0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}><Truck size={24} /></div>
          <div><div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>قيد التنفيذ</div><div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#3b82f6" }}>{stats.inTransit.length}</div></div>
        </div>
        <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 16, border: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--success-soft)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={24} /></div>
          <div><div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>مكتملة</div><div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--success)" }}>{stats.delivered.length}</div></div>
        </div>
        <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 16, border: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: completionRate >= 70 ? "var(--success-soft)" : completionRate >= 40 ? "var(--warning-soft)" : "var(--danger-soft)", color: completionRate >= 70 ? "var(--success)" : completionRate >= 40 ? "var(--warning)" : "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp size={24} /></div>
          <div><div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>نسبة الإنجاز</div><div style={{ fontSize: "1.6rem", fontWeight: 800, color: completionRate >= 70 ? "var(--success)" : completionRate >= 40 ? "var(--warning)" : "var(--danger)" }}>{completionRate}%</div></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) minmax(350px, 1.2fr)", gap: 32 }}>
        {/* Drivers List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} color="var(--primary)" /> السائقون النشطون ({myDrivers.length})
          </h3>
          {myDrivers.length === 0 ? (
            <div style={{ background: "var(--bg-card)", padding: 32, borderRadius: 16, border: "1px dashed var(--glass-border)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.95rem" }}>لا توجد بيانات سائقين</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {myDrivers.map(driver => {
                const isDelivering = driver.status === 'delivering';
                const currentPoint = driver.currentPointId ? points.find(p => p.id === driver.currentPointId) : null;
                return (
                  <div key={driver.id} style={{
                    background: isDelivering ? "var(--primary-soft)" : "var(--bg-card)",
                    borderRadius: 14, padding: "16px",
                    border: isDelivering ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex", alignItems: "center", gap: 14,
                    transition: "all 0.2s"
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-dark)", border: "1px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                      {driver.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text)", marginBottom: 4 }}>{driver.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: 8, alignItems: "center" }}>
                        {isDelivering ? (
                          <><span style={{ color: "var(--primary)", fontWeight: 600 }}>يوصّل الآن</span> {currentPoint && <span>→ {currentPoint.name}</span>}</>
                        ) : driver.status === 'returning' ? (
                          <span style={{ color: "var(--warning)", fontWeight: 600 }}>عائد للمحطة</span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>في الانتظار</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0, padding: "0 8px" }}>
                      <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--success)" }}>{driver.completedToday}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>مكتملة</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Timeline Log */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={18} color="var(--primary)" /> سجل الأحداث المباشر ({timeline.length})
          </h3>
          {timeline.length === 0 ? (
            <div style={{ background: "var(--bg-card)", padding: 32, borderRadius: 16, border: "1px dashed var(--glass-border)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.95rem" }}>لا توجد أحداث بعد</div>
          ) : (
            <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--glass-border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
              <div style={{ padding: "0 20px" }}>
                {timeline.map(({ delivery, point }, i) => {
                  const isVerified = delivery.status === 'verified';
                  const time = new Date(delivery.createdAt);
                  return (
                    <div key={delivery.id} style={{
                      display: "flex", gap: 16, padding: "16px 0",
                      borderBottom: i < timeline.length - 1 ? "1px solid var(--glass-border)" : "none",
                    }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: isVerified ? "var(--success)" : "var(--primary)", border: "2px solid var(--bg-card)", boxShadow: `0 0 0 2px ${isVerified ? "var(--success-soft)" : "var(--primary-soft)"}`, marginTop: 4, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)" }}>{point?.name || delivery.pointId}</span>
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: isVerified ? "var(--success-soft)" : "var(--primary-soft)", color: isVerified ? "var(--success)" : "var(--primary)" }}>
                            {isVerified ? "مؤكّد" : "تم التسليم"}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                          <span>💧 {formatNum(delivery.liters)} لتر</span>
                          {delivery.receipt?.receiverName && <span>👤 {delivery.receipt.receiverName}</span>}
                          <span>🕐 {time.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
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
