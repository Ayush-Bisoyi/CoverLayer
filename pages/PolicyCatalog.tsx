import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  X,
  ShieldCheck, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Clock, 
  Globe2, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { base44, PolicyCatalog } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";

export default function PolicyCatalogPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    coverage_type: "accident",
    insurer_name: "",
    base_premium: 1.0,
    currency: "USD",
    coverage_amount: 10000,
    duration_days: 1,
    exclusions: "",
    geographies: "US, UK, CA"
  });

  // Fetch product catalog items
  const { data: catalogs = [], isLoading } = useQuery({
    queryKey: ["policyCatalogs"],
    queryFn: () => base44.entities.PolicyCatalog.list("-created_date")
  });

  // Fetch active insurers to link underwriter select dropdowns
  const { data: insurers = [] } = useQuery({
    queryKey: ["insurers"],
    queryFn: () => base44.entities.InsurerPartner.list()
  });

  // Create catalog product mutation
  const createCatalogMutation = useMutation({
    mutationFn: (newCatalog: typeof form) => {
      const geos = newCatalog.geographies.split(",").map(g => g.trim().toUpperCase());
      return base44.entities.PolicyCatalog.create({
        name: newCatalog.name,
        description: newCatalog.description,
        coverage_type: newCatalog.coverage_type,
        insurer_name: newCatalog.insurer_name,
        base_premium: Number(newCatalog.base_premium),
        currency: newCatalog.currency,
        coverage_amount: Number(newCatalog.coverage_amount),
        duration_days: Number(newCatalog.duration_days),
        exclusions: newCatalog.exclusions,
        geographies: geos,
        status: "active"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policyCatalogs"] });
      setIsOpen(false);
      setForm({
        name: "",
        description: "",
        coverage_type: "accident",
        insurer_name: "",
        base_premium: 1.0,
        currency: "USD",
        coverage_amount: 10000,
        duration_days: 1,
        exclusions: "",
        geographies: "US, UK, CA"
      });
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (catalog: PolicyCatalog) => {
      const nextStatus = catalog.status === "active" ? "inactive" : "active";
      return base44.entities.PolicyCatalog.update(catalog.id, { status: nextStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policyCatalogs"] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.insurer_name || !form.description) return;
    createCatalogMutation.mutate(form);
  };

  const filteredCatalogs = catalogs.filter((c) => {
    const text = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(text) ||
      c.description.toLowerCase().includes(text) ||
      c.insurer_name.toLowerCase().includes(text) ||
      c.coverage_type.toLowerCase().includes(text)
    );
  });

  const getVerticalColor = (v: string) => {
    switch (v) {
      case "accident": return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400";
      case "cyber": return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400";
      case "travel": return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
      default: return "bg-stone-50 text-stone-700 dark:bg-stone-900";
    }
  };

  const activeInsurers = insurers.filter(i => i.status === "active");

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="catalog-page-root">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="catalog-header-row">
        <PageHeader 
          id="catalog-head-comp"
          title="Embeddable Product Catalog" 
          subtitle="Configure core micro-insurance templates, cover pricing limits, geographical exclusions, and digital assets."
        />
        <button
          onClick={() => {
            // Pick default active insurer if exists
            setForm(f => ({
              ...f,
              insurer_name: activeInsurers[0]?.name || ""
            }));
            setIsOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          id="btn-add-product"
        >
          <Plus className="h-4 w-4" />
          <span>Configure Product</span>
        </button>
      </div>

      {/* Control panel bar */}
      <div className="flex items-center bg-white text-slate-900 border border-slate-200 px-4 py-3 rounded-2xl shadow-3xs gap-3" id="control-panel-catalog">
        <Search className="h-5 w-5 text-slate-400 mr-1" />
        <input 
          type="text" 
          placeholder="Filter coverage catalog by template name, description, risk vertical or underwriting carrier..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-0 outline-none text-sm w-full text-slate-800 placeholder:text-slate-400"
          id="search-catalog"
        />
      </div>

      {/* Catalog items list */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-450 font-bold" id="catalog-loading">Reading embedded templates...</div>
      ) : filteredCatalogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2" id="catalog-empty">
          <ShieldCheck className="h-10 w-10 mx-auto text-slate-350" />
          <p className="font-bold text-slate-800">No product templates match filter criteria</p>
          <p className="text-sm">Kickstart embedded distribution triggers by generating your first micro-insurance template above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="catalog-grid">
          {filteredCatalogs.map((catalog) => (
            <div 
              key={catalog.id}
              className={`bg-white text-slate-900 border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-xs hover:border-indigo-400 transition-all ${
                catalog.status === "inactive" ? "opacity-75 bg-slate-50/50" : ""
              }`}
              id={`catalog-card-${catalog.id}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-lg tracking-tight text-slate-900">{catalog.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-semibold">Underwriter: {catalog.insurer_name}</p>
                  </div>

                  <span className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded ${getVerticalColor(catalog.coverage_type)}`}>
                    {catalog.coverage_type}
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                  {catalog.description}
                </p>

                {/* Scope parameters */}
                <div className="grid grid-cols-2 gap-3.5 pt-3.5 border-t border-slate-100 text-sm" id={`catalog-meta-${catalog.id}`}>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Premium Cost</p>
                    <p className="font-extrabold text-emerald-600 font-mono mt-1 text-base">
                      ${catalog.base_premium.toFixed(2)} <span className="text-xxs font-semibold font-sans text-slate-400">/{catalog.duration_days} day</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Max Coverage</p>
                    <p className="font-extrabold text-slate-800 font-mono mt-1 text-base">
                      ${catalog.coverage_amount.toLocaleString()} <span className="text-xxs font-semibold font-sans text-slate-400">limits</span>
                    </p>
                  </div>
                </div>

                {catalog.exclusions && (
                  <div className="text-xs p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 leading-relaxed font-semibold shadow-3xs" id={`exclusions-box-${catalog.id}`}>
                    <span className="font-black uppercase text-rose-500 mr-1 text-[10px] tracking-wider">Exclusions:</span>
                    {catalog.exclusions}
                  </div>
                )}
              </div>

              {/* Status toggles & geographies */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
                <div className="flex items-center gap-1.5 font-bold">
                  <Globe2 className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="truncate max-w-[120px] text-slate-500">{catalog.geographies?.join(", ") || "GLOBAL"}</span>
                </div>

                <button 
                  onClick={() => toggleStatusMutation.mutate(catalog)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-1.5 transition-all ${
                    catalog.status === "active"
                      ? "bg-emerald-50 text-emerald-700 hover:bg-slate-100"
                      : "bg-slate-100 text-slate-600 hover:bg-emerald-100"
                  }`}
                  id={`btn-toggle-status-${catalog.id}`}
                >
                  {catalog.status === "active" ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span>In Catalog</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" />
                      <span>Disabled</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configuration Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" id="configure-product-overlay">
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs" onClick={() => setIsOpen(false)}></div>

          <div className="relative bg-card text-card-foreground border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150" id="configure-product-box">
            <div className="flex items-center justify-between p-5 border-b border-border bg-stone-50 dark:bg-stone-900/50">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-500" />
                <span>Configure Embedded Template</span>
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                id="close-catalog-modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Warn if no carriers */}
              {activeInsurers.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-amber-800 text-xs" id="warning-bar">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Underwriting Carriers Missing</p>
                    <p className="mt-0.5">Onboard and activate at least one **Underwriting Insurer Syndicate** before registering templates.</p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product / policy Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Gig-Worker Accident Protect" 
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  id="form-cat-name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">template description</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="On-demand accidental medical and earnings cover for ridehailing, delivery and logistics contractors."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none"
                  id="form-cat-description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target risk portal</label>
                  <select 
                    value={form.coverage_type}
                    onChange={(e) => setForm({ ...form, coverage_type: e.target.value })}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-cat-risk"
                  >
                    <option value="accident">Accidental Injury</option>
                    <option value="cyber">Cyber Security</option>
                    <option value="travel">Travel Flight Guardian</option>
                    <option value="property">Merchant Assets</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Underwriting carrier syndicate</label>
                  <select 
                    value={form.insurer_name}
                    onChange={(e) => setForm({ ...form, insurer_name: e.target.value })}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    required
                    id="form-cat-insurer"
                  >
                    <option value="" disabled>Select live syndicate...</option>
                    {activeInsurers.map(i => (
                      <option key={i.id} value={i.name}>{i.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base premium cost</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min={0}
                    value={form.base_premium}
                    onChange={(e) => setForm({ ...form, base_premium: parseFloat(e.target.value) || 0.0 })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-cat-premium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coverage Amount</label>
                  <input 
                    type="number" 
                    min={0}
                    value={form.coverage_amount}
                    onChange={(e) => setForm({ ...form, coverage_amount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-cat-coverage"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration (Days)</label>
                  <input 
                    type="number" 
                    min={1}
                    value={form.duration_days}
                    onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value) || 1 })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-cat-duration"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">Geographies (Comma Separated)</label>
                  <input 
                    type="text" 
                    placeholder="US, CA, UK" 
                    value={form.geographies}
                    onChange={(e) => setForm({ ...form, geographies: e.target.value })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-cat-geos"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Currency</label>
                  <input 
                    type="text" 
                    required
                    placeholder="USD" 
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase().slice(0, 3) })}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    id="form-cat-currency"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-rose-500">Exclusions / Conditions</label>
                <input 
                  type="text" 
                  placeholder="Pre-existing conditions, physical transport liability limits, etc." 
                  value={form.exclusions}
                  onChange={(e) => setForm({ ...form, exclusions: e.target.value })}
                  className="w-full bg-transparent border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  id="form-cat-exclusions"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-3">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                  id="cancel-catalog-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createCatalogMutation.isPending || activeInsurers.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer hover:shadow transition-all disabled:opacity-50"
                  id="submit-catalog-btn"
                >
                  {createCatalogMutation.isPending ? "Configuring..." : "Configure Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
