// import { useState, useEffect, useCallback } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { ordersAPI } from '../services/api';

// const NAV_ITEMS = [
//   { key: 'pos',      label: 'POS',      icon: '🛒' },
//   { key: 'history',  label: 'History',  icon: '📋' },
//   { key: 'products', label: 'Products', icon: '🍽️' },
//   { key: 'settings', label: 'Settings', icon: '⚙️' },
// ];

// const fc = (n) => `₹${Number(n).toFixed(0)}`;

// export default function Navbar({ view, onNav, revenueRefreshKey }) {
//   const { logout, cafeName } = useAuth();
//   const [todayRevenue, setTodayRevenue] = useState(0);

//   // ✅ FIX 1: Refresh revenue whenever:
//   //   - view changes (switching tabs)
//   //   - revenueRefreshKey changes (passed from parent after order edit/place)
//   //   - every 30 seconds automatically
//   const loadRevenue = useCallback(async () => {
//     try {
//       const res = await ordersAPI.getToday();
//       setTodayRevenue(res.data.data.revenue);
//     } catch {}
//   }, []);

//   useEffect(() => {
//     loadRevenue();
//     const id = setInterval(loadRevenue, 30000);
//     return () => clearInterval(id);
//   }, [view, revenueRefreshKey, loadRevenue]);

//   return (
//     <>
//       {/* ── Top Navbar (Desktop) ── */}
//       <nav style={{
//         position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
//         background: '#3d1a00', height: 56,
//         display: 'flex', alignItems: 'center',
//         padding: '0 16px',
//         boxShadow: '0 3px 20px rgba(0,0,0,0.4)',
//       }}>
//         {/* Logo — always visible */}
//         <div style={{
//           fontFamily: "'Playfair Display', Georgia, serif",
//           fontSize: 18, fontWeight: 700,
//           color: '#f5c842', letterSpacing: 3,
//           marginRight: 24, flexShrink: 0,
//           display: 'flex', alignItems: 'center', gap: 8,
//         }}>
//           <span>☕</span>
//           <span className="nav-cafe-name">{cafeName}</span>
//         </div>

//         {/* Desktop nav items */}
//         <div className="nav-desktop" style={{ display: 'flex', gap: 4 }}>
//           {NAV_ITEMS.map(n => (
//             <button key={n.key} onClick={() => onNav(n.key)} style={{
//               padding: '7px 14px', borderRadius: 10, border: 'none',
//               cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
//               fontSize: 13, fontWeight: 600,
//               background: view === n.key ? 'rgba(245,200,66,0.18)' : 'transparent',
//               color: view === n.key ? '#f5c842' : '#c9a96e',
//               borderBottom: view === n.key ? '2px solid #f5c842' : '2px solid transparent',
//               transition: 'all 0.2s',
//             }}>
//               {n.icon} {n.label}
//             </button>
//           ))}
//         </div>

//         {/* Right side — revenue + logout */}
//         <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
//           {/* ✅ FIX 3: Revenue visible on mobile too (in top bar) */}
//           <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
//             <span style={{ fontSize: 15, fontWeight: 700, color: '#f5c842', lineHeight: 1 }}>{fc(todayRevenue)}</span>
//             <span style={{ fontSize: 10, color: '#c9a96e' }}>Today</span>
//           </div>
//           <button onClick={logout} className="nav-logout-btn" style={{
//             padding: '7px 12px', borderRadius: 8,
//             border: '1px solid rgba(255,100,100,0.3)',
//             background: 'rgba(255,70,70,0.1)',
//             color: '#ff9999', cursor: 'pointer',
//             fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
//           }}>
//             🔒 <span className="nav-logout-text">Logout</span>
//           </button>
//         </div>
//       </nav>

//       {/* ── Bottom Nav (Mobile only) ── */}
//       <nav className="mobile-nav" style={{
//         position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
//         background: '#3d1a00',
//         borderTop: '1px solid rgba(245,200,66,0.15)',
//         display: 'none',
//         boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
//       }}>
//         {NAV_ITEMS.map(n => (
//           <button key={n.key} onClick={() => onNav(n.key)} style={{
//             flex: 1, padding: '10px 4px 8px',
//             border: 'none', background: 'transparent',
//             cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
//             display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
//             color: view === n.key ? '#f5c842' : '#c9a96e',
//             borderTop: view === n.key ? '2px solid #f5c842' : '2px solid transparent',
//             transition: 'all 0.2s',
//           }}>
//             <span style={{ fontSize: 20 }}>{n.icon}</span>
//             <span style={{ fontSize: 10, fontWeight: 600 }}>{n.label}</span>
//           </button>
//         ))}
//         <button onClick={logout} style={{
//           flex: 1, padding: '10px 4px 8px',
//           border: 'none', background: 'transparent',
//           cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
//           display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
//           color: '#ff9999', borderTop: '2px solid transparent',
//         }}>
//           <span style={{ fontSize: 20 }}>🔒</span>
//           <span style={{ fontSize: 10, fontWeight: 600 }}>Out</span>
//         </button>
//       </nav>

