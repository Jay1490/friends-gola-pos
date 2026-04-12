import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { expensesAPI, ordersAPI, settingsAPI, withdrawalsAPI } from '../services/api';

const fc = (n) => `₹${Number(n).toFixed(0)}`;
const CATS      = ['Colours', 'Toppings', 'Baraf', 'Other'];
const CAT_EMOJI = { Colours:'🎨', Toppings:'🧁', Baraf:'🧊', Other:'📦' };
const CAT_COLOR = { Colours:'#e91e63', Toppings:'#ff9800', Baraf:'#2196f3', Other:'#607d8b' };
const PAYERS = ['JP', 'Jenish', 'Urvish'];       // only real people
const ALL_PAYERS = ['JP', 'Jenish', 'Urvish', 'CashBox']; // for expenses only
const PAYER_EMOJI = { JP:'👦🏻', Jenish:'🧔🏻‍♂️', Urvish:'👨🏻', CashBox:'💰' };
const PAYER_COLOR = { JP:'#7c3aed', Jenish:'#0891b2', Urvish:'#059669', CashBox:'#f59e0b' };
const PAGE_SIZE = 10;

const todayIST = () => {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return istNow.toISOString().split('T')[0];
};

function StatCard({ emoji, label, value, color, sub }) {
  return (
    <div style={{ background:'#fff', borderRadius:16, padding:'16px 18px', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5', flex:1, minWidth:120 }}>
      <div style={{ fontSize:24, marginBottom:6 }}>{emoji}</div>
      <div style={{ fontSize:10, color:'#b0a090', fontWeight:600, letterSpacing:0.5, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:19, fontWeight:800, color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#b0a090', marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function ExpenseRow({ expense, onEdit, onDelete }) {
  const payer = expense.paidBy || 'JP';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 8px', borderBottom:'1px solid #f5efe8' }}>
      <div style={{ width:34, height:34, borderRadius:10, background: CAT_COLOR[expense.category] + '20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
        {CAT_EMOJI[expense.category]}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#3d2a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{expense.title}</div>
        <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:2, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, background: CAT_COLOR[expense.category] + '20', color: CAT_COLOR[expense.category], padding:'1px 7px', borderRadius:10, fontWeight:700 }}>{expense.category}</span>
          <span style={{ fontSize:10, background: PAYER_COLOR[payer] + '18', color: PAYER_COLOR[payer], padding:'1px 7px', borderRadius:10, fontWeight:700 }}>
            {PAYER_EMOJI[payer]} {payer}
          </span>
          <span style={{ fontSize:11, color:'#b0a090' }}>{expense.date}</span>
          {expense.note && <span style={{ fontSize:11, color:'#c9a96e' }}>· {expense.note}</span>}
        </div>
      </div>
      <div style={{ fontWeight:800, color:'#c0504d', fontSize:13, flexShrink:0 }}>-{fc(expense.amount)}</div>
      <div style={{ display:'flex', gap:5, flexShrink:0 }}>
        <button onClick={() => onEdit(expense)} style={{ width:28, height:28, borderRadius:8, border:'1px solid #e0d5c8', background:'#fff8ef', cursor:'pointer', fontSize:13, color:'#c17f3c' }}>✏️</button>
        <button onClick={() => onDelete(expense._id)} style={{ width:28, height:28, borderRadius:8, border:'1px solid #f0d0d0', background:'transparent', cursor:'pointer', fontSize:14, color:'#c0504d', fontWeight:700, lineHeight:1 }}>×</button>
      </div>
    </div>
  );
}

// ── Section Hub Card ──────────────────────────────────────────────────────────
function SectionCard({ emoji, title, subtitle, color, borderColor, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:16,
        padding:'20px 20px', borderRadius:18,
        border:`2px solid ${hovered ? borderColor : '#e8e0d5'}`,
        background: hovered ? color : '#fff',
        cursor:'pointer', textAlign:'left', fontFamily:"'DM Sans',sans-serif",
        boxShadow: hovered ? `0 6px 24px ${borderColor}30` : '0 2px 10px rgba(0,0,0,0.05)',
        transition:'all 0.2s',
      }}
    >
      <div style={{
        width:52, height:52, borderRadius:14, flexShrink:0,
        background: hovered ? '#fff' : color,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:26, boxShadow:`0 2px 10px ${borderColor}30`,
        transition:'all 0.2s',
      }}>
        {emoji}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:16, fontWeight:800, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif" }}>{title}</div>
        <div style={{ fontSize:12, color:'#b0a090', marginTop:3 }}>{subtitle}</div>
      </div>
      <div style={{ fontSize:20, color: hovered ? borderColor : '#d0c8c0', transition:'all 0.2s' }}>›</div>
    </button>
  );
}

// ── Back Button ───────────────────────────────────────────────────────────────
function BackButton({ onBack, title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
      <button onClick={onBack} style={{
        width:36, height:36, borderRadius:10, border:'1.5px solid #e0d5c8',
        background:'#fff', cursor:'pointer', display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:18, color:'#7a6a5a', flexShrink:0,
        boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
      }}>‹</button>
      <h2 style={{ margin:0, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif", fontSize:'clamp(16px,4vw,22px)' }}>{title}</h2>
    </div>
  );
}

// ── Pagination Controls ───────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  // Build page list: first, last, current ±1, with ellipsis gaps
  const toShow = new Set([1, totalPages, page, page - 1, page + 1].filter(p => p >= 1 && p <= totalPages));
  const sorted = [...toShow].sort((a, b) => a - b);
  const pages = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) pages.push('...');
    pages.push(sorted[i]);
  }

  const navBtn = (label, target, disabled) => (
    <button
      key={label}
      onClick={() => !disabled && onPage(target)}
      disabled={disabled}
      style={{
        width:34, height:34, borderRadius:9, border:'1px solid #e0d5c8',
        background: disabled ? '#f8f5f0' : '#fff',
        color: disabled ? '#d0c8c0' : '#5a4a3a',
        fontWeight:600, fontSize:16, cursor: disabled ? 'default' : 'pointer',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: disabled ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
        fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s',
      }}>
      {label}
    </button>
  );

  const pageBtn = (p) => (
    <button
      key={p}
      onClick={() => onPage(p)}
      style={{
        minWidth:34, height:34, borderRadius:9, border:'none', padding:'0 6px',
        background: p === page ? '#c17f3c' : '#fff',
        color: p === page ? '#fff' : '#5a4a3a',
        fontWeight: p === page ? 700 : 500, fontSize:13, cursor:'pointer',
        boxShadow: p === page ? '0 2px 8px rgba(193,127,60,0.4)' : '0 1px 4px rgba(0,0,0,0.08)',
        border: p === page ? 'none' : '1px solid #e0d5c8',
        fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s',
      }}>
      {p}
    </button>
  );

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'14px 8px 8px', flexWrap:'wrap' }}>
      {navBtn('‹', page - 1, page === 1)}
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`e${i}`} style={{ color:'#b0a090', fontSize:13, lineHeight:'34px' }}>…</span>
          : pageBtn(p)
      )}
      {navBtn('›', page + 1, page === totalPages)}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeSection, setActiveSection] = useState(null);

  const [orders,      setOrders]      = useState([]);
  const [upiOwners,   setUpiOwners]   = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading,     setLoading]     = useState(true);

  const [expenses,        setExpenses]        = useState([]);
  const [expensesLoaded,  setExpensesLoaded]  = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);

  // Pagination state
  const [expPage, setExpPage] = useState(1);

  const [showExpForm,  setShowExpForm]  = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);
  const [fTitle,    setFTitle]    = useState('');
  const [fAmount,   setFAmount]   = useState('');
  const [fCategory, setFCategory] = useState('Colours');
  const [fNote,     setFNote]     = useState('');
  const [fDate,     setFDate]     = useState(() => todayIST());
  const [fPaidBy,   setFPaidBy]   = useState('JP');
  const [savingExp, setSavingExp] = useState(false);

  const [cashInputs,    setCashInputs]    = useState({ JP:'', Jenish:'', Urvish:'' });
  const [cashNotes,     setCashNotes]     = useState({ JP:'', Jenish:'', Urvish:'' });
  const [savingCash,    setSavingCash]    = useState({ JP:false, Jenish:false, Urvish:false });
  const [expandedOwner, setExpandedOwner] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [oRes, setRes, wRes] = await Promise.all([
          ordersAPI.getAll({ limit: 10000 }),
          settingsAPI.getPublic(),
          withdrawalsAPI.getAll({}),
        ]);
        setOrders(oRes.data.data);
        setUpiOwners(setRes.data.data?.upiOwners || []);
        setWithdrawals(wRes.data.data);
      } catch { toast.error('Failed to load dashboard'); }
      finally  { setLoading(false); }
    })();
  }, []);

  const loadExpenses = async () => {
    setExpensesLoading(true);
    try {
      const res = await expensesAPI.getAll({});
      setExpenses(res.data.data);
      setExpensesLoaded(true);
      setExpPage(1);
    } catch { toast.error('Failed to load expenses'); }
    finally  { setExpensesLoading(false); }
  };

  useEffect(() => {
    if (activeSection === 'expenses' && !expensesLoaded) {
      loadExpenses();
    }
  }, [activeSection]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const activeOrders  = orders.filter(o => o.status !== 'cancelled');
  const cashOrders    = activeOrders.filter(o => !o.paymentMethod || o.paymentMethod === 'cash');
  const onlineOrders  = activeOrders.filter(o => o.paymentMethod === 'online');
  const totalIncome   = activeOrders.reduce((s, o) => s + o.total, 0);
  const cashIncome    = cashOrders.reduce((s, o) => s + o.total, 0);
  const onlineIncome  = onlineOrders.reduce((s, o) => s + o.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalProfit   = totalIncome - totalExpenses;

  const ownerOnlineIncome = upiOwners.reduce((acc, owner) => {
    const ownerOrders = onlineOrders.filter(o => o.upiOwner === owner.key);
    acc[owner.key] = { total: ownerOrders.reduce((s,o) => s+o.total, 0), count: ownerOrders.length };
    return acc;
  }, {});

  const wByPerson = PAYERS.reduce((acc, p) => {
    acc[p] = withdrawals.filter(w => w.person === p).reduce((s,w) => s+w.amount, 0);
    return acc;
  }, {});
  const totalWithdrawn = Object.values(wByPerson).reduce((s,v) => s+v, 0);
  const cashRemaining  = cashIncome - totalWithdrawn;

  const perPersonTotal = PAYERS.reduce((acc, p) => {
    const upi  = ownerOnlineIncome[p]?.total || 0;
    const cash = wByPerson[p] || 0;
    acc[p] = { upi, cash, total: upi + cash };
    return acc;
  }, {});

  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount; return acc;
  }, {});
  const payerTotals = ALL_PAYERS.reduce((acc, p) => {
    acc[p] = expenses.filter(e => (e.paidBy||'JP') === p).reduce((s,e) => s+e.amount, 0); return acc;
  }, {});

  // Pagination slice
  const totalPages    = Math.ceil(expenses.length / PAGE_SIZE);
  const pagedExpenses = expenses.slice((expPage - 1) * PAGE_SIZE, expPage * PAGE_SIZE);

  const recordWithdrawal = async (person) => {
    const amt = parseFloat(cashInputs[person]);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (cashRemaining - amt < 0) return toast.error(`❌ Exceeds cash balance of ${fc(cashRemaining)}`);
    setSavingCash(p => ({ ...p, [person]: true }));
    try {
      await withdrawalsAPI.create({ person, amount: amt, note: cashNotes[person] || '', date: todayIST() });
      setCashInputs(p => ({ ...p, [person]: '' }));
      setCashNotes(p => ({ ...p, [person]: '' }));
      toast.success(`✅ ${person} received ${fc(amt)}`);
      const wRes = await withdrawalsAPI.getAll({});
      setWithdrawals(wRes.data.data);
    } catch { toast.error('Failed'); }
    finally { setSavingCash(p => ({ ...p, [person]: false })); }
  };

  const deleteWithdrawal = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await withdrawalsAPI.delete(id);
      toast.success('Deleted');
      const wRes = await withdrawalsAPI.getAll({});
      setWithdrawals(wRes.data.data);
    } catch { toast.error('Failed'); }
  };

  const resetExpForm = () => {
    setFTitle(''); setFAmount(''); setFCategory('Colours');
    setFNote(''); setFDate(todayIST()); setFPaidBy('JP');
    setEditingExpId(null); setShowExpForm(false);
  };

  const openEditExp = (exp) => {
    setFTitle(exp.title); setFAmount(String(exp.amount));
    setFCategory(exp.category); setFNote(exp.note || '');
    setFDate(exp.date); setFPaidBy(exp.paidBy || 'JP');
    setEditingExpId(exp._id);
    setShowExpForm(true);
    setTimeout(() => document.getElementById('exp-title-input')?.focus(), 100);
  };

  const openAddExp = () => {
    resetExpForm();
    setShowExpForm(true);
    setTimeout(() => document.getElementById('exp-title-input')?.focus(), 100);
  };

  const saveExpense = async () => {
    if (!fTitle.trim()) return toast.error('Title is required');
    if (!fAmount || isNaN(fAmount) || Number(fAmount) <= 0) return toast.error('Enter a valid amount');
    setSavingExp(true);
    try {
      const payload = { title:fTitle, amount:Number(fAmount), category:fCategory, note:fNote, date:fDate, paidBy:fPaidBy };
      if (editingExpId) { await expensesAPI.update(editingExpId, payload); toast.success('✅ Updated!'); }
      else              { await expensesAPI.create(payload); toast.success('✅ Added!'); }
      resetExpForm();
      const res = await expensesAPI.getAll({});
      setExpenses(res.data.data); setExpensesLoaded(true);
      setExpPage(1);
    } catch { toast.error('Failed to save'); }
    finally { setSavingExp(false); }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expensesAPI.delete(id); toast.success('Deleted');
      const res = await expensesAPI.getAll({});
      setExpenses(res.data.data);
      setExpPage(p => {
        const newTotal = Math.ceil(res.data.data.length / PAGE_SIZE);
        return p > newTotal ? Math.max(1, newTotal) : p;
      });
    } catch { toast.error('Failed'); }
  };

  const exportCSV = () => {
    if (!expenses.length) return toast.error('No expenses to export');
    const headers = ['Date','Title','Category','Paid By','Amount (₹)','Note'];
    const rows = expenses.map(e => [e.date, `"${e.title.replace(/"/g,'""')}"`, e.category, e.paidBy||'JP', e.amount, `"${(e.note||'').replace(/"/g,'""')}"`]);
    const csv = [headers,...rows].map(r=>r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download:'expenses-all-time.csv' });
    a.click(); URL.revokeObjectURL(a.href);
    toast.success(`✅ Exported ${expenses.length} expenses`);
  };

  const inputStyle = { width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e0d5c8', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:"'DM Sans',sans-serif", color:'#3d1a00', background:'#fff' };

  // ── HUB VIEW ─────────────────────────────────────────────────────────────
  if (!activeSection) {
    return (
      <div style={{ height:'100%', overflowY:'auto', background:'#f8f5f0', padding:'clamp(16px,4vw,24px)', fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ marginBottom:24 }}>
          <h2 style={{ margin:0, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif", fontSize:'clamp(20px,5vw,28px)' }}>📊 Dashboard</h2>
          <p style={{ margin:'4px 0 0', color:'#b0a090', fontSize:13 }}>Select a section to view details</p>
        </div>
        {loading ? (
          <div style={{ textAlign:'center', paddingTop:60, color:'#c9a96e', fontSize:36 }}>⏳</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:560 }}>
            <SectionCard emoji="💰" title="Statements" subtitle="Income, online, cash & net profit" color="#f0fff4" borderColor="#4caf50" onClick={() => setActiveSection('statements')} />
            <SectionCard emoji="🏧" title="Cash withdrawal" subtitle="Per person — total, online & cash" color="#fff8ef" borderColor="#c17f3c" onClick={() => setActiveSection('cash')} />
            <SectionCard emoji="📤" title="Expenses" subtitle="All expenses with pagination" color="#fff0f0" borderColor="#e91e63" onClick={() => setActiveSection('expenses')} />
          </div>
        )}
      </div>
    );
  }

  // ── STATEMENTS SECTION ────────────────────────────────────────────────────
  if (activeSection === 'statements') {
    return (
      <div style={{ height:'100%', overflowY:'auto', background:'#f8f5f0', padding:'12px 12px 70px', fontFamily:"'DM Sans',sans-serif" }}>
        <BackButton onBack={() => setActiveSection(null)} title="📊 Statements" />
        {loading ? (
          <div style={{ textAlign:'center', paddingTop:60, color:'#c9a96e', fontSize:36 }}>⏳</div>
        ) : (<>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:14 }}>
            <StatCard emoji="💰" label="TOTAL INCOME"  value={fc(totalIncome)}  color="#2e7d32" sub={`${activeOrders.length} orders`} />
            <StatCard emoji="💵" label="CASH INCOME"   value={fc(cashIncome)}   color="#c17f3c" sub={`${cashOrders.length} orders`} />
            <StatCard emoji="📱" label="ONLINE INCOME" value={fc(onlineIncome)} color="#1a237e" sub={`${onlineOrders.length} orders`} />
            {expensesLoaded && (
              <StatCard emoji="📉" label="NET PROFIT" value={fc(totalProfit)} color={totalProfit >= 0 ? '#2e7d32' : '#c0504d'} sub="after expenses" />
            )}
          </div>

          <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5', marginBottom:14, overflow:'hidden' }}>
            <div style={{ padding:'13px 18px', background:'linear-gradient(135deg,#f5f0e8,#fffbf5)', borderBottom:'1px solid #f0ebe4' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif" }}>👥 Income Per Person</div>
              <div style={{ fontSize:11, color:'#b0a090', marginTop:2 }}>📱 UPI received + 💵 Cash withdrawn</div>
            </div>
            <div style={{ padding:'14px 16px', display:'flex', gap:10, flexWrap:'wrap' }}>
              {PAYERS.map(p => {
                const color = PAYER_COLOR[p];
                const data  = perPersonTotal[p];
                const pct   = totalIncome > 0 ? Math.round((data.total / totalIncome) * 100) : 0;
                return (
                  <div key={p} style={{ flex:1, minWidth:100, background:`${color}08`, border:`2px solid ${color}30`, borderRadius:16, padding:'14px 12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                      <div style={{ width:30, height:30, borderRadius:10, background:`${color}20`, border:`2px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{PAYER_EMOJI[p]}</div>
                      <div style={{ fontSize:13, fontWeight:800, color }}>{p}</div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5, padding:'4px 8px', background:'#f0f0ff', borderRadius:8 }}>
                      <span style={{ fontSize:10, color:'#5c6bc0', fontWeight:600 }}>📱</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'#1a237e' }}>{fc(data.upi)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, padding:'4px 8px', background:'#f0fff4', borderRadius:8 }}>
                      <span style={{ fontSize:10, color:'#388e3c', fontWeight:600 }}>💵</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'#2e7d32' }}>{fc(data.cash)}</span>
                    </div>
                    <div style={{ borderTop:`1px dashed ${color}40`, paddingTop:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:12, color:'#7a6a5a', fontWeight:600 }}>∑</span>
                        <span style={{ fontSize:16, fontWeight:900, color }}>{fc(data.total)}</span>
                      </div>
                      <div style={{ height:3, background:`${color}20`, borderRadius:3, margin:'7px 0 4px' }}>
                        <div style={{ height:'100%', background:color, borderRadius:3, width:`${pct}%`, transition:'width 0.5s' }}/>
                      </div>
                      <div style={{ fontSize:10, color:'#b0a090', textAlign:'right' }}>{pct}% of total</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {upiOwners.filter(o => o.upiId).length > 0 && (
            <div style={{ background:'#fff', borderRadius:16, padding:'14px 16px', marginBottom:14, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5' }}>
              <div style={{ fontSize:11, color:'#7a6a5a', fontWeight:700, letterSpacing:0.8, marginBottom:12 }}>📱 ONLINE — BY UPI OWNER</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {upiOwners.filter(o => o.upiId).map(owner => {
                  const color = PAYER_COLOR[owner.key] || '#7c3aed';
                  const info  = ownerOnlineIncome[owner.key] || { total:0, count:0 };
                  const pct   = onlineIncome > 0 ? Math.round((info.total / onlineIncome) * 100) : 0;
                  return (
                    <div key={owner.key} style={{ flex:1, minWidth:90, background:`${color}08`, border:`2px solid ${color}80`, borderRadius:14, padding:'12px', textAlign:'center' }}>
                      <div style={{ fontSize:24, marginBottom:4 }}>{owner.emoji}</div>
                      <div style={{ fontSize:12, fontWeight:800, color }}>{owner.name}</div>
                      <div style={{ fontSize:17, fontWeight:900, color:'#1a237e', marginTop:4 }}>{fc(info.total)}</div>
                      <div style={{ fontSize:10, color:'#9fa8da', marginTop:2 }}>{info.count} orders</div>
                      {onlineIncome > 0 && (<>
                        <div style={{ height:4, background:`${color}20`, borderRadius:4, margin:'8px 0 3px' }}>
                          <div style={{ height:'100%', background:color, borderRadius:4, width:`${pct}%`, transition:'width 0.5s' }}/>
                        </div>
                        <div style={{ fontSize:10, color, fontWeight:700 }}>{pct}%</div>
                      </>)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>)}
      </div>
    );
  }

  // ── CASH WITHDRAWAL SECTION ───────────────────────────────────────────────
  if (activeSection === 'cash') {
    return (
      <div style={{ height:'100%', overflowY:'auto', background:'#f8f5f0', padding:'clamp(12px,3vw,20px)', fontFamily:"'DM Sans',sans-serif" }}>
        <BackButton onBack={() => setActiveSection(null)} title="💵 Cash Withdrawal" />
        {loading ? (
          <div style={{ textAlign:'center', paddingTop:60, color:'#c9a96e', fontSize:36 }}>⏳</div>
        ) : (
          <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5', marginBottom:14, overflow:'hidden' }}>
            <div style={{ padding:'13px 18px', background:'linear-gradient(135deg,#f5f0e8,#fffbf5)', borderBottom:'1px solid #f0ebe4' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#3d1a00', fontFamily:"'Playfair Display',Georgia,serif" }}>💵 Cash to Owner</div>
              <div style={{ fontSize:11, color:'#b0a090', marginTop:2 }}>
                Box: <strong style={{ color:'#2e7d32' }}>{fc(cashIncome)}</strong>
                {' · '}Distributed: <strong style={{ color:'#c17f3c' }}>{fc(totalWithdrawn)}</strong>
                {' · '}Left: <strong style={{ color: cashRemaining >= 0 ? '#2e7d32' : '#c0504d' }}>{fc(cashRemaining)}</strong>
              </div>
            </div>
            {cashIncome > 0 && (
              <div style={{ padding:'12px 18px 4px' }}>
                <div style={{ height:6, background:'#f0ebe4', borderRadius:6, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:6, background:'linear-gradient(90deg,#c17f3c,#e8a045)', width:`${Math.min(100,(totalWithdrawn/cashIncome)*100)}%`, transition:'width 0.5s' }}/>
                </div>
                <div style={{ fontSize:10, color:'#b0a090', marginTop:3, marginBottom:8 }}>
                  {Math.round((totalWithdrawn/cashIncome)*100)}% distributed
                </div>
              </div>
            )}
            <div style={{ padding:'0 14px 16px', display:'flex', flexDirection:'column', gap:12 }}>
              {PAYERS.map(person => {
                const color      = PAYER_COLOR[person];
                const withdrawn  = wByPerson[person] || 0;
                const myHistory  = withdrawals.filter(w => w.person === person).sort((a,b) => b.date.localeCompare(a.date));
                const isExpanded = expandedOwner === person;
                const isSaving   = savingCash[person];
                return (
                  <div key={person} style={{ background:`${color}08`, border:`2px solid ${color}30`, borderRadius:16, overflow:'hidden' }}>
                    <div style={{ padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                        <div style={{ width:40, height:40, borderRadius:12, background:`${color}20`, border:`2px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{PAYER_EMOJI[person]}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:800, color:'#3d1a00' }}>{person}</div>
                          <div style={{ fontSize:11, color:'#b0a090', marginTop:1 }}>Received: <span style={{ fontWeight:700, color }}>{fc(withdrawn)}</span></div>
                        </div>
                        {myHistory.length > 0 && (
                          <button onClick={() => setExpandedOwner(isExpanded ? null : person)}
                            style={{ padding:'5px 10px', borderRadius:8, border:`1px solid ${color}40`, background: isExpanded ? `${color}15` : 'transparent', color, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
                            {isExpanded ? '▲' : `▼ ${myHistory.length}`}
                          </button>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                          <div style={{ display:'flex', alignItems:'center', background:'#fff', border:`1.5px solid ${color}40`, borderRadius:10, overflow:'hidden' }}>
                            <span style={{ color:'#c9a96e', fontSize:14, padding:'0 10px', fontWeight:700, borderRight:`1px solid ${color}20` }}>₹</span>
                            <input type="number" value={cashInputs[person]} onChange={e => setCashInputs(p => ({ ...p, [person]: e.target.value }))} placeholder="Amount..."
                              style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#3d1a00', fontSize:14, fontFamily:"'DM Sans',sans-serif", padding:'10px' }} />
                          </div>
                          <input type="text" value={cashNotes[person]} onChange={e => setCashNotes(p => ({ ...p, [person]: e.target.value }))} placeholder="Note (optional)"
                            style={{ background:'#fff', border:`1.5px solid ${color}30`, borderRadius:10, outline:'none', color:'#7a6a5a', fontSize:12, fontFamily:"'DM Sans',sans-serif", padding:'8px 12px' }} />
                        </div>
                        <button onClick={() => recordWithdrawal(person)} disabled={isSaving || !cashInputs[person]}
                          style={{ width:54, borderRadius:12, border:'none', flexShrink:0, background: isSaving || !cashInputs[person] ? '#e0d5c8' : `linear-gradient(135deg,${color},${color}cc)`, color: isSaving || !cashInputs[person] ? '#b0a090' : '#fff', fontSize:22, cursor: isSaving || !cashInputs[person] ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: cashInputs[person] ? `0 4px 14px ${color}40` : 'none', transition:'all 0.2s' }}>
                          {isSaving ? '⏳' : '✓'}
                        </button>
                      </div>
                    </div>
                    {isExpanded && myHistory.length > 0 && (
                      <div style={{ borderTop:`1px solid ${color}20`, background:`${color}05` }}>
                        <div style={{ padding:'8px 16px 4px', fontSize:10, fontWeight:700, color, letterSpacing:0.8 }}>HISTORY</div>
                        {myHistory.map(w => (
                          <div key={w._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px', borderBottom:`1px solid ${color}10` }}>
                            <div style={{ width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }}/>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:12, fontWeight:600, color:'#3d2a1a' }}>{fc(w.amount)}{w.note && <span style={{ color:'#b0a090', fontWeight:400 }}> · {w.note}</span>}</div>
                              <div style={{ fontSize:10, color:'#b0a090', marginTop:1 }}>{w.date}</div>
                            </div>
                            <button onClick={() => deleteWithdrawal(w._id)} style={{ width:22, height:22, borderRadius:6, border:'1px solid #f0d0d0', background:'transparent', color:'#c0504d', cursor:'pointer', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                          </div>
                        ))}
                        <div style={{ padding:'8px 16px', display:'flex', justifyContent:'flex-end' }}>
                          <span style={{ fontSize:11, fontWeight:700, color }}>Total: {fc(withdrawn)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── EXPENSES SECTION ──────────────────────────────────────────────────────
  if (activeSection === 'expenses') {
    return (
      <div style={{ height:'100%', overflowY:'auto', background:'#f8f5f0', padding:'clamp(12px,3vw,20px)', fontFamily:"'DM Sans',sans-serif" }}>
        <BackButton onBack={() => setActiveSection(null)} title="💸 Expenses" />

        <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #e8e0d5', marginBottom:80, overflow:'hidden' }}>

          {/* Header */}
          <div style={{ padding:'13px 16px', borderBottom:'1px solid #e8e0d5', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <div>
              <span style={{ fontSize:14, fontWeight:700, color:'#3d1a00' }}>💸 Expenses</span>
              {/* {expensesLoaded && (
                <span style={{ fontSize:11, color:'#b0a090', marginLeft:8 }}>
                  {expenses.length} total · <span style={{ color:'#c0504d', fontWeight:700 }}>{fc(totalExpenses)}</span>
                </span>
              )} */}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {expensesLoaded && (<>
                <button onClick={exportCSV} style={{ padding:'7px 12px', borderRadius:10, border:'1.5px solid #4caf50', background:'#f0fff0', color:'#2e7d32', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>📥</button>
                <button onClick={openAddExp} style={{ padding:'7px 12px', borderRadius:10, border:'1.5px solid #c17f3c', background:'#fff8ef', color:'#c17f3c', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>➕</button>
              </>)}
              <button onClick={loadExpenses} disabled={expensesLoading}
                style={{ padding:'7px 14px', borderRadius:10, border:'none', cursor: expensesLoading ? 'not-allowed' : 'pointer', background: expensesLoading ? '#e0d5c8' : expensesLoaded ? '#f5f0e8' : 'linear-gradient(135deg,#c17f3c,#e8a045)', color: expensesLoading ? '#b0a090' : expensesLoaded ? '#c17f3c' : '#fff', fontWeight:700, fontSize:12, fontFamily:"'DM Sans',sans-serif", transition:'all 0.2s' }}>
                {expensesLoading ? '⏳' : expensesLoaded ? '🔄' : '📂 Load Expenses'}
              </button>
            </div>
          </div>

          {/* Profit bar — always visible */}
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0ebe4' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:700, color:'#3d1a00' }}>📈 Profit Margin</span>
              <span style={{ fontSize:12, fontWeight:800, color: totalProfit >= 0 ? '#2e7d32' : '#c0504d' }}>
                {totalIncome > 0 ? `${Math.round((totalProfit / totalIncome) * 100)}%` : '—'}
              </span>
            </div>
            <div style={{ height:7, background:'#f0ebe4', borderRadius:10, overflow:'hidden', marginBottom:6 }}>
              <div style={{
                height:'100%', borderRadius:10, transition:'width 0.6s',
                background: totalProfit >= 0
                  ? 'linear-gradient(90deg,#43a047,#66bb6a)'
                  : 'linear-gradient(90deg,#e53935,#ef5350)',
                width: totalIncome > 0 ? `${Math.min(100, Math.abs(totalProfit / totalIncome) * 100)}%` : '0%',
              }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#b0a090' }}>
              <span>Expenses: <strong style={{ color:'#c0504d' }}>{fc(totalExpenses)}</strong></span>
              <span>Profit: <strong style={{ color: totalProfit >= 0 ? '#2e7d32' : '#c0504d' }}>{fc(totalProfit)}</strong></span>
            </div>
          </div>

          {/* Not loaded */}
          {!expensesLoaded && !expensesLoading && (
            <div style={{ textAlign:'center', padding:'36px 20px', color:'#b0a090' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>💸</div>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:'#7a6a5a' }}>Expenses not loaded</p>
              <p style={{ margin:'6px 0 16px', fontSize:12 }}>Tap to load expenses & profit analysis</p>
              <button onClick={loadExpenses} style={{ padding:'11px 24px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:'0 4px 14px rgba(193,127,60,0.35)' }}>
                📂 Load Expenses
              </button>
            </div>
          )}

          {expensesLoading && (
            <div style={{ textAlign:'center', padding:'36px 20px', color:'#c9a96e', fontSize:30 }}>⏳</div>
          )}

          {expensesLoaded && !expensesLoading && (<>

            {/* Paid by */}
            {expenses.length > 0 && (
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0ebe4' }}>
                <div style={{ fontSize:10, color:'#b0a090', fontWeight:700, letterSpacing:0.8, marginBottom:10 }}>PAID BY</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {ALL_PAYERS.map(p => (
                    <div key={p} style={{ flex:1, minWidth:80, padding:'10px', borderRadius:12, border:`1.5px solid ${PAYER_COLOR[p]}30`, background: PAYER_COLOR[p]+'10', textAlign:'center' }}>
                      <div style={{ fontSize:18 }}>{PAYER_EMOJI[p]}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:'#3d1a00', marginTop:3 }}>{p}</div>
                      <div style={{ fontSize:13, fontWeight:800, color: PAYER_COLOR[p], marginTop:2 }}>{fc(payerTotals[p])}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By category */}
            {Object.keys(byCategory).length > 0 && (
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0ebe4' }}>
                <div style={{ fontSize:10, color:'#b0a090', fontWeight:700, letterSpacing:0.8, marginBottom:10 }}>BY CATEGORY</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {Object.entries(byCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => {
                    const pct = Math.round((amt / totalExpenses) * 100);
                    return (
                      <div key={cat}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3, fontSize:12 }}>
                          <span>{CAT_EMOJI[cat]} {cat}</span>
                          <span style={{ fontWeight:700, color:'#c0504d' }}>{fc(amt)} <span style={{ color:'#b0a090', fontWeight:400 }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height:5, background:'#f0ebe4', borderRadius:5 }}>
                          <div style={{ height:'100%', borderRadius:5, background: CAT_COLOR[cat], width:`${pct}%`, transition:'width 0.5s' }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expense list with pagination */}
            {expenses.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 20px', color:'#b0a090' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>💸</div>
                <p style={{ margin:0, fontSize:13 }}>No expenses yet</p>
              </div>
            ) : (<>
              {/* Page info strip */}
              <div style={{ padding:'10px 16px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'#b0a090' }}>
                  Showing <strong style={{ color:'#5a4a3a' }}>{(expPage - 1) * PAGE_SIZE + 1}–{Math.min(expPage * PAGE_SIZE, expenses.length)}</strong> of <strong style={{ color:'#5a4a3a' }}>{expenses.length}</strong>
                </span>
                <span style={{ fontSize:11, color:'#b0a090' }}>Page {expPage}/{totalPages}</span>
              </div>

              <div style={{ padding:'0 8px' }}>
                {pagedExpenses.map(exp => (
                  <ExpenseRow key={exp._id} expense={exp} onEdit={openEditExp} onDelete={deleteExpense} />
                ))}
              </div>

              {/* Pagination + totals */}
              <div style={{ borderTop:'1px solid #f0ebe4' }}>
                <Pagination page={expPage} totalPages={totalPages} onPage={p => { setExpPage(p); }} />
                <div style={{ padding:'4px 16px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'#b0a090' }}>
                    Page total: <strong style={{ color:'#c0504d' }}>{fc(pagedExpenses.reduce((s, e) => s + e.amount, 0))}</strong>
                  </span>
                  <span style={{ fontSize:13, fontWeight:800, color:'#c0504d' }}>Grand: {fc(totalExpenses)}</span>
                </div>
              </div>
            </>)}
          </>)}
        </div>

        {/* Add/Edit Expense Modal */}
        {showExpForm && (
          <div style={{ position:'fixed', inset:0, zIndex:1100, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={resetExpForm}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
              <div style={{ padding:'16px 20px', background:'#3d1a00', borderRadius:'20px 20px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:1 }}>
                <div style={{ color:'#f5c842', fontWeight:700, fontSize:16, fontFamily:"'Playfair Display',Georgia,serif" }}>{editingExpId ? '✏️ Edit Expense' : '➕ Add Expense'}</div>
                <button onClick={resetExpForm} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#f5c842', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontSize:18 }}>✕</button>
              </div>
              <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>TITLE *</label>
                  <input id="exp-title-input" value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="e.g. Colours purchase" style={inputStyle} />
                </div>
                <div style={{ display:'flex', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>AMOUNT (₹) *</label>
                    <input type="number" value={fAmount} onChange={e => setFAmount(e.target.value)} placeholder="0" style={inputStyle} />
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>DATE *</label>
                    <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:8, fontWeight:600 }}>CATEGORY *</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {CATS.map(cat => (
                      <button key={cat} type="button" onClick={() => setFCategory(cat)} style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:600, border:`2px solid ${fCategory === cat ? CAT_COLOR[cat] : '#e0d5c8'}`, background: fCategory === cat ? CAT_COLOR[cat]+'20' : 'transparent', color: fCategory === cat ? CAT_COLOR[cat] : '#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                        {CAT_EMOJI[cat]} {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:8, fontWeight:600 }}>PAID BY *</label>
                <div style={{ display:'flex', gap:8 }}>
                  {ALL_PAYERS.map(p => (
                    <button key={p} type="button" onClick={() => setFPaidBy(p)} style={{
                      flex:1, padding:'8px 6px', borderRadius:12, fontSize:12, fontWeight:700,
                      border:`2px solid ${fPaidBy === p ? PAYER_COLOR[p] : '#e0d5c8'}`,
                      background: fPaidBy === p ? PAYER_COLOR[p]+'18' : 'transparent',
                      color: fPaidBy === p ? PAYER_COLOR[p] : '#7a6a5a',
                      cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'center',
                    }}>
                      <div style={{ fontSize:16 }}>{PAYER_EMOJI[p]}</div>
                      <div>{p}</div>
                    </button>
                  ))}
                </div>
                </div>
                <div>
                  <label style={{ fontSize:11, color:'#7a6a5a', display:'block', marginBottom:5, fontWeight:600 }}>NOTE (optional)</label>
                  <input value={fNote} onChange={e => setFNote(e.target.value)} placeholder="Any extra details..." style={inputStyle} />
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={saveExpense} disabled={savingExp} style={{ flex:1, padding:'14px', borderRadius:12, border:'none', background: savingExp ? '#888' : 'linear-gradient(135deg,#c17f3c,#e8a045)', color:'#fff', fontSize:15, fontWeight:700, cursor: savingExp ? 'not-allowed' : 'pointer', fontFamily:"'DM Sans',sans-serif", boxShadow:'0 4px 14px rgba(193,127,60,0.4)' }}>
                    {savingExp ? '⏳ Saving...' : editingExpId ? '💾 Update' : '➕ Add Expense'}
                  </button>
                  <button onClick={resetExpForm} style={{ padding:'14px 20px', borderRadius:12, border:'1.5px solid #e0d5c8', background:'transparent', color:'#7a6a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
