import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ordersAPI, productsAPI } from '../services/api';

const fc     = (n)   => `₹${Number(n).toFixed(0)}`;
const fDate  = (iso) => new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
const fTime  = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
const today  = ()    => new Date().toISOString().split('T')[0];

export default function History({ onOrderEdited }) {
  const [summary,       setSummary]       = useState([]);
  const [orders,        setOrders]        = useState([]);
  const [selectedDate,  setSelected]      = useState(today());
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showDateList,  setShowDateList]  = useState(false);
  const [payFilter,     setPayFilter]     = useState('all'); // 'all' | 'cash' | 'online'

  const [editOrder,   setEditOrder]   = useState(null);
  const [editItems,   setEditItems]   = useState([]);
  const [editNote,    setEditNote]    = useState('');
  const [editPayMethod, setEditPayMethod] = useState('cash');
  const [allProducts, setAllProducts] = useState([]);
  const [saving,      setSaving]      = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          ordersAPI.getSummary(60),
          productsAPI.getAll({ all: 'true' }),
        ]);
        setSummary(sRes.data.data);
        setAllProducts(pRes.data.data);
      } catch { toast.error('Failed to load history'); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingOrders(true);
      try {
        const res = await ordersAPI.getAll({ date: selectedDate, limit: 100 });
        setOrders(res.data.data);
      } catch { toast.error('Failed to load orders'); }
      finally { setLoadingOrders(false); }
    })();
  }, [selectedDate]);

  const selectDate = (d) => { setSelected(d); setShowDateList(false); };

  // ── Download Daily PDF ────────────────────────────────────────────────────
  const downloadPDF = async () => {
    // Dynamically load jsPDF if not already loaded
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const W = 210; // A4 width
    const margin = 14;
    let y = 0;

    const dateStr = fDate(selectedDate + 'T00:00:00');

    // ── Header ──────────────────────────────────────────────────────────────
    doc.setFillColor(61, 26, 0);
    doc.rect(0, 0, W, 32, 'F');
    doc.setTextColor(245, 200, 66);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text("Friend's Gola", W / 2, 13, { align:'center' });
    doc.setFontSize(10);
    doc.setTextColor(201, 169, 110);
    doc.setFont('helvetica', 'normal');
    doc.text('Daily Income Report', W / 2, 21, { align:'center' });
    doc.setFontSize(9);
    doc.text(dateStr, W / 2, 28, { align:'center' });
    y = 40;

    // ── Summary Cards ───────────────────────────────────────────────────────
    const cardW = (W - margin * 2 - 8) / 3;
    const cards = [
      { label:'Total Orders', value: String(activeOrders.length), color:[193,127,60] },
      { label:'Cash Income',  value: 'Rs ' + cashTotal,           color:[46,125,50] },
      { label:'Online Income',value: 'Rs ' + onlineTotal,         color:[26,35,126] },
    ];
    cards.forEach((c, i) => {
      const x = margin + i * (cardW + 4);
      doc.setFillColor(...c.color);
      doc.roundedRect(x, y, cardW, 18, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(c.label.toUpperCase(), x + cardW / 2, y + 7, { align:'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(c.value, x + cardW / 2, y + 14, { align:'center' });
    });
    y += 26;

    // Total revenue bar
    doc.setFillColor(245, 200, 66);
    doc.roundedRect(margin, y, W - margin * 2, 14, 3, 3, 'F');
    doc.setTextColor(61, 26, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Revenue: Rs ' + dayRevenue, W / 2, y + 9, { align:'center' });
    y += 22;

    // ── Orders Table ────────────────────────────────────────────────────────
    // Table header
    doc.setFillColor(61, 26, 0);
    doc.rect(margin, y, W - margin * 2, 8, 'F');
    doc.setTextColor(245, 200, 66);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const cols = [margin+2, margin+40, margin+65, margin+120, margin+148];
    doc.text('#Bill', cols[0], y + 5.5);
    doc.text('Time',  cols[1], y + 5.5);
    doc.text('Items', cols[2], y + 5.5);
    doc.text('Pay',   cols[3], y + 5.5);
    doc.text('Total', cols[4], y + 5.5);
    y += 8;

    // Rows
    const rowOrders = activeOrders;
    rowOrders.forEach((order, idx) => {
      const rowH = 8;
      // Zebra stripe
      if (idx % 2 === 0) {
        doc.setFillColor(250, 248, 245);
        doc.rect(margin, y, W - margin * 2, rowH, 'F');
      }
      doc.setTextColor(61, 26, 0);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');

      const itemsSummary = order.items.map(i => `${i.name} x${i.qty}`).join(', ');
      const truncatedItems = itemsSummary.length > 38 ? itemsSummary.slice(0, 35) + '...' : itemsSummary;
      const pay = order.paymentMethod === 'online' ? 'Online' : 'Cash';

      doc.text(order.billNo || '-',      cols[0], y + 5.5);
      doc.text(fTime(order.createdAt),   cols[1], y + 5.5);
      doc.text(truncatedItems,           cols[2], y + 5.5);
      // Payment badge color
      if (pay === 'Online') { doc.setTextColor(26, 35, 126); doc.setFont('helvetica','bold'); }
      else { doc.setTextColor(46, 125, 50); doc.setFont('helvetica','bold'); }
      doc.text(pay, cols[3], y + 5.5);
      doc.setTextColor(193, 127, 60);
      doc.setFont('helvetica', 'bold');
      doc.text('Rs ' + order.total, cols[4], y + 5.5);

      // Bottom border
      doc.setDrawColor(232, 224, 213);
      doc.line(margin, y + rowH, W - margin, y + rowH);
      y += rowH;

      // New page if needed
      if (y > 270) {
        doc.addPage();
        y = 14;
      }
    });

    // ── Footer ──────────────────────────────────────────────────────────────
    y += 8;
    doc.setDrawColor(193, 127, 60);
    doc.setLineWidth(0.5);
    doc.line(margin, y, W - margin, y);
    y += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 130, 110);
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, margin, y);
    doc.text(`Friend's Gola POS`, W - margin, y, { align:'right' });

    doc.save(`income-${selectedDate}.pdf`);
    toast.success('📥 PDF downloaded!');
  };

  // ── Payment filtering & totals ────────────────────────────────────────────
  const activeOrders   = orders.filter(o => o.status !== 'cancelled');
  const cashOrders     = activeOrders.filter(o => !o.paymentMethod || o.paymentMethod === 'cash');
  const onlineOrders   = activeOrders.filter(o => o.paymentMethod === 'online');
  const cashTotal      = cashOrders.reduce((s, o) => s + o.total, 0);
  const onlineTotal    = onlineOrders.reduce((s, o) => s + o.total, 0);
  const dayRevenue     = cashTotal + onlineTotal;

  const filteredOrders = payFilter === 'cash'   ? orders.filter(o => !o.paymentMethod || o.paymentMethod === 'cash')
    :                    payFilter === 'online'  ? orders.filter(o => o.paymentMethod === 'online')
    :                    orders;

  // ── Edit helpers ──────────────────────────────────────────────────────────
  const openEdit  = (order) => { setEditOrder(order); setEditItems(order.items.map(i => ({ ...i, _id: i.productId || i._id }))); setEditNote(order.note || ''); setEditPayMethod(order.paymentMethod || 'cash'); setShowAddItem(false); };
  const closeEdit = () => { setEditOrder(null); setEditItems([]); setEditNote(''); setEditPayMethod('cash'); };

  const updateEditQty   = (idx, delta) => setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter(i => i.qty > 0));
  const removeEditItem  = (idx) => setEditItems(prev => prev.filter((_, i) => i !== idx));
  const updateEditPrice = (idx, val) => setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, price: parseFloat(val) || 0 } : item));

  const addProductToEdit = (product) => {
    setEditItems(prev => {
      const ex = prev.find(i => (i.productId || i._id)?.toString() === product._id?.toString());
      if (ex) return prev.map(i => (i.productId || i._id)?.toString() === product._id?.toString() ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { productId: product._id, name: product.name, emoji: product.emoji, price: product.price, qty: 1, total: product.price }];
    });
    setShowAddItem(false);
  };

  const saveEdit = async () => {
    if (!editItems.length) return toast.error('Order must have at least one item');
    setSaving(true);
    try {
      const res = await ordersAPI.edit(editOrder._id, {
        items: editItems.map(i => ({ productId: i.productId || i._id, name: i.name, emoji: i.emoji, price: i.price, qty: i.qty })),
        note: editNote,
        paymentMethod: editPayMethod,
      });
      const updated = res.data.data;
      setOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
      const sRes = await ordersAPI.getSummary(60);
      setSummary(sRes.data.data);
      toast.success('✅ Order updated!');
      closeEdit();
      if (onOrderEdited) onOrderEdited();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally { setSaving(false); }
  };

  const editTotal = editItems.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#f8f5f0' }}>

      {/* Mobile header */}
      <div className="history-mobile-header" style={{ display:'none', padding:'10px 14px', background:'#fff', borderBottom:'1px solid #e8e0d5', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <button onClick={() => setShowDateList(true)} style={{ padding:'9px 16px', borderRadius:12, border:'1.5px solid #c17f3c', background:'transparent', color:'#c17f3c', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          📅 {fDate(selectedDate + 'T00:00:00')}
        </button>
        <div style={{ fontWeight:700, color:'#c17f3c', fontSize:14 }}>{fc(dayRevenue)}</div>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Date Sidebar */}
        <div className="date-sidebar-desktop" style={{ width:200, background:'#fff', borderRight:'1px solid #e8e0d5', overflowY:'auto', flexShrink:0 }}>
          <DateList summary={summary} selectedDate={selectedDate} onSelect={selectDate} />
        </div>

        {/* Mobile Date Drawer */}
        {showDateList && (
          <div style={{ position:'fixed', inset:0, zIndex:950, background:'rgba(0,0,0,0.5)' }} onClick={() => setShowDateList(false)}>
            <div onClick={e => e.stopPropagation()} style={{ position:'absolute', top:0, left:0, bottom:0, width:'75%', maxWidth:280, background:'#fff', boxShadow:'4px 0 20px rgba(0,0,0,0.2)', display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'16px', borderBottom:'1px solid #e8e0d5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:700, color:'#3d1a00' }}>Select Date</span>
                <button onClick={() => setShowDateList(false)} style={{ background:'#f0ebe4', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
              <div style={{ flex:1, overflowY:'auto' }}>
                <DateList summary={summary} selectedDate={selectedDate} onSelect={selectDate} />
              </div>
            </div>
          </div>
        )}

        {/* Orders Area */}
        <div style={{ flex:1, overflowY:'auto', padding:'clamp(12px,3vw,20px)' }}>

          {/* Date + Total */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
            <h3 style={{ margin:0, color:'#3d2a1a', fontSize:16, fontFamily:"'Playfair Display',Georgia,serif" }}>
              {fDate(selectedDate + 'T00:00:00')}
              <span style={{ fontSize:13, fontWeight:400, color:'#b0a090', marginLeft:8 }}>({orders.length} orders)</span>
            </h3>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ background:'#c17f3c', color:'#fff', padding:'8px 20px', borderRadius:20, fontWeight:700, fontSize:14, boxShadow:'0 3px 12px rgba(193,127,60,0.35)' }}>
                {fc(dayRevenue)}
              </div>
              <button onClick={downloadPDF} disabled={activeOrders.length === 0} style={{
                padding:'8px 14px', borderRadius:20, border:'none', cursor: activeOrders.length===0?'not-allowed':'pointer',
                background: activeOrders.length===0?'#ddd':'linear-gradient(135deg,#c17f3c,#e8a045)',
                color:'#fff', fontWeight:700, fontSize:12, fontFamily:"'DM Sans',sans-serif",
                boxShadow: activeOrders.length===0?'none':'0 3px 10px rgba(193,127,60,0.4)',
                display:'flex', alignItems:'center', gap:5,
              }}>
                📥 PDF
              </button>
            </div>
          </div>

          {/* ── Cash / Online Summary Cards ── */}
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <div style={{ flex:1, background:'#f0fff4', border:'1.5px solid #a5d6a7', borderRadius:14, padding:'12px 14px', textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:2 }}>💵</div>
              <div style={{ fontSize:10, color:'#2e7d32', fontWeight:700, letterSpacing:0.5, marginBottom:4 }}>CASH</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#2e7d32' }}>{fc(cashTotal)}</div>
              <div style={{ fontSize:11, color:'#81c784', marginTop:2 }}>{cashOrders.length} orders</div>
            </div>
            <div style={{ flex:1, background:'#f0f0ff', border:'1.5px solid #9fa8da', borderRadius:14, padding:'12px 14px', textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:2 }}>📱</div>
              <div style={{ fontSize:10, color:'#1a237e', fontWeight:700, letterSpacing:0.5, marginBottom:4 }}>ONLINE</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#1a237e' }}>{fc(onlineTotal)}</div>
              <div style={{ fontSize:11, color:'#7986cb', marginTop:2 }}>{onlineOrders.length} orders</div>
            </div>
          </div>

          {/* ── Filter Tabs ── */}
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            {[
              { key:'all',    label:'All',    emoji:'📋' },
              { key:'cash',   label:'Cash',   emoji:'💵' },
              { key:'online', label:'Online', emoji:'📱' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setPayFilter(tab.key)} style={{
                padding:'8px 16px', borderRadius:20, fontSize:12, fontWeight:700, border:'none', cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s',
                background: payFilter === tab.key
                  ? tab.key === 'online' ? '#1a237e' : tab.key === 'cash' ? '#2e7d32' : '#c17f3c'
                  : '#f0ebe4',
                color: payFilter === tab.key ? '#fff' : '#7a6a5a',
                boxShadow: payFilter === tab.key ? '0 3px 10px rgba(0,0,0,0.2)' : 'none',
              }}>{tab.emoji} {tab.label}</button>
            ))}
          </div>

          {/* Orders List */}
          {loadingOrders ? (
            <div style={{ textAlign:'center', paddingTop:60, color:'#c9a96e', fontSize:30 }}>⏳</div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign:'center', paddingTop:60, color:'#b0a090' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🚫</div>
              <p>No {payFilter !== 'all' ? payFilter : ''} orders on this date</p>
            </div>
          ) : filteredOrders.map(order => {
            const isOnline = order.paymentMethod === 'online';
            return (
              <div key={order._id} style={{ background:'#fff', borderRadius:16, padding:'clamp(14px,3vw,18px)', marginBottom:12, boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:'1px solid #e8e0d5', borderLeft:`4px solid ${isOnline ? '#3949ab' : '#2e7d32'}` }}>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, flexWrap:'wrap', gap:8 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'#3d1a00', background:'#f5c842', padding:'3px 12px', borderRadius:20 }}>#{order.billNo}</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20, background: isOnline ? '#e8eaf6' : '#e8f5e9', color: isOnline ? '#1a237e' : '#2e7d32' }}>
                        {isOnline ? '📱 Online' : '💵 Cash'}
                      </span>
                      {order.status === 'cancelled' && (
                        <span style={{ fontSize:11, color:'#c0504d', background:'#ffe5e5', padding:'2px 8px', borderRadius:12 }}>Cancelled</span>
                      )}
                      <span style={{ fontSize:12, color:'#b0a090' }}>{fTime(order.createdAt)}</span>
                    </div>
                    {order.note && <div style={{ fontSize:11, color:'#c9a96e', marginTop:4 }}>📝 {order.note}</div>}
                  </div>
                  {order.status !== 'cancelled' && (
                    <button onClick={() => openEdit(order)} style={{ padding:'7px 14px', borderRadius:10, border:'1.5px solid #c17f3c', background:'#fff8ef', color:'#c17f3c', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
                      ✏️ Edit
                    </button>
                  )}
                </div>

                <div>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13, color:'#5a4a3a', borderBottom:'1px dotted #f0ebe4' }}>
                      <span>{item.emoji} {item.name} ×{item.qty}</span>
                      <span style={{ fontWeight:600 }}>{fc(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, paddingTop:10, borderTop:'1px dashed #e8e0d5' }}>
                  <span style={{ fontSize:11, color:'#b0a090' }}>{order.items.length} items</span>
                  <strong style={{ color:'#c17f3c', fontSize:15 }}>Total: {fc(order.total)}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editOrder && (
        <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={closeEdit}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:500, maxHeight:'90dvh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding:'16px 20px', background:'#3d1a00', borderRadius:'20px 20px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:'#f5c842', fontWeight:700, fontSize:16, fontFamily:"'Playfair Display',Georgia,serif" }}>✏️ Edit Order</div>
                <div style={{ color:'#c9a96e', fontSize:12, marginTop:2 }}>#{editOrder.billNo}</div>
              </div>
              <button onClick={closeEdit} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#f5c842', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:16 }}>
              {editItems.map((item, idx) => (
                <div key={idx} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 8px', borderBottom:'1px solid #f5efe8' }}>
                  <span style={{ fontSize:22, flexShrink:0 }}>{item.emoji}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#3d2a1a', marginBottom:4 }}>{item.name}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:11, color:'#b0a090' }}>₹</span>
                      <input type="number" value={item.price} onChange={e => updateEditPrice(idx, e.target.value)}
                        style={{ width:70, padding:'3px 6px', borderRadius:6, border:'1px solid #e0d5c8', fontSize:12, outline:'none', fontFamily:"'DM Sans',sans-serif", color:'#c17f3c', fontWeight:700 }} />
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                    <button onClick={() => updateEditQty(idx,-1)} style={{ width:30,height:30,borderRadius:8,border:'1.5px solid #e0d5c8',background:'#faf8f5',cursor:'pointer',fontSize:18,fontWeight:700,color:'#c17f3c',display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
                    <span style={{ fontSize:14,fontWeight:700,minWidth:22,textAlign:'center' }}>{item.qty}</span>
                    <button onClick={() => updateEditQty(idx,1)} style={{ width:30,height:30,borderRadius:8,border:'none',background:'#c17f3c',cursor:'pointer',fontSize:18,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
                  </div>
                  <div style={{ fontSize:13,fontWeight:700,color:'#3d1a00',minWidth:52,textAlign:'right' }}>{fc(item.price*item.qty)}</div>
                  <button onClick={() => removeEditItem(idx)} style={{ width:28,height:28,borderRadius:8,border:'1px solid #f0d0d0',background:'transparent',color:'#c0504d',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>×</button>
                </div>
              ))}

              <button onClick={() => setShowAddItem(v => !v)} style={{ width:'100%',marginTop:12,padding:'10px',borderRadius:12,border:'2px dashed #c17f3c',background:'#fff8ef',color:'#c17f3c',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                {showAddItem ? '✕ Cancel' : '➕ Add Item'}
              </button>

              {showAddItem && (
                <div style={{ marginTop:10,border:'1px solid #e8e0d5',borderRadius:14,overflow:'hidden',maxHeight:240,overflowY:'auto' }}>
                  {allProducts.filter(p=>p.active).map(p => (
                    <button key={p._id} onClick={() => addProductToEdit(p)} style={{ width:'100%',padding:'10px 14px',border:'none',borderBottom:'1px solid #f5efe8',background:'#fff',textAlign:'left',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:"'DM Sans',sans-serif" }}
                      onMouseEnter={e=>e.currentTarget.style.background='#fff8ef'}
                      onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                      <span style={{ fontSize:13 }}>{p.emoji} {p.name}</span>
                      <span style={{ fontSize:13,fontWeight:700,color:'#c17f3c' }}>{fc(p.price)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Payment Method */}
              <div style={{ marginTop:12 }}>
                <label style={{ fontSize:11,color:'#7a6a5a',display:'block',marginBottom:8,fontWeight:600 }}>PAYMENT METHOD</label>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setEditPayMethod('cash')} style={{
                    flex:1, padding:'11px 8px', borderRadius:12, cursor:'pointer',
                    border:`2px solid ${editPayMethod==='cash'?'#2e7d32':'#e0d5c8'}`,
                    background: editPayMethod==='cash' ? '#f0fff4' : '#faf8f5',
                    color: editPayMethod==='cash' ? '#2e7d32' : '#7a6a5a',
                    fontWeight:700, fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s',
                  }}>💵 Cash</button>
                  <button onClick={() => setEditPayMethod('online')} style={{
                    flex:1, padding:'11px 8px', borderRadius:12, cursor:'pointer',
                    border:`2px solid ${editPayMethod==='online'?'#1a237e':'#e0d5c8'}`,
                    background: editPayMethod==='online' ? '#f0f0ff' : '#faf8f5',
                    color: editPayMethod==='online' ? '#1a237e' : '#7a6a5a',
                    fontWeight:700, fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s',
                  }}>📱 Online</button>
                </div>
              </div>

              <div style={{ marginTop:12 }}>
                <label style={{ fontSize:11,color:'#7a6a5a',display:'block',marginBottom:4,fontWeight:600 }}>ORDER NOTE</label>
                <input value={editNote} onChange={e=>setEditNote(e.target.value)} placeholder="Add a note..."
                  style={{ width:'100%',padding:'9px 12px',borderRadius:10,border:'1px solid #e0d5c8',fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:"'DM Sans',sans-serif",color:'#3d1a00' }} />
              </div>
            </div>

            <div style={{ padding:'12px 20px',borderTop:'1px solid #e8e0d5',background:'#faf8f5',borderRadius:'0 0 20px 20px' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
                <span style={{ fontSize:14,color:'#7a6a5a' }}>{editItems.reduce((s,i)=>s+i.qty,0)} items</span>
                <span style={{ fontSize:20,fontWeight:800,color:'#c17f3c' }}>Total: {fc(editTotal)}</span>
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={saveEdit} disabled={saving||!editItems.length} style={{ flex:1,padding:'14px',borderRadius:12,border:'none',background:saving?'#888':'linear-gradient(135deg,#c17f3c,#e8a045)',color:'#fff',fontSize:15,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif",boxShadow:'0 4px 14px rgba(193,127,60,0.4)' }}>
                  {saving ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
                <button onClick={closeEdit} style={{ padding:'14px 20px',borderRadius:12,border:'1.5px solid #e0d5c8',background:'transparent',color:'#7a6a5a',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .date-sidebar-desktop { display: none !important; }
          .history-mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function DateList({ summary, selectedDate, onSelect }) {
  const fDate = (iso) => new Date(iso+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
  return (
    <>
      <div style={{ padding:'10px 14px',borderBottom:'1px solid #e8e0d5',fontSize:11,color:'#b0a090',fontWeight:600,letterSpacing:1 }}>RECENT DATES</div>
      {summary.length === 0 ? (
        <div style={{ padding:20,color:'#b0a090',fontSize:13,textAlign:'center' }}>No orders yet</div>
      ) : summary.map(d => (
        <button key={d._id} onClick={() => onSelect(d._id)} style={{ width:'100%',padding:'13px 14px',border:'none',borderBottom:'1px solid #f0ebe4',background:selectedDate===d._id?'#fff8ef':'#fff',borderLeft:selectedDate===d._id?'4px solid #c17f3c':'4px solid transparent',textAlign:'left',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all 0.15s' }}>
          <div style={{ fontSize:13,fontWeight:700,color:'#3d2a1a' }}>{fDate(d._id)}</div>
          <div style={{ fontSize:11,color:'#c17f3c',marginTop:2 }}>{fc(d.totalRevenue)} · {d.totalOrders} orders</div>
        </button>
      ))}
    </>
  );
}