import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Building2, 
  Plus, 
  Search, 
  Key, 
  Check, 
  Mail, 
  MapPin, 
  Briefcase, 
  Percent, 
  X,
  RefreshCw,
  Clock,
  ExternalLink
} from "lucide-react";
import { base44, Partner } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";

export default function Partners() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    email: "",
    contact_name: "",
    country: "US",
    industry_vertical: "gig_economy",
    integration_type: "api",
    revenue_share_pct: 10
  });

  // Fetch partners
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["partners"],
    queryFn: () => base44.entities.Partner.list("-created_date")
  });

  // Create partner mutation
  const createPartnerMutation = useMutation({
    mutationFn: (newPartner: Partial<Partner>) => {
      // Auto-generate random API key
      const keySuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
      const api_key = `cl_live_${newPartner.industry_vertical?.substring(0,4)}_${keySuffix}`;
      return base44.entities.Partner.create({
        ...newPartner,
        api_key,
        status: "active",
        total_policies_issued: 0,
        total_premium_volume: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      setIsOpen(false);
      setForm({
        company_name: "",
        email: "",
        contact_name: "",
        country: "US",
        industry_vertical: "gig_economy",
        integration_type: "api",
        revenue_share_pct: 10
      });
    }
  });

  // Toggle partner status mutation
  const togglePartnerStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      const nextStatus = status === "active" ? "suspended" : "active";
      return base44.entities.Partner.update(id, { status: nextStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    }
  });

  // Re-generate API Key mutation
  const regenerateKeyMutation = useMutation({
    mutationFn: (partner: Partner) => {
      const keySuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
      const api_key = `cl_live_${partner.industry_vertical?.substring(0,4)}_${keySuffix}`;
      return base44.entities.Partner.update(partner.id, { api_key });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.email || !form.contact_name) return;
    createPartnerMutation.mutate(form);
  };

  const filteredPartners = partners.filter((p) => {
    const text = search.toLowerCase();
    return (
      p.company_name.toLowerCase().includes(text) ||
      p.email.toLowerCase().includes(text) ||
      p.contact_name.toLowerCase().includes(text) ||
      p.industry_vertical.toLowerCase().includes(text)
    );
  });

  const getVerticalLabel = (v: string) => {
    switch (v) {
      case "gig_economy": return "Gig Economy";
      case "ecommerce": return "E-Commerce";
      case "travel": return "Travel & Logistics";
      case "cyber": return "Cyber Solutions";
      default: return v.replace("_", " ");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="partners-page-root">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="partners-header-row">
        <PageHeader 
          id="partners-head-comp"
          title="Tenant Platform Partners" 
          subtitle="Deploy, distribute and audit insurance offerings across third party storefronts, marketplaces, and networks."
        />
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          id="btn-add-partner"
        >
          <Plus className="h-4 w-4" />
          <span>Onboard Tenant</span>
        </button>
      </div>

      {/* Control panel bar */}
      <div className="flex items-center bg-white text-slate-900 border border-slate-200 px-4 py-3 rounded-2xl shadow-3xs gap-3" id="control-panel-partners">
        <Search className="h-5 w-5 text-slate-400 mr-1" />
        <input 
          type="text" 
          placeholder="Filter tenants by name, contact, vertical or email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-0 outline-none text-sm w-full text-slate-800 placeholder:text-slate-400"
          id="search-partners"
        />
      </div>

      {/* Partners List Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 font-bold" id="partners-loading">Loading platform tenants...</div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2" id="partners-empty">
          <Building2 className="h-10 w-10 mx-auto text-slate-400" />
          <p className="font-bold text-slate-800">No tenant partners match your query</p>
          <p className="text-sm">Generate or onboard a partner above to initiate embedded integrations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="partners-cards-grid">
          {filteredPartners.map((partner) => (
            <div 
              key={partner.id} 
              className={`bg-white text-slate-900 rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4 transition-all hover:shadow-xs hover:border-indigo-400 flex flex-col justify-between ${
                partner.status === "suspended" ? "opacity-75 bg-slate-50/50" : ""
              }`}
              id={`partner-card-${partner.id}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg tracking-tight text-foreground/90">{partner.company_name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{partner.country}</span>
                      <span>•</span>
                      <span className="capitalize">{partner.integration_type} mode</span>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePartnerStatusMutation.mutate(partner)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                      partner.status === "active" 
                        ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 hover:bg-red-50 hover:text-red-700" 
                        : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-green-50 hover:text-green-700"
                    }`}
                    title={partner.status === "active" ? "Suspends tenant access" : "Activates tenant access"}
                    id={`toggle-status-btn-${partner.id}`}
                  >
                    {partner.status === "active" ? "Active" : "Suspended"}
                  </button>
                </div>

                <div className="space-y-2 pt-1.5 border-t border-slate-100 text-sm">
                  <div className="flex items-center gap-2 text-slate-500 font-semibold">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{partner.contact_name}</span>
                    <span className="text-slate-300">•</span>
                    <span className="truncate max-w-[150px] font-bold text-slate-650">{partner.email}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-500 font-semibold">
                    <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="font-bold text-slate-700">{getVerticalLabel(partner.industry_vertical)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 font-semibold">
                    <Percent className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-slate-400">Gross Fee Revenue Share:</span> 
                    <span className="font-bold text-emerald-650">{partner.revenue_share_pct}%</span>
                  </div>
                </div>
              </div>

              {/* API and Analytics section */}
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 text-slate-600 overflow-hidden font-bold">
                    <Key className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{partner.api_key}</span>
                  </div>
                  <button 
                    onClick={() => regenerateKeyMutation.mutate(partner)}
                    className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-amber-600 cursor-pointer transition-colors"
                    title="Roll secret API Key"
                    id={`btn-roll-key-${partner.id}`}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>

                {/* Simulated Volume */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <div>
                    <p className="font-medium text-slate-400">Policies Premium</p>
                    <p className="font-bold text-foreground font-mono mt-0.5">${(partner.total_premium_volume || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-400">Policies Active</p>
                    <p className="font-bold text-foreground font-mono mt-0.5">{partner.total_policies_issued || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboard Tenant Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="onboard-modal">
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs" onClick={() => setIsOpen(false)}></div>
          
          <div className="relative bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" id="onboard-modal-form-wrap">
            <div className="flex items-center justify-between p-5 border-b border-border bg-stone-50 dark:bg-stone-900/50">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" />
                <span>Onboard Embedded Tenant</span>
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                id="close-modal-x"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Deliveroo Singapore" 
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  id="form-company"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Person</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Jack Ma" 
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    id="form-contact"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. admin@firm.com" 
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                    id="form-email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Vertical</label>
                  <select 
                    value={form.industry_vertical}
                    onChange={(e) => setForm({ ...form, industry_vertical: e.target.value })}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-vertical"
                  >
                    <option value="gig_economy">Gig Economy</option>
                    <option value="ecommerce">E-Commerce Merchant</option>
                    <option value="travel">Travel & Logistics</option>
                    <option value="cyber">Cyber Security</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country/Jurisdiction</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. US, SG, DE" 
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase().slice(0, 3) })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-country"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Integration Tool</label>
                  <select 
                    value={form.integration_type}
                    onChange={(e) => setForm({ ...form, integration_type: e.target.value })}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-integration"
                  >
                    <option value="api">Dynamic REST API</option>
                    <option value="sdk">Modern ES6 SDK</option>
                    <option value="widget">Copied Web Widget</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue Share (%)</label>
                  <input 
                    type="number" 
                    min={0}
                    max={50}
                    value={form.revenue_share_pct}
                    onChange={(e) => setForm({ ...form, revenue_share_pct: parseInt(e.target.value) || 0 })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-revshare"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-3">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                  id="btn-cancel-form"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createPartnerMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer hover:shadow transition-all disabled:opacity-50"
                  id="btn-submit-form"
                >
                  {createPartnerMutation.isPending ? "Onboarding..." : "Onboard Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
