import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  X,
  Mail, 
  User, 
  Calendar,
  Building,
  DollarSign,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { base44, Policy } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";

export default function Policies() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    end_user_name: "",
    end_user_email: "",
    catalog_id: "",
    partner_id: "",
    start_date: new Date().toISOString().substring(0, 16),
    end_date: new Date(Date.now() + 86400000 * 30).toISOString().substring(0, 16)
  });

  // Fetch policies
  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["policies"],
    queryFn: () => base44.entities.Policy.list("-created_date")
  });

  // Fetch partners for select dropdown
  const { data: partners = [] } = useQuery({
    queryKey: ["partners"],
    queryFn: () => base44.entities.Partner.list()
  });

  // Fetch policy catalogs for select dropdown
  const { data: catalogs = [] } = useQuery({
    queryKey: ["policyCatalogs"],
    queryFn: () => base44.entities.PolicyCatalog.list()
  });

  // Issue policy mutation
  const issuePolicyMutation = useMutation({
    mutationFn: (newPolicy: typeof form) => {
      const selectedPartner = partners.find(p => p.id === newPolicy.partner_id);
      const selectedCatalog = catalogs.find(c => c.id === newPolicy.catalog_id);
      
      if (!selectedPartner || !selectedCatalog) {
        throw new Error("Unable to map partner or catalog specifications.");
      }

      const policyNum = "POL-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      return base44.entities.Policy.create({
        policy_number: policyNum,
        end_user_name: newPolicy.end_user_name,
        end_user_email: newPolicy.end_user_email,
        policy_name: selectedCatalog.name,
        coverage_type: selectedCatalog.coverage_type,
        insurer_name: selectedCatalog.insurer_name,
        premium_paid: selectedCatalog.base_premium,
        currency: selectedCatalog.currency,
        coverage_amount: selectedCatalog.coverage_amount,
        start_date: new Date(newPolicy.start_date).toISOString(),
        end_date: new Date(newPolicy.end_date).toISOString(),
        partner_id: selectedPartner.id,
        partner_name: selectedPartner.company_name,
        status: "active"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      // Invalidate dashboard or partner queries to update active counts & metrics
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      setIsOpen(false);
      setForm({
        end_user_name: "",
        end_user_email: "",
        catalog_id: "",
        partner_id: "",
        start_date: new Date().toISOString().substring(0, 16),
        end_date: new Date(Date.now() + 86400000 * 30).toISOString().substring(0, 16)
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.end_user_name || !form.end_user_email || !form.catalog_id || !form.partner_id) return;
    issuePolicyMutation.mutate(form);
  };

  const filteredPolicies = policies.filter((p) => {
    const text = search.toLowerCase();
    return (
      p.end_user_name.toLowerCase().includes(text) ||
      p.end_user_email.toLowerCase().includes(text) ||
      p.policy_number.toLowerCase().includes(text) ||
      p.policy_name.toLowerCase().includes(text) ||
      p.partner_name.toLowerCase().includes(text) ||
      p.insurer_name.toLowerCase().includes(text)
    );
  });

  const formatDate = (raw?: string) => {
    if (!raw) return "";
    return new Date(raw).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="policies-page-root">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="policies-header-row">
        <PageHeader 
          id="policies-head-comp"
          title="Issued Coverage Policies" 
          subtitle="Real-time multi-tenant ledger tracking micro-coverage logs, pricing distributions, and binder statuses."
        />
        <button
          onClick={() => {
            // Set defaults if active catalogs / partners exist
            const activeCatalogs = catalogs.filter(c => c.status === "active");
            const activePartners = partners.filter(p => p.status === "active");
            setForm(f => ({
              ...f,
              catalog_id: activeCatalogs[0]?.id || "",
              partner_id: activePartners[0]?.id || ""
            }));
            setIsOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          id="btn-issue-policy"
        >
          <Plus className="h-4 w-4" />
          <span>Issue Coverage Binder</span>
        </button>
      </div>

      {/* Control panel bar */}
      <div className="flex items-center bg-white text-slate-900 border border-slate-200 px-4 py-3 rounded-2xl shadow-3xs gap-3" id="control-panel-policies">
        <Search className="h-5 w-5 text-slate-400 mr-1" />
        <input 
          type="text" 
          placeholder="Filter issued policies ledger by number, holder info, carrier, product, or tenant..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-0 outline-none text-sm w-full text-slate-800 placeholder:text-slate-400"
          id="search-policies"
        />
      </div>

      {/* Policies List Table */}
      <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-2xs overflow-hidden" id="policies-table-container">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 font-bold" id="policies-loading">Reading platform coverage ledger...</div>
        ) : filteredPolicies.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2" id="policies-empty">
            <ShieldCheck className="h-10 w-10 mx-auto text-slate-400" />
            <p className="font-bold text-slate-800">No issued policies match query</p>
            <p className="text-sm border-slate-100">Coverage binders are issued in real-time when clients embed product checkout links.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" id="policies-overflow">
            <table className="w-full text-sm text-left border-collapse" id="policies-main-table">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/40" id="table-head-tr">
                  <th className="px-6 py-4 font-bold">Policy Details</th>
                  <th className="px-6 py-4 font-bold">Policyholder</th>
                  <th className="px-6 py-4 font-bold">Tenant Distributor</th>
                  <th className="px-6 py-4 font-bold">Underwriter Carrier</th>
                  <th className="px-6 py-4 font-bold text-right">Settlement</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody id="table-body">
                {filteredPolicies.map((policy) => (
                  <tr key={policy.id} className="border-b border-slate-100 hover:bg-slate-50/50 last:border-0" id={`policy-row-${policy.id}`}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground/90">{policy.policy_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 px-1.5 py-0.5 rounded uppercase">{policy.policy_number}</span>
                        <span className="text-xs text-muted-foreground font-semibold capitalize bg-stone-100 dark:bg-stone-900 px-1.5 py-0.5 rounded">{policy.coverage_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground/90">{policy.end_user_name}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{policy.end_user_email}</p>
                    </td>
                    <td className="px-6 py-4 text-stone-700 dark:text-stone-300 font-semibold">
                      {policy.partner_name}
                    </td>
                    <td className="px-6 py-4 text-stone-700 dark:text-stone-300">
                      {policy.insurer_name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">${policy.premium_paid.toFixed(2)}</p>
                      <p className="text-xs font-semibold text-slate-400">of ${policy.coverage_amount.toLocaleString()} limits</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${
                        policy.status === "active"
                          ? "bg-green-150 text-green-800 dark:bg-green-950/40 dark:text-green-400"
                          : policy.status === "expired"
                          ? "bg-stone-200 text-stone-700 dark:bg-stone-850 dark:text-stone-400"
                          : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400"
                      }`} id={`status-badge-${policy.id}`}>
                        {policy.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Issue Policy Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" id="manual-policy-overlay">
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs" onClick={() => setIsOpen(false)}></div>

          <div className="relative bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150" id="manual-policy-box">
            <div className="flex items-center justify-between p-5 border-b border-border bg-stone-50 dark:bg-stone-900/50">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-500" />
                <span>Issue Direct Coverage Binder</span>
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                id="close-manual-modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Warn if no partners or catalogs available */}
              {(partners.length === 0 || catalogs.length === 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-2.5 text-amber-800 text-xs" id="warning-bar">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Pre-requisite entities missing</p>
                    <p className="mt-0.5 leading-relaxed">Ensure you have created at least one active **Tenant Partner** and **Policy Product in the Catalog** before manual issue.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Policyholder Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. pilot@gmail.com" 
                    value={form.end_user_email}
                    onChange={(e) => setForm({ ...form, end_user_email: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-holder-email"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Policyholder Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. John Doe" 
                    value={form.end_user_name}
                    onChange={(e) => setForm({ ...form, end_user_name: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-holder-name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tenant Distributor</label>
                  <select 
                    value={form.partner_id}
                    onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    required
                    id="form-holder-partner"
                  >
                    <option value="" disabled>Select active tenant...</option>
                    {partners.filter(p => p.status === "active").map(p => (
                      <option key={p.id} value={p.id}>{p.company_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Products Catalog</label>
                  <select 
                    value={form.catalog_id}
                    onChange={(e) => setForm({ ...form, catalog_id: e.target.value })}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    required
                    id="form-holder-catalog"
                  >
                    <option value="" disabled>Select product...</option>
                    {catalogs.filter(c => c.status === "active").map(c => (
                      <option key={c.id} value={c.id}>{c.name} (${c.base_premium.toFixed(2)} premium)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">coverage start</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-holder-start"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">coverage expiration</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-holder-end"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-3">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                  id="cancel-direct-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={issuePolicyMutation.isPending || partners.length === 0 || catalogs.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer hover:shadow transition-all disabled:opacity-50"
                  id="submit-direct-btn"
                >
                  {issuePolicyMutation.isPending ? "Issuing..." : "Issue Coverage Binder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
