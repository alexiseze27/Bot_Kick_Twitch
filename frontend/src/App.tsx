import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { OAuthConsent } from './pages/OAuthConsent';
import { OAuthSetupGuide } from './pages/OAuthSetupGuide';
import { Dashboard } from './pages/Dashboard';
import { Connections } from './pages/Connections';
import { Commands } from './pages/Commands';
import { Timers } from './pages/Timers';
import { AlertsConfig } from './pages/AlertsConfig';
import { AiBotConfigPage } from './pages/AiBotConfig';
import { ChatConfig } from './pages/ChatConfig';
import { GoalsConfig } from './pages/GoalsConfig';
import { SubathonConfigPage } from './pages/SubathonConfig';
import { AdminPage } from './pages/Admin';
import { AdminImpersonationBanner } from './components/layout/AdminImpersonationBanner';
import { AlertOverlay } from './components/overlays/AlertOverlay';
import { AiBotOverlay } from './components/overlays/AiBotOverlay';
import { ChatOverlay } from './components/overlays/ChatOverlay';
import { GoalOverlay } from './components/overlays/GoalOverlay';
import { SubathonOverlay } from './components/overlays/SubathonOverlay';
import { RefreshCw } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm font-semibold">Cargando perfil...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950">
      <AdminImpersonationBanner />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/oauth/authorize" element={<OAuthConsent />} />
            <Route path="/oauth/setup" element={<OAuthSetupGuide />} />

            {/* OBS Browser Source Overlays (Transparent, Token/Key authenticated) */}
            <Route path="/overlay/alerts" element={<AlertOverlay />} />
            <Route path="/overlay/ai-bot" element={<AiBotOverlay />} />
            <Route path="/overlay/chat" element={<ChatOverlay />} />
            <Route path="/overlay/goals" element={<GoalOverlay />} />
            <Route path="/overlay/subathon" element={<SubathonOverlay />} />

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/commands" element={<Commands />} />
              <Route path="/timers" element={<Timers />} />
              <Route path="/alerts-config" element={<AlertsConfig />} />
              <Route path="/ai-config" element={<AiBotConfigPage />} />
              <Route path="/chat-config" element={<ChatConfig />} />
              <Route path="/goals-config" element={<GoalsConfig />} />
              <Route path="/subathon-config" element={<SubathonConfigPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
