import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { AuthScreen } from "./screens/AuthScreen";
import { AppShell } from "./components/AppShell";
import { DashboardScreen } from "./screens/DashboardScreen";
import { ProjectsScreen } from "./screens/ProjectsScreen";
import { ProjectDetailScreen } from "./screens/ProjectDetailScreen";
import { TeamScreen } from './screens/TeamScreen';
import { ProfileScreen } from "./screens/ProfileScreen";
import { ResetPasswordScreen } from "./screens/ResetPasswordScreen";
import { Spinner } from "./components/ui";

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900">
        <Spinner size={40} />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/projects" element={<ProjectsScreen />} />
        <Route path="/projects/:id" element={<ProjectDetailScreen />} />
        <Route path="/team" element={<TeamScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
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
