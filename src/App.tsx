import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MemberProvider } from "@/contexts/member/MemberContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import Index from "./pages/Index";
import BusinessDetail from "./pages/BusinessDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import CompanyProfile from "./pages/CompanyProfile";
import TeamManagement from "./pages/TeamManagement";

// Lazy load admin routes for code splitting
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ClaimsQueue = lazy(() => import("./pages/admin/ClaimsQueue"));
const CompaniesAdmin = lazy(() => import("./pages/admin/CompaniesAdmin"));
const CompanyDetail = lazy(() => import("./pages/admin/CompanyDetail"));
const MembershipsAdmin = lazy(() => import("./pages/admin/MembershipsAdmin"));
const UsersAdmin = lazy(() => import("./pages/admin/UsersAdmin"));
const EventsAdmin = lazy(() => import("./pages/admin/EventsAdmin"));
const EventDetail = lazy(() => import("./pages/admin/EventDetail"));

const queryClient = new QueryClient();

// Loading fallback for lazy-loaded components
const AdminLoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin-orange mx-auto mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <MemberProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/business/:id" element={<BusinessDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/company-profile"
              element={
                <ProtectedRoute>
                  <CompanyProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/team"
              element={
                <ProtectedRoute>
                  <TeamManagement />
                </ProtectedRoute>
              }
            />

            {/* Admin routes - lazy loaded */}
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <AdminDashboard />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/claims"
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <ClaimsQueue />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/companies"
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <CompaniesAdmin />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/companies/:id"
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <CompanyDetail />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/memberships"
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <MembershipsAdmin />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <UsersAdmin />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <EventsAdmin />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/events/:id"
              element={
                <AdminProtectedRoute>
                  <Suspense fallback={<AdminLoadingFallback />}>
                    <EventDetail />
                  </Suspense>
                </AdminProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MemberProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
