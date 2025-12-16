import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
import ClaimsQueue from "./pages/admin/ClaimsQueue";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CompaniesAdmin from "./pages/admin/CompaniesAdmin";
import MembershipsAdmin from "./pages/admin/MembershipsAdmin";
import UsersAdmin from "./pages/admin/UsersAdmin";
import EventsAdmin from "./pages/admin/EventsAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/claims"
              element={
                <AdminProtectedRoute>
                  <ClaimsQueue />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/companies"
              element={
                <AdminProtectedRoute>
                  <CompaniesAdmin />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/memberships"
              element={
                <AdminProtectedRoute>
                  <MembershipsAdmin />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminProtectedRoute>
                  <UsersAdmin />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <AdminProtectedRoute>
                  <EventsAdmin />
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
