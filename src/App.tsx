import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { AuthScreen } from "./screens/AuthScreen";
import { AppShell } from "./components/AppShell";
import { DashboardScreen } from "./screens/DashboardScreen";
import { ProjectsScreen } from "./screens/ProjectsScreen";
// Removed missing import
import { TeamScreen } from "./screens/TeamScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { Spinner } from "./components/ui";

function ProtectedRoutes() {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900">
        <Spinner size={40} />
      </div>
    );
  }

  if (!user && !isGuest) {
    return <AuthScreen />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/projects" element={<ProjectsScreen />} />
        <Route path="/projects/:id" element={<div className="p-8 text-center text-white">جاري إعادة بناء صفحة تفاصيل المشروع...</div>} />
        <Route path="/team" element={<TeamScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
