import { useCallback, useEffect, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { MapPin, Plus, X } from "lucide-react";
import indiaGeo from "@/assets/india-topo.json";
import { getPincodeRiskBatch } from "@/api/client";
import { Card } from "@/components/ui-bits";
import { cn } from "@/lib/utils";

export type DeliveryRisk = {
  input: string;
  matched_city: string;
  latitude: number;
  longitude: number;
  risk_level: "low" | "medium" | "high";
  estimated_return_rate: number;
  recommendation: string;
};

type DeliveryRiskMapProps = {
  onRiskChange?: (locations: DeliveryRisk[]) => void;
};

const DEFAULT_LOCATIONS = ["Patna", "Ahmedabad", "Delhi"];
const DEMO_RISKS: Record<string, DeliveryRisk> = {
  patna: { input: "Patna", matched_city: "Patna", latitude: 25.6026, longitude: 85.1199, risk_level: "high", estimated_return_rate: 31.4, recommendation: "High return risk. Consider disabling COD or verifying the order via call." },
  ahmedabad: { input: "Ahmedabad", matched_city: "Ahmedabad", latitude: 23.027, longitude: 72.5998, risk_level: "medium", estimated_return_rate: 16.2, recommendation: "Moderate return risk. Standard logistics guidelines apply." },
  delhi: { input: "Delhi", matched_city: "Delhi", latitude: 28.6304, longitude: 77.2177, risk_level: "low", estimated_return_rate: 8.4, recommendation: "Safe zone. Low return rates expected." },
  uttarakhand: { input: "Uttarakhand", matched_city: "Uttarakhand (Dehradun)", latitude: 30.3165, longitude: 78.0322, risk_level: "medium", estimated_return_rate: 14.5, recommendation: "Moderate return risk. Standard logistics guidelines apply." },
};

const RISK_STYLES = {
  high: { label: "High risk", dot: "#A8323E", badge: "bg-[#A8323E]/12 text-[#8F2833]" },
  medium: { label: "Medium risk", dot: "#D48A14", badge: "bg-[#D48A14]/15 text-[#8D5706]" },
  low: { label: "Low risk", dot: "#648B65", badge: "bg-[#648B65]/15 text-[#456C47]" },
};

function fallbackRisks(inputs: string[]): DeliveryRisk[] {
  return inputs.map((input) => DEMO_RISKS[input.trim().toLowerCase()] ?? {
    input,
    matched_city: input,
    latitude: 22.9734,
    longitude: 78.6569,
    risk_level: "medium" as const,
    estimated_return_rate: 15,
    recommendation: "General caution advised. Monitor order closely.",
  });
}

export function DeliveryRiskMap({ onRiskChange }: DeliveryRiskMapProps) {
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [risks, setRisks] = useState<DeliveryRisk[]>(fallbackRisks(DEFAULT_LOCATIONS));
  const [draft, setDraft] = useState("");
  const [activeRisk, setActiveRisk] = useState<DeliveryRisk | null>(null);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  const refreshRisks = useCallback(async (nextLocations: string[]) => {
    const id = ++requestId.current;
    if (!nextLocations.length) {
      setRisks([]);
      onRiskChange?.([]);
      return;
    }

    setLoading(true);
    try {
      const response = await getPincodeRiskBatch(nextLocations);
      if (id !== requestId.current) return;
      const freshRisks = response as DeliveryRisk[];
      setRisks(freshRisks);
      onRiskChange?.(freshRisks);
    } catch {
      if (id !== requestId.current) return;
      const freshRisks = fallbackRisks(nextLocations);
      setRisks(freshRisks);
      onRiskChange?.(freshRisks);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [onRiskChange]);

  useEffect(() => { refreshRisks(DEFAULT_LOCATIONS); }, [refreshRisks]);

  const addLocation = () => {
    const city = draft.trim();
    if (!city || locations.some((location) => location.toLowerCase() === city.toLowerCase())) return;
    const nextLocations = [...locations, city];
    setLocations(nextLocations);
    setDraft("");
    setActiveRisk(null);
    refreshRisks(nextLocations);
  };

  const removeLocation = (location: string) => {
    const nextLocations = locations.filter((item) => item !== location);
    setLocations(nextLocations);
    setActiveRisk((current) => current?.input === location ? null : current);
    refreshRisks(nextLocations);
  };

  return (
    <section aria-labelledby="delivery-risk-heading" className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <label id="delivery-risk-heading" htmlFor="delivery-zone-input" className="text-sm font-semibold text-foreground">Where do you sell?</label>
          {loading && <span className="text-xs text-muted-foreground">Updating risk map…</span>}
        </div>
        <div className="mt-2 flex min-h-12 flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 focus-within:border-primary focus-within:ring-4 focus-within:ring-ring/30">
          {locations.map((location) => (
            <span key={location} className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-2.5 pr-1 text-xs font-semibold text-primary">
              {location}
              <button type="button" onClick={() => removeLocation(location)} className="grid h-5 w-5 place-items-center rounded-full hover:bg-primary/15" aria-label={`Remove ${location}`}><X className="h-3 w-3" /></button>
            </span>
          ))}
          <input id="delivery-zone-input" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addLocation(); } }} placeholder={locations.length ? "Add another city" : "Type a city name"} className="min-w-28 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground" />
          <button type="button" onClick={addLocation} className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50" disabled={!draft.trim()} aria-label="Add delivery location"><Plus className="h-4 w-4" /></button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Type a city or pincode, then press Enter or tap +.</p>
      </div>

      <Card className="relative overflow-visible p-3 sm:p-4">
        <div className="mb-2 flex items-center gap-2 px-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" /> Delivery return-risk map</div>
        <div className="relative overflow-hidden rounded-2xl border border-[#E8D8C5] bg-[#FFF8EB]">
          <ComposableMap projection="geoMercator" projectionConfig={{ center: [82, 22], scale: 850 }} width={520} height={500} className="h-auto w-full">
            <Geographies geography={indiaGeo as any}>
              {({ geographies }) => geographies.map((geo) => <Geography key={geo.rsmKey} geography={geo} fill="#F2E2CC" stroke="#B86B4A" strokeWidth={0.55} style={{ default: { outline: "none" }, hover: { fill: "#ECD1B1", outline: "none" }, pressed: { outline: "none" } }} />)}
            </Geographies>
            {risks.map((risk) => {
              const style = RISK_STYLES[risk.risk_level] ?? RISK_STYLES.medium;
              return <Marker key={risk.input} coordinates={[risk.longitude, risk.latitude]}>
                <g role="button" tabIndex={0} aria-label={`${risk.matched_city}: ${style.label}, ${risk.estimated_return_rate}% estimated return rate`} onMouseEnter={() => setActiveRisk(risk)} onMouseLeave={() => setActiveRisk(null)} onFocus={() => setActiveRisk(risk)} onBlur={() => setActiveRisk(null)} onClick={() => setActiveRisk((current) => current?.input === risk.input ? null : risk)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveRisk(risk); } }} className="cursor-pointer">
                  <circle r={12} fill={style.dot} opacity="0.16" /><circle r={6} fill={style.dot} stroke="#FFF8EB" strokeWidth={2.5} />
                </g>
              </Marker>;
            })}
          </ComposableMap>
          {activeRisk && (() => {
            const style = RISK_STYLES[activeRisk.risk_level] ?? RISK_STYLES.medium;
            return <div role="status" className="absolute bottom-3 left-3 right-3 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur sm:left-auto sm:right-3 sm:w-64">
              <div className="flex items-start justify-between gap-2"><p className="font-semibold text-foreground">{activeRisk.matched_city}</p><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", style.badge)}>{style.label}</span></div>
              <p className="mt-1 text-xs text-muted-foreground">Est. return rate: <strong className="text-foreground">{activeRisk.estimated_return_rate}%</strong></p>
              <p className="mt-2 text-xs leading-relaxed text-foreground">{activeRisk.recommendation}</p>
            </div>;
          })()}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 px-1 text-[11px] text-muted-foreground">{Object.entries(RISK_STYLES).map(([risk, style]) => <span key={risk} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: style.dot }} />{style.label}</span>)}</div>
      </Card>

      <div aria-live="polite" className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your delivery zones</p>
        {risks.map((risk) => { const style = RISK_STYLES[risk.risk_level] ?? RISK_STYLES.medium; return <button key={risk.input} type="button" onClick={() => setActiveRisk(risk)} className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-left hover:border-primary/40"><span className="text-sm font-medium text-foreground">{risk.matched_city}</span><span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", style.badge)}>{style.label} · {risk.estimated_return_rate}%</span></button>; })}
      </div>
    </section>
  );
}