//       <style>{`
//         @media (max-width: 640px) {
//           .nav-desktop { display: none !important; }
//           .nav-logout-btn { display: none !important; }
//           .mobile-nav { display: flex !important; }
//           /* ✅ FIX 3: Show café name + revenue on mobile top bar */
//           .nav-cafe-name { display: inline !important; font-size: 13px !important; letter-spacing: 2px !important; }
//         }
//         @media (min-width: 641px) {
//           .mobile-nav { display: none !important; }
//           .nav-cafe-name { display: inline !important; }
//         }
//       `}</style>
//     </>
//   );
// }


import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';

const NAV_ITEMS = [
  { key: 'pos',       label: 'POS',       icon: '🛒' },
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'history',   label: 'History',   icon: '📋' },
  { key: 'products',  label: 'Products',  icon: '🍽️' },
  { key: 'settings',  label: 'Settings',  icon: '⚙️' },
];

const fc = (n) => `₹${Number(n).toFixed(0)}`;

export default function Navbar({ view, onNav, revenueRefreshKey }) {
  const { logout, cafeName } = useAuth();
  const [todayRevenue, setTodayRevenue] = useState(0);

  // ✅ FIX 1: Refresh revenue whenever:
  //   - view changes (switching tabs)
  //   - revenueRefreshKey changes (passed from parent after order edit/place)
  //   - every 30 seconds automatically
  const loadRevenue = useCallback(async () => {
    try {
      const res = await ordersAPI.getToday();
      setTodayRevenue(res.data.data.revenue);
    } catch {}
  }, []);

  useEffect(() => {
    loadRevenue();
    const id = setInterval(loadRevenue, 30000);
    return () => clearInterval(id);
  }, [view, revenueRefreshKey, loadRevenue]);

  return (
    <>
      {/* ── Top Navbar (Desktop) ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: '#3d1a00', height: 56,
        display: 'flex', alignItems: 'center',
        padding: '0 16px',
        boxShadow: '0 3px 20px rgba(0,0,0,0.4)',
      }}>
        {/* Logo — always visible */}
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 18, fontWeight: 700,
          color: '#f5c842', letterSpacing: 3,
          marginRight: 24, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>☕</span>
          <span className="nav-cafe-name">{cafeName}</span>
        </div>

        {/* Desktop nav items */}
        <div className="nav-desktop" style={{ display: 'flex', gap: 4 }}>
          {NAV_ITEMS.map(n => (
            <button key={n.key} onClick={() => onNav(n.key)} style={{
              padding: '7px 14px', borderRadius: 10, border: 'none',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, fontWeight: 600,
              background: view === n.key ? 'rgba(245,200,66,0.18)' : 'transparent',
              color: view === n.key ? '#f5c842' : '#c9a96e',
              borderBottom: view === n.key ? '2px solid #f5c842' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
              {n.icon} {n.label}
            </button>
          ))}
        </div>

        {/* Right side — revenue + logout */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* ✅ FIX 3: Revenue visible on mobile too (in top bar) */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#f5c842', lineHeight: 1 }}>{fc(todayRevenue)}</span>
            <span style={{ fontSize: 10, color: '#c9a96e' }}>Today</span>
          </div>
          <button onClick={logout} className="nav-logout-btn" style={{
            padding: '7px 12px', borderRadius: 8,
            border: '1px solid rgba(255,100,100,0.3)',
            background: 'rgba(255,70,70,0.1)',
            color: '#ff9999', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
          }}>
            🔒 <span className="nav-logout-text">Logout</span>
          </button>
        </div>
      </nav>

      {/* ── Bottom Nav (Mobile only) ── */}
      <nav className="mobile-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: '#3d1a00',
        borderTop: '1px solid rgba(245,200,66,0.15)',
        display: 'none',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
      }}>
        {NAV_ITEMS.map(n => (
          <button key={n.key} onClick={() => onNav(n.key)} style={{
            flex: 1, padding: '10px 4px 8px',
            border: 'none', background: 'transparent',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: view === n.key ? '#f5c842' : '#c9a96e',
            borderTop: view === n.key ? '2px solid #f5c842' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{n.label}</span>
          </button>
        ))}
        <button onClick={logout} style={{
          flex: 1, padding: '10px 4px 8px',
          border: 'none', background: 'transparent',
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          color: '#ff9999', borderTop: '2px solid transparent',
        }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>Out</span>
        </button>
      </nav>

      <style>{`
        @media (max-width: 640px) {
          .nav-desktop { display: none !important; }
          .nav-logout-btn { display: none !important; }
          .mobile-nav { display: flex !important; }
          /* ✅ FIX 3: Show café name + revenue on mobile top bar */
          .nav-cafe-name { display: inline !important; font-size: 13px !important; letter-spacing: 2px !important; }
        }
        @media (min-width: 641px) {
          .mobile-nav { display: none !important; }
          .nav-cafe-name { display: inline !important; }
        }
      `}</style>
    </>
  );
}