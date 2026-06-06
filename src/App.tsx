import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/AuthContext";
import { queryClientInstance } from "@/lib/query-client";
import Layout from "@/components/Layout";
import ScrollToTop from "@/components/ScrollToTop";
import PageNotFound from "@/lib/PageNotFound";

// Pages imports
import Dashboard from "@/pages/Dashboard";
import Insurers from "@/pages/Insurers";
import Partners from "@/pages/Partners";
import PolicyCatalogPage from "@/pages/PolicyCatalog";
import RiskEngine from "@/pages/RiskEngine";
import Policies from "@/pages/Policies";
import Claims from "@/pages/Claims";

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/insurers" element={<Insurers />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/catalog" element={<PolicyCatalogPage />} />
              <Route path="/risk-engine" element={<RiskEngine />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/claims" element={<Claims />} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
