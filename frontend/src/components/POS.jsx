import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { productsAPI, ordersAPI, settingsAPI } from '../services/api';

const CATS = ['All', 'Premium Gola', 'Classic Gola', 'Drinks', 'Extras', 'Other'];
const fc   = (n) => `₹${Number(n).toFixed(0)}`;

const OWNER_COLORS = { JP:'#7c3aed', Jenish:'#0891b2', Urvish:'#059669' };

// ── Owner Picker Modal ────────────────────────────────────────────────────────
function OwnerPickerModal({ upiOwners, onPick, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:340, overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ background:'linear-gradient(135deg,#1a237e,#283593)', padding:'20px', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:6 }}>📱</div>
          <div style={{ color:'#fff', fontWeight:700, fontSize:18, fontFamily:"'Playfair Display',Georgia,serif" }}>Who's receiving payment?</div>
          <div style={{ color:'rgba(255,255,255,0.75)', fontSize:12, marginTop:4 }}>Select the UPI owner</div>
        </div>
        <div style={{ padding:'20px', display:'flex', flexDirection:'column', gap:12 }}>
          {upiOwners.filter(o => o.upiId).map(owner => {
            const color = OWNER_COLORS[owner.key] || '#c17f3c';
            return (
              <button key={owner.key} onClick={() => onPick(owner)} style={{
                padding:'16px', borderRadius:14, border:`2px solid ${color}20`,
                background:`${color}08`, cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
                display:'flex', alignItems:'center', gap:14,
                transition:'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.borderColor = color; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.borderColor = `${color}20`; }}>
                <span style={{ fontSize:32 }}>{owner.emoji}</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:'#3d1a00' }}>{owner.name}</div>
                  <div style={{ fontSize:12, color, fontFamily:'monospace', marginTop:2 }}>{owner.upiId}</div>
                </div>
              </button>
            );
          })}
          {upiOwners.filter(o => o.upiId).length === 0 && (
            <div style={{ textAlign:'center', padding:'20px', color:'#b0a090' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>⚠️</div>
              <p style={{ margin:0, fontSize:13 }}>No UPI IDs configured.<br/>Go to Settings → GPay / UPI.</p>
            </div>
          )}
          <button onClick={onCancel} style={{ padding:'12px', borderRadius:12, border:'1.5px solid #e0d5c8', background:'transparent', color:'#7a6a5a', fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:14 }}>
            ← Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── GPay QR Modal ─────────────────────────────────────────────────────────────
function QRModal({ total, owner, onConfirm, onCancel }) {
  const color = OWNER_COLORS[owner.key] || '#1a237e';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${owner.upiId}&pn=Friends+Gola&am=${total}&cu=INR`)}`;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:340, overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,0.4)' }}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${color},${color}bb)`, padding:'20px', textAlign:'center' }}>
          <div style={{ fontSize:28, marginBottom:4 }}>{owner.emoji}</div>
          <div style={{ color:'#fff', fontWeight:700, fontSize:18, fontFamily:"'Playfair Display',Georgia,serif" }}>{owner.name}'s GPay QR</div>
          <div style={{ color:'rgba(255,255,255,0.75)', fontSize:12, marginTop:4 }}>{owner.upiId}</div>
        </div>

        {/* QR Code */}
        <div style={{ padding:'20px 20px 16px', textAlign:'center' }}>
          <div style={{ background:'#f8f8ff', borderRadius:16, padding:14, display:'inline-block', border:`2px solid ${color}30`, marginBottom:14 }}>
            <img src={qrUrl} alt="GPay QR" width={200} height={200} style={{ display:'block', borderRadius:8 }} />
          </div>

          {/* Amount */}
          <div style={{ background:`linear-gradient(135deg,${color}18,${color}08)`, borderRadius:14, padding:'12px 20px', marginBottom:14, border:`1px solid ${color}30` }}>
            <div style={{ fontSize:11, color, fontWeight:700, letterSpacing:1, marginBottom:4 }}>AMOUNT TO PAY</div>
            <div style={{ fontSize:34, fontWeight:900, color:'#1a237e' }}>{fc(total)}</div>
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onCancel} style={{ flex:1, padding:'13px', borderRadius:12, border:'1.5px solid #e0d5c8', background:'transparent', color:'#7a6a5a', fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
              ← Back
            </button>
            <button onClick={onConfirm} style={{ flex:2, padding:'13px', borderRadius:12, border:'none', background:`linear-gradient(135deg,${color},${color}cc)`, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:14, boxShadow:`0 4px 14px ${color}40` }}>
              ✅ Payment Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main POS ──────────────────────────────────────────────────────────────────
export default function POS({ onOrderPlaced }) {
  const [products,    setProducts]    = useState([]);
  const [settings,    setSettings]    = useState(null);
  const [cart,        setCart]        = useState([]);
  const [activeCat,   setActiveCat]   = useState('All');
  const [search,      setSearch]      = useState('');
  const [note,        setNote]        = useState('');
  const [loading,     setLoading]     = useState(true);
  const [placing,     setPlacing]     = useState(false);
  const [showCart,    setShowCart]    = useState(false);
  const [payMethod,   setPayMethod]   = useState('cash');
  const [showOwnerPicker, setShowOwnerPicker] = useState(false);
  const [selectedOwner,   setSelectedOwner]   = useState(null); // { key, name, upiId, emoji }
  const [showQR,      setShowQR]      = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, sRes] = await Promise.all([productsAPI.getAll(), settingsAPI.getPublic()]);
        setProducts(pRes.data.data);
        setSettings(sRes.data.data);
      } catch { toast.error('Failed to load data'); }
      finally  { setLoading(false); }
    })();
  }, []);

  const filtered  = products.filter(p =>
    (activeCat === 'All' || p.category === activeCat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total     = subtotal;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (p) => setCart(prev => {
    const ex = prev.find(i => i._id === p._id);
    if (ex) return prev.map(i => i._id === p._id ? { ...i, qty: i.qty + 1 } : i);
    return [...prev, { ...p, qty: 1 }];
  });

  const updateQty = (id, delta) =>
    setCart(prev => prev.map(i => i._id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));

  const placeOrder = async (ownerOverride) => {
    if (!cart.length || placing) return;
    const owner = ownerOverride || selectedOwner;
    setPlacing(true);
    try {
      const res = await ordersAPI.place({
        items: cart.map(i => ({ productId:i._id, name:i.name, emoji:i.emoji, price:i.price, qty:i.qty })),
        subtotal, gstEnabled:false, gstRate:0, gst:0, total,
        note, paymentMethod: payMethod,
        upiOwner: payMethod === 'online' ? (owner?.key || '') : '',
      });
      toast.success(`✅ Order #${res.data.data.billNo} placed! (${payMethod === 'cash' ? '💵 Cash' : `📱 ${owner?.name || 'Online'}`})`);
      setCart([]); setNote(''); setShowCart(false); setShowQR(false);
      setShowOwnerPicker(false); setSelectedOwner(null); setPayMethod('cash');
      if (onOrderPlaced) onOrderPlaced();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  const handleCheckout = () => {
    if (!cart.length) return;
    if (payMethod === 'online') {
      setShowOwnerPicker(true); // Step 1: pick owner
    } else {
      placeOrder(null);
    }
  };

  const handleOwnerPicked = (owner) => {
    setSelectedOwner(owner);
    setShowOwnerPicker(false);
    setShowQR(true); // Step 2: show QR
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:16, color:'#c9a96e' }}>
      <div style={{ fontSize:48, animation:'spin 1s linear infinite' }}>🧊</div>
      <p style={{ fontFamily:"'DM Sans',sans-serif" }}>Loading menu...</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const upiOwners = settings?.upiOwners || [];

  return (
    <div style={{ display:'flex', height:'100%', position:'relative', background:'#f8f5f0' }}>

      {showOwnerPicker && (
        <OwnerPickerModal
          upiOwners={upiOwners}
          onPick={handleOwnerPicked}
          onCancel={() => setShowOwnerPicker(false)}
        />
      )}

      {showQR && selectedOwner && (
        <QRModal
          total={total}
          owner={selectedOwner}
          onConfirm={() => placeOrder(selectedOwner)}
          onCancel={() => { setShowQR(false); setSelectedOwner(null); }}
        />
      )}

      {/* ── Product Area ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <div style={{ padding:'12px 12px 8px', background:'#fff', borderBottom:'1px solid #e8e0d5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <input
            placeholder="🔍  Search items..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'10px 16px', borderRadius:14, border:'1.5px solid #e0d5c8', fontSize:15, outline:'none', background:'#faf8f5', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", marginBottom:10, color:'#3d1a00' }}
          />
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2, scrollbarWidth:'none' }}>
            {CATS.filter(c => c === 'All' || products.some(p => p.category === c)).map(c => (
              <button key={c} onClick={() => setActiveCat(c)} style={{
                padding:'8px 16px', borderRadius:20, fontSize:13, fontWeight:600, border:'none', cursor:'pointer', whiteSpace:'nowrap',
                background: activeCat === c ? '#c17f3c' : '#f0ebe4',
                color: activeCat === c ? '#fff' : '#7a6a5a',
                transition:'all 0.2s', fontFamily:"'DM Sans',sans-serif", flexShrink:0,
                boxShadow: activeCat === c ? '0 3px 10px rgba(193,127,60,0.35)' : 'none',
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'12px 12px 75px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:10, alignContent:'start' }}>
          {filtered.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', paddingTop:60, color:'#b0a090' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🔍</div><p>No items found</p>
            </div>
          )}
          {filtered.map(p => {
            const ic = cart.find(i => i._id === p._id);
            return (
              <button key={p._id} onClick={() => addToCart(p)} style={{
                background: ic ? '#fff8ef' : '#fff', border:`2px solid ${ic?'#c17f3c':'#e8e0d5'}`,
                borderRadius:16, padding:'14px 8px 12px', cursor:'pointer', textAlign:'center',
                transition:'all 0.15s', position:'relative', fontFamily:"'DM Sans',sans-serif",
                boxShadow: ic ? '0 4px 16px rgba(193,127,60,0.2)' : '0 1px 6px rgba(0,0,0,0.05)',
                WebkitTapHighlightColor:'transparent',
              }}
              onPointerDown={e => e.currentTarget.style.transform='scale(0.94)'}
              onPointerUp={e => e.currentTarget.style.transform='scale(1)'}
              onPointerLeave={e => e.currentTarget.style.transform='scale(1)'}>
                {ic && <div style={{ position:'absolute', top:6, right:6, background:'#c17f3c', color:'#fff', borderRadius:'50%', width:22, height:22, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{ic.qty}</div>}
                <div style={{ fontSize:34, marginBottom:6 }}>{p.emoji}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'#3d2a1a', marginBottom:4, lineHeight:1.3 }}>{p.name}</div>
                <div style={{ fontSize:14, fontWeight:800, color:'#c17f3c' }}>{fc(p.price)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Desktop Bill Panel ── */}
      <div className="bill-panel-desktop" style={{ width:300, background:'#fff', borderLeft:'1px solid #e8e0d5', display:'flex', flexDirection:'column', boxShadow:'-4px 0 20px rgba(0,0,0,0.08)', flexShrink:0 }}>
        <BillPanel cart={cart} note={note} setNote={setNote} subtotal={subtotal} total={total} cartCount={cartCount} payMethod={payMethod} setPayMethod={setPayMethod} onUpdateQty={updateQty} onClear={() => setCart([])} onCheckout={handleCheckout} placing={placing} />
      </div>

      {/* ── Mobile Cart Button ── */}
      {cartCount > 0 && (
        <button className="mobile-cart-btn" onClick={() => setShowCart(true)} style={{
          position:'fixed', bottom:72, right:16, zIndex:900,
          background:'linear-gradient(135deg,#c17f3c,#e8a045)', border:'none', borderRadius:20, padding:'12px 20px',
          color:'#fff', fontWeight:700, fontSize:15, boxShadow:'0 6px 24px rgba(193,127,60,0.5)',
          display:'flex', alignItems:'center', gap:10, fontFamily:"'DM Sans',sans-serif", cursor:'pointer',
        }}>
          <span style={{ background:'rgba(255,255,255,0.25)', borderRadius:'50%', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800 }}>{cartCount}</span>
          View Cart · {fc(total)}
        </button>
      )}

      {/* ── Mobile Drawer ── */}
      {showCart && (
        <div className="mobile-drawer-overlay" style={{ position:'fixed', inset:0, zIndex:950, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }} onClick={() => setShowCart(false)}>
          <div onClick={e => e.stopPropagation()} style={{ position:'absolute', bottom:65, left:0, right:0, background:'#fff', borderRadius:'24px 24px 0 0', maxHeight:'92dvh', display:'flex', flexDirection:'column', boxShadow:'0 -10px 40px rgba(0,0,0,0.25)' }}>
            <div style={{ padding:'12px 20px', borderBottom:'1px solid #e8e0d5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, color:'#3d1a00', fontSize:16 }}>🧾 Your Order</span>
              <button onClick={() => setShowCart(false)} style={{ background:'#f0ebe4', border:'none', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontSize:16, color:'#7a6a5a' }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              <BillPanel cart={cart} note={note} setNote={setNote} subtotal={subtotal} total={total} cartCount={cartCount} payMethod={payMethod} setPayMethod={setPayMethod} onUpdateQty={updateQty} onClear={() => setCart([])} onCheckout={handleCheckout} placing={placing} mobile />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) { .bill-panel-desktop { display: none !important; } }
        @media (min-width: 641px) { .mobile-cart-btn { display: none !important; } .mobile-drawer-overlay { display: none !important; } }
      `}</style>
    </div>
  );
}

// ── Bill Panel ────────────────────────────────────────────────────────────────
function BillPanel({ cart, note, setNote, total, cartCount, payMethod, setPayMethod, onUpdateQty, onClear, onCheckout, placing, mobile }) {
  return (
    <>
      {!mobile && (
        <div style={{ padding:'14px 20px', background:'#3d1a00' }}>
          <div style={{ color:'#f5c842', fontSize:15, fontWeight:700, letterSpacing:2, fontFamily:"'Playfair Display',Georgia,serif" }}>🧾 CURRENT ORDER</div>
          <div style={{ color:'#c9a96e', fontSize:12, marginTop:2 }}>{cartCount} item{cartCount !== 1?'s':''} · {fc(total)}</div>
        </div>
      )}

      <div style={{ flex:1, overflowY:'auto', padding:12 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign:'center', color:'#b0a090', paddingTop:50, fontSize:13 }}>
            <div style={{ fontSize:48, marginBottom:10 }}>🧊</div>
            <p>Tap items to add them</p>
          </div>
        ) : cart.map(item => (
          <div key={item._id} style={{ display:'flex', alignItems:'center', padding:'10px 4px', borderBottom:'1px solid #f5efe8', gap:8 }}>
            <span style={{ fontSize:24 }}>{item.emoji}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#3d2a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
              <div style={{ fontSize:11, color:'#c17f3c' }}>{fc(item.price)}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <button onClick={() => onUpdateQty(item._id, -1)} style={{ width:28, height:28, borderRadius:8, border:'1.5px solid #e0d5c8', background:'#faf8f5', cursor:'pointer', fontSize:17, fontWeight:700, color:'#c17f3c', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
              <span style={{ fontSize:14, fontWeight:700, minWidth:20, textAlign:'center' }}>{item.qty}</span>
              <button onClick={() => onUpdateQty(item._id, 1)} style={{ width:28, height:28, borderRadius:8, border:'none', background:'#c17f3c', cursor:'pointer', fontSize:17, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'#3d1a00', minWidth:46, textAlign:'right' }}>{fc(item.price * item.qty)}</div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <>
          {/* Note */}
          <div style={{ padding:'0 12px 10px' }}>
            <input placeholder="📝 Order note..." value={note} onChange={e => setNote(e.target.value)}
              style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'1px solid #e0d5c8', fontSize:12, outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", color:'#3d1a00' }} />
          </div>

          {/* ── Payment Method Selector ── */}
          <div style={{ padding:'0 12px 12px' }}>
            <div style={{ fontSize:11, color:'#7a6a5a', fontWeight:700, marginBottom:8, letterSpacing:0.5 }}>PAYMENT METHOD</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setPayMethod('cash')} style={{
                flex:1, padding:'11px 8px', borderRadius:12, cursor:'pointer',
                border:`2px solid ${payMethod==='cash'?'#2e7d32':'#e0d5c8'}`,
                background: payMethod==='cash' ? '#f0fff4' : '#faf8f5',
                color: payMethod==='cash' ? '#2e7d32' : '#7a6a5a',
                fontWeight:700, fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s',
              }}>💵 Cash</button>
              <button onClick={() => setPayMethod('online')} style={{
                flex:1, padding:'11px 8px', borderRadius:12, cursor:'pointer',
                border:`2px solid ${payMethod==='online'?'#1a237e':'#e0d5c8'}`,
                background: payMethod==='online' ? '#f0f0ff' : '#faf8f5',
                color: payMethod==='online' ? '#1a237e' : '#7a6a5a',
                fontWeight:700, fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s',
              }}>📱 Online</button>
            </div>
            {payMethod === 'online' && (
              <div style={{ marginTop:8, fontSize:11, color:'#5c6bc0', background:'#f0f0ff', padding:'6px 10px', borderRadius:8, textAlign:'center' }}>
                📲 You'll pick which owner's QR to show next
              </div>
            )}
          </div>

          {/* Total */}
          <div style={{ padding:'12px 18px', borderTop:'2px dashed #e8e0d5' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:22, fontWeight:800, color:'#3d1a00' }}>
              <span>TOTAL</span>
              <span style={{ color:'#c17f3c' }}>{fc(total)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ padding:'0 14px 14px', display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={onCheckout} disabled={placing} style={{
              padding:'16px', borderRadius:14, border:'none',
              cursor: placing ? 'not-allowed' : 'pointer',
              background: placing ? '#888' : payMethod === 'online'
                ? 'linear-gradient(135deg,#1a237e,#3949ab)'
                : 'linear-gradient(135deg,#2e7d32,#43a047)',
              color:'#fff', fontSize:16, fontWeight:700,
              fontFamily:"'DM Sans',sans-serif", transition:'all 0.3s',
              boxShadow: payMethod==='online' ? '0 6px 20px rgba(26,35,126,0.35)' : '0 6px 20px rgba(46,125,50,0.35)',
            }}>
              {placing ? '⏳ Placing...' : payMethod === 'online' ? '📱 Select Owner & Pay' : '💵 Place Cash Order'}
            </button>
            <button onClick={onClear} style={{ padding:'10px', borderRadius:10, border:'1.5px solid #e0d5c8', background:'transparent', color:'#c0504d', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              🗑️ Clear Cart
            </button>
          </div>
        </>
      )}
    </>
  );
}