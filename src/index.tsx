import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { BuildingsPage, type Building } from './pages/BuildingsPage';
import { DashboardPage } from './pages/DashboardPage';
import { Main } from './pages/Main';
import { Scheme } from './pages/Scheme';
import { ApiService } from './services/api.service';
import './styles/index.css';

type Page = 'dashboard' | 'main' | 'scheme';

// ── Inner app (shown after login + building selection) ────────────────────────
const AppInner: React.FC<{ building: Building; onBack: () => void }> = ({ building, onBack }) => {
  const [page, setPage] = useState<Page>('dashboard');
  return (
    <>
      <nav className="app-tab-nav">
        <button className={`tab-btn ${page === 'dashboard' ? 'tab-active' : ''}`} onClick={() => setPage('dashboard')}>
          Dashboard
        </button>
        <button className={`tab-btn ${page === 'main' ? 'tab-active' : ''}`} onClick={() => setPage('main')}>
          AK-SM Control
        </button>
        <button className={`tab-btn ${page === 'scheme' ? 'tab-active' : ''}`} onClick={() => setPage('scheme')}>
          Schemat
        </button>
        <span className="tab-building-label">🏭 {building.name}</span>
        <button className="tab-back-btn" onClick={onBack}>← Budynki</button>
      </nav>
      {page === 'dashboard' && <DashboardPage building={building} />}
      {page === 'main'      && <Main building={building} />}
      {page === 'scheme'    && <Scheme buildingId={building.id} />}
    </>
  );
};


// ── Root app (handles auth + building selection flow) ─────────────────────────
const App: React.FC = () => {
  const { user, token, isLoading } = useAuth();
  const [building, setBuilding] = useState<Building | null>(null);

  // Sync token to ApiService whenever it changes
  useEffect(() => {
    if (token) ApiService.setToken(token);
  }, [token]);

  if (isLoading) return <div className="app-loading"><div className="spinner" /></div>;
  if (!user)     return <LoginPage />;
  if (!building) return <BuildingsPage onSelect={b => { ApiService.setBuildingId(b.id); setBuilding(b); }} />;

  return <AppInner building={building} onBack={() => setBuilding(null)} />;
};

// ── Mount ─────────────────────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
