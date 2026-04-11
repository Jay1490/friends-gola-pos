import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ordersAPI, productsAPI, settingsAPI } from '../services/api';

const fc     = (n)   => `₹${Number(n).toFixed(0)}`;
const fDate  = (iso) => new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
const fTime  = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
const today  = ()    => new Date().toISOString().split('T')[0];

const OWNER_COLORS = { JP:'#7c3aed', Jenish:'#0891b2', Urvish:'#059669' };
const OWNER_EMOJIS = { JP:'👦🏻', Jenish:'🧔🏻‍♂️', Urvish:'👨🏻' };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function History({ onOrderEdited }) {
  const [view,          setView]          = useState('calendar'); // 'calendar' | 'orders'
  const [summary,       setSummary]       = useState([]);
  const [orders,        setOrders]        = useState([]);
  const [selectedDate,  setSelected]      = useState(today());
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [payFilter,     setPayFilter]     = useState('all');
  const [upiOwners,     setUpiOwners]     = useState([]);

  // Calendar state
  const [calYear,  setCalYear]  = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const [viewOrder,     setViewOrder]     = useState(null);
  const [editOrder,     setEditOrder]     = useState(null);
  const [editItems,     setEditItems]     = useState([]);
  const [editNote,      setEditNote]      = useState('');
  const [editPayMethod, setEditPayMethod] = useState('cash');
  const [editUpiOwner,  setEditUpiOwner]  = useState('');
  const [allProducts,   setAllProducts]   = useState([]);
  const [saving,        setSaving]        = useState(false);
  const [showAddItem,   setShowAddItem]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, pRes, setRes] = await Promise.all([
          ordersAPI.getSummary(365),
          productsAPI.getAll({ all: 'true' }),
          settingsAPI.getPublic(),
        ]);
        setSummary(sRes.data.data);
        setAllProducts(pRes.data.data);
        setUpiOwners(setRes.data.data?.upiOwners || []);
      } catch { toast.error('Failed to load history'); }
    })();
  }, []);

  useEffect(() => {
    if (view !== 'orders') return;
    (async () => {
      setLoadingOrders(true);
      try {
        const res = await ordersAPI.getAll({ date: selectedDate, limit: 100 });
        setOrders(res.data.data);
      } catch { toast.error('Failed to load orders'); }
      finally { setLoadingOrders(false); }
    })();
  }, [selectedDate, view]);

  const selectDate = (d) => {
    setSelected(d);
    setView('orders');
    setPayFilter('all');
  };

  // ── Revenue map for calendar dots ─────────────────────────────────────────
  const revenueMap = summary.reduce((acc, d) => {
    acc[d._id] = d.totalRevenue;
    return acc;
  }, {});

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const changeMonth = (dir) => {
    let m = calMonth + dir;
    let y = calYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setCalMonth(m);
    setCalYear(y);
  };

  const buildCalendar = () => {
    const firstDay  = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
    const offset    = firstDay === 0 ? 6 : firstDay - 1;       // Mon-based
    const daysInMon = new Date(calYear, calMonth + 1, 0).getDate();
    return { offset, daysInMon };
  };

  const dayKey = (d) => `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  // ── Download Daily PDF ────────────────────────────────────────────────────
  const downloadPDF = async () => {
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    const { jsPDF } = window.jspdf;
    const doc    = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const W      = 210;
    const margin = 14;
    let y = 0;

    const dateStr = fDate(selectedDate + 'T00:00:00');
    doc.setFillColor(61, 26, 0);
    doc.rect(0, 0, W, 32, 'F');
    doc.setTextColor(245, 200, 66);
    doc.setFontSize(20); doc.setFont('helvetica','bold');
    doc.text("Friend's Gola", W/2, 13, { align:'center' });
    doc.setFontSize(10); doc.setTextColor(201,169,110); doc.setFont('helvetica','normal');
    doc.text('Daily Income Report', W/2, 21, { align:'center' });
    doc.setFontSize(9);
    doc.text(dateStr, W/2, 28, { align:'center' });
    y = 40;

    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const cashTotal   = activeOrders.filter(o => !o.paymentMethod || o.paymentMethod==='cash').reduce((s,o)=>s+o.total,0);
    const onlineTotal = activeOrders.filter(o => o.paymentMethod==='online').reduce((s,o)=>s+o.total,0);
    const dayRevenue  = cashTotal + onlineTotal;

    const cardW = (W - margin*2 - 8) / 3;
    [{label:'Total Orders',value:String(activeOrders.length),color:[193,127,60]},{label:'Cash Income',value:'Rs '+cashTotal,color:[46,125,50]},{label:'Online Income',value:'Rs '+onlineTotal,color:[26,35,126]}]
      .forEach((c,i) => {
        const x = margin + i*(cardW+4);
        doc.setFillColor(...c.color);
        doc.roundedRect(x,y,cardW,18,3,3,'F');
        doc.setTextColor(255,255,255); doc.setFontSize(7); doc.setFont('helvetica','normal');
        doc.text(c.label.toUpperCase(), x+cardW/2, y+7, {align:'center'});
        doc.setFontSize(11); doc.setFont('helvetica','bold');
        doc.text(c.value, x+cardW/2, y+14, {align:'center'});
      });
    y += 26;

    doc.setFillColor(245,200,66);
    doc.roundedRect(margin,y,W-margin*2,14,3,3,'F');
    doc.setTextColor(61,26,0); doc.setFontSize(11); doc.setFont('helvetica','bold');
    doc.text('Total Revenue: Rs '+dayRevenue, W/2, y+9, {align:'center'});
    y += 22;

    doc.setFillColor(61,26,0);
    doc.rect(margin,y,W-margin*2,8,'F');
    doc.setTextColor(245,200,66); doc.setFontSize(8); doc.setFont('helvetica','bold');
    const cols = [margin+2,margin+38,margin+62,margin+108,margin+138,margin+162];
    ['#Bill','Time','Items','Pay','Owner','Total'].forEach((t,i)=>doc.text(t,cols[i],y+5.5));
    y += 8;

    activeOrders.forEach((order,idx)=>{
      const rowH=8;
      if(idx%2===0){doc.setFillColor(250,248,245);doc.rect(margin,y,W-margin*2,rowH,'F');}
      doc.setTextColor(61,26,0);doc.setFontSize(7.5);doc.setFont('helvetica','normal');
      const itemsSummary=order.items.map(i=>`${i.name} x${i.qty}`).join(', ');
      const truncated=itemsSummary.length>34?itemsSummary.slice(0,31)+'...':itemsSummary;
      const pay=order.paymentMethod==='online'?'Online':'Cash';
      doc.text(order.billNo||'-',cols[0],y+5.5);
      doc.text(fTime(order.createdAt),cols[1],y+5.5);
      doc.text(truncated,cols[2],y+5.5);
      if(pay==='Online'){doc.setTextColor(26,35,126);doc.setFont('helvetica','bold');}
      else{doc.setTextColor(46,125,50);doc.setFont('helvetica','bold');}
      doc.text(pay,cols[3],y+5.5);
      doc.setTextColor(100,60,150);doc.setFont('helvetica','normal');
      doc.text(order.upiOwner||'-',cols[4],y+5.5);
      doc.setTextColor(193,127,60);doc.setFont('helvetica','bold');
      doc.text('Rs '+order.total,cols[5],y+5.5);
      doc.setDrawColor(232,224,213);doc.line(margin,y+rowH,W-margin,y+rowH);
      y+=rowH;
      if(y>270){doc.addPage();y=14;}
    });

    doc.save(`income-${selectedDate}.pdf`);
    toast.success('📥 PDF downloaded!');
  };

  // ── Edit helpers ──────────────────────────────────────────────────────────
  const openEdit = (order) => {
    setEditOrder(order);
    setEditItems(order.items.map(i => ({ ...i, _id: i.productId || i._id })));
    setEditNote(order.note || '');
    setEditPayMethod(order.paymentMethod || 'cash');
    setEditUpiOwner(order.upiOwner || '');
    setShowAddItem(false);
  };
  const closeEdit = () => { setEditOrder(null); setEditItems([]); setEditNote(''); setEditPayMethod('cash'); setEditUpiOwner(''); };

  const updateEditQty   = (idx, delta) => setEditItems(prev => prev.map((item, i) => i===idx ? {...item, qty:Math.max(0,item.qty+delta)} : item).filter(i=>i.qty>0));
  const removeEditItem  = (idx)        => setEditItems(prev => prev.filter((_,i) => i!==idx));
  const updateEditPrice = (idx, val)   => setEditItems(prev => prev.map((item,i) => i===idx ? {...item, price:parseFloat(val)||0} : item));

  const addProductToEdit = (product) => {
    setEditItems(prev => {
      const ex = prev.find(i => (i.productId||i._id)?.toString()===product._id?.toString());
      if (ex) return prev.map(i => (i.productId||i._id)?.toString()===product._id?.toString() ? {...i,qty:i.qty+1} : i);
      return [...prev, { productId:product._id, name:product.name, emoji:product.emoji, price:product.price, qty:1, total:product.price }];
    });
    setShowAddItem(false);
  };

  const saveEdit = async () => {
    if (!editItems.length) return toast.error('Order must have at least one item');
    if (editPayMethod==='online' && !editUpiOwner) return toast.error('Please select which owner received this payment');
    setSaving(true);
    try {
      const res = await ordersAPI.edit(editOrder._id, {
        items: editItems.map(i => ({ productId:i.productId||i._id, name:i.name, emoji:i.emoji, price:i.price, qty:i.qty })),
        note: editNote, paymentMethod: editPayMethod,
        upiOwner: editPayMethod==='online' ? editUpiOwner : '',
      });
      const updated = res.data.data;
      setOrders(prev => prev.map(o => o._id===updated._id ? updated : o));
      const sRes = await ordersAPI.getSummary(365);
      setSummary(sRes.data.data);
      toast.success('✅ Order updated!');
      closeEdit();
      if (onOrderEdited) onOrderEdited();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally { setSaving(false); }
  };

  const editTotal = editItems.reduce((s,i) => s+i.price*i.qty, 0);

  // ── Computed for orders view ──────────────────────────────────────────────
  const activeOrders  = orders.filter(o => o.status !== 'cancelled');
  const cashOrders    = activeOrders.filter(o => !o.paymentMethod || o.paymentMethod==='cash');
  const onlineOrders  = activeOrders.filter(o => o.paymentMethod==='online');
  const cashTotal     = cashOrders.reduce((s,o)=>s+o.total,0);
  const onlineTotal   = onlineOrders.reduce((s,o)=>s+o.total,0);
  const dayRevenue    = cashTotal + onlineTotal;

  const ownerOnlineTotals = upiOwners.reduce((acc, o) => {
    acc[o.key] = onlineOrders.filter(ord=>ord.upiOwner===o.key).reduce((s,ord)=>s+ord.total,0);
    return acc;
  }, {});

  const filteredOrders = payFilter==='cash'   ? orders.filter(o=>!o.paymentMethod||o.paymentMethod==='cash')
    :                    payFilter==='online'  ? orders.filter(o=>o.paymentMethod==='online')
    :                    orders;

  // ── Calendar view ─────────────────────────────────────────────────────────
  if (view === 'calendar') {
    const { offset, daysInMon } = buildCalendar();
    const todayStr = today();

    return (
      <div style={{ height:'100%', overflowY:'auto', background:'#f8f5f0', padding:'12px 16px 70px', fontFamily:"'DM Sans',sans-serif" }}>
        <h2 style={{ margin:'0 0 20px', color:'#3d1a00', fontSize:22, fontFamily:"'Playfair Display',Georgia,serif" }}>📋 History</h2>

        {/* Month navigation */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, marginBottom:16 }}>
          <button onClick={() => changeMonth(-1)}
            style={{ width:36, height:36, borderRadius:18, border:'1.5px solid #e0d5c8', background:'#fff', cursor:'pointer', fontSize:18, color:'#7a6a5a', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
          <span style={{ fontSize:18, fontWeight:700, color:'#3d1a00', minWidth:180, textAlign:'center', fontFamily:"'Playfair Display',Georgia,serif" }}>
            {MONTHS[calMonth]} {calYear}
          </span>
          <button onClick={() => changeMonth(1)}
            style={{ width:36, height:36, borderRadius:18, border:'1.5px solid #e0d5c8', background:'#fff', cursor:'pointer', fontSize:18, color:'#7a6a5a', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
        </div>

        {/* Day labels */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
          {DAY_LABELS.map((d,i) => (
            <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color: i>=5 ? '#c0504d' : '#b0a090', padding:'4px 0', letterSpacing:0.5 }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMon }, (_, i) => i + 1).map(d => {
            const key  = dayKey(d);
            const rev  = revenueMap[key];
            const isToday    = key === todayStr;
            const isSelected = key === selectedDate;
            const isWeekend  = ((d + offset - 1) % 7) >= 5;
            const today = new Date();
            today.setHours(0,0,0,0);
            const current = new Date(key);
            current.setHours(0,0,0,0);
            const isFuture = current > today;

            return (
              <div key={d} onClick={() => !isFuture && selectDate(key)}
                style={{
                  aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  borderRadius:'50%', position:'relative', transition:'background 0.15s', cursor: isFuture ? 'not-allowed' : 'pointer',
                  opacity: isFuture ? 0.4 : 1, background: isFuture ? '#f5f5f5' : isSelected ? '#3d1a00' : isToday ? '#f5c842': 'transparent',
                }}>
                <span style={{
                  fontSize:14, fontWeight: isToday||isSelected ? 700 : 400,
                  color: isSelected ? '#f5c842' : isToday ? '#3d1a00' : isWeekend ? '#c0504d' : '#3d1a00',
                }}>{d}</span>
                {rev && (
                  <span style={{
                    position:'absolute', bottom:3, fontSize:8, fontWeight:700,
                    color: isSelected ? '#f5c842' : isToday ? '#3d1a00' : '#2e7d32',
                    whiteSpace:'nowrap',
                  }}>
                    {fc(rev)}
                  </span>
                )}
                {!rev && (
                  <span style={{ position:'absolute', bottom:4, width:4, height:4 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:12, fontSize:11, color:'#b0a090' }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:14, height:14, borderRadius:7, background:'#f5c842', display:'inline-block' }}></span> Today
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ width:14, height:14, borderRadius:7, background:'#3d1a00', display:'inline-block' }}></span> Selected
          </span>
          <span style={{ color:'#2e7d32', fontWeight:700 }}>₹ = has revenue</span>
        </div>

        {/* Recent dates list */}
        <div style={{ marginTop:20 }}>
          <div style={{ fontSize:11, color:'#b0a090', fontWeight:700, letterSpacing:0.5, marginBottom:10 }}>RECENT DAYS WITH ORDERS</div>
          {summary.slice(0,5).map(d => (
            <div key={d._id} onClick={() => selectDate(d._id)}
              style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 14px', background:'#fff', borderRadius:12, marginBottom:8, border:'1px solid #e8e0d5', cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#3d2a1a' }}>{fDate(d._id + 'T00:00:00')}</div>
                <div style={{ fontSize:11, color:'#b0a090', marginTop:1 }}>{d.totalOrders} order{d.totalOrders!==1?'s':''}</div>
              </div>
              <div style={{ fontSize:15, fontWeight:800, color:'#c17f3c' }}>{fc(d.totalRevenue)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Orders view (for selected date) ──────────────────────────────────────
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#f8f5f0' }}>

      {/* Header */}
      <div style={{ background:'#fff', padding:'10px 14px', borderBottom:'1px solid #e8e0d5', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => setView('calendar')}
          style={{ width:34, height:34, borderRadius:17, border:'1.5px solid #e0d5c8', background:'transparent', cursor:'pointer', fontSize:16, color:'#7a6a5a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>‹</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif" }}>
            {fDate(selectedDate + 'T00:00:00')}
          </div>
          <div style={{ fontSize:11, color:'#b0a090', marginTop:1 }}>{orders.length} orders</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ background:'#c17f3c', color:'#fff', padding:'6px 14px', borderRadius:20, fontWeight:700, fontSize:13 }}>{fc(dayRevenue)}</div>
          <button onClick={downloadPDF} disabled={activeOrders.length===0}
            style={{ padding:'7px 12px', borderRadius:16, border:'none', cursor:activeOrders.length===0?'not-allowed':'pointer', background:activeOrders.length===0?'#ddd':'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontWeight:700, fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>
            📥 PDF
          </button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 12px 75px' }}>

        {/* Cash / Online summary */}
        <div style={{ display:'flex', gap:10, marginBottom:upiOwners.some(o=>o.upiId)?10:14 }}>
          <div style={{ flex:1, background:'#f0fff4', border:'1.5px solid #a5d6a7', borderRadius:14, padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#2e7d32', fontWeight:700, letterSpacing:0.5, marginBottom:4 }}>💵 CASH</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#2e7d32' }}>{fc(cashTotal)}</div>
            <div style={{ fontSize:11, color:'#81c784', marginTop:2 }}>{cashOrders.length} orders</div>
          </div>
          <div style={{ flex:1, background:'#f0f0ff', border:'1.5px solid #9fa8da', borderRadius:14, padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#1a237e', fontWeight:700, letterSpacing:0.5, marginBottom:4 }}>📱 ONLINE</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#1a237e' }}>{fc(onlineTotal)}</div>
            <div style={{ fontSize:11, color:'#7986cb', marginTop:2 }}>{onlineOrders.length} orders</div>
          </div>
        </div>

        {/* Per-owner online breakdown */}
        {upiOwners.filter(o=>o.upiId).length>0 && onlineOrders.length>0 && (
          <div style={{ background:'#fff', borderRadius:14, padding:'12px 16px', marginBottom:14, border:'1px solid #e8e0d5', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:11, color:'#7a6a5a', fontWeight:700, letterSpacing:0.5, marginBottom:10 }}>📱 ONLINE — BY OWNER</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {upiOwners.filter(o=>o.upiId).map(owner => {
                const color = OWNER_COLORS[owner.key] || '#7c3aed';
                const ownerOrders = onlineOrders.filter(o=>o.upiOwner===owner.key);
                const ownerTotal  = ownerOnlineTotals[owner.key] || 0;
                return (
                  <div key={owner.key} style={{ flex:1, minWidth:80, background:`${color}08`, border:`1.5px solid ${color}30`, borderRadius:12, padding:'10px 12px', textAlign:'center' }}>
                    <div style={{ fontSize:20 }}>{owner.emoji}</div>
                    <div style={{ fontSize:11, fontWeight:700, color, marginTop:3 }}>{owner.name}</div>
                    <div style={{ fontSize:16, fontWeight:800, color:'#1a237e', marginTop:4 }}>{fc(ownerTotal)}</div>
                    <div style={{ fontSize:10, color:'#9fa8da', marginTop:2 }}>{ownerOrders.length} orders</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          {[{key:'all',label:'All',emoji:'📋'},{key:'cash',label:'Cash',emoji:'💵'},{key:'online',label:'Online',emoji:'📱'}].map(tab => (
            <button key={tab.key} onClick={() => setPayFilter(tab.key)} style={{
              padding:'8px 16px', borderRadius:20, fontSize:12, fontWeight:700, border:'none', cursor:'pointer',
              fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s',
              background: payFilter===tab.key ? (tab.key==='online'?'#1a237e':tab.key==='cash'?'#2e7d32':'#c17f3c') : '#f0ebe4',
              color: payFilter===tab.key ? '#fff' : '#7a6a5a',
              boxShadow: payFilter===tab.key ? '0 3px 10px rgba(0,0,0,0.2)' : 'none',
            }}>{tab.emoji} {tab.label}</button>
          ))}
        </div>

        {/* Orders list */}
        {loadingOrders ? (
          <div style={{ textAlign:'center', paddingTop:60, color:'#c9a96e', fontSize:30 }}>⏳</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign:'center', paddingTop:60, color:'#b0a090' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🚫</div>
            <p>No {payFilter!=='all'?payFilter:''} orders on this date</p>
          </div>
        ) : filteredOrders.map(order => {
          const isOnline   = order.paymentMethod === 'online';
          const ownerColor = isOnline && order.upiOwner ? (OWNER_COLORS[order.upiOwner]||'#3949ab') : '#3949ab';
          const ownerEmoji = isOnline && order.upiOwner ? (OWNER_EMOJIS[order.upiOwner]||'📱') : '📱';
          return (
            <div key={order._id} style={{ background:'#fff', borderRadius:16, padding:'clamp(14px,3vw,18px)', marginBottom:12, boxShadow:'0 2px 10px rgba(0,0,0,0.06)', border:'1px solid #e8e0d5', borderLeft:`4px solid ${isOnline?ownerColor:'#2e7d32'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, flexWrap:'wrap', gap:8 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#3d1a00', background:'#f5c842', padding:'3px 12px', borderRadius:20 }}>#{order.billNo}</span>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20, background:isOnline?`${ownerColor}18`:'#e8f5e9', color:isOnline?ownerColor:'#2e7d32' }}>
                      {isOnline ? `${ownerEmoji} ${order.upiOwner||'Online'}` : '💵 Cash'}
                    </span>
                    {order.status==='cancelled' && <span style={{ fontSize:11, color:'#c0504d', background:'#ffe5e5', padding:'2px 8px', borderRadius:12 }}>Cancelled</span>}
                    <span style={{ fontSize:12, color:'#b0a090' }}>{fTime(order.createdAt)}</span>
                  </div>
                  {order.note && <div style={{ fontSize:11, color:'#c9a96e', marginTop:4 }}>📝 {order.note}</div>}
                </div>
              </div>

              <div>
                {order.items.map((item, idx) => (
                  <div key={idx} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13, color:'#5a4a3a', borderBottom:'1px dotted #f0ebe4' }}>
                    <span>{item.emoji} {item.name} ×{item.qty}</span>
                    <span style={{ fontWeight:600 }}>{fc(item.price*item.qty)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, paddingTop:10, borderTop:'1px dashed #e8e0d5' }}>
                <span style={{ fontSize:11, color:'#b0a090' }}>{order.items.length} item{order.items.length!==1?'s':''}</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button onClick={() => setViewOrder(order)}
                    style={{ width:34, height:34, borderRadius:10, border:'1.5px solid #9fa8da', background:'#f0f0ff', color:'#3949ab', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>👁️</button>
                  {order.status!=='cancelled' && (
                    <button onClick={() => openEdit(order)}
                      style={{ width:34, height:34, borderRadius:10, border:'1.5px solid #c17f3c', background:'#fff8ef', color:'#c17f3c', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✏️</button>
                  )}
                  <strong style={{ color:'#c17f3c', fontSize:15 }}>Total: {fc(order.total)}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── View Order Modal ── */}
      {viewOrder && (() => {
        const vo = viewOrder;
        const isOnline   = vo.paymentMethod === 'online';
        const ownerColor = isOnline && vo.upiOwner ? (OWNER_COLORS[vo.upiOwner]||'#3949ab') : '#3949ab';
        const ownerEmoji = isOnline && vo.upiOwner ? (OWNER_EMOJIS[vo.upiOwner]||'📱') : '📱';
        return (
          <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={() => setViewOrder(null)}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,0.3)', overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', background:'#3d1a00', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ color:'#f5c842', fontWeight:700, fontSize:16, fontFamily:"'Playfair Display',Georgia,serif" }}>🧾 Order Details</div>
                  <div style={{ color:'#c9a96e', fontSize:12, marginTop:2 }}>#{vo.billNo}</div>
                </div>
                <button onClick={() => setViewOrder(null)} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#f5c842', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontSize:18 }}>✕</button>
              </div>
              <div style={{ padding:'14px 20px', borderBottom:'1px solid #f0ebe4', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:isOnline?`${ownerColor}18`:'#e8f5e9', color:isOnline?ownerColor:'#2e7d32' }}>
                  {isOnline ? `${ownerEmoji} ${vo.upiOwner||'Online'}` : '💵 Cash'}
                </span>
                {vo.status==='cancelled' && <span style={{ fontSize:11, color:'#c0504d', background:'#ffe5e5', padding:'3px 10px', borderRadius:20 }}>Cancelled</span>}
                <span style={{ fontSize:12, color:'#b0a090', marginLeft:'auto' }}>{fDate(vo.createdAt)} · {fTime(vo.createdAt)}</span>
              </div>
              <div style={{ padding:'4px 20px 12px' }}>
                {vo.items.map((item, idx) => (
                  <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px dotted #f0ebe4' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:22 }}>{item.emoji}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#3d2a1a' }}>{item.name}</div>
                        <div style={{ fontSize:11, color:'#b0a090' }}>{fc(item.price)} × {item.qty}</div>
                      </div>
                    </div>
                    <span style={{ fontSize:14, fontWeight:700, color:'#3d1a00' }}>{fc(item.price*item.qty)}</span>
                  </div>
                ))}
              </div>
              {vo.note && <div style={{ margin:'0 20px 12px', background:'#fff8ef', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#c9a96e' }}>📝 {vo.note}</div>}
              <div style={{ padding:'14px 20px', background:'#faf8f5', borderTop:'2px dashed #e8e0d5', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, color:'#7a6a5a' }}>{vo.items.reduce((s,i)=>s+i.qty,0)} items</span>
                <strong style={{ fontSize:20, color:'#c17f3c' }}>Total: {fc(vo.total)}</strong>
              </div>
              {vo.status!=='cancelled' ? (
                <div style={{ padding:'12px 20px 20px', display:'flex', gap:10 }}>
                  <button onClick={() => { setViewOrder(null); openEdit(vo); }}
                    style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                    ✏️ Edit Order
                  </button>
                  <button onClick={() => setViewOrder(null)}
                    style={{ padding:'12px 20px', borderRadius:12, border:'1.5px solid #e0d5c8', background:'transparent', color:'#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Close</button>
                </div>
              ) : (
                <div style={{ padding:'12px 20px 20px' }}>
                  <button onClick={() => setViewOrder(null)} style={{ width:'100%', padding:'12px', borderRadius:12, border:'1.5px solid #e0d5c8', background:'transparent', color:'#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Close</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Edit Modal ── */}
      {editOrder && (
        <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={closeEdit}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:500, maxHeight:'90dvh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding:'16px 20px', background:'#3d1a00', borderRadius:'20px 20px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:'#f5c842', fontWeight:700, fontSize:16, fontFamily:"'Playfair Display',Georgia,serif" }}>✏️ Edit Order</div>
                <div style={{ color:'#c9a96e', fontSize:12, marginTop:2 }}>#{editOrder.billNo}</div>
              </div>
              <button onClick={closeEdit} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#f5c842', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:16 }}>
              {editItems.map((item, idx) => (
                <div key={idx} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 8px', borderBottom:'1px solid #f5efe8' }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{item.emoji}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#3d2a1a', marginBottom:4 }}>{item.name}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:11, color:'#b0a090' }}>₹</span>
                      <input type="number" value={item.price} onChange={e=>updateEditPrice(idx,e.target.value)}
                        style={{ width:48, padding:'2px 4px', borderRadius:6, border:'1px solid #e0d5c8', fontSize:10, outline:'none', fontFamily:"'DM Sans',sans-serif", color:'#c17f3c', fontWeight:700 }} />
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
                    <button onClick={()=>updateEditQty(idx,-1)} style={{ width:22,height:22,borderRadius:8,border:'1.5px solid #e0d5c8',background:'#faf8f5',cursor:'pointer',fontSize:20,fontWeight:700,color:'#c17f3c',display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
                    <span style={{ fontSize:12,fontWeight:700,minWidth:22,textAlign:'center' }}>{item.qty}</span>
                    <button onClick={()=>updateEditQty(idx,1)} style={{ width:22,height:22,borderRadius:8,border:'none',background:'#c17f3c',cursor:'pointer',fontSize:20,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
                  </div>
                  <div style={{ fontSize:12,fontWeight:700,color:'#3d1a00',textAlign:'right' }}>{fc(item.price*item.qty)}</div>
                  <button onClick={()=>removeEditItem(idx)} style={{ width:22,height:22,borderRadius:8,border:'1px solid #f0d0d0',background:'transparent',color:'#c0504d',cursor:'pointer',fontSize:20,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>×</button>
                </div>
              ))}

              <button onClick={()=>setShowAddItem(v=>!v)} style={{ width:'100%',marginTop:12,padding:'10px',borderRadius:12,border:'2px dashed #c17f3c',background:'#fff8ef',color:'#c17f3c',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                {showAddItem ? '✕ Cancel' : '➕ Add Item'}
              </button>

              {showAddItem && (
                <div style={{ marginTop:10,border:'1px solid #e8e0d5',borderRadius:14,overflow:'hidden',maxHeight:240,overflowY:'auto' }}>
                  {allProducts.filter(p=>p.active).map(p => (
                    <button key={p._id} onClick={()=>addProductToEdit(p)} style={{ width:'100%',padding:'10px 14px',border:'none',borderBottom:'1px solid #f5efe8',background:'#fff',textAlign:'left',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:"'DM Sans',sans-serif" }}
                      onMouseEnter={e=>e.currentTarget.style.background='#fff8ef'}
                      onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                      <span style={{ fontSize:13 }}>{p.emoji} {p.name}</span>
                      <span style={{ fontSize:13,fontWeight:700,color:'#c17f3c' }}>{fc(p.price)}</span>
                    </button>
                  ))}
                </div>
              )}

              <div style={{ marginTop:12 }}>
                <label style={{ fontSize:11,color:'#7a6a5a',display:'block',marginBottom:8,fontWeight:600 }}>PAYMENT METHOD</label>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>{setEditPayMethod('cash');setEditUpiOwner('');}} style={{ flex:1,padding:'11px 8px',borderRadius:12,cursor:'pointer',border:`2px solid ${editPayMethod==='cash'?'#2e7d32':'#e0d5c8'}`,background:editPayMethod==='cash'?'#f0fff4':'#faf8f5',color:editPayMethod==='cash'?'#2e7d32':'#7a6a5a',fontWeight:700,fontSize:14,fontFamily:"'DM Sans',sans-serif",transition:'all 0.2s' }}>💵 Cash</button>
                  <button onClick={()=>setEditPayMethod('online')} style={{ flex:1,padding:'11px 8px',borderRadius:12,cursor:'pointer',border:`2px solid ${editPayMethod==='online'?'#1a237e':'#e0d5c8'}`,background:editPayMethod==='online'?'#f0f0ff':'#faf8f5',color:editPayMethod==='online'?'#1a237e':'#7a6a5a',fontWeight:700,fontSize:14,fontFamily:"'DM Sans',sans-serif",transition:'all 0.2s' }}>📱 Online</button>
                </div>
              </div>

              {editPayMethod==='online' && upiOwners.filter(o=>o.upiId).length>0 && (
                <div style={{ marginTop:12 }}>
                  <label style={{ fontSize:11,color:'#7a6a5a',display:'block',marginBottom:8,fontWeight:600 }}>UPI OWNER (who received?)</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {upiOwners.filter(o=>o.upiId).map(owner => {
                      const color = OWNER_COLORS[owner.key] || '#7c3aed';
                      return (
                        <button key={owner.key} onClick={()=>setEditUpiOwner(owner.key)} style={{ flex:1,minWidth:70,padding:'10px 6px',borderRadius:12,cursor:'pointer',border:`2px solid ${editUpiOwner===owner.key?color:'#e0d5c8'}`,background:editUpiOwner===owner.key?`${color}15`:'#faf8f5',color:editUpiOwner===owner.key?color:'#7a6a5a',fontWeight:700,fontSize:13,fontFamily:"'DM Sans',sans-serif",textAlign:'center',transition:'all 0.2s' }}>
                          <div style={{ fontSize:18 }}>{owner.emoji}</div>
                          <div style={{ marginTop:2 }}>{owner.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                <button onClick={saveEdit} disabled={saving||!editItems.length} style={{ flex:1,padding:'12px',borderRadius:12,border:'none',background:saving?'#888':'linear-gradient(135deg,#c17f3c,#e8a045)',color:'#fff',fontSize:14,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:"'DM Sans',sans-serif" }}>
                  {saving ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
                <button onClick={closeEdit} style={{ padding:'14px 20px',borderRadius:12,border:'1.5px solid #e0d5c8',background:'transparent',color:'#7a6a5a',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:600 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}