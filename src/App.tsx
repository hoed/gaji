/* src/App.tsx */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client"; // Adjust path to your Supabase client
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
            />
            <Route element={<Layout />}>
              <Route
                path="/"
                element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/karyawan"
                element={isAuthenticated ? <Employees /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/penggajian"
                element={isAuthenticated ? <Payroll /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/kehadiran"
                element={isAuthenticated ? <Attendance /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/laporan"
                element={isAuthenticated ? <Reports /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/kalender"
                element={isAuthenticated ? <Calendar /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/pengaturan"
                element={isAuthenticated ? <Settings /> : <Navigate to="/login" replace />}
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;