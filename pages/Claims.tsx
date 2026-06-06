import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  X,
  AlertTriangle,
  Building2, 
  ShieldAlert, 
  FileWarning, 
  Sparkles,
  ClipboardList,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Mail,
  Workflow
} from "lucide-react";
import { base44, Claim } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";

export default function Claims() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  
  const [form, setForm] = useState({
    policy_id: "",
    claimant_email: "",
    claimant_name: "",
    incident_date: new Date().toISOString().substring(0, 16),
    incident_description: "",
    claim_amount: 100
  });

  // Fetch claims
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["claims"],
    queryFn: () => base44.entities.Claim.list("-created_date")
  });

  // Fetch policies to associate inside claim form
  const { data: policies = [] } = useQuery({
    queryKey: ["policies"],
    queryFn: () => base44.entities.Policy.list()
  });

  // Create claim mutation
  const createClaimMutation = useMutation({
    mutationFn: (newClaim: typeof form) => {
      const selectedPolicy = policies.find(p => p.id === newClaim.policy_id);
      if (!selectedPolicy) {
        throw new Error("Target issued policy is missing.");
      }

      return base44.entities.Claim.create({
        policy_id: selectedPolicy.id,
        policy_number: selectedPolicy.policy_number,
        claimant_email: newClaim.claimant_email || selectedPolicy.end_user_email,
        claimant_name: newClaim.claimant_name || selectedPolicy.end_user_name,
        incident_date: new Date(newClaim.incident_date).toISOString(),
        incident_description: newClaim.incident_description,
        claim_amount: Number(newClaim.claim_amount),
        currency: selectedPolicy.currency,
        status: "submitted"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      setIsOpen(false);
      setForm({
        policy_id: "",
        claimant_email: "",
        claimant_name: "",
        incident_date: new Date().toISOString().substring(0, 16),
        incident_description: "",
        claim_amount: 100
      });
    }
  });

  // AI Claims Triage trigger mutation
  const runAiTriageMutation = useMutation({
    mutationFn: async (claim: Claim) => {
      const selectedPolicy = policies.find(p => p.id === claim.policy_id);
      const policyDetailsText = selectedPolicy 
        ? `Policy Product: ${selectedPolicy.policy_name}, Coverage amount limit: $${selectedPolicy.coverage_amount}, Premium: $${selectedPolicy.premium_paid}, Carrier: ${selectedPolicy.insurer_name}`
        : "Policy Details: Unknown Policy limits.";

      const prompt = `You are CoverLayer's AI Claims Triage underwriting assistant.
Evaluate this micro-insurance claim for legitimacy, severity, and alignment with policy coverage limits.

Policy Constraints:
${policyDetailsText}

Claim Details:
- Claimant Name: ${claim.claimant_name || "Unverified Claimant"}
- Claimant Email: ${claim.claimant_email}
- Incident Date: ${claim.incident_date}
- Claim Amount Filed: $${claim.claim_amount} ${claim.currency}
- Incident Description: "${claim.incident_description}"

Evaluate the claim and output structural triaging metrics. Write a factual, precise, concise assessment of whether the incident corresponds with the policy guidelines, rating factors, or if further investigation is needed.

Evaluate and answer in JSON:
{
  "severity": "low" | "medium" | "high" | "critical",
  "triage_summary": "Provide a clean, precise 2-3 sentence professional claims underwriting synthesis detailing findings, potential policy matches/clashes and recommended steps.",
  "recommended_status": "under_review" | "approved" | "rejected"
}`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            severity: { type: "string" },
            triage_summary: { type: "string" },
            recommended_status: { type: "string" }
          },
          required: ["severity", "triage_summary", "recommended_status"]
        }
      });

      // Update local storage entity with AI triage results
      const updated = await base44.entities.Claim.update(claim.id, {
        ai_severity: aiResponse.severity,
        ai_triage_summary: aiResponse.triage_summary,
        status: aiResponse.recommended_status || "under_review"
      });

      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      setSelectedClaim(data);
    }
  });

  // Manual status change mutation
  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      return base44.entities.Claim.update(id, { status });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      setSelectedClaim(data);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.policy_id || !form.incident_description) return;
    createClaimMutation.mutate(form);
  };

  const filteredClaims = claims.filter((c) => {
    const text = search.toLowerCase();
    return (
      (c.claimant_name || "").toLowerCase().includes(text) ||
      c.claimant_email.toLowerCase().includes(text) ||
      (c.policy_number || "").toLowerCase().includes(text) ||
      c.incident_description.toLowerCase().includes(text) ||
      c.status.toLowerCase().includes(text)
    );
  });

  const getSeverityBadgeColor = (sev?: string) => {
    switch (sev?.toLowerCase()) {
      case "critical": return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400";
      case "high": return "bg-orange-100 text-orange-850 dark:bg-orange-950/40 dark:text-orange-400";
      case "medium": return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400";
      default: return "bg-stone-100 text-stone-600 dark:bg-stone-900";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200/50";
      case "rejected":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50";
      case "under_review":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50";
      default:
        return "bg-stone-100 text-stone-700 dark:bg-stone-900 border border-border";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="claims-page-root">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="claims-header-row">
        <PageHeader 
          id="claims-head-comp"
          title="Incident Claim Processing" 
          subtitle="Triage carrier liability claims, review automated underwriting compliance scores, and settle payment balances."
        />
        <button
          onClick={() => {
            // Pick default policy inside list if exists
            const activePolicies = policies.filter(p => p.status === "active");
            setForm(f => ({
              ...f,
              policy_id: activePolicies[0]?.id || ""
            }));
            setIsOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          id="btn-file-claim"
        >
          <Plus className="h-4 w-4" />
          <span>File Incident Claim</span>
        </button>
      </div>

      {/* Control panel bar */}
      <div className="flex items-center bg-white text-slate-900 border border-slate-200 px-4 py-3 rounded-2xl shadow-3xs gap-3" id="control-panel-claims">
        <Search className="h-5 w-5 text-slate-400 mr-1" />
        <input 
          type="text" 
          placeholder="Filter issued claims by policy, claimant details, incident notes or settlement flags..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-0 outline-none text-sm w-full text-slate-800 placeholder:text-slate-400"
          id="search-claims"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="claims-layout-grid">
        {/* Claims ledger list */}
        <div className="lg:col-span-2 bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-2xs overflow-hidden" id="claims-list-box">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Claims Operations</h3>
            <span className="text-xs text-slate-400 font-bold font-mono">{filteredClaims.length} active entries</span>
          </div>

          <div className="divide-y divide-border/60 overflow-y-auto max-h-[600px]" id="claims-scrollable-list">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground" id="claims-loading-led">Retrieving incident ledger...</div>
            ) : filteredClaims.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground space-y-2" id="claims-ledger-empty">
                <FileWarning className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="font-semibold text-foreground/85">No incident claim entries found</p>
                <p className="text-sm">Initiate manual claim filings or allow test payload API triggers through the Risk Engine.</p>
              </div>
            ) : (
              filteredClaims.map((claim) => (
                <div 
                  key={claim.id} 
                  onClick={() => setSelectedClaim(claim)}
                  className={`p-4 hover:bg-muted/10 transition-colors cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
                    selectedClaim?.id === claim.id ? "bg-indigo-50/25 border-l-2 border-indigo-600 dark:bg-indigo-950/10" : ""
                  }`}
                  id={`claim-ledger-item-${claim.id}`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold bg-stone-100 dark:bg-stone-900 px-1.5 py-0.5 rounded text-stone-700 dark:text-stone-300">{claim.policy_number || "POL-UNKNOWN"}</span>
                      {claim.ai_severity && (
                        <span className={`text-3xs uppercase font-bold px-1.5 py-0.5 rounded ${getSeverityBadgeColor(claim.ai_severity)}`}>
                          AI: {claim.ai_severity}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-base text-foreground/90 truncate">{claim.claimant_name || claim.claimant_email}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed max-w-md">{claim.incident_description}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:self-center" id={`claim-ledger-side-${claim.id}`}>
                    <div className="text-right">
                      <p className="font-bold text-foreground font-mono text-base">${claim.claim_amount.toLocaleString()}</p>
                      <p className="text-xxs font-semibold text-slate-400 capitalize">Incident: {new Date(claim.incident_date).toLocaleDateString()}</p>
                    </div>

                    <span className={`text-2xs font-bold px-2 py-1 rounded-full uppercase ${getStatusBadgeColor(claim.status)}`}>
                      {claim.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Claim detail Triage Center */}
        <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-2xs p-6 space-y-4 flex flex-col justify-between" id="claims-inspection-ops">
          {selectedClaim ? (
            <div className="space-y-4" id="inspection-main-box">
              <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Triage Center</h3>
                  <p className="text-xs text-muted-foreground font-mono">ID: {selectedClaim.id}</p>
                </div>
                <button
                  onClick={() => setSelectedClaim(null)}
                  className="p-1 hover:bg-stone-100 dark:hover:bg-stone-900 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                  id="close-inspection-btn"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Claimant context */}
              <div className="space-y-3.5" id="claimant-context-details">
                <div className="space-y-1">
                  <p className="text-xxs font-bold text-muted-foreground uppercase tracking-wider">Policyholder Applicant</p>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground/90">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{selectedClaim.claimant_name}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span>{selectedClaim.claimant_email}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xxs font-bold text-muted-foreground uppercase tracking-wider">coverage timeline</p>
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground/80">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Incident Date: {new Date(selectedClaim.incident_date).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xxs font-bold text-muted-foreground uppercase tracking-wider">Incident description</p>
                  <p className="text-sm text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-900 p-3 rounded-lg border border-border/45 leading-relaxed font-medium">
                    {selectedClaim.incident_description}
                  </p>
                </div>

                {/* AI Underwriter Module */}
                <div className="border border-indigo-200/50 dark:border-indigo-900/30 bg-indigo-50/15 dark:bg-indigo-950/10 rounded-lg p-3.5 space-y-2.5" id="ai-module">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                      <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold font-sans">Embedded Underwriter AI</span>
                    </div>
                    {selectedClaim.ai_severity && (
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getSeverityBadgeColor(selectedClaim.ai_severity)}`}>
                        {selectedClaim.ai_severity} Severity RISK
                      </span>
                    )}
                  </div>

                  {selectedClaim.ai_triage_summary ? (
                    <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-semibold">
                      {selectedClaim.ai_triage_summary}
                    </p>
                  ) : (
                    <div className="space-y-2" id="no-triage-yet">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Triage this incident to trigger the **CoverLayer AI**. Checks compliance metrics, liability clauses, and exclusions.
                      </p>
                      <button
                        onClick={() => runAiTriageMutation.mutate(selectedClaim)}
                        disabled={runAiTriageMutation.isPending}
                        className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition-all disabled:opacity-50"
                        id="run-ai-triage-btn"
                      >
                        <Workflow className="h-3.5 w-3.5" />
                        <span>{runAiTriageMutation.isPending ? "Generating Audit..." : "Execute AI Claims Triage"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="pt-4 border-t border-border flex flex-col gap-2" id="status-changing-panel">
                <p className="text-xxs font-bold text-muted-foreground uppercase tracking-wider">Settlement decision override</p>
                <div className="grid grid-cols-2 gap-2" id="claims-action-override">
                  <button
                    onClick={() => changeStatusMutation.mutate({ id: selectedClaim.id, status: "approved" })}
                    disabled={changeStatusMutation.isPending}
                    className="inline-flex items-center justify-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30 text-xs font-bold py-2 rounded-lg cursor-pointer transition-colors"
                    id="btn-claim-approve"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Approve Risk</span>
                  </button>

                  <button
                    onClick={() => changeStatusMutation.mutate({ id: selectedClaim.id, status: "rejected" })}
                    disabled={changeStatusMutation.isPending}
                    className="inline-flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 text-xs font-bold py-2 rounded-lg cursor-pointer transition-colors"
                    id="btn-claim-reject"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Reject Out</span>
                  </button>
                </div>
                
                {selectedClaim.status !== "paid" && selectedClaim.status === "approved" && (
                  <button
                    onClick={() => changeStatusMutation.mutate({ id: selectedClaim.id, status: "paid" })}
                    disabled={changeStatusMutation.isPending}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg mt-1.5 cursor-pointer transition-colors shadow-sm"
                    id="btn-claim-settle"
                  >
                    <span>Disburse Settlement Payment</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2 py-12" id="no-inspection-selected">
              <ClipboardList className="h-10 w-10 text-muted-foreground/45" />
              <p className="font-semibold text-foreground/80">Operational Triage Unit</p>
              <p className="text-xs leading-relaxed max-w-[200px]">Select any active claim from the ledger sheet to trigger automated underwriter audits.</p>
            </div>
          )}
        </div>
      </div>

      {/* manual submission modal direct from user */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" id="file-claim-overlay">
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs" onClick={() => setIsOpen(false)}></div>

          <div className="relative bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150" id="file-claim-modal">
            <div className="flex items-center justify-between p-5 border-b border-border bg-stone-50 dark:bg-stone-900/50">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-indigo-500" />
                <span>File Syndicate Casualty Claim</span>
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                id="close-casualty-modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {policies.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-amber-800 text-xs" id="policies-warn">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Create and activate at least one **Coverage Policy** before filing claimant casualties.</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issued Policy Binding</label>
                <select 
                  value={form.policy_id}
                  onChange={(e) => {
                    const matchedPol = policies.find(p => p.id === e.target.value);
                    setForm({
                      ...form,
                      policy_id: e.target.value,
                      claimant_name: matchedPol?.end_user_name || "",
                      claimant_email: matchedPol?.end_user_email || ""
                    });
                  }}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  required
                  id="form-clm-policy"
                >
                  <option value="" disabled>Select active issued policy...</option>
                  {policies.map(p => (
                    <option key={p.id} value={p.id}>{p.policy_number} / {p.end_user_name} / {p.policy_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">claimant Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Carlos Mendosa" 
                    value={form.claimant_name}
                    onChange={(e) => setForm({ ...form, claimant_name: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-clm-name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">claimant Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. carlos@uberpartner.com" 
                    value={form.claimant_email}
                    onChange={(e) => setForm({ ...form, claimant_email: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-clm-email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">incident Date / timestamp</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={form.incident_date}
                    onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-clm-date"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Claim Amount ($)</label>
                  <input 
                    type="number" 
                    min={1}
                    required
                    value={form.claim_amount}
                    onChange={(e) => setForm({ ...form, claim_amount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-clm-amount"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-rose-500">casualty description / incident logs</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Minor passenger vehicular collision during transit support services. Soft tissue strain on wrist from airbag..."
                  value={form.incident_description}
                  onChange={(e) => setForm({ ...form, incident_description: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none font-medium"
                  id="form-clm-desc"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-3">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                  id="cancel-casualty"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createClaimMutation.isPending || policies.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer hover:shadow transition-all disabled:opacity-50"
                  id="submit-casualty"
                >
                  {createClaimMutation.isPending ? "Submitting..." : "Submit Claims"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
