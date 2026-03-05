import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Navbar from './components/Navbar';
import POS from './components/POS';
import History from './components/History';
import Products from './components/Products';
import Settings from './components/Settings';

export default function App() {
  const { isLoggedIn, loading } = useAuth();
  const [view, setView] = useState('pos');
  // ✅ Increment this after any order place/edit to force Navbar revenue refresh
  const [revenueRefreshKey, setRevenueRefreshKey] = useState(0);

  const triggerRevenueRefresh = () => setRevenueRefreshKey(k => k + 1);

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(145deg, #1a0800, #3d1a00)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 52, animation: 'pulse 1.2s ease-in-out infinite' }}>☕</div>
        <p style={{ color: '#c9a96e', fontFamily: "'DM Sans', sans-serif", letterSpacing: 2, fontSize: 13 }}>
          LOADING...
        </p>
        <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:0.8}50%{transform:scale(1.1);opacity:1}}`}</style>
      </div>
    );
  }

  if (!isLoggedIn) return <Login />;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar view={view} onNav={setView} revenueRefreshKey={revenueRefreshKey} />

      <main style={{ flex: 1, overflow: 'hidden', marginTop: 56 }}>
        <div style={{ height: '100%', overflow: 'hidden' }} className="main-content">
          {view === 'pos'      && <POS onOrderPlaced={triggerRevenueRefresh} />}
          {view === 'history'  && <History onOrderEdited={triggerRevenueRefresh} />}
          {view === 'products' && <Products />}
          {view === 'settings' && <Settings />}
        </div>
      </main>

      <style>{`
        @media (max-width: 640px) {
          .main-content { margin-bottom: 56px; }
        }
      `}</style>
    </div>
  );
}
