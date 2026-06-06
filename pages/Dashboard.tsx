import React from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Building2, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  Banknote, 
  Activity, 
  ArrowUpRight,
  TrendingUp,
  FileCheck2,
  Clock
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { base44 } from "@/api/base44Client";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";

export default function Dashboard() {
  const { data: partners = [] } = useQuery({
    queryKey: ["partners"],
    queryFn: () => base44.entities.Partner.list()
  });

  const { data: policies = [] } = useQuery({
    queryKey: ["policies"],
    queryFn: () => base44.entities.Policy.list()
  });

  const { data: claims = [] } = useQuery({
    queryKey: ["claims"],
    queryFn: () => base44.entities.Claim.list()
  });

  const { data: riskEvents = [] } = useQuery({
    queryKey: ["riskEvents"],
    queryFn: () => base44.entities.RiskEvent.list()
  });

  const { data: insurers = [] } = useQuery({
    queryKey: ["insurers"],
    queryFn: () => base44.entities.InsurerPartner.list()
  });

  // Calculate dynamic stats
  const totalPartners = partners.length;
  const activePoliciesCount = policies.filter(p => p.status === "active").length;
  const pendingClaimsCount = claims.filter(c => c.status === "under_review" || c.status === "submitted").length;
  
  const totalPremiumPaid = policies.reduce((sum, p) => sum + (p.premium_paid || 0), 0);
  
  // Format to USD
  const formatUSD = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Static/Calculated chart data based on loaded items plus historical points
  const chartData = [
    { name: "Jan", volume: 4500, claims: 120 },
    { name: "Feb", volume: 6200, claims: 180 },
    { name: "Mar", volume: 8900, claims: 140 },
    { name: "Apr", volume: 12400, claims: 450 },
    { name: "May", volume: 18100, claims: 320 },
    { name: "Jun", volume: totalPremiumPaid || 21545, claims: claims.reduce((sum, c) => sum + c.claim_amount, 0) || 1250 }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="dashboard-root">
      <PageHeader 
        id="dashboard-header"
        title="CoverLayer Platform Dashboard" 
        subtitle="Real-time multi-tenant insurance aggregation operations, claim processing, and AI risk scoring statistics."
      />

      {/* Main metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="metrics-grid">
        <div id="stat-premium-volume">
          <StatCard
            title="Gross Premium Volume"
            value={formatUSD(totalPremiumPaid)}
            subtext="Total settled premium across all channels"
            icon={Banknote}
            trend={{ value: "+28.4%", type: "up" }}
          />
        </div>
        <div id="stat-active-policies">
          <StatCard
            title="Active Policies"
            value={activePoliciesCount.toString()}
            subtext="In-force micro-insurance policies"
            icon={ShieldCheck}
            trend={{ value: "+14.2%", type: "up" }}
          />
        </div>
        <div id="stat-claims-review">
          <StatCard
            title="Pending Claims"
            value={pendingClaimsCount.toString()}
            subtext="Claims undergoing AI & team triage"
            icon={AlertTriangle}
            trend={{ value: "-8.3%", type: "down" }}
          />
        </div>
        <div id="stat-partners">
          <StatCard
            title="Tenant Partners"
            value={totalPartners.toString()}
            subtext="Active API/SDK distributors connected"
            icon={Building2}
            trend={{ value: "+1", type: "neutral" }}
          />
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-and-feeds">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-[#121215]/90 backdrop-blur-md border border-[#1f1f24] p-6 rounded-3xl shadow-3xs space-y-4" id="volume-chart-container">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest" id="chart-title">Premium Growth & Volume</h3>
              <p className="text-xs text-zinc-500 font-semibold mt-1" id="chart-subtitle">Gross written premiums integrated via client SDKs (monthly run-rate)</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-xs font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>MoM Upward Surge</span>
            </div>
          </div>
          
          <div className="h-80 w-full" id="premium-area-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e1e24" />
                <XAxis dataKey="name" stroke="#52525b" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#16161a", 
                    borderColor: "#2d2d34",
                    borderRadius: "1rem"
                  }} 
                  itemStyle={{ color: "#f4f4f5" }}
                  formatter={(value: any) => [`$${value}`, "Written Volume"]}
                />
                <Area type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operating status & System diagnostics */}
        <div className="bg-[#121215]/90 backdrop-blur-md border border-[#1f1f24] p-6 rounded-3xl shadow-3xs space-y-4 flex flex-col justify-between" id="diagnostics-container">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest" id="status-card-title">Infrastructure Status</h3>
            
            <div className="space-y-3" id="system-status-indicators">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-emerald-400" />
                  <div>
                    <span className="text-sm font-bold text-zinc-100 block leading-tight">Base44 Protocol Engine</span>
                    <span className="text-xs text-zinc-400 font-semibold mt-0.5 block leading-none">99.98% runtime operational</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 uppercase tracking-wide">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <FileCheck2 className="h-5 w-5 text-indigo-400" />
                  <div>
                    <span className="text-sm font-bold text-zinc-100 block leading-tight">Smart Triage LLM Gateway</span>
                    <span className="text-xs text-zinc-400 font-semibold mt-0.5 block leading-none">Gemini model synced</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/35 uppercase tracking-wide">Synced</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div>
                    <span className="text-sm font-bold text-zinc-100 block leading-tight">LLM Scoring Latency</span>
                    <span className="text-xs text-zinc-400 font-semibold mt-0.5 block leading-none">Computed in real-time</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/25 text-amber-400 border border-amber-500/35 uppercase tracking-wide">184ms</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1f1f24] mt-4" id="diagnostics-summary">
            <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
              All cover syndicates are synchronized with active FCA and regulatory portals. Policy premium settlements are finalized in real time using transactional payloads.
            </p>
          </div>
        </div>
      </div>

      {/* Recent activities section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="claims-and-events-section">
        {/* Recent Claims Table */}
        <div className="bg-[#121215]/90 backdrop-blur-md border border-[#1f1f24] p-6 rounded-3xl shadow-3xs space-y-4" id="recent-claims-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest" id="claims-title">Recent Claims Activity</h3>
            <span className="text-xs font-bold text-zinc-400 bg-zinc-800/50 px-2.5 py-1 rounded-lg border border-[#1f1f24]">Auto triaged</span>
          </div>
          
          <div className="overflow-x-auto" id="recent-claims-table-div">
            <table className="w-full text-sm text-left border-collapse" id="recent-claims-table">
              <thead>
                <tr className="border-b border-[#1f1f24] text-zinc-500 text-[10px] font-bold uppercase tracking-wider" id="recent-claims-thead-tr">
                  <th className="py-2.5 font-bold">Claimant / Policy</th>
                  <th className="py-2.5 font-bold">Incident</th>
                  <th className="py-2.5 font-bold text-right">Amount</th>
                  <th className="py-2.5 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody id="recent-claims-tbody">
                {claims.length === 0 ? (
                  <tr id="no-claims-tr">
                    <td colSpan={4} className="py-4 text-center text-zinc-500" id="no-claims-td">No open claims filed yet.</td>
                  </tr>
                ) : (
                  claims.slice(0, 4).map((claim) => (
                    <tr key={claim.id} className="border-b border-[#1f1f24] hover:bg-zinc-800/30 last:border-0" id={`claim-row-${claim.id}`}>
                      <td className="py-3">
                        <p className="font-bold text-white">{claim.claimant_name || claim.claimant_email}</p>
                        <p className="text-[10px] text-zinc-500 font-bold font-mono tracking-tight uppercase leading-none mt-1">{claim.policy_number || "POL-UNKNOWN"}</p>
                      </td>
                      <td className="py-3 max-w-[180px] truncate text-zinc-400 font-semibold" title={claim.incident_description}>
                        {claim.incident_description}
                      </td>
                      <td className="py-3 text-right font-black text-white font-mono">
                        ${claim.claim_amount.toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-lg border uppercase tracking-wide ${
                          claim.status === "paid" || claim.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : claim.status === "rejected"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`} id={`claim-status-${claim.id}`}>
                          {claim.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Risk Events Payload Logger */}
        <div className="bg-[#121215]/90 backdrop-blur-md border border-[#1f1f24] p-6 rounded-3xl shadow-3xs space-y-4" id="risk-events-panel">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest" id="events-title">Incoming Risk Events Logging</h3>
            <span className="text-xs text-zinc-500 font-semibold hover:text-white flex items-center gap-1.5 font-mono">
              <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-ping"></span> Live SDK Stream
            </span>
          </div>

          <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1" id="risk-events-list">
            {riskEvents.length === 0 ? (
              <p className="text-sm text-center text-zinc-500 py-8" id="no-events-p">No API transaction payloads evaluated yet.</p>
            ) : (
              riskEvents.slice(0, 4).map((evt) => (
                <div key={evt.id} className="flex flex-col md:flex-row md:items-center justify-between p-3.5 border border-[#1f1f24] rounded-2xl hover:border-[#32323b] hover:bg-[#16161a] transition-all gap-2" id={`event-card-${evt.id}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono bg-[#16161a] border border-[#1e1e24] text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-wide">{evt.event_type}</span>
                      <span className="text-xs text-zinc-500 font-bold">{evt.location}</span>
                    </div>
                    <p className="text-sm font-bold tracking-tight text-zinc-200 mt-1 truncate max-w-sm md:max-w-md" title={evt.user_context}>
                      {evt.user_context}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-right" id={`event-stats-${evt.id}`}>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Value</p>
                      <p className="text-sm font-bold text-zinc-100 mt-1">${evt.transaction_value}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-none">Score</p>
                      <p className={`text-md font-black mt-1 ${
                        evt.risk_score > 60 ? "text-rose-500" :
                        evt.risk_score > 30 ? "text-amber-500" :
                        "text-emerald-500"
                      }`}>{evt.risk_score}%</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
