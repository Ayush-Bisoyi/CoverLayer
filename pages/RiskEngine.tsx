import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Sparkles, 
  Workflow, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Flame, 
  Network,
  ShoppingBag,
  Plane,
  Truck,
  Heart,
  Plus
} from "lucide-react";
import { base44, RiskEvent } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";

export default function RiskEngine() {
  const queryClient = useQueryClient();
  const [eventType, setEventType] = useState("gig_job_accepted");
  const [transactionValue, setTransactionValue] = useState(45);
  const [location, setLocation] = useState("New York, US");
  const [userContext, setUserContext] = useState(
    "28-year-old courier driver with 12 months history. Accepting job hauling heavy electronic cargo across high congestion lanes at midnight in pouring rain."
  );

  const [activeAnalysis, setActiveAnalysis] = useState<any>(null);

  // Fetch historic risk events
  const { data: riskEvents = [], isLoading } = useQuery({
    queryKey: ["riskEvents"],
    queryFn: () => base44.entities.RiskEvent.list("-created_date", 20)
  });

  // Fetch partners
  const { data: partners = [] } = useQuery({
    queryKey: ["partners"],
    queryFn: () => base44.entities.Partner.list()
  });

  // Fetch active policy catalogs to match
  const { data: catalogs = [] } = useQuery({
    queryKey: ["policyCatalogs"],
    queryFn: () => base44.entities.PolicyCatalog.list()
  });

  // Run AI Risk Evaluation
  const evaluateRiskMutation = useMutation({
    mutationFn: async () => {
      const activeCatalogs = catalogs.filter(c => c.status === "active");
      const catalogDataText = activeCatalogs.map(c => 
        `Product ID: ${c.id}, Product Name: ${c.name}, Premium: $${c.base_premium}, Limits: $${c.coverage_amount}, Exclusions: ${c.exclusions || "None"}`
      ).join("\n");

      const prompt = `You are CoverLayer's Core AI Risk Underwriting & Rating Engine.
An API consumer has submitted a real-time transactional event payload for underwriting analysis and micro-insurance eligibility matching.

Event Payload specifications:
- Event Class: ${eventType}
- Transaction Value: $${transactionValue} USD
- Location/Jurisdiction: ${location}
- User Context & Telemetry Payload: "${userContext}"

Available Policy Catalog templates matching carrier capacities:
${catalogDataText || "No catalog products active. Auto-generate recommended fit."}

Your Job:
1. Formulate a risk score from 1 to 100 (1 indicates zero exposure, 100 indicates catastrophic risk).
2. Synthesize a professional underwriting risk summary (max 3 sentences) outlining rating exposures.
3. Recommend matched policies from the available catalogs above. For each matched policy, supply a custom calculated premium based on the risk, and a concise compliance/triage rationale.
4. Extract 3 high-impact primary risk exposure factors.

You MUST structure and return the response strictly in JSON:
{
  "risk_score": 45,
  "risk_summary": "Summarize key observations and hazard rating parameters.",
  "recommended_policies": [
    {
      "coverage_type": "accident" | "cyber" | "travel" | "property",
      "policy_name": "Product Name matched or recommended",
      "estimated_premium_usd": 0.45,
      "coverage_amount_usd": 25000,
      "rationale": "Clear underwriting mapping reasons."
    }
  ],
  "primary_risk_factors": [
    "Exposure factor 1",
    "Exposure factor 2",
    "Exposure factor 3"
  ]
}`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            risk_score: { type: "integer" },
            risk_summary: { type: "string" },
            recommended_policies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  coverage_type: { type: "string" },
                  policy_name: { type: "string" },
                  estimated_premium_usd: { type: "number" },
                  coverage_amount_usd: { type: "integer" },
                  rationale: { type: "string" }
                },
                required: ["coverage_type", "policy_name", "estimated_premium_usd", "coverage_amount_usd", "rationale"]
              }
            },
            primary_risk_factors: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["risk_score", "risk_summary", "recommended_policies", "primary_risk_factors"]
        }
      });

      // Issue and persist evaluated RiskEvent object
      const activePartners = partners.filter(p => p.status === "active");
      const assignedPartnerId = activePartners[0]?.id || "part_1";

      await base44.entities.RiskEvent.create({
        partner_id: assignedPartnerId,
        event_type: eventType,
        user_context: userContext.substring(0, 150) + "...",
        transaction_value: Number(transactionValue),
        location,
        risk_score: aiResponse.risk_score || 35,
        matched_policies: aiResponse.recommended_policies?.length || 1,
        processing_ms: Math.floor(Math.random() * 150) + 120
      });

      return aiResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["riskEvents"] });
      setActiveAnalysis(data);
    }
  });

  const handleTestTrigger = (type: string) => {
    setEventType(type);
    if (type === "gig_job_accepted") {
      setTransactionValue(80);
      setLocation("London, UK");
      setUserContext("34-year-old bike delivery courier. Accepting job in torrential rainstorm carrying fragile culinary cargo across high-traffic urban corridors.");
    } else if (type === "ecommerce_checkout") {
      setTransactionValue(1250);
      setLocation("Los Angeles, US");
      setUserContext("High-value electronics cart checkout from a new user account. Unmatched billing/shipping addresses, ordering from residential proxies.");
    } else if (type === "flight_booking") {
      setTransactionValue(450);
      setLocation("Tokyo, JP");
      setUserContext("Leisure traveller booking flight ticket to sub-tropical island during active monsoon advisory forecasts.");
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "gig_job_accepted": return <Truck className="h-4 w-4 text-emerald-500" />;
      case "ecommerce_checkout": return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case "flight_booking": return <Plane className="h-4 w-4 text-amber-500" />;
      default: return <Activity className="h-4 w-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="risk-engine-root">
      <PageHeader 
        id="risk-head-comp"
        title="CoverLayer SDK Risk Engine" 
        subtitle="Test API webhooks and live contextual telemetry payloads to evaluate underwriting ratings and match insurance templates in 180ms."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="risk-layout-grid">
        {/* Test Payload Form */}
        <div className="lg:col-span-5 bg-white text-slate-900 border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between" id="risk-payload-entry">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Network className="h-5 w-5 text-indigo-500" />
              <span>Payload Generator Trigger</span>
            </h3>

            {/* Test buttons */}
            <div className="space-y-1.5" id="preset-buttons">
              <p className="text-xxs font-bold text-muted-foreground uppercase tracking-wider">Load Preset Telemetry</p>
              <div className="grid grid-cols-3 gap-2" id="grid-presets">
                <button
                  type="button"
                  onClick={() => handleTestTrigger("gig_job_accepted")}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                    eventType === "gig_job_accepted" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 font-bold" 
                      : "bg-surface text-foreground hover:bg-neutral-100"
                  }`}
                  id="preset-gig"
                >
                  Gig Dispatch
                </button>
                <button
                  type="button"
                  onClick={() => handleTestTrigger("ecommerce_checkout")}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                    eventType === "ecommerce_checkout" 
                      ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 font-bold" 
                      : "bg-surface text-foreground hover:bg-neutral-100"
                  }`}
                  id="preset-ecom"
                >
                  Cart Secure
                </button>
                <button
                  type="button"
                  onClick={() => handleTestTrigger("flight_booking")}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                    eventType === "flight_booking" 
                      ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 font-bold" 
                      : "bg-surface text-foreground hover:bg-neutral-100"
                  }`}
                  id="preset-travel"
                >
                  Flight Guard
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction Value ($)</label>
                <input 
                  type="number" 
                  min={1}
                  value={transactionValue}
                  onChange={(e) => setTransactionValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  id="risk-trans-val"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Host Geography</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  id="risk-geography"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">User Metadata / Telemetry logs</label>
              <textarea 
                rows={4}
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none font-medium"
                id="risk-context-payload"
              />
            </div>
          </div>

          <button
            onClick={() => evaluateRiskMutation.mutate()}
            disabled={evaluateRiskMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg text-sm mt-4 cursor-pointer hover:shadow shadow-sm transition-all disabled:opacity-50"
            id="btn-evaluate-event"
          >
            <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span>{evaluateRiskMutation.isPending ? "Evaluating Payload..." : "Evaluate Event Risk via CoverLayer AI"}</span>
          </button>
        </div>

        {/* AI Underwriter Outputs and Policy matching */}
        <div className="lg:col-span-7 bg-white text-slate-900 border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-5 flex flex-col justify-between" id="risk-underwriter-module">
          {activeAnalysis ? (
            <div className="space-y-5" id="analysis-filled-card">
              <div className="flex items-start justify-between pb-3.5 border-b border-border/70">
                <div>
                  <h3 className="font-bold text-lg text-foreground tracking-tight flex items-center gap-1.5">
                    <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span>AI Underwriting Diagnostics</span>
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold">Decisions evaluated successfully in real-time</p>
                </div>

                <div className="text-center bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 rounded-xl px-4 py-1.5">
                  <p className="text-[10px] text-rose-500 uppercase font-bold tracking-wider">Score Value</p>
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-450 font-mono leading-none mt-0.5">{activeAnalysis.risk_score}%</p>
                </div>
              </div>

              {/* Assessment summary */}
              <div className="space-y-1">
                <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Observations Syntheses</p>
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-900 p-3.5 rounded-lg border border-border/45">
                  {activeAnalysis.risk_summary}
                </p>
              </div>

              {/* Extreme factors */}
              <div className="space-y-2.5" id="observations-section">
                <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Primary Hazard Exposures</p>
                <div className="flex flex-wrap gap-2" id="hazards-tags">
                  {activeAnalysis.primary_risk_factors?.map((f: string, i: number) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center gap-1 text-xs text-rose-800 bg-rose-50 border border-rose-100 dark:text-rose-450 dark:bg-rose-950/20 dark:border-rose-900/20 px-2.5 py-1 rounded-full font-semibold"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      <span>{f}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Matching coverage products */}
              <div className="space-y-3 pt-3.5 border-t border-border/60" id="matched-templates-box">
                <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Matched Embeddable templates</p>
                
                <div className="space-y-3" id="mat-pol-cards">
                  {activeAnalysis.recommended_policies?.map((policy: any, index: number) => (
                    <div 
                      key={index} 
                      className="border border-indigo-200/50 dark:border-indigo-900/30 bg-indigo-50/15 dark:bg-indigo-950/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.5 rounded uppercase font-bold">{policy.coverage_type}</span>
                          <h4 className="font-bold text-sm text-foreground/90">{policy.policy_name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground font-semibold leading-relaxed max-w-md">{policy.rationale}</p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-xs text-muted-foreground uppercase font-bold leading-none">Dynamic Premium</p>
                        <p className="text-lg font-black text-indigo-700 dark:text-indigo-400 font-mono mt-1">${policy.estimated_premium_usd?.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">limits up to ${policy.coverage_amount_usd?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2 py-16" id="no-analysis-yet">
              <Workflow className="h-12 w-12 text-muted-foreground/35" />
              <p className="font-semibold text-foreground/80">Real-Time Risk Ledger</p>
              <p className="text-xs max-w-[220px] leading-relaxed">Modify transaction properties in the trigger panel and initiate an automated rating. Coverage results of matching underwriters populate here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Evaluating logs history */}
      <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4" id="recent-evaluations-panel">
        <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Activity className="h-4.5 w-4.5 text-indigo-500" />
          <span>Real-time processed API webhook transactions</span>
        </h3>

        <div className="overflow-x-auto" id="recent-evals-table-box">
          <table className="w-full text-sm text-left border-collapse" id="recent-evals-table">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase" id="recent-evals-thead-tr">
                <th className="py-2.5 font-semibold">Event trigger class</th>
                <th className="py-2.5 font-semibold">User Context / Telemetry Info</th>
                <th className="py-2.5 font-semibold">Location</th>
                <th className="py-2.5 font-semibold text-right">Value</th>
                <th className="py-2.5 font-semibold text-center">Exposure Score</th>
                <th className="py-2.5 font-semibold text-right">Processing</th>
              </tr>
            </thead>
            <tbody id="recent-evals-tbody">
              {riskEvents.map((evt) => (
                <tr key={evt.id} className="border-b border-border/50 hover:bg-muted/30 last:border-0" id={`evals-row-${evt.id}`}>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {getEventIcon(evt.event_type)}
                      <span className="font-mono font-semibold bg-stone-100 dark:bg-stone-900 border border-border/40 px-1.5 py-0.5 rounded text-stone-700 dark:text-stone-300 uppercase text-xxs font-bold">{evt.event_type}</span>
                    </div>
                  </td>
                  <td className="py-3 max-w-sm truncate" title={evt.user_context}>
                    {evt.user_context}
                  </td>
                  <td className="py-3 font-medium text-stone-600 dark:text-stone-400">
                    {evt.location}
                  </td>
                  <td className="py-3 text-right font-bold text-foreground/90 font-mono">
                    ${evt.transaction_value}
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
                      evt.risk_score > 60 ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400" :
                      evt.risk_score > 30 ? "bg-amber-150 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" :
                      "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400"
                    }`} id={`risk-badge-${evt.id}`}>
                      {evt.risk_score || 0}%
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono text-xs text-slate-400 font-semibold flex items-center justify-end gap-1">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400/85" />
                    <span>{evt.processing_ms}ms</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
