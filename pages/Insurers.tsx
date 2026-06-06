import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  X,
  Mail, 
  MapPin, 
  Briefcase, 
  Percent, 
  ShieldAlert,
  Fingerprint,
  Wallet,
  Activity,
  Award
} from "lucide-react";
import { base44, InsurerPartner } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";

export default function Insurers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "GB",
    license_number: "",
    regulatory_body: "FCA",
    contact_email: "",
    supported_currencies: "USD, GBP, EUR",
    supported_verticals: "gig_economy, ecommerce, travel"
  });

  // Fetch insurers
  const { data: insurers = [], isLoading } = useQuery({
    queryKey: ["insurers"],
    queryFn: () => base44.entities.InsurerPartner.list("-created_date")
  });

  // Create insurer mutation
  const createInsurerMutation = useMutation({
    mutationFn: (newInsurer: typeof form) => {
      const currenciesArr = newInsurer.supported_currencies.split(",").map(c => c.trim().toUpperCase());
      const verticalsArr = newInsurer.supported_verticals.split(",").map(v => v.trim().toLowerCase());
      
      return base44.entities.InsurerPartner.create({
        name: newInsurer.name,
        country: newInsurer.country,
        license_number: newInsurer.license_number,
        regulatory_body: newInsurer.regulatory_body,
        contact_email: newInsurer.contact_email,
        status: "active",
        supported_currencies: currenciesArr,
        supported_verticals: verticalsArr,
        active_policies_count: 0,
        loss_ratio: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurers"] });
      setIsOpen(false);
      setForm({
        name: "",
        country: "GB",
        license_number: "",
        regulatory_body: "FCA",
        contact_email: "",
        supported_currencies: "USD, GBP, EUR",
        supported_verticals: "gig_economy, ecommerce, travel"
      });
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (insurer: InsurerPartner) => {
      const nextStatus = insurer.status === "active" ? "inactive" : "active";
      return base44.entities.InsurerPartner.update(insurer.id, { status: nextStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurers"] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.license_number || !form.contact_email) return;
    createInsurerMutation.mutate(form);
  };

  const filteredInsurers = insurers.filter((ins) => {
    const text = search.toLowerCase();
    return (
      ins.name.toLowerCase().includes(text) ||
      ins.contact_email.toLowerCase().includes(text) ||
      ins.license_number.toLowerCase().includes(text) ||
      ins.regulatory_body.toLowerCase().includes(text)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="insurers-page-root">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="insurers-header-row">
        <PageHeader 
          id="insurers-head-comp"
          title="Underwriting Insurers" 
          subtitle="Manage cover syndicates, capacity allocations, carrier licenses, and live portfolio loss ratio audits."
        />
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          id="btn-add-insurer"
        >
          <Plus className="h-4 w-4" />
          <span>Register Syndicate</span>
        </button>
      </div>

      {/* Search tool */}
      <div className="flex items-center bg-white text-slate-900 border border-slate-200 px-4 py-3 rounded-2xl shadow-3xs gap-3" id="control-panel-insurers">
        <Search className="h-5 w-5 text-slate-400 mr-1" />
        <input 
          type="text" 
          placeholder="Filter underwriting insurers by name, regulatory body, license or support networks..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-0 outline-none text-sm w-full text-slate-800 placeholder:text-slate-400"
          id="search-insurers"
        />
      </div>

      {/* Insurers list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground" id="insurers-loading">Auditing registered underwriters...</div>
      ) : filteredInsurers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-2" id="insurers-empty">
          <ShieldAlert className="h-10 w-10 mx-auto text-slate-400" />
          <p className="font-bold text-slate-800">No registered syndicate matches query</p>
          <p className="text-sm">Initiate carrier capacity allocations by onboarding an insurer syndicate above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="insurers-grid">
          {filteredInsurers.map((insurer) => (
            <div 
              key={insurer.id}
              className={`bg-white text-slate-900 border border-slate-200 rounded-3xl p-6 shadow-2xs transition-all hover:shadow-xs hover:border-indigo-400 flex flex-col justify-between ${
                insurer.status === "inactive" ? "opacity-75 bg-slate-50/50" : ""
              }`}
              id={`insurer-card-${insurer.id}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-lg tracking-tight text-slate-900">{insurer.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 font-semibold">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{insurer.country} Carrier Office</span>
                      <span>•</span>
                      <span className="font-bold text-indigo-600">{insurer.regulatory_body} Registered</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStatusMutation.mutate(insurer)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                      insurer.status === "active" 
                        ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 hover:bg-stone-200" 
                        : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 hover:bg-green-100"
                    }`}
                    id={`toggle-insurer-status-${insurer.id}`}
                  >
                    {insurer.status === "active" ? "Active Cover" : "Deactivated"}
                  </button>
                </div>

                {/* Sub data blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3.5 border-t border-slate-100">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                      <Fingerprint className="h-3.5 w-3.5 text-slate-400" />
                      <span>License ID:</span>
                      <span className="font-mono font-bold text-slate-700">{insurer.license_number}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>Claims Contact:</span>
                      <span className="font-bold text-slate-700 truncate max-w-[120px]" title={insurer.contact_email}>{insurer.contact_email}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                      <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Currencies:</span>
                      <span className="font-bold text-slate-700">{insurer.supported_currencies.join(", ")}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                      <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Risk Portals:</span>
                      <span className="font-bold text-slate-700 capitalize">{insurer.supported_verticals.map(v => v.replace("_", " ")).join(", ")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loss ration metrics */}
              <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-sm" id={`insurer-metrics-${insurer.id}`}>
                <div className="flex items-center gap-2 text-xs text-slate-550 font-bold">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-slate-400">Policies In-Force:</span>
                  <span className="font-black text-slate-800 font-mono">{insurer.active_policies_count || 0}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="text-muted-foreground">Reported Loss Ratio:</span>
                  <span className={`font-bold font-mono ${
                    insurer.loss_ratio > 65 ? "text-rose-600 dark:text-rose-400" :
                    insurer.loss_ratio > 45 ? "text-amber-600" :
                    "text-emerald-600 dark:text-emerald-400"
                  }`}>{insurer.loss_ratio || 0}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Syndicate Registration Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="add-insurer-modal">
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs" onClick={() => setIsOpen(false)}></div>

          <div className="relative bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" id="insurer-form-wrapper">
            <div className="flex items-center justify-between p-5 border-b border-border bg-stone-50 dark:bg-stone-900/50">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-indigo-500" />
                <span>Onboard Syndicate Carrier</span>
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                id="close-insurer-modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Syndicate / corporate Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Allianz Specialty AG" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  id="form-ins-name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">License ID / Serial number</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. DE-SPECIAL-9951" 
                    value={form.license_number}
                    onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-ins-license"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Regulatory Oversight body</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. BaFin, FCA, SEC" 
                    value={form.regulatory_body}
                    onChange={(e) => setForm({ ...form, regulatory_body: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-ins-regulator"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Corporate Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. corp@allianz.de" 
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-ins-email"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered country</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. DE, FR, JP" 
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase().slice(0, 3) })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-ins-country"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supported Currencies (Comma Separated)</label>
                <input 
                  type="text" 
                  placeholder="USD, EUR, SGD, JPY" 
                  value={form.supported_currencies}
                  onChange={(e) => setForm({ ...form, supported_currencies: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  id="form-ins-currencies"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supported Portals (Comma Separated)</label>
                <input 
                  type="text" 
                  placeholder="gig_economy, ecommerce, travel, cargo" 
                  value={form.supported_verticals}
                  onChange={(e) => setForm({ ...form, supported_verticals: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  id="form-ins-verticals"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-3">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                  id="cancel-ins-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createInsurerMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer hover:shadow transition-all disabled:opacity-50"
                  id="submit-ins-btn"
                >
                  {createInsurerMutation.isPending ? "Registering..." : "Onboard Syndicate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
